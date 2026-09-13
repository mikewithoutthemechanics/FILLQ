import crypto from 'crypto';

const ALGORITHM = 'aes-256-gcm';
const IV_LENGTH = 16;
const SALT_LENGTH = 64;
const TAG_LENGTH = 16;
const KEY_LENGTH = 32;

function getEncryptionKey(): Buffer {
  const secret = process.env.ENCRYPTION_KEY || process.env.JWT_SECRET || 'filliq-default-secret-key-32-chars!!';
  return crypto.scryptSync(secret, 'filliq-salt', KEY_LENGTH);
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

  // Combine iv, tag, and encrypted content into a single base64 string
  const combined = Buffer.concat([iv, tag, encrypted]);
  return combined.toString('base64');
}

/**
 * Decrypt an AES-256-GCM encrypted base64 string
 */
export function decryptText(encryptedBase64: string): string {
  if (!encryptedBase64) return encryptedBase64;

  try {
    const combined = Buffer.from(encryptedBase64, 'base64');

    if (combined.length < IV_LENGTH + TAG_LENGTH) {
      // Return as is if not encrypted in expected format
      return encryptedBase64;
    }

    const iv = combined.subarray(0, IV_LENGTH);
    const tag = combined.subarray(IV_LENGTH, IV_LENGTH + TAG_LENGTH);
    const encryptedText = combined.subarray(IV_LENGTH + TAG_LENGTH);

    const key = getEncryptionKey();
    const decipher = crypto.createDecipheriv(ALGORITHM, key, iv);
    decipher.setAuthTag(tag);

    const decrypted = Buffer.concat([decipher.update(encryptedText), decipher.final()]);
    return decrypted.toString('utf8');
  } catch (error) {
    // If decryption fails (e.g. was plain text or wrong key), fallback to original string
    return encryptedBase64;
  }
}
