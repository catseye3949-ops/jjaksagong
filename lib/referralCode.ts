const ALPHANUM = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";

export function generateReferralCodeSegment(length = 6) {
  const bytes = new Uint8Array(length);
  crypto.getRandomValues(bytes);
  let out = "";
  for (let i = 0; i < length; i += 1) {
    out += ALPHANUM[bytes[i]! % ALPHANUM.length];
  }
  return out;
}
