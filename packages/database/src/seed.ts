import { PrismaClient } from "@energy/database";

const prisma = new PrismaClient();

async function main() {
  // 1. Create Microgrid
  const microgrid = await prisma.microgrid.upsert({
    where: { id: "u-grid-lagos-1" },
    update: {},
    create: {
      id: "u-grid-lagos-1",
      name: "Lagos Island Microgrid",
      location: "Broad Street, Lagos",
      capacity_kw: 500.0,
    },
  });

  // 2. Create Transformer
  const transformer = await prisma.transformer.upsert({
    where: { id: "tr-broad-01" },
    update: {},
    create: {
      id: "tr-broad-01",
      location: "Broad St / Marina Intersection",
      capacity_kw: 100.0,
      microgridId: microgrid.id,
    },
  });

  // 3. Create Device
  const device = await prisma.device.upsert({
    where: { id: "dev-smart-001" },
    update: {},
    create: {
      id: "dev-smart-001",
      type: "smart_meter",
      transformerId: transformer.id,
    },
  });

  console.log("Hierarchy Seed successful:", { microgrid, transformer, device });
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
