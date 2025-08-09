import { useState } from 'react'
import reactLogo from './assets/react.svg'
import viteLogo from '/vite.svg'
import './App.css'
import axios from 'axios';


const App = () => {
  // useState hook to manage the IP address state.
  const [ip, setIp] = useState('localhost:3000');
  
  // useState hook to manage the connection status message.
  const [status, setStatus] = useState('Disconnected');

  /**
   * Sends a command to the specified IP address via a POST request.
   * The server expects the command in the request body.
   * @param {string} command The command to send (e.g., 'forward', 'stop').
   */
  const sendCommand = async (command) => {
    try {
      setStatus(`Sending command: ${command}...`);
      await axios.post(`http://${ip}/devices/esp32-1/command`, { command });
      setStatus(`Command sent: ${command}`);
    } catch (error) {
      console.error('Error sending command:', error);
      setStatus(`Error: Could not reach ${ip}`);
    }
  };

  // Define CSS styles as a JavaScript object.
  const styles = {
    container: {
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center',
      justifyContent: 'center',
      minHeight: '100vh',
      backgroundColor: '#1e1e1e',
      color: '#fff',
      padding: '2rem',
      fontFamily: '"Inter", sans-serif',
      boxSizing: 'border-box'
    },
    title: {
      fontSize: '2.25rem',
      fontWeight: 'bold',
      marginBottom: '2rem',
      color: '#60a5fa' // blue-400
    },
    input: {
      backgroundColor: '#374151', // gray-700
      color: '#fff',
      width: '100%',
      maxWidth: '20rem',
      padding: '0.75rem',
      marginBottom: '1.5rem',
      borderRadius: '0.5rem',
      textAlign: 'center',
      outline: 'none',
      border: '2px solid transparent',
      transition: 'border-color 0.2s ease-in-out'
    },
    inputFocus: {
      borderColor: '#3b82f6' // blue-500
    },
    buttonRow: {
      display: 'flex',
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'center',
      gap: '1rem'
    },
    buttonCol: {
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center',
      gap: '1rem'
    },
    button: {
      padding: '1.5rem',
      borderRadius: '50%',
      width: '5rem',
      height: '5rem',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      fontSize: '2.25rem',
      fontWeight: 'bold',
      color: '#fff',
      border: 'none',
      cursor: 'pointer',
      boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1), 0 2px 4px -2px rgb(0 0 0 / 0.1)',
      transition: 'background-color 0.2s ease-in-out',
    },
    blueButton: {
      backgroundColor: '#3b82f6', // blue-500
    },
    redButton: {
      backgroundColor: '#ef4444' // red-500
    },
    status: {
      marginTop: '2rem',
      fontSize: '1.125rem',
      color: '#9ca3af' // gray-400
    }
  };

  return (
    <div style={styles.container}>
      <h1 style={styles.title}>RC Controller</h1>

      {/* IP Address Input Field */}
      <input
        type="text"
        style={styles.input}
        placeholder="ESP32 IP Address"
        value={ip}
        onChange={(e) => setIp(e.target.value)}
      />

      {/* Control Buttons */}
      <div style={styles.buttonCol}>
        {/* Forward button */}
        <button
          style={{ ...styles.button, ...styles.blueButton }}
          onClick={() => sendCommand('forward')}
        >
          ↑
        </button>
        
        <div style={styles.buttonRow}>
          {/* Left button */}
          <button
            style={{ ...styles.button, ...styles.blueButton }}
            onClick={() => sendCommand('left')}
          >
            ←
          </button>
          
          {/* Stop button */}
          <button
            style={{ ...styles.button, ...styles.redButton }}
            onClick={() => sendCommand('stop')}
          >
            ■
          </button>
          
          {/* Right button */}
          <button
            style={{ ...styles.button, ...styles.blueButton }}
            onClick={() => sendCommand('right')}
          >
            →
          </button>
        </div>
        
        {/* Back button */}
        <button
          style={{ ...styles.button, ...styles.blueButton }}
          onClick={() => sendCommand('back')}
        >
          ↓
        </button>
      </div>
      
      {/* Status Display */}
      <p style={styles.status}>{status}</p>
    </div>
  );
};

export default App;


