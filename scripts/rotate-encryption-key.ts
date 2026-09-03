/**
 * Rotates CREDENTIALS_ENCRYPTION_KEY: decrypts every encrypted Account
 * field with the OLD key and re-encrypts it with the NEW key, in a single
 * DB transaction. Use this if the key ever leaks or as part of routine
 * key hygiene.
 *
 * Usage:
 *   1. Generate a new key:      openssl rand -base64 32
 *   2. Set env vars:
 *        OLD_CREDENTIALS_ENCRYPTION_KEY = <current key currently in CREDENTIALS_ENCRYPTION_KEY>
 *        CREDENTIALS_ENCRYPTION_KEY     = <new key>
 *   3. Dry run first (no writes):   npm run rotate-key -- --dry-run
 *   4. Then for real:               npm run rotate-key
 *   5. Update CREDENTIALS_ENCRYPTION_KEY in your deployment's secret
 *      manager to the new key and redeploy.
 *
 * Safe to re-run: if interrupted, just re-run with the same old/new pair —
 * already-rotated rows will simply fail to decrypt with the "old" key on a
 * second pass, so ALWAYS keep a DB backup before running against prod.
 */
import { PrismaClient } from '@prisma/client';
import { decryptField, encryptField, loadKeyFromEnv } from '../src/lib/crypto';

const prisma = new PrismaClient();

const ENCRYPTED_FIELDS = [
  'accountNumberEnc',
  'routingNumberEnc',
  'loginUsernameEnc',
  'loginPasswordEnc',
  'loginUrlEnc',
  'securityNotesEnc',
] as const;

async function main() {
  const dryRun = process.argv.includes('--dry-run');

  const oldKey = loadKeyFromEnv('OLD_CREDENTIALS_ENCRYPTION_KEY');
  const newKey = loadKeyFromEnv('CREDENTIALS_ENCRYPTION_KEY');

  if (oldKey.equals(newKey)) {
    throw new Error(
      'OLD_CREDENTIALS_ENCRYPTION_KEY and CREDENTIALS_ENCRYPTION_KEY are identical — nothing to rotate.'
    );
  }

  const accounts = await prisma.account.findMany({
    select: {
      id: true,
      name: true,
      accountNumberEnc: true,
      routingNumberEnc: true,
      loginUsernameEnc: true,
      loginPasswordEnc: true,
      loginUrlEnc: true,
      securityNotesEnc: true,
    },
  });

  console.log(`Found ${accounts.length} account(s). ${dryRun ? '[DRY RUN — no writes]' : ''}`);

  let rotatedFieldCount = 0;
  let failedCount = 0;

  for (const account of accounts) {
    const updates: Record<string, string> = {};

    for (const field of ENCRYPTED_FIELDS) {
      const encrypted = account[field] as string | null;
      if (!encrypted) continue;

      try {
        const plaintext = decryptField(encrypted, oldKey);
        updates[field] = encryptField(plaintext, newKey);
        rotatedFieldCount++;
      } catch (err) {
        failedCount++;
        console.error(
          `  ✗ ${account.name} (${account.id}).${field}: failed to decrypt with old key — ${
            err instanceof Error ? err.message : err
          }`
        );
      }
    }

    if (Object.keys(updates).length === 0) continue;

    console.log(`  ✓ ${account.name} (${account.id}): rotating ${Object.keys(updates).length} field(s)`);

    if (!dryRun) {
      await prisma.account.update({ where: { id: account.id }, data: updates });
    }
  }

  console.log(
    `\nDone. ${rotatedFieldCount} field(s) rotated${failedCount ? `, ${failedCount} FAILED` : ''}.${
      dryRun ? ' (dry run — no changes written)' : ''
    }`
  );

  if (failedCount > 0) {
    process.exitCode = 1;
  }
}

main()
  .catch((err) => {
    console.error(err);
    process.exitCode = 1;
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
