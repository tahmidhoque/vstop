require("dotenv/config");
const { hash } = require("bcryptjs");
const { PrismaClient } = require("../src/generated/client.js");

const prisma = new PrismaClient();

async function main() {
  // Check if passwords already exist
  const existingAdmin = await prisma.password.findUnique({
    where: { type: "ADMIN" },
  });
  const existingCustomer = await prisma.password.findUnique({
    where: { type: "CUSTOMER" },
  });

  // Set admin password
  if (!existingAdmin) {
    const adminPassword = process.env.ADMIN_PASSWORD || "admin123";
    const adminHash = await hash(adminPassword, 12);

    await prisma.password.create({
      data: {
        type: "ADMIN",
        passwordHash: adminHash,
      },
    });
    console.log("✅ Admin password created (default: admin123)");
  } else {
    console.log("ℹ️  Admin password already exists");
  }

  // Set customer password
  if (!existingCustomer) {
    const customerPassword = process.env.CUSTOMER_PASSWORD || "customer123";
    const customerHash = await hash(customerPassword, 12);

    await prisma.password.create({
      data: {
        type: "CUSTOMER",
        passwordHash: customerHash,
      },
    });
    console.log("✅ Customer password created (default: customer123)");
  } else {
    console.log("ℹ️  Customer password already exists");
  }
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });



