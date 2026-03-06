import { Queue, Worker, Job } from "bullmq";
import IORedis from "ioredis";
import prisma from "./lib/prisma";
import { eventEmitter } from "./controllers/events.controller";

const redisConnection = new IORedis(process.env.REDIS_URL || "redis://localhost:6379", {
  maxRetriesPerRequest: null,
});

export const readingQueue = new Queue("reading-jobs", {
  connection: redisConnection as any,
});

export const initWorker = () => {
  const worker = new Worker(
    "reading-jobs",
    async (job: Job) => {
      const { deviceId, voltage, current, frequency, timestamp, idempotencyKey } = job.data;

      console.log(`[Worker] Processing reading from device: ${deviceId}`);

      try {
        const device = await prisma.device.findUnique({
          where: { id: deviceId },
          include: { transformer: true },
        });

        if (!device) {
          console.error(`[Worker] Device ${deviceId} not found`);
          return;
        }

        // 1. Create the reading
        const reading = await prisma.energyReading.create({
          data: {
            deviceId,
            voltage,
            current,
            frequency,
            timestamp: new Date(timestamp),
            idempotencyKey,
          },
        });

        // Emit reading event for SSE
        eventEmitter.emit("reading", reading);

        // 2. Alert Detection Logic
        const alertsToCreate = [];
        const normalTypes = [];

        if (voltage > 250) {
          alertsToCreate.push({ type: "OverVoltage", message: `Critical OverVoltage: ${voltage}V detected on device ${deviceId}` });
        } else if (voltage < 180) {
          alertsToCreate.push({ type: "UnderVoltage", message: `Critical UnderVoltage: ${voltage}V detected on device ${deviceId}` });
        } else {
          normalTypes.push("OverVoltage", "UnderVoltage");
        }

        if (frequency > 51 || frequency < 49) {
          alertsToCreate.push({ type: "GridInstability", message: `Frequency anomaly: ${frequency}Hz detected on device ${deviceId}` });
        } else {
          normalTypes.push("GridInstability");
        }

        // Deduplicate and resolve alerts
        for (const alertData of alertsToCreate) {
          const existingAlert = await prisma.alert.findFirst({
            where: {
              transformerId: device.transformerId,
              type: alertData.type,
              isResolved: false
            }
          });

          if (!existingAlert) {
            const alert = await prisma.alert.create({
              data: {
                transformerId: device.transformerId,
                type: alertData.type,
                message: alertData.message,
              },
            });

            // Emit alert event for SSE
            eventEmitter.emit("alert", alert);
          }
        }

        if (normalTypes.length > 0) {
          await prisma.alert.updateMany({
            where: {
              transformerId: device.transformerId,
              type: { in: normalTypes },
              isResolved: false
            },
            data: { isResolved: true }
          });
        }

        console.log(`[Worker] Successfully processed reading for device ${deviceId}`);
      } catch (error) {
        console.error(`[Worker] Error processing job ${job.id}:`, error);
        throw error; // Let BullMQ handle retries
      }
    },
    { connection: redisConnection as any }
  );

  worker.on("completed", (job) => {
    console.log(`[Worker] Job ${job.id} completed`);
  });

  worker.on("failed", (job, err) => {
    console.error(`[Worker] Job ${job?.id} failed with ${err.message}`);
  });

  return worker;
};
