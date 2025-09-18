const { PrismaClient } = require('@prisma/client');
const bcrypt = require('bcrypt');

const prisma = new PrismaClient();

async function main() {
  console.log('🌱 Starting simple database seeding...');

  // Create admin user
  const adminEmail = 'admin@solevaeg.com';
  const adminPassword = '?3aeeSjqq';
  const hashedPassword = await bcrypt.hash(adminPassword, 12);

  const admin = await prisma.user.upsert({
    where: { email: adminEmail },
    update: {},
    create: {
      email: adminEmail,
      password: hashedPassword,
      name: 'Admin User',
      role: 'OWNER',
      isActive: true,
      isVerified: true,
      emailVerifiedAt: new Date()
    }
  });

  console.log('✅ Admin user created:', admin.email);

  console.log('🎉 Simple seeding completed successfully!');
}

main().
catch((e) => {
  console.error('❌ Error during seeding:', e);
  process.exit(1);
}).
finally(async () => {
  await prisma.$disconnect();
});