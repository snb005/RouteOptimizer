const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();
prisma.location.deleteMany().then(() => { console.log("Deleted"); process.exit(0); });
