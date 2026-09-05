import crypto from "crypto";

export const DEFAULT_MASTER_ACCESS_KEY = "BNDES2026#Naval";

/**
 * Retorna a chave mestre institucional do projeto configurada no ambiente.
 */
export function getProjectMasterKey(): string {
  return (process.env.PROJECT_ACCESS_KEY || DEFAULT_MASTER_ACCESS_KEY).trim();
}

/**
 * Cria um hash seguro scrypt para a senha com salt aleatório.
 */
export function hashPassword(password: string): string {
  const salt = crypto.randomBytes(16).toString("hex");
  const derivedKey = crypto.scryptSync(password.normalize(), salt, 64);
  return `${salt}:${derivedKey.toString("hex")}`;
}

/**
 * Verifica se a senha fornecida corresponde ao hash armazenado.
 */
export function verifyPassword(password: string, storedHash: string | null | undefined): boolean {
  if (!storedHash || !storedHash.includes(":")) return false;
  const [salt, key] = storedHash.split(":");
  if (!salt || !key) return false;

  try {
    const keyBuffer = Buffer.from(key, "hex");
    const derivedKey = crypto.scryptSync(password.normalize(), salt, 64);
    return crypto.timingSafeEqual(keyBuffer, derivedKey);
  } catch {
    return false;
  }
}

/**
 * Verifica se a senha fornecida é a chave mestre institucional do projeto.
 */
export function verifyProjectMasterKey(password: string): boolean {
  const masterKey = getProjectMasterKey();
  if (!password || !masterKey) return false;

  // Comparação em tempo constante para evitar timing attacks
  const bufA = Buffer.from(password.trim());
  const bufB = Buffer.from(masterKey);
  if (bufA.length !== bufB.length) return false;
  return crypto.timingSafeEqual(bufA, bufB);
}
