import { useState } from 'react'
import reactLogo from './assets/react.svg'
import viteLogo from '/vite.svg'
import './App.css'
import axios from 'axios';

// The App component represents the entire RC controller application.
const App = () => {
  // useState hook to manage the IP address state.
  // The default IP is set here.
  const [ip, setIp] = useState('192.168.0.100'); 
  
  // useState hook to manage the connection status message.
  const [status, setStatus] = useState('Disconnected');

  /**
   * Sends a command to the specified IP address via a GET request.
   * Updates the status message based on success or failure.
   * * @param {string} command The command to send (e.g., 'forward', 'stop').
   */
  const sendCommand = async (command) => {
    try {
      setStatus(`Sending command: ${command}...`);
      await axios.post(`http://${ip}/devices/esp32-1/command`, {command});
      setStatus(`Command sent: ${command}`);
    } catch (error) {
      console.error('Error sending command:', error);
      setStatus(`Error: Could not reach ${ip}`);
    }
  };

  return (
    <div className="flex flex-col items-center justify-center min-h-screen bg-gray-900 text-white p-8 font-inter">
      <h1 className="text-4xl font-bold mb-8 text-blue-400">RC Controller</h1>

      {/* IP Address Input Field */}
      <input
        type="text"
        className="bg-gray-800 text-white w-full max-w-xs p-3 mb-6 rounded-lg text-center focus:outline-none focus:ring-2 focus:ring-blue-500"
        placeholder="ESP32 IP Address"
        value={ip}
        onChange={(e) => setIp(e.target.value)}
      />

      {/* Control Buttons */}
      <div className="flex flex-col items-center gap-4">
        {/* Forward button */}
        <button
          className="bg-blue-600 hover:bg-blue-700 active:bg-blue-800 p-6 rounded-full w-20 h-20 flex items-center justify-center text-4xl font-bold transition-colors duration-200 shadow-lg"
          onClick={() => sendCommand('forward')}
        >
          ↑
        </button>
        
        <div className="flex flex-row items-center gap-4">
          {/* Left button */}
          <button
            className="bg-blue-600 hover:bg-blue-700 active:bg-blue-800 p-6 rounded-full w-20 h-20 flex items-center justify-center text-4xl font-bold transition-colors duration-200 shadow-lg"
            onClick={() => sendCommand('left')}
          >
            ←
          </button>
          
          {/* Stop button */}
          <button
            className="bg-red-600 hover:bg-red-700 active:bg-red-800 p-6 rounded-full w-20 h-20 flex items-center justify-center text-4xl font-bold transition-colors duration-200 shadow-lg"
            onClick={() => sendCommand('stop')}
          >
            ■
          </button>
          
          {/* Right button */}
          <button
            className="bg-blue-600 hover:bg-blue-700 active:bg-blue-800 p-6 rounded-full w-20 h-20 flex items-center justify-center text-4xl font-bold transition-colors duration-200 shadow-lg"
            onClick={() => sendCommand('right')}
          >
            →
          </button>
        </div>
        
        {/* Back button */}
        <button
          className="bg-blue-600 hover:bg-blue-700 active:bg-blue-800 p-6 rounded-full w-20 h-20 flex items-center justify-center text-4xl font-bold transition-colors duration-200 shadow-lg"
          onClick={() => sendCommand('back')}
        >
          ↓
        </button>
      </div>
      
      {/* Status Display */}
      <p className="mt-8 text-lg text-gray-400">{status}</p>
    </div>
  );
};

export default App;


