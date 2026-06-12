/**
 * deriveEntryId.ts
 *
 * Produces a deterministic UUID from a userId and sleepStartUtc string.
 * The same pair of inputs always produces the same UUID, making it safe
 * to re-import the same sleep session any number of times on any device.
 *
 * Implementation:
 *   - SHA-256 via the Web Crypto API (no external dependency).
 *   - First 16 bytes of the digest formatted as a UUID string.
 *   - Version bits (byte 6) set to 5; RFC 4122 variant bits (byte 8) set.
 *
 * @param userId       - The authenticated user's Supabase UUID.
 * @param sleepStartUtc - ISO 8601 UTC timestamp of sleep onset.
 * @returns A UUID string in standard 8-4-4-4-12 format.
 */
export async function deriveEntryId(
  userId: string,
  sleepStartUtc: string
): Promise<string> {
  const input = `${userId}:${sleepStartUtc}`
  const encoded = new TextEncoder().encode(input)
  const hashBuffer = await crypto.subtle.digest('SHA-256', encoded)
  const bytes = new Uint8Array(hashBuffer)

  // Set version nibble to 5 (name-based / SHA-1-derived UUID variant)
  bytes[6] = (bytes[6] & 0x0f) | 0x50
  // Set RFC 4122 variant bits: 10xx in the top two bits of byte 8
  bytes[8] = (bytes[8] & 0x3f) | 0x80

  // Format first 16 bytes as xxxxxxxx-xxxx-5xxx-yxxx-xxxxxxxxxxxx
  const hex = Array.from(bytes.slice(0, 16))
    .map(b => b.toString(16).padStart(2, '0'))
    .join('')

  return [
    hex.slice(0, 8),
    hex.slice(8, 12),
    hex.slice(12, 16),
    hex.slice(16, 20),
    hex.slice(20, 32),
  ].join('-')
}
