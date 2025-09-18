import crypto from 'crypto';

// Encryption configuration
const ALGORITHM = 'aes-256-gcm';
const KEY_LENGTH = 32; // 256 bits
const IV_LENGTH = 16; // 128 bits
const SALT_LENGTH = 64; // 512 bits
const TAG_LENGTH = 16; // 128 bits

interface EncryptedData {
  encrypted: string;
  iv: string;
  salt: string;
  tag: string;
}

interface EncryptionOptions {
  key?: string;
  encoding?: BufferEncoding;
}

class EncryptionService {
  private masterKey: string;

  constructor() {
    this.masterKey = process.env.ENCRYPTION_MASTER_KEY || this.generateKey();
    
    if (!process.env.ENCRYPTION_MASTER_KEY) {
      console.warn('⚠️ ENCRYPTION_MASTER_KEY not set. Using generated key. Set this in production!');
      console.log('Generated key:', this.masterKey);
    }
  }

  /**
   * Generate a random encryption key
   */
  generateKey(): string {
    return crypto.randomBytes(KEY_LENGTH).toString('hex');
  }

  /**
   * Derive key from master key and salt using PBKDF2
   */
  private deriveKey(salt: Buffer, masterKey?: string): Buffer {
    const key = masterKey || this.masterKey;
    return crypto.pbkdf2Sync(key, salt, 100000, KEY_LENGTH, 'sha512');
  }

  /**
   * Encrypt sensitive data
   */
  encrypt(plaintext: string, options: EncryptionOptions = {}): EncryptedData {
    try {
      const salt = crypto.randomBytes(SALT_LENGTH);
      const iv = crypto.randomBytes(IV_LENGTH);
      const key = this.deriveKey(salt, options.key);

      const cipher = crypto.createCipheriv(ALGORITHM, key, iv);
      cipher.setAAD(salt); // Additional authenticated data

      let encrypted = cipher.update(plaintext, 'utf8', 'hex');
      encrypted += cipher.final('hex');

      const tag = cipher.getAuthTag();

      return {
        encrypted,
        iv: iv.toString('hex'),
        salt: salt.toString('hex'),
        tag: tag.toString('hex')
      };
    } catch (error) {
      console.error('Encryption error:', error);
      throw new Error('Failed to encrypt data');
    }
  }

  /**
   * Decrypt sensitive data
   */
  decrypt(encryptedData: EncryptedData, options: EncryptionOptions = {}): string {
    try {
      const { encrypted, iv, salt, tag } = encryptedData;
      
      const saltBuffer = Buffer.from(salt, 'hex');
      const ivBuffer = Buffer.from(iv, 'hex');
      const tagBuffer = Buffer.from(tag, 'hex');
      const key = this.deriveKey(saltBuffer, options.key);

      const decipher = crypto.createDecipheriv(ALGORITHM, key, ivBuffer);
      decipher.setAAD(saltBuffer);
      decipher.setAuthTag(tagBuffer);

      let decrypted = decipher.update(encrypted, 'hex', 'utf8');
      decrypted += decipher.final('utf8');

      return decrypted;
    } catch (error) {
      console.error('Decryption error:', error);
      throw new Error('Failed to decrypt data');
    }
  }

  /**
   * Encrypt PII data with field-specific keys
   */
  encryptPII(data: string, fieldType: string, userId?: string): string {
    const fieldSalt = crypto.createHash('sha256')
      .update(`${fieldType}:${userId || 'anonymous'}`)
      .digest('hex');
    
    const encryptedData = this.encrypt(data, { key: fieldSalt });
    
    // Store as JSON string for database
    return JSON.stringify(encryptedData);
  }

  /**
   * Decrypt PII data with field-specific keys
   */
  decryptPII(encryptedJson: string, fieldType: string, userId?: string): string {
    const fieldSalt = crypto.createHash('sha256')
      .update(`${fieldType}:${userId || 'anonymous'}`)
      .digest('hex');
    
    const encryptedData = JSON.parse(encryptedJson) as EncryptedData;
    
    return this.decrypt(encryptedData, { key: fieldSalt });
  }

  /**
   * Hash sensitive data (one-way)
   */
  hash(data: string, salt?: string): { hash: string; salt: string } {
    const saltBuffer = salt ? Buffer.from(salt, 'hex') : crypto.randomBytes(SALT_LENGTH);
    const hash = crypto.pbkdf2Sync(data, saltBuffer, 100000, 64, 'sha512');
    
    return {
      hash: hash.toString('hex'),
      salt: saltBuffer.toString('hex')
    };
  }

  /**
   * Verify hashed data
   */
  verifyHash(data: string, hash: string, salt: string): boolean {
    const computedHash = crypto.pbkdf2Sync(data, Buffer.from(salt, 'hex'), 100000, 64, 'sha512');
    return computedHash.toString('hex') === hash;
  }

