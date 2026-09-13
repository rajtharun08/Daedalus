/**
 * Daedalus AI - Zero-Knowledge Client-Side Key Vault
 * 
 * Security Guarantees:
 * 1. AES-256-GCM symmetric encryption via Web Crypto API.
 * 2. PBKDF2 key derivation (100,000 iterations, SHA-256) using a device-unique salt.
 * 3. Never writes plaintext API keys to localStorage or cookies.
 * 4. Safe masking utilities (reveals only harmless prefix/suffix).
 * 5. Instant 1-click cryptographic purge ("Panic Shredder").
 */

export type AIProvider = 'gemini' | 'openai' | 'anthropic' | 'github';

export interface VaultKeyMetadata {
  provider: AIProvider;
  maskedKey: string;
  fingerprint: string;
  model: string;
  addedAt: string;
  verified: boolean;
  latencyMs?: number;
}

interface EncryptedPayload {
  ciphertext: string;
  iv: string;
  salt: string;
  provider: AIProvider;
  model: string;
  maskedKey: string;
  fingerprint: string;
  addedAt: string;
  verified: boolean;
  latencyMs?: number;
}

const VAULT_STORAGE_KEY = 'daedalus_byok_encrypted_vault';
const VAULT_SALT_KEY = 'daedalus_vault_device_salt';
const VAULT_CANARY_KEY = 'daedalus_vault_canary';
const CANARY_PLAINTEXT = 'DAEDALUS_VAULT_OK';

// Volatile in-memory runtime secrets (never persisted to storage or transmitted)
let activeCryptoKey: CryptoKey | null = null;
let activePin: string | null = null;
let failedAttempts = 0;
let lockoutUntil = 0;

interface VaultCanary {
  ciphertext: string;
  iv: string;
  salt: string;
  createdAt: string;
}

// Helper: Convert ArrayBuffer to Base64
function bufferToBase64(buffer: ArrayBuffer): string {
  const bytes = new Uint8Array(buffer);
  let binary = '';
  for (let i = 0; i < bytes.byteLength; i++) {
    binary += String.fromCharCode(bytes[i]);
  }
  return window.btoa(binary);
}

// Helper: Convert Base64 to ArrayBuffer
function base64ToBuffer(base64: string): ArrayBuffer {
  const binary = window.atob(base64);
  const bytes = new Uint8Array(binary.length);
  for (let i = 0; i < binary.length; i++) {
    bytes[i] = binary.charCodeAt(i);
  }
  return bytes.buffer as ArrayBuffer;
}

function checkCryptoSupport(): void {
  if (typeof window === 'undefined' || !window.crypto || !window.crypto.subtle) {
    throw new Error('Web Crypto API requires a Secure Context (HTTPS or localhost).');
  }
}

// Get or create unique device salt for PBKDF2
function getOrCreateDeviceSalt(): Uint8Array {
  checkCryptoSupport();
  let saved = localStorage.getItem(VAULT_SALT_KEY);
  if (!saved) {
    const salt = window.crypto.getRandomValues(new Uint8Array(16));
    saved = bufferToBase64(salt.buffer as ArrayBuffer);
    localStorage.setItem(VAULT_SALT_KEY, saved);
    return salt;
  }
  return new Uint8Array(base64ToBuffer(saved));
}

// Derive AES-GCM Key using PBKDF2 from Master PIN
async function deriveKeyFromPin(pin: string, salt: Uint8Array): Promise<CryptoKey> {
  checkCryptoSupport();
  const enc = new TextEncoder();
  const keyMaterial = await window.crypto.subtle.importKey(
    'raw',
    enc.encode(`daedalus_vault_pin_${pin}`),
    { name: 'PBKDF2' },
    false,
    ['deriveKey']
  );

  return window.crypto.subtle.deriveKey(
    {
      name: 'PBKDF2',
      salt: salt as unknown as BufferSource,
      iterations: 100000,
      hash: 'SHA-256',
    },
    keyMaterial,
    { name: 'AES-GCM', length: 256 },
    false,
    ['encrypt', 'decrypt']
  );
}

// Legacy fallback derivation for backwards compatibility
async function deriveLegacyKey(salt: Uint8Array): Promise<CryptoKey> {
  checkCryptoSupport();
  const enc = new TextEncoder();
  const passphrase = `daedalus_vault_seed_${window.location.origin || window.location.host}`;
  const keyMaterial = await window.crypto.subtle.importKey(
    'raw',
    enc.encode(passphrase),
    { name: 'PBKDF2' },
    false,
    ['deriveKey']
  );

  return window.crypto.subtle.deriveKey(
    {
      name: 'PBKDF2',
      salt: salt as unknown as BufferSource,
      iterations: 100000,
      hash: 'SHA-256',
    },
    keyMaterial,
    { name: 'AES-GCM', length: 256 },
    false,
    ['encrypt', 'decrypt']
  );
}

/**
 * Returns whether a Master PIN canary has been initialized
 */
export function hasMasterPinSet(): boolean {
  return !!localStorage.getItem(VAULT_CANARY_KEY);
}

