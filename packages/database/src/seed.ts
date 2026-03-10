import { PrismaClient } from "./generated/client/index.js";

const prisma = new PrismaClient();

async function main() {
  // 1. Create Organization
  const org = await prisma.organization.upsert({
    where: { id: "org-energyflow-demo" },
    update: {},
    create: {
      id: "org-energyflow-demo",
      name: "EnergyFlow Startup Demo",
    },
  });

  // 2. Create Site (formerly Microgrid)
  const site = await prisma.site.upsert({
    where: { id: "site-lagos-1" },
    update: {},
    create: {
      id: "site-lagos-1",
      name: "Lagos Island Microgrid",
      location: "Broad Street, Lagos",
      capacity_kw: 500.0,
      organizationId: org.id,
    },
  });

  // 3. Create Infrastructure Models
  const transformer = await prisma.transformer.upsert({
    where: { id: "tr-broad-01" },
    update: {},
    create: {
      id: "tr-broad-01",
      location: "Broad St / Marina Intersection",
      capacity_kw: 100.0,
      siteId: site.id,
    },
  });

  const solar = await prisma.solarGenerator.upsert({
    where: { id: "sol-array-01" },
    update: {},
    create: {
      id: "sol-array-01",
      name: "Roof Solar Array",
      location: "Roof 1",
      siteId: site.id,
    },
  });

  const battery = await prisma.batteryStorage.upsert({
    where: { id: "bat-bank-01" },
    update: {},
    create: {
      id: "bat-bank-01",
      name: "Main Battery Bank",
      location: "Basement",
      siteId: site.id,
    },
  });

  const load = await prisma.energyLoad.upsert({
    where: { id: "load-node-01" },
    update: {},
    create: {
      id: "load-node-01",
      name: "Building A HVAC",
      location: "Building A",
      siteId: site.id,
    },
  });

  // 4. Create Devices for Infrastructure Monitoring
  const devices = [
    {
      id: "tr-broad-01",
      type: "transformer",
      protocol: "MQTT",
      transformerId: transformer.id,
      siteId: site.id,
      apiKey: "key-tr-broad-01",
      metadata: JSON.stringify({ topic: "energy/telemetry/tr-broad-01" })
    },
    {
      id: "sol-array-01",
      type: "solar",
      protocol: "MODBUS",
      siteId: site.id,
      apiKey: "key-sol-array-01",
      metadata: JSON.stringify({ ip: "192.168.1.50", port: 502 })
    },
    {
      id: "bat-bank-01",
      type: "battery",
      protocol: "MQTT",
      siteId: site.id,
      apiKey: "key-bat-bank-01",
      metadata: JSON.stringify({ topic: "energy/telemetry/bat-bank-01" })
    },
    {
      id: "load-node-01",
      type: "load",
      protocol: "WEBHOOK",
      siteId: site.id,
      apiKey: "load-secret-123",
      metadata: JSON.stringify({})
    }
  ];

  for (const dev of devices) {
    await prisma.device.upsert({
      where: { id: dev.id },
      update: dev,
      create: dev,
    });
  }

  // 5. Create Default Alert Rules
  const defaultRules = [
    {
      id: "rule-overvoltage",
      organizationId: org.id,
      deviceType: "transformer",
      metric: "voltage",
      warningThreshold: 240,
      criticalThreshold: 250,
      condition: "GREATER_THAN"
    },
    {
      id: "rule-undervoltage",
      organizationId: org.id,
      deviceType: "transformer",
      metric: "voltage",
      warningThreshold: 200,
      criticalThreshold: 180,
      condition: "LESS_THAN"
    },
    {
      id: "rule-battery-temp",
      organizationId: org.id,
      deviceType: "battery",
      metric: "temperature",
      warningThreshold: 45,
      criticalThreshold: 60,
      condition: "GREATER_THAN"
    }
  ];

  for (const rule of defaultRules) {
    await prisma.alertRule.upsert({
      where: { id: rule.id },
      update: rule,
      create: rule
    });
  }

  console.log("Infrastructure Registry & AlertRules Seed successful.");
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
