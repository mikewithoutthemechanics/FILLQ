import crypto from 'crypto';

const ALGORITHM = 'aes-256-gcm';
const IV_LENGTH = 16;
const TAG_LENGTH = 16;
const KEY_LENGTH = 32;

function getEncryptionKey(): Buffer {
  const secret = process.env.ENCRYPTION_KEY || process.env.JWT_SECRET;

  if (!secret) {
    if (process.env.NODE_ENV === 'production') {
      throw new Error('ENCRYPTION_KEY or JWT_SECRET must be set in production');
    }
    // Fallback for local development
    return crypto.scryptSync('filliq-development-secret-key-32-chars!!', 'filliq-app-salt-v1', KEY_LENGTH);
  }

  const salt = process.env.ENCRYPTION_SALT || 'filliq-app-salt-v1';
  return crypto.scryptSync(secret, salt, KEY_LENGTH);
}

/**
 * Encrypt a plain text string using AES-256-GCM
 */
export function encryptText(text: string): string {
  if (!text) return text;

  const iv = crypto.randomBytes(IV_LENGTH);
  const key = getEncryptionKey();
  const cipher = crypto.createCipheriv(ALGORITHM, key, iv);

  const encrypted = Buffer.concat([cipher.update(text, 'utf8'), cipher.final()]);
  const tag = cipher.getAuthTag();

  const combined = Buffer.concat([iv, tag, encrypted]);
  return combined.toString('base64');
}

/**
 * Decrypt an AES-256-GCM encrypted base64 string
 */
export function decryptText(encryptedBase64: string): string {
  if (!encryptedBase64) return encryptedBase64;

  const combined = Buffer.from(encryptedBase64, 'base64');

  if (combined.length < IV_LENGTH + TAG_LENGTH) {
    throw new Error('Invalid ciphertext length');
  }

  const iv = combined.subarray(0, IV_LENGTH);
  const tag = combined.subarray(IV_LENGTH, IV_LENGTH + TAG_LENGTH);
  const encryptedText = combined.subarray(IV_LENGTH + TAG_LENGTH);

  const key = getEncryptionKey();
  const decipher = crypto.createDecipheriv(ALGORITHM, key, iv);
  decipher.setAuthTag(tag);

  const decrypted = Buffer.concat([decipher.update(encryptedText), decipher.final()]);
  return decrypted.toString('utf8');
}
