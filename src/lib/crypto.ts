import crypto from 'crypto';

/**
 * Field-level encryption for highly sensitive data (account numbers, login
 * credentials, security notes) stored on the Account model. This is
 * server-only code — never import it from a client component.
 *
 * Uses AES-256-GCM: a random 12-byte IV per value, with the GCM auth tag
 * appended so we can detect tampering/corruption on decrypt. Output format:
 * `v1:base64(iv):base64(authTag):base64(ciphertext)` — the leading `v1:`
 * is a key-version marker (see KEY_VERSION below), letting a future key
 * rotation tell already-rotated values apart from ones still encrypted
 * with an older key, so rotation can be resumed safely if interrupted.
 * Values encrypted before this marker existed have no prefix (3 parts
 * instead of 4) and are still read correctly — see decryptField.
 *
 * The key comes from CREDENTIALS_ENCRYPTION_KEY (32 raw bytes, base64
 * encoded — generate with `openssl rand -base64 32`). If it's not set,
 * encrypt/decrypt throw rather than silently storing plaintext.
 */

const ALGORITHM = 'aes-256-gcm';
const IV_LENGTH = 12;
const KEY_VERSION = 'v1';

function parseKey(secret: string, envVarName: string): Buffer {
  const key = Buffer.from(secret, 'base64');
  if (key.length !== 32) {
    throw new Error(`${envVarName} must decode to exactly 32 bytes (256 bits).`);
  }
  return key;
}

function getKey(): Buffer {
  const secret = process.env.CREDENTIALS_ENCRYPTION_KEY;
  if (!secret) {
    throw new Error(
      'CREDENTIALS_ENCRYPTION_KEY is not set. Generate one with `openssl rand -base64 32` and add it to your environment before storing account credentials.'
    );
  }
  return parseKey(secret, 'CREDENTIALS_ENCRYPTION_KEY');
}

export function isEncryptionConfigured(): boolean {
  const secret = process.env.CREDENTIALS_ENCRYPTION_KEY;
  if (!secret) return false;
  try {
    return Buffer.from(secret, 'base64').length === 32;
  } catch {
    return false;
  }
}

export function encryptField(plaintext: string, key: Buffer = getKey()): string {
  const iv = crypto.randomBytes(IV_LENGTH);
  const cipher = crypto.createCipheriv(ALGORITHM, key, iv);
  const ciphertext = Buffer.concat([cipher.update(plaintext, 'utf8'), cipher.final()]);
  const authTag = cipher.getAuthTag();
  return `${KEY_VERSION}:${iv.toString('base64')}:${authTag.toString('base64')}:${ciphertext.toString('base64')}`;
}

/** True if a stored value already carries the current key-version prefix. */
export function isCurrentKeyVersion(stored: string): boolean {
  return stored.startsWith(`${KEY_VERSION}:`);
}

export function decryptField(stored: string, key: Buffer = getKey()): string {
  const parts = stored.split(':');
  // Legacy (pre-versioning) values have no marker: iv:authTag:ciphertext.
  // Versioned values are marker:iv:authTag:ciphertext.
  const [ivB64, tagB64, dataB64] = parts.length === 4 ? parts.slice(1) : parts;
  if (!ivB64 || !tagB64 || !dataB64) {
    throw new Error('Malformed encrypted value.');
  }
  const iv = Buffer.from(ivB64, 'base64');
  const authTag = Buffer.from(tagB64, 'base64');
  const ciphertext = Buffer.from(dataB64, 'base64');
  const decipher = crypto.createDecipheriv(ALGORITHM, key, iv);
  decipher.setAuthTag(authTag);
  const plaintext = Buffer.concat([decipher.update(ciphertext), decipher.final()]);
  return plaintext.toString('utf8');
}

/**
 * Parses a base64-encoded 32-byte key from an arbitrary env var name.
 * Used by the key-rotation script to load the OLD key distinctly from
 * CREDENTIALS_ENCRYPTION_KEY (the new/current key used everywhere else).
 */
export function loadKeyFromEnv(envVarName: string): Buffer {
  const secret = process.env[envVarName];
  if (!secret) {
    throw new Error(`${envVarName} is not set.`);
  }
  return parseKey(secret, envVarName);
}

/** Encrypts a value, or returns null/undefined unchanged (optional fields). */
export function encryptOptional(value: string | null | undefined): string | null {
  if (value === null || value === undefined || value === '') return null;
  return encryptField(value);
}

export function decryptOptional(value: string | null | undefined): string | null {
  if (value === null || value === undefined) return null;
  try {
    return decryptField(value);
  } catch {
    return null;
  }
}

/** Masks a decrypted secret for display, e.g. "••••4821" for an account number. */
export function maskSecret(value: string, visibleTail = 4): string {
  if (value.length <= visibleTail) return '•'.repeat(value.length);
  return `${'•'.repeat(Math.max(4, value.length - visibleTail))}${value.slice(-visibleTail)}`;
}
