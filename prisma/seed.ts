import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

async function main() {
  await prisma.driver.upsert({
    where: { id: "demo-driver-001" },
    update: {},
    create: {
      id:      "demo-driver-001",
      name:    "Demo Driver",
      phone:   "+91-98765-43210",
      vehicle: "MH-12 AB 1234",
    },
  });
  console.log("✅ Demo driver seeded");
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