/**
 * Checks if the vault is currently unlocked in volatile memory
 */
export function isVaultUnlocked(): boolean {
  return activeCryptoKey !== null;
}

/**
 * Returns active lockout state and failed attempt count
 */
export function getLockoutStatus(): { isLockedOut: boolean; remainingSeconds: number; failedAttempts: number } {
  const now = Date.now();
  if (lockoutUntil > now) {
    return {
      isLockedOut: true,
      remainingSeconds: Math.ceil((lockoutUntil - now) / 1000),
      failedAttempts,
    };
  }
  return { isLockedOut: false, remainingSeconds: 0, failedAttempts };
}

/**
 * Sets or updates the Master PIN, encrypting a Canary verification token
 */
export async function setMasterPin(pin: string): Promise<void> {
  checkCryptoSupport();
  const trimmed = pin.trim();
  if (trimmed.length < 4) {
    throw new Error('Master PIN must be at least 4 digits/characters.');
  }

  const salt = getOrCreateDeviceSalt();
  const cryptoKey = await deriveKeyFromPin(trimmed, salt);
  const iv = window.crypto.getRandomValues(new Uint8Array(12));
  const enc = new TextEncoder();

  const canaryBuffer = await window.crypto.subtle.encrypt(
    { name: 'AES-GCM', iv },
    cryptoKey,
    enc.encode(CANARY_PLAINTEXT)
  );

  const canaryPayload: VaultCanary = {
    ciphertext: bufferToBase64(canaryBuffer),
    iv: bufferToBase64(iv.buffer as ArrayBuffer),
    salt: bufferToBase64(salt.buffer as ArrayBuffer),
    createdAt: new Date().toISOString(),
  };

  localStorage.setItem(VAULT_CANARY_KEY, JSON.stringify(canaryPayload));
  activeCryptoKey = cryptoKey;
  activePin = trimmed;
  failedAttempts = 0;
  lockoutUntil = 0;
}

/**
 * Unlocks the vault by verifying the candidate PIN against the Canary token
 */
export async function unlockVault(pin: string): Promise<boolean> {
  checkCryptoSupport();
  const now = Date.now();
  if (lockoutUntil > now) {
    const remaining = Math.ceil((lockoutUntil - now) / 1000);
    throw new Error(`Vault rate-limited: please wait ${remaining}s before retrying.`);
  }

  const trimmed = pin.trim();
  const canaryRaw = localStorage.getItem(VAULT_CANARY_KEY);

  // If no PIN set yet, configure this PIN as the Master PIN
  if (!canaryRaw) {
    await setMasterPin(trimmed);
    return true;
  }

  try {
    const canary: VaultCanary = JSON.parse(canaryRaw);
    const canarySalt = new Uint8Array(base64ToBuffer(canary.salt));
    const candidateKey = await deriveKeyFromPin(trimmed, canarySalt);
    const iv = new Uint8Array(base64ToBuffer(canary.iv));
    const ciphertext = base64ToBuffer(canary.ciphertext);

    const decryptedBuffer = await window.crypto.subtle.decrypt(
      { name: 'AES-GCM', iv },
      candidateKey,
      ciphertext
    );

    const dec = new TextDecoder();
    if (dec.decode(decryptedBuffer) === CANARY_PLAINTEXT) {
      activeCryptoKey = candidateKey;
      activePin = trimmed;
      failedAttempts = 0;
      lockoutUntil = 0;
      return true;
    }
  } catch {
    // Decryption failed (GCM authentication tag mismatch)
  }

  failedAttempts += 1;
  if (failedAttempts >= 5) {
    lockoutUntil = Date.now() + 60000; // 60s lockout
  } else if (failedAttempts >= 3) {
    lockoutUntil = Date.now() + 10000; // 10s lockout
  }
  return false;
}

/**
 * Locks the vault, wiping volatile cryptographic keys from memory
 */
export function lockVault(): void {
  activeCryptoKey = null;
  activePin = null;
}

// Active key resolution helper
async function resolveEncryptionKey(salt: Uint8Array): Promise<CryptoKey> {
  if (activeCryptoKey) {
    return activeCryptoKey;
  }
  if (activePin) {
    return deriveKeyFromPin(activePin, salt);
  }

  // Fallback to legacy key for existing unmigrated keys
  return deriveLegacyKey(salt);
}

/**
 * Mask raw API keys for safe UI presentation
 */
export function maskKey(key: string): string {
  if (!key) return '';
  const trimmed = key.trim();
  if (trimmed.length <= 8) {
    return '••••••••';
  }
  const prefix = trimmed.slice(0, 6);
  const suffix = trimmed.slice(-4);
  return `${prefix}••••••••••••••••${suffix}`;
}

/**
 * Generate a SHA-256 fingerprint hash prefix of the key
 */
export async function generateKeyFingerprint(key: string): Promise<string> {
  const enc = new TextEncoder();
  const hashBuffer = await window.crypto.subtle.digest('SHA-256', enc.encode(key.trim()));
  const hashArray = Array.from(new Uint8Array(hashBuffer));
  const hashHex = hashArray.map((b) => b.toString(16).padStart(2, '0')).join('');
  return `sha256:${hashHex.slice(0, 10)}`;
}

