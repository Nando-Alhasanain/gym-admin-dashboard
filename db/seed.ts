import { db } from './index';
import { members, membershipPlans, memberMemberships, products, sales, saleItems, attendanceLogs } from './schema/gym';
import { faker } from '@faker-js/faker';
import QRCode from 'qrcode';
import { nanoid } from 'nanoid';

// Generate seed data for the gym management system
async function seedDatabase() {
  console.log('Starting database seeding...');

  try {
    // Create membership plans
    const plansData = [
      {
        name: 'Basic Membership',
        description: 'Access to gym floor during business hours',
        duration: 30,
        price: 29.99,
        features: JSON.stringify(['Gym Floor Access', 'Basic Equipment', 'Business Hours Only']),
        isActive: true,
        maxVisits: null
      },
      {
        name: 'Premium Membership',
        description: '24/7 access plus classes',
        duration: 30,
        price: 59.99,
        features: JSON.stringify(['24/7 Access', 'Group Classes', 'Personal Training Discount', 'Sauna Access']),
        isActive: true,
        maxVisits: null
      },
      {
        name: 'All Access Pass',
        description: 'Premium plus nutrition coaching',
        duration: 30,
        price: 99.99,
        features: JSON.stringify(['24/7 Access', 'Unlimited Classes', 'Personal Training Sessions', 'Nutrition Coaching', 'Guest Passes']),
        isActive: true,
        maxVisits: null
      },
      {
        name: 'Day Pass',
        description: 'Single day access',
        duration: 1,
        price: 15.00,
        features: JSON.stringify(['Gym Floor Access', 'Basic Equipment']),
        isActive: true,
        maxVisits: 1
      },
      {
        name: '10 Visit Pack',
        description: '10 visits within 3 months',
        duration: 90,
        price: 120.00,
        features: JSON.stringify(['10 Visits', 'Gym Floor Access', 'Basic Equipment']),
        isActive: true,
        maxVisits: 10
      }
    ];

    const [insertedPlans] = await db
      .insert(membershipPlans)
      .values(plansData)
      .returning();

    console.log(`Created ${insertedPlans.length} membership plans`);

    // Create products
    const productsData = [
      {
        name: 'Whey Protein 5lb',
        description: 'High-quality whey protein powder',
        category: 'Supplements',
        sku: 'WP001',
        price: 49.99,
        cost: 25.00,
        stockQuantity: 25,
        minStockLevel: 5,
        imageUrl: null,
        isActive: true
      },
      {
        name: 'Pre-Workout Energy',
        description: 'Pre-workout energy supplement',
        category: 'Supplements',
        sku: 'PRE001',
        price: 34.99,
        cost: 18.00,
        stockQuantity: 15,
        minStockLevel: 3,
        imageUrl: null,
        isActive: true
      },
      {
        name: 'Gym T-Shirt',
        description: 'Premium cotton gym t-shirt',
        category: 'Apparel',
        sku: 'APP001',
        price: 24.99,
        cost: 12.00,
        stockQuantity: 50,
        minStockLevel: 10,
        imageUrl: null,
        isActive: true
      },
      {
        name: 'Water Bottle',
        description: 'Insulated water bottle 1L',
        category: 'Accessories',
        sku: 'ACC001',
        price: 19.99,
        cost: 8.00,
        stockQuantity: 30,
        minStockLevel: 5,
        imageUrl: null,
        isActive: true
      },
      {
        name: 'Resistance Bands Set',
        description: 'Complete resistance bands set',
        category: 'Equipment',
        sku: 'EQ001',
        price: 29.99,
        cost: 15.00,
        stockQuantity: 20,
        minStockLevel: 4,
        imageUrl: null,
        isActive: true
      },
      {
        name: 'Yoga Mat',
        description: 'Premium yoga mat',
        category: 'Equipment',
        sku: 'EQ002',
        price: 39.99,
        cost: 20.00,
        stockQuantity: 12,
        minStockLevel: 3,
        imageUrl: null,
        isActive: true
      },
      {
        name: 'BCAA Powder',
        description: 'Branched-chain amino acids',
        category: 'Supplements',
        sku: 'SUP001',
        price: 29.99,
        cost: 15.00,
        stockQuantity: 8, // Low stock for testing
        minStockLevel: 5,
        imageUrl: null,
        isActive: true
      }
    ];

    const [insertedProducts] = await db
      .insert(products)
      .values(productsData)
      .returning();

    console.log(`Created ${insertedProducts.length} products`);

    // Create sample members
    const membersData = [];
    for (let i = 0; i < 50; i++) {
      const firstName = faker.person.firstName();
      const lastName = faker.person.lastName();
      const email = faker.internet.email({ firstName, lastName }).toLowerCase();
      const memberId = `GYM${Date.now()}${i}${nanoid(4).toUpperCase()}`;

      // Generate QR code
      const qrCodeData = {
        memberId,
        firstName,
        lastName,
        email
      };
      const qrCode = await QRCode.toDataURL(JSON.stringify(qrCodeData));

      membersData.push({
        memberId,
        firstName,
        lastName,
        email,
        phone: faker.phone.number(),
        dateOfBirth: faker.date.past({ years: 50 }),
        gender: faker.helpers.arrayElement(['male', 'female', 'other']),
        address: faker.location.streetAddress(),
        emergencyContact: faker.person.fullName(),
        emergencyPhone: faker.phone.number(),
        qrCode,
        photo: null,
        notes: faker.lorem.sentences(1)
      });
    }

    const [insertedMembers] = await db
      .insert(members)
      .values(membersData)
      .returning();

    console.log(`Created ${insertedMembers.length} members`);

    // Create member memberships
    const membershipsData = [];
    for (const member of insertedMembers) {
      // Assign 1-2 memberships per member
      const numMemberships = faker.helpers.arrayElement([1, 2]);

      for (let i = 0; i < numMemberships; i++) {
        const plan = faker.helpers.arrayElement(insertedPlans);
        const startDate = faker.date.past({ years: 1 });
        const endDate = new Date(startDate);
        endDate.setDate(endDate.getDate() + plan.duration);

        // Mix of statuses
        const status = faker.helpers.arrayElement(['active', 'expired', 'cancelled']);

        let remainingVisits = null;
        if (plan.maxVisits) {
          if (status === 'active') {
            remainingVisits = faker.number.int({ min: 0, max: plan.maxVisits });
          } else {
            remainingVisits = 0;
          }
        }

        membershipsData.push({
          memberId: member.id,
          planId: plan.id,
          startDate,
          endDate,
          status,
          remainingVisits,
          price: plan.price,
          notes: faker.lorem.sentences(1)
        });
      }
    }

    const [insertedMemberships] = await db
      .insert(memberMemberships)
      .values(membershipsData)
      .returning();

    console.log(`Created ${insertedMemberships.length} member memberships`);

    // Create some sample sales
    const salesData = [];
    const saleItemsData = [];

    for (let i = 0; i < 100; i++) {
      const saleNumber = `SALE${faker.date.past({ years: 1 }).getTime()}${faker.string.alphanumeric({ length: 5 }).toUpperCase()}`;
      const totalAmount = faker.number.float({ min: 10, max: 200, fractionDigits: 2 });
      const discountAmount = faker.helpers.maybe(() => faker.number.float({ min: 0, max: 20, fractionDigits: 2 }), { probability: 0.3 });
      const finalAmount = totalAmount - (discountAmount || 0);

      const member = faker.helpers.maybe(() => faker.helpers.arrayElement(insertedMembers), { probability: 0.7 });

      const [newSale] = await db
        .insert(sales)
        .values({
          saleNumber,
          memberId: member?.id,
          totalAmount,
          discountAmount: discountAmount || 0,
          finalAmount,
          paymentMethod: faker.helpers.arrayElement(['cash', 'card', 'mobile']),
          paymentStatus: faker.helpers.arrayElement(['completed', 'pending', 'failed']),
          staffId: faker.helpers.maybe(() => faker.helpers.arrayElement(insertedMembers).id),
          notes: faker.helpers.maybe(() => faker.lorem.sentences(1))
        })
        .returning();

      // Add sale items
      const numItems = faker.number.int({ min: 1, max: 5 });
      for (let j = 0; j < numItems; j++) {
        const product = faker.helpers.arrayElement(insertedProducts);
        const quantity = faker.number.int({ min: 1, max: 3 });
        const unitPrice = product.price;
        const totalPrice = unitPrice * quantity;

        saleItemsData.push({
          saleId: newSale.id,
          productId: product.id,
          quantity,
          unitPrice,
          totalPrice
        });
      }
    }

    const [insertedSaleItems] = await db
      .insert(saleItems)
      .values(saleItemsData)
      .returning();

    console.log(`Created ${saleItemsData.length} sale items`);

    // Create attendance logs
    const attendanceData = [];
    for (let i = 0; i < 500; i++) {
      const member = faker.helpers.arrayElement(insertedMembers);
      const checkInTime = faker.date.past({ years: 1 });
      const hasCheckOut = faker.helpers.maybe(() => true, { probability: 0.7 });

      const checkOutTime = hasCheckOut ?
        new Date(checkInTime.getTime() + faker.number.int({ min: 3000000, max: 14400000 })) : // 50 min to 4 hours
        null;

      const status = hasCheckOut ? 'checked_out' : 'checked_in';

      attendanceData.push({
        memberId: member.id,
        checkInTime,
        checkOutTime,
        status,
        notes: faker.helpers.maybe(() => faker.lorem.sentences(1)),
        staffId: faker.helpers.maybe(() => faker.helpers.arrayElement(insertedMembers).id)
      });
    }

    const [insertedAttendance] = await db
      .insert(attendanceLogs)
      .values(attendanceData)
      .returning();

    console.log(`Created ${insertedAttendance.length} attendance logs`);

    console.log('Database seeding completed successfully!');

    return {
      plans: insertedPlans.length,
      products: insertedProducts.length,
      members: insertedMembers.length,
      memberships: insertedMemberships.length,
      sales: saleItemsData.length,
      attendance: insertedAttendance.length
    };

  } catch (error) {
    console.error('Error seeding database:', error);
    throw error;
  }
}

// Run seeding if this file is executed directly
if (require.main === module) {
  seedDatabase()
    .then((result) => {
      console.log('Seeding results:', result);
      process.exit(0);
    })
    .catch((error) => {
      console.error('Seeding failed:', error);
      process.exit(1);
    });
}

export { seedDatabase };