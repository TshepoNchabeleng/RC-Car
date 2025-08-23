#include <WiFi.h>
#include <WebServer.h>

const char* ssid = "ESP32-Network";
const char* password = "myesp32password@today";

WebServer server(80);

// Assign one LED per button
const int ledPins[] = {15, 16, 17, 18};  // forward, left, right, back
const String commands[] = {"forward", "left", "right", "back"};

void flashLED(int pin) {
  digitalWrite(pin, HIGH);
  Serial.println("LED ON: " + String(pin));
  delay(500);            // momentary 100ms
  digitalWrite(pin, LOW);
  Serial.println("LED OFF: " + String(pin));
}

// Handler
void handleLED() {
  String command = server.arg("command");  // ?command=forward
  for (int i = 0; i < 4; i++) {
    if (command == commands[i]) {
      flashLED(ledPins[i]);
      break;
    }
  }
  server.send(200, "text/plain", "Command received: " + command);
}

void setup() {
  Serial.begin(115200);

  // Initialize LEDs
  for (int i = 0; i < 4; i++) {
    pinMode(ledPins[i], OUTPUT);
    digitalWrite(ledPins[i], LOW);
  }

  // Start hotspot
  WiFi.softAP(ssid, password);
  Serial.print("IP: "); Serial.println(WiFi.softAPIP());

  // Server route
  server.on("/led", handleLED);
  server.begin();
}

void loop() {
  server.handleClient();
}