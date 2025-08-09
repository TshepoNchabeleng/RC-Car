// index.js - Fake ESP32 server (HTTP + WebSocket)
const express = require('express');
const http = require('http');
const WebSocket = require('ws');
const cors = require('cors');

const app = express();
app.use(cors());          // allow cross-origin requests (helpful when testing from mobile/web)
app.use(express.json());  // parse JSON bodies

const PORT = process.env.PORT || 3000;

// --- FakeDevice class: holds "device state" and emits periodic sensor updates ---
class FakeDevice {
  constructor(id, opts = {}) {
    this.id = id;
    this.firmware = opts.firmware || '1.0.0';
    this.uptimeStart = Date.now();
    this._sensor = { temp: 22.0, humidity: 45.0 };
    this._interval = null;    // will hold broadcaster interval
    this.status = 'idle';
  }

  // computed uptime (seconds)
  get uptime() { return Math.floor((Date.now() - this.uptimeStart) / 1000); }

  // current "heap" (just a random-ish value to emulate memory info)
  heap() { return Math.floor(20000 + Math.random() * 80000); }

  getStatus() {
    return {
      id: this.id,
      firmware: this.firmware,
      uptime: this.uptime,
      heap: this.heap(),
      status: this.status
    };
  }

  getSensor() { return { ...this._sensor }; }

  // update sensor values (simple random walk)
  stepSensor() {
    const t = 20 + Math.random() * 15;                // 20..35 °C
    const h = 30 + Math.random() * 50;                // 30..80 %
    this._sensor.temp = Number(t.toFixed(2));
    this._sensor.humidity = Number(h.toFixed(2));
  }

  // Start broadcasting sensor updates to connected WebSocket clients
  // - wss: WebSocket.Server instance
  // - intervalMs: milliseconds between updates
  startBroadcast(wss, intervalMs = 5000) {
    if (this._interval) return; // already running
    this._interval = setInterval(() => {
      this.stepSensor();
      const payload = JSON.stringify({
        type: 'sensor',
        deviceId: this.id,
        data: this.getSensor(),
        ts: new Date().toISOString()
      });

      // send to clients that either subscribed to this device, or to all clients if no subscription
      wss.clients.forEach((client) => {
        if (client.readyState !== WebSocket.OPEN) return;
        // If client declared subscriptions, only send when included
        if (Array.isArray(client.subscribedDevices) && client.subscribedDevices.length > 0) {
          if (!client.subscribedDevices.includes(this.id)) return;
        }
        client.send(payload);
      });
    }, intervalMs);
  }

  stopBroadcast() {
    if (this._interval) clearInterval(this._interval);
    this._interval = null;
  }

  // simulate handling a command
  handleCommand(command) {
    const reply = { deviceId: this.id, command };

    if (command === 'reboot') {
      this.uptimeStart = Date.now();
      this.status = 'rebooting';
      setTimeout(() => { this.status = 'idle'; }, 2000);
      reply.result = 'ok';
      reply.info = 'rebooting';
    } else if (command === 'led:on') {
      this.status = 'led_on';
      reply.result = 'ok'; reply.info = 'led on';
    } else if (command === 'led:off') {
      this.status = 'idle';
      reply.result = 'ok'; reply.info = 'led off';
    } else {
      reply.result = 'error'; reply.info = 'unknown command';
    }

    return reply;
  }
}

// --- Create N fake devices ---
const NUM_DEVICES = parseInt(process.env.DEVICES || '1', 10);
const devices = [];
for (let i = 0; i < NUM_DEVICES; i++) devices.push(new FakeDevice(`esp32-${i + 1}`));

function findDevice(id) {
  return devices.find(d => d.id === id);
}

// --- HTTP routes ---
app.get('/', (req, res) => res.send('Fake ESP32 server running. See /devices'));

app.get('/devices', (req, res) => {
  res.json(devices.map(d => d.getStatus()));
});

app.get('/devices/:id/info', (req, res) => {
  const d = findDevice(req.params.id);
  if (!d) return res.status(404).json({ error: 'device not found' });
  res.json(d.getStatus());
});

app.get('/devices/:id/sensor', (req, res) => {
  const d = findDevice(req.params.id);
  if (!d) return res.status(404).json({ error: 'device not found' });
  res.json({ deviceId: d.id, sensor: d.getSensor(), ts: new Date().toISOString() });
});

// Accept commands as POST { "command": "led:on" }
app.post('/devices/:id/command', (req, res) => {
  const d = findDevice(req.params.id);
  if (!d) return res.status(404).json({ error: 'device not found' });
  const { command } = req.body || {};
  if (!command) return res.status(400).json({ error: 'missing command' });

  const result = d.handleCommand(command);

  // also notify WS clients that a command was executed
  const notice = JSON.stringify({ type: 'command_executed', deviceId: d.id, result, ts: new Date().toISOString() });
  // broadcast to all connected clients (you can filter similarly to sensor)
  wss.clients.forEach((c) => { if (c.readyState === WebSocket.OPEN) c.send(notice); });

  res.json(result);
});

// --- HTTP server + WebSocket server ---
const server = http.createServer(app);
const wss = new WebSocket.Server({ server, path: '/ws' });

wss.on('connection', (ws, req) => {
  console.log('WS client connected');
  ws.isAlive = true;
  ws.on('pong', () => ws.isAlive = true);

  // By default client receives broadcasts for all devices. Client may send a "subscribe" message
  // to restrict events to particular device IDs.
  ws.send(JSON.stringify({ type: 'welcome', msg: 'connected to fake-esp32-server', ts: new Date().toISOString() }));

  ws.on('message', (message) => {
    try {
      const msg = JSON.parse(message.toString());

      if (msg.type === 'subscribe') {
        // { type: 'subscribe', deviceIds: ['esp32-1'] }
        ws.subscribedDevices = Array.isArray(msg.deviceIds) ? msg.deviceIds : [];
        ws.send(JSON.stringify({ type: 'subscribed', deviceIds: ws.subscribedDevices }));
        return;
      }

      if (msg.type === 'command') {
        // { type: 'command', deviceId: 'esp32-1', command: 'reboot' }
        const d = findDevice(msg.deviceId);
        if (!d) return ws.send(JSON.stringify({ type: 'error', error: 'device not found' }));
        const result = d.handleCommand(msg.command);
        ws.send(JSON.stringify({ type: 'command_ack', result }));

        // also broadcast to other clients to notify about command
        const notice = JSON.stringify({ type: 'command_executed', deviceId: d.id, result, ts: new Date().toISOString() });
        wss.clients.forEach((c) => { if (c.readyState === WebSocket.OPEN) c.send(notice); });
        return;
      }

      // unknown message
      ws.send(JSON.stringify({ type: 'error', error: 'unknown message type' }));

    } catch (err) {
      ws.send(JSON.stringify({ type: 'error', error: 'invalid JSON' }));
    }
  });
});

// simple heartbeat to clean up dead connections
const heartbeatInterval = setInterval(() => {
  wss.clients.forEach((ws) => {
    if (ws.isAlive === false) return ws.terminate();
    ws.isAlive = false;
    ws.ping(() => {});
  });
}, 30000);

// start server and start devices broadcasting
server.listen(PORT, () => {
  console.log(`Fake ESP32 server running on http://localhost:${PORT}`);
  devices.forEach(d => d.startBroadcast(wss, 5000));
});

// graceful shutdown
process.on('SIGINT', () => {
  console.log('Shutting down...');
  devices.forEach(d => d.stopBroadcast());
  clearInterval(heartbeatInterval);
  wss.close(() => server.close(() => process.exit(0)));
});
