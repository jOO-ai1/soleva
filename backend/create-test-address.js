const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

async function createTestAddress() {
  try {
    const address = await prisma.address.create({
      data: {
        userId: 'eb44b9b8-f7ce-4ec6-a77e-4f36f948d09e',
        name: 'Home Address',
        recipientName: 'Test User QA',
        phone: '+201234567890',
        country: 'Egypt',
        governorate: 'Cairo',
        center: 'Heliopolis',
        street: '123 Test Street',
        isDefault: true
      }
    });

    console.log('Address created:', address.id);
    return address.id;
  } catch (error) {
    console.error('Error creating address:', error);
  } finally {
    await prisma.$disconnect();
  }
}

createTestAddress();