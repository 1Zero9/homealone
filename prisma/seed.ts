import { PrismaClient, Role } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  console.log('Ensuring primary household workspace...');

  // 1. Ensure or find primary Household
  let household = await prisma.household.findFirst();
  if (!household) {
    household = await prisma.household.create({
      data: {
        name: 'Our Household',
        inviteCode: 'home-alone-family',
      },
    });
  }

  console.log('Primary household:', household.name, `(ID: ${household.id}, Code: ${household.inviteCode})`);

  // 2. Ensure core household accounts exist and belong to this household
  await prisma.user.upsert({
    where: { email: 'onezeronine@gmail.com' },
    update: {
      name: 'Admin',
      role: Role.ADMIN,
      householdId: household.id,
    },
    create: {
      email: 'onezeronine@gmail.com',
      name: 'Admin',
      role: Role.ADMIN,
      householdId: household.id,
    },
  });

  await prisma.user.upsert({
    where: { email: 'wife@homealone.local' },
    update: {
      name: 'Wife / Partner',
      role: Role.MEMBER,
      householdId: household.id,
    },
    create: {
      email: 'wife@homealone.local',
      name: 'Wife / Partner',
      role: Role.MEMBER,
      householdId: household.id,
    },
  });

  await prisma.user.upsert({
    where: { email: 'backup-admin@homealone.local' },
    update: {
      name: 'Admin Backup',
      role: Role.BACKUP_ADMIN,
      householdId: household.id,
    },
    create: {
      email: 'backup-admin@homealone.local',
      name: 'Admin Backup',
      role: Role.BACKUP_ADMIN,
      householdId: household.id,
    },
  });

  // Link any orphaned users or expenses to the primary household
  await prisma.user.updateMany({
    where: { householdId: null },
    data: { householdId: household.id },
  });

  await prisma.expense.updateMany({
    where: { householdId: null },
    data: { householdId: household.id },
  });

  console.log('Household workspace and users synchronized.');
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
