import axios from "axios";

const API_URL = "http://localhost:3001/readings";
const DEVICE_COUNT = 50;
const SEND_INTERVAL_MS = 10000;

const devices = Array.from({ length: DEVICE_COUNT }, (_, i) => ({
  id: `dev-sim-${(i + 1).toString().padStart(3, "0")}`,
}));

async function registerSimulatedDevices() {
  console.log("Registering simulated devices...");
  for (const device of devices) {
    try {
      await axios.post("http://localhost:3001/devices/register", {
        id: device.id,
        type: "iot_sensor",
        transformerId: "tr-broad-01", // Default for simulation
      });
    } catch (e) {
      // Ignore if already registered
    }
  }
  console.log("Registration complete.");
}

async function sendReading(deviceId: string) {
  const voltage = 180 + Math.random() * 80; // 180 to 260
  const current = 5 + Math.random() * 20;
  const frequency = 49.5 + Math.random() * 1.5; // 49.5 to 51.0

  try {
    await axios.post(API_URL, {
      deviceId,
      voltage: parseFloat(voltage.toFixed(2)),
      current: parseFloat(current.toFixed(2)),
      frequency: parseFloat(frequency.toFixed(2)),
      timestamp: new Date().toISOString(),
    });
    console.log(`Sent reading for ${deviceId}: ${voltage.toFixed(1)}V`);
  } catch (error) {
    console.error(`Failed to send reading for ${deviceId}`);
  }
}

async function runSimulation() {
  await registerSimulatedDevices();

  console.log(`Starting simulation for ${DEVICE_COUNT} devices...`);
  
  // Start staggered sending to avoid burst
  devices.forEach((device, index) => {
    setTimeout(() => {
      setInterval(() => sendReading(device.id), SEND_INTERVAL_MS);
    }, index * 200); // Stagger by 200ms
  });
}

runSimulation();