  /**
   * Generate secure token
   */
  generateToken(length: number = 32): string {
    return crypto.randomBytes(length).toString('hex');
  }

  /**
   * Generate secure numeric code
   */
  generateNumericCode(length: number = 6): string {
    const max = Math.pow(10, length) - 1;
    const min = Math.pow(10, length - 1);
    return (Math.floor(Math.random() * (max - min + 1)) + min).toString();
  }

  /**
   * Encrypt file content
   */
  encryptFile(fileBuffer: Buffer, options: EncryptionOptions = {}): Buffer {
    const salt = crypto.randomBytes(SALT_LENGTH);
    const iv = crypto.randomBytes(IV_LENGTH);
    const key = this.deriveKey(salt, options.key);

    const cipher = crypto.createCipheriv(ALGORITHM, key, iv);
    cipher.setAAD(salt);

    const encrypted = Buffer.concat([
      cipher.update(fileBuffer),
      cipher.final()
    ]);

    const tag = cipher.getAuthTag();

    // Combine salt, iv, tag, and encrypted data
    return Buffer.concat([
      Buffer.from([SALT_LENGTH]), // Salt length indicator
      salt,
      Buffer.from([IV_LENGTH]), // IV length indicator  
      iv,
      Buffer.from([TAG_LENGTH]), // Tag length indicator
      tag,
      encrypted
    ]);
  }

  /**
   * Decrypt file content
   */
  decryptFile(encryptedBuffer: Buffer, options: EncryptionOptions = {}): Buffer {
    let offset = 0;

    // Read salt
    const saltLength = encryptedBuffer.readUInt8(offset++);
    const salt = encryptedBuffer.subarray(offset, offset + saltLength);
    offset += saltLength;

    // Read IV
    const ivLength = encryptedBuffer.readUInt8(offset++);
    const iv = encryptedBuffer.subarray(offset, offset + ivLength);
    offset += ivLength;

    // Read tag
    const tagLength = encryptedBuffer.readUInt8(offset++);
    const tag = encryptedBuffer.subarray(offset, offset + tagLength);
    offset += tagLength;

    // Read encrypted data
    const encrypted = encryptedBuffer.subarray(offset);

    const key = this.deriveKey(salt, options.key);
    const decipher = crypto.createDecipheriv(ALGORITHM, key, iv);
    decipher.setAAD(salt);
    decipher.setAuthTag(tag);

    return Buffer.concat([
      decipher.update(encrypted),
      decipher.final()
    ]);
  }

  /**
   * Create HMAC signature
   */
  createSignature(data: string, secret?: string): string {
    const key = secret || this.masterKey;
    return crypto.createHmac('sha256', key).update(data).digest('hex');
  }

  /**
   * Verify HMAC signature
   */
  verifySignature(data: string, signature: string, secret?: string): boolean {
    const key = secret || this.masterKey;
    const computedSignature = crypto.createHmac('sha256', key).update(data).digest('hex');
    return crypto.timingSafeEqual(Buffer.from(signature), Buffer.from(computedSignature));
  }

  /**
   * Mask sensitive data for logging
   */
  maskData(data: string, visibleChars: number = 4): string {
    if (data.length <= visibleChars * 2) {
      return '*'.repeat(data.length);
    }
    
    const start = data.substring(0, visibleChars);
    const end = data.substring(data.length - visibleChars);
    const middle = '*'.repeat(data.length - (visibleChars * 2));
    
    return `${start}${middle}${end}`;
  }
}

// Singleton instance
export const encryptionService = new EncryptionService();

// Helper functions for common PII fields
export const encryptEmail = (email: string, userId?: string): string => {
  return encryptionService.encryptPII(email, 'email', userId);
};

export const decryptEmail = (encryptedEmail: string, userId?: string): string => {
  return encryptionService.decryptPII(encryptedEmail, 'email', userId);
};

export const encryptPhone = (phone: string, userId?: string): string => {
  return encryptionService.encryptPII(phone, 'phone', userId);
};

export const decryptPhone = (encryptedPhone: string, userId?: string): string => {
  return encryptionService.decryptPII(encryptedPhone, 'phone', userId);
};

export const encryptAddress = (address: string, userId?: string): string => {
  return encryptionService.encryptPII(address, 'address', userId);
};

export const decryptAddress = (encryptedAddress: string, userId?: string): string => {
  return encryptionService.decryptPII(encryptedAddress, 'address', userId);
};

export const encryptName = (name: string, userId?: string): string => {
  return encryptionService.encryptPII(name, 'name', userId);
};

export const decryptName = (encryptedName: string, userId?: string): string => {
  return encryptionService.decryptPII(encryptedName, 'name', userId);
};

// Export the service
export default encryptionService;
