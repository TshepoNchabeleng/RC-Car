//App.js
import React, {useState} from 'react';
import {Stylesheet, Text, View, TouchableOpacity, Textinput} from 'react-native'
import axios from 'axios';

export default function App() {
  const [ip, setIp] = useState('192.168.0.100'); // default IP, change later
  const [status, setStatus] = useState('Disconnected');

  const sendCommand = async (command) => {
    try {
      await axios.get(`http://${ip}/${command}`);
      setStatus(`Sent: ${command}`);
    } catch (error) {
      setStatus('Error sending command');
    }
  };

  return (
    <View style={styles.container}>
      <Text style={styles.title}>RC Controller</Text>

      {/* IP Input */}
      <TextInput
        style={styles.input}
        placeholder="ESP32 IP Address"
        value={ip}
        onChangeText={setIp}
      />

      {/* Controls */}
      <View style={styles.row}>
        <TouchableOpacity style={styles.button} onPress={() => sendCommand('forward')}>
          <Text style={styles.btnText}>↑</Text>
        </TouchableOpacity>
      </View>

      <View style={styles.row}>
        <TouchableOpacity style={styles.button} onPress={() => sendCommand('left')}>
          <Text style={styles.btnText}>←</Text>
        </TouchableOpacity>
        <TouchableOpacity style={styles.button} onPress={() => sendCommand('stop')}>
          <Text style={styles.btnText}>■</Text>
        </TouchableOpacity>
        <TouchableOpacity style={styles.button} onPress={() => sendCommand('right')}>
          <Text style={styles.btnText}>→</Text>
        </TouchableOpacity>
      </View>

      <View style={styles.row}>
        <TouchableOpacity style={styles.button} onPress={() => sendCommand('back')}>
          <Text style={styles.btnText}>↓</Text>
        </TouchableOpacity>
      </View>

      {/* Status */}
      <Text style={styles.status}>{status}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#1e1e1e',
    padding: 20,
  },
  title: {
    fontSize: 28,
    color: '#fff',
    marginBottom: 20,
  },
  input: {
    backgroundColor: '#fff',
    width: '80%',
    padding: 10,
    marginBottom: 20,
    borderRadius: 8,
    textAlign: 'center',
  },
  row: {
    flexDirection: 'row',
    marginVertical: 5,
  },
  button: {
    backgroundColor: '#007AFF',
    padding: 20,
    margin: 10,
    borderRadius: 8,
  },
  btnText: {
    fontSize: 24,
    color: '#fff',
  },
  status: {
    marginTop: 20,
    fontSize: 16,
    color: '#ccc',
  },
});