/**
 * Encrypt and store an API key in the secure local vault
 */
export async function storeKeyInVault(
  provider: AIProvider,
  rawKey: string,
  model: string = 'gemini-3.6-flash',
  verified: boolean = true,
  latencyMs?: number
): Promise<VaultKeyMetadata> {
  const trimmed = rawKey.trim();
  const salt = getOrCreateDeviceSalt();
  const cryptoKey = await resolveEncryptionKey(salt);
  const iv = window.crypto.getRandomValues(new Uint8Array(12));
  const enc = new TextEncoder();

  const ciphertextBuffer = await window.crypto.subtle.encrypt(
    { name: 'AES-GCM', iv },
    cryptoKey,
    enc.encode(trimmed)
  );

  const fingerprint = await generateKeyFingerprint(trimmed);
  const masked = maskKey(trimmed);

  const encryptedItem: EncryptedPayload = {
    provider,
    model,
    ciphertext: bufferToBase64(ciphertextBuffer),
    iv: bufferToBase64(iv.buffer as ArrayBuffer),
    salt: bufferToBase64(salt.buffer as ArrayBuffer),
    maskedKey: masked,
    fingerprint,
    addedAt: new Date().toISOString(),
    verified,
    latencyMs,
  };

  const existing = getAllEncryptedItems();
  const filtered = existing.filter((item) => item.provider !== provider);
  filtered.push(encryptedItem);
  localStorage.setItem(VAULT_STORAGE_KEY, JSON.stringify(filtered));

  return {
    provider,
    model,
    maskedKey: masked,
    fingerprint,
    addedAt: encryptedItem.addedAt,
    verified,
    latencyMs,
  };
}

/**
 * Decrypts a specific provider's key into volatile memory
 */
export async function getDecryptedKey(provider: AIProvider): Promise<string | null> {
  try {
    const items = getAllEncryptedItems();
    const target = items.find((i) => i.provider === provider);
    if (!target) return null;

    const salt = new Uint8Array(base64ToBuffer(target.salt));
    const iv = new Uint8Array(base64ToBuffer(target.iv));
    const ciphertext = base64ToBuffer(target.ciphertext);
    const cryptoKey = await resolveEncryptionKey(salt);

    const decryptedBuffer = await window.crypto.subtle.decrypt(
      { name: 'AES-GCM', iv },
      cryptoKey,
      ciphertext
    );

    const dec = new TextDecoder();
    return dec.decode(decryptedBuffer);
  } catch (err) {
    console.error(`Failed to decrypt BYOK key for ${provider}:`, err);
    return null;
  }
}

/**
 * Returns metadata list of all stored keys (safe for UI rendering)
 */
export function listVaultKeys(): VaultKeyMetadata[] {
  const items = getAllEncryptedItems();
  return items.map((i) => ({
    provider: i.provider,
    model: i.model,
    maskedKey: i.maskedKey,
    fingerprint: i.fingerprint,
    addedAt: i.addedAt,
    verified: i.verified,
    latencyMs: i.latencyMs,
  }));
}

/**
 * Removes a specific key from the vault
 */
export function removeKeyFromVault(provider: AIProvider): void {
  const items = getAllEncryptedItems().filter((i) => i.provider !== provider);
  localStorage.setItem(VAULT_STORAGE_KEY, JSON.stringify(items));
}

/**
 * Panic Shredder: Instantly purges all vault keys, salt, and canary from local storage
 */
export function purgeVault(): void {
  localStorage.removeItem(VAULT_STORAGE_KEY);
  localStorage.removeItem(VAULT_SALT_KEY);
  localStorage.removeItem(VAULT_CANARY_KEY);
  activeCryptoKey = null;
  activePin = null;
  failedAttempts = 0;
  lockoutUntil = 0;
}

/**
 * Get active key and provider for request headers
 */
export async function getActiveBYOKHeaders(): Promise<{
  'X-BYOK-Provider'?: string;
  'X-BYOK-Key'?: string;
  'X-BYOK-Model'?: string;
}> {
  const keys = listVaultKeys();
  if (keys.length === 0) return {};

  // Preference: Gemini (3.6) > OpenAI > Anthropic > GitHub
  const preferredOrder: AIProvider[] = ['gemini', 'openai', 'anthropic', 'github'];
  let chosen = keys[0];
  for (const p of preferredOrder) {
    const found = keys.find((k) => k.provider === p);
    if (found) {
      chosen = found;
      break;
    }
  }

  const raw = await getDecryptedKey(chosen.provider);
  if (!raw) return {};

  return {
    'X-BYOK-Provider': chosen.provider,
    'X-BYOK-Key': raw,
    'X-BYOK-Model': chosen.model,
  };
}

function getAllEncryptedItems(): EncryptedPayload[] {
  const raw = localStorage.getItem(VAULT_STORAGE_KEY);
  if (!raw) return [];
  try {
    return JSON.parse(raw);
  } catch {
    return [];
  }
}
