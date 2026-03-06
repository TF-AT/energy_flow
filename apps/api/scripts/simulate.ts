import axios from "axios";

const API_URL = "http://localhost:3001";
const DEVICE_COUNT = 50;
const SEND_INTERVAL_MS = 10000;
const DEFAULT_TRANSFORMER_ID = "tr-broad-01";

// Simulation States
type GridState = "HEALTHY" | "WARNING" | "CRITICAL";
let currentGridState: GridState = "CRITICAL";

async function registerDevice(id: string) {
  try {
    await axios.post(`${API_URL}/devices/register`, {
      id,
      type: "iot_sensor",
      transformerId: DEFAULT_TRANSFORMER_ID,
      token: "energy_secret_2026"
    });
    console.log(`Registered device: ${id}`);
  } catch (error: any) {
    if (error.response?.status !== 201 && error.response?.status !== 500) {
        console.error(`Registration failed for ${id}:`, error.response?.data?.error || error.message);
    }
  }
}

function getStochasticMetrics(state: GridState) {
  switch (state) {
    case "HEALTHY":
      return {
        voltage: 220 + Math.random() * 10, // 220-230V
        frequency: 49.8 + Math.random() * 0.4, // 49.8-50.2Hz
      };
    case "WARNING":
      return {
        voltage: 242 + Math.random() * 8, // 242-250V
        frequency: 50.5 + Math.random() * 0.5, // 50.5-51.0Hz
      };
    case "CRITICAL":
      return {
        voltage: 255 + Math.random() * 15, // 255-270V (Spike!)
        frequency: 51.5 + Math.random() * 1.0, // 51.5-52.5Hz (Instability)
      };
  }
}

async function sendReading(deviceId: string) {
  const { voltage, frequency } = getStochasticMetrics(currentGridState);
  const current = Math.random() * 50;

  try {
    await axios.post(`${API_URL}/readings`, {
      deviceId,
      voltage: parseFloat(voltage.toFixed(2)),
      current: parseFloat(current.toFixed(2)),
      frequency: parseFloat(frequency.toFixed(2)),
      timestamp: new Date().toISOString(),
    });
    
    // Status color indicator in console
    const color = currentGridState === "CRITICAL" ? "\x1b[31m" : currentGridState === "WARNING" ? "\x1b[33m" : "\x1b[32m";
    console.log(`${color}[${currentGridState}]\x1b[0m ${deviceId} | ${voltage.toFixed(1)}V | ${frequency.toFixed(1)}Hz`);
  } catch (error: any) {
    console.error(`Failed to send reading for ${deviceId}:`, error.message);
  }
}

async function startSimulation() {
  console.log(`\x1b[36m>>> Starting Automated Grid Stabilization Demo <<<\x1b[0m`);
  console.log(`Objective: Demonstrate situational awareness & state transitions.`);

  const devices = Array.from({ length: DEVICE_COUNT }, (_, i) => `sim-dev-${i + 1}`);

  for (const id of devices) {
    await registerDevice(id);
  }

  // 1. Grid State Rotator (Cycles every 45s)
  setInterval(() => {
    if (currentGridState === "HEALTHY") currentGridState = "WARNING";
    else if (currentGridState === "WARNING") currentGridState = "CRITICAL";
    else currentGridState = "HEALTHY";
    
    console.log(`\n\x1b[1m\x1b[35m[SYSTEM] Grid State Transition: ${currentGridState}\x1b[0m\n`);
  }, 45000);

  // 2. Reading Loop
  devices.forEach((id, index) => {
    setTimeout(() => {
      sendReading(id);
      setInterval(() => sendReading(id), SEND_INTERVAL_MS);
    }, index * 200);
  });
}

startSimulation().catch(console.error);
