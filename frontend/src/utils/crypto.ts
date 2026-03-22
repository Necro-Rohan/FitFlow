export async function hashPIN(pin: string): Promise<string> {
  const enc = new TextEncoder();
  const hashBuffer = await crypto.subtle.digest('SHA-256', enc.encode(pin));
  const hashArray = Array.from(new Uint8Array(hashBuffer));
  return hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
}

// MVP: PIN hash is cached in localStorage. In production this
// should validate against the backend instead.
export function setOwnerPinHash(hash: string) {
  localStorage.setItem('fitflow_owner_pin', hash);
}

export function getOwnerPinHash(): string | null {
  return localStorage.getItem('fitflow_owner_pin');
}
