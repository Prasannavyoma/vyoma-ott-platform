const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
  console.log('Creating high-fidelity dummy invoice data...');
  
  // 1. Create accurate Test User matching screenshot
  const user = await prisma.user.upsert({
    where: { email: 'sudhakrishnamurthy62@gmail.com' },
    update: {},
    create: {
      email: 'sudhakrishnamurthy62@gmail.com',
      name: 'Sudha Krishnamurthy',
      address: '49/10 Srinilayam, 8th cross, 2nd main, sriram avenue',
      city: 'Coimbatore',
      state: 'Tamilnadu',
      zipCode: '641041',
      plan: 'PLATINUM'
    }
  });

  // 2. Ensure test course exists
  const course = await prisma.course.create({
    data: {
      title: 'Platinum Plan - Annual Subscription',
      description: 'Comprehensive annual access to the entire platform library.',
      accessLevel: 'PLATINUM',
      price: 490.00
    }
  });

  // 3. Log the matching purchase transaction
  const purchase = await prisma.purchase.create({
    data: {
      userId: user.id,
      courseId: course.id,
      amount: 490.00,
      hsnCode: '998439',
      placeOfSupply: 'Tamilnadu',
      billingAddress: '49/10 Srinilayam, 8th cross, Coimbatore'
    }
  });

  console.log(`✅ SUCCESSFULLY CREATED TRANSACTION!`);
  console.log(`UserID: ${user.id}`);
  console.log(`Invoice View Route ready at: http://localhost:3000/admin/invoices/${purchase.id}`);
}

main()
  .catch(e => console.error(e))
  .finally(async () => {
    await prisma.$disconnect();
  });
