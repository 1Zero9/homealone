import { PrismaClient, Role } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  console.log('Seeding Home Alone user accounts...');

  // 1. Ensure core household accounts exist
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

  console.log('Household users ready:', {
    stephen: stephen.email,
    wife: wife.email,
    adminBackup: adminBackup.email,
  });
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
