// Generates the short codes users share to unlock access: invite access codes
// (they gate the whole app), partner pairing codes (they link two accounts and
// expose partner data) and friend connection codes.
//
// These grant access, so the codes must come from a cryptographic RNG. Math.random()
// is a predictable generator whose internal state can be recovered from a handful
// of observed outputs, which would let an attacker predict codes not yet issued.
//
// The alphabet is exactly 32 characters (no O/0/I/1, so codes stay readable), so
// `byte % 32` over the 256 possible byte values is uniform — no modulo bias.
const CODE_CHARS = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';

export function generateAccessCode(length = 6) {
  const bytes = crypto.getRandomValues(new Uint8Array(length));
  let code = '';
  for (let i = 0; i < length; i++) code += CODE_CHARS[bytes[i] % CODE_CHARS.length];
  return code;
}