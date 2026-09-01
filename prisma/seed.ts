import { PrismaClient, Role } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  console.log('Seeding Home Alone database...');

  // 1. Create or upsert users
  const stephen = await prisma.user.upsert({
    where: { email: 'scranfield@gmail.com' },
    update: {
      name: 'Stephen',
      role: Role.ADMIN,
    },
    create: {
      email: 'scranfield@gmail.com',
      name: 'Stephen',
      role: Role.ADMIN,
    },
  });

  const wife = await prisma.user.upsert({
    where: { email: 'wife@homealone.local' },
    update: {
      name: 'Wife / Partner',
      role: Role.MEMBER,
    },
    create: {
      email: 'wife@homealone.local',
      name: 'Wife / Partner',
      role: Role.MEMBER,
    },
  });

  const adminBackup = await prisma.user.upsert({
    where: { email: 'backup-admin@homealone.local' },
    update: {
      name: 'Admin Backup',
      role: Role.BACKUP_ADMIN,
    },
    create: {
      email: 'backup-admin@homealone.local',
      name: 'Admin Backup',
      role: Role.BACKUP_ADMIN,
    },
  });

  console.log(`Users seeded:`, { stephen: stephen.name, wife: wife.name, adminBackup: adminBackup.name });

  // 2. Check if expenses already exist
  const count = await prisma.expense.count();
  if (count === 0) {
    console.log('Seeding initial household expenses...');

    const now = new Date();
    const currentYear = now.getFullYear();
    const currentMonth = now.getMonth();
    const formatDate = (d: number) =>
      new Date(currentYear, currentMonth, Math.min(d, 28)).toISOString().split('T')[0];

    const initialExpenses = [
      // Streaming
      {
        name: 'Netflix Standard',
        amount: 13.99,
        currency: 'EUR',
        billingCycle: 'monthly',
        category: 'entertainment',
        icon: 'Tv',
        color: '#F04E3E',
        renewalDay: 12,
        nextRenewalDate: formatDate(12),
        paymentMethod: 'SEPA Direct Debit',
        isActive: true,
        notes: '1080p HD profile, 2 screens',
        usageRating: 'high',
        createdById: stephen.id,
      },
      {
        name: 'Spotify Premium',
        amount: 10.99,
        currency: 'EUR',
        billingCycle: 'monthly',
        category: 'entertainment',
        icon: 'Music',
        color: '#3155D9',
        renewalDay: 18,
        nextRenewalDate: formatDate(18),
        paymentMethod: 'Visa Debit',
        isActive: true,
        notes: 'Daily music & podcasts',
        usageRating: 'high',
        createdById: stephen.id,
      },
      {
        name: 'Apple TV+',
        amount: 9.99,
        currency: 'EUR',
        billingCycle: 'monthly',
        category: 'entertainment',
        icon: 'Film',
        color: '#202124',
        renewalDay: 24,
        nextRenewalDate: formatDate(24),
        paymentMethod: 'Apple Pay',
        isActive: true,
        notes: '4K HDR originals',
        usageRating: 'medium',
        createdById: stephen.id,
      },

      // AI & Tech
      {
        name: 'ChatGPT Plus (OpenAI)',
        amount: 22.99,
        currency: 'EUR',
        billingCycle: 'monthly',
        category: 'ai-tech',
        icon: 'Bot',
        color: '#1a3299',
        renewalDay: 5,
        nextRenewalDate: formatDate(5),
        paymentMethod: 'Credit Card',
        isActive: true,
        notes: 'GPT-4o, o1 reasoning, Canvas & Voice mode',
        usageRating: 'high',
        createdById: stephen.id,
      },
      {
        name: 'Claude Pro (Anthropic)',
        amount: 22.99,
        currency: 'EUR',
        billingCycle: 'monthly',
        category: 'ai-tech',
        icon: 'Sparkles',
        color: '#202124',
        renewalDay: 15,
        nextRenewalDate: formatDate(15),
        paymentMethod: 'Credit Card',
        isActive: true,
        notes: 'Claude 3.5 Sonnet, projects & artifacts',
        usageRating: 'high',
        createdById: stephen.id,
      },
      {
        name: 'Cursor Pro AI Editor',
        amount: 20.00,
        currency: 'EUR',
        billingCycle: 'monthly',
        category: 'ai-tech',
        icon: 'Code2',
        color: '#3155D9',
        renewalDay: 22,
        nextRenewalDate: formatDate(22),
        paymentMethod: 'Credit Card',
        isActive: true,
        notes: 'Main code editor with Composer',
        usageRating: 'high',
        createdById: stephen.id,
      },
      {
        name: 'Midjourney Standard',
        amount: 28.00,
        currency: 'EUR',
        billingCycle: 'monthly',
        category: 'ai-tech',
        icon: 'Image',
        color: '#202124',
        renewalDay: 28,
        nextRenewalDate: formatDate(28),
        paymentMethod: 'Credit Card',
        isActive: false, // Paused
        notes: 'Paused subscription',
        usageRating: 'low',
        createdById: stephen.id,
      },
      {
        name: 'iCloud+ 200GB Storage',
        amount: 2.99,
        currency: 'EUR',
        billingCycle: 'monthly',
        category: 'ai-tech',
        icon: 'Cloud',
        color: '#3155D9',
        renewalDay: 3,
        nextRenewalDate: formatDate(3),
        paymentMethod: 'Apple Pay',
        isActive: true,
        notes: 'Phone backup & iCloud Private Relay',
        usageRating: 'high',
        createdById: stephen.id,
      },

      // Utilities
      {
        name: 'Home Power & Gas (Dual Fuel)',
        amount: 155.00,
        currency: 'EUR',
        billingCycle: 'monthly',
        category: 'utilities',
        icon: 'Zap',
        color: '#3155D9',
        renewalDay: 1,
        nextRenewalDate: formatDate(1),
        paymentMethod: 'SEPA Direct Debit',
        isActive: true,
        notes: 'Green electricity and gas heating',
        contractEndDate: '2027-04-30',
        createdById: stephen.id,
      },
      {
        name: 'Fiber Broadband (500 Mbps)',
        amount: 39.99,
        currency: 'EUR',
        billingCycle: 'monthly',
        category: 'utilities',
        icon: 'Wifi',
        color: '#3155D9',
        renewalDay: 8,
        nextRenewalDate: formatDate(8),
        paymentMethod: 'SEPA Direct Debit',
        isActive: true,
        notes: 'Fiber broadband with Wi-Fi hub',
        contractEndDate: '2026-11-15',
        createdById: stephen.id,
      },
      {
        name: 'Water & Wastewater Utility',
        amount: 32.50,
        currency: 'EUR',
        billingCycle: 'monthly',
        category: 'utilities',
        icon: 'Droplets',
        color: '#3155D9',
        renewalDay: 14,
        nextRenewalDate: formatDate(14),
        paymentMethod: 'SEPA Direct Debit',
        isActive: true,
        notes: 'Monthly metered water utility',
        createdById: stephen.id,
      },
      {
        name: 'Mobile Phone Plan (5G Unlimited)',
        amount: 19.99,
        currency: 'EUR',
        billingCycle: 'monthly',
        category: 'utilities',
        icon: 'Smartphone',
        color: '#3155D9',
        renewalDay: 19,
        nextRenewalDate: formatDate(19),
        paymentMethod: 'SEPA Direct Debit',
        isActive: true,
        notes: 'Unlimited 5G data, EU roaming',
        createdById: stephen.id,
      },

      // Housing
      {
        name: 'Municipal & Property Tax',
        amount: 185.00,
        currency: 'EUR',
        billingCycle: 'monthly',
        category: 'housing',
        icon: 'Building2',
        color: '#202124',
        renewalDay: 1,
        nextRenewalDate: formatDate(1),
        paymentMethod: 'SEPA Direct Debit',
        isActive: true,
        notes: 'Monthly municipal rate instalment',
        createdById: stephen.id,
      },
      {
        name: 'Home & Contents Insurance',
        amount: 26.00,
        currency: 'EUR',
        billingCycle: 'monthly',
        category: 'housing',
        icon: 'ShieldCheck',
        color: '#202124',
        renewalDay: 20,
        nextRenewalDate: formatDate(20),
        paymentMethod: 'SEPA Direct Debit',
        isActive: true,
        notes: 'Comprehensive buildings and contents coverage',
        createdById: stephen.id,
      },

      // Lifestyle
      {
        name: 'Gym Membership',
        amount: 34.99,
        currency: 'EUR',
        billingCycle: 'monthly',
        category: 'lifestyle',
        icon: 'Dumbbell',
        color: '#676B73',
        renewalDay: 7,
        nextRenewalDate: formatDate(7),
        paymentMethod: 'SEPA Direct Debit',
        isActive: true,
        notes: 'Full gym and fitness facility access',
        usageRating: 'high',
        createdById: stephen.id,
      },
    ];

    for (const exp of initialExpenses) {
      await prisma.expense.create({
        data: exp,
      });
    }

    console.log(`Seeded ${initialExpenses.length} household expenses.`);
  }

  // Create initial database backup snapshot
  const allExpenses = await prisma.expense.findMany();
  await prisma.databaseBackup.create({
    data: {
      createdById: adminBackup.id,
      payloadJson: allExpenses as any,
      recordCount: allExpenses.length,
      notes: 'Initial database seed snapshot',
    },
  });

  console.log('Database seeding completed successfully.');
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
