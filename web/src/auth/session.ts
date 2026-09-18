// Stand-in for a real session/login mechanism (owned by a separate auth story).
// The defect creation screens assume an already-authenticated project member;
// this holds that member's opaque bearer token for authorizing API calls.
//
// This token is intentionally NOT the member's public id — it must match the
// corresponding entry in server/src/auth/memberTokens.ts (member "u1" / Jane Doe),
// since the server only accepts these pre-issued opaque tokens, never a member id.
const CURRENT_MEMBER_TOKEN = "7f3a9c1e5b8d4260a1f6e9c2b7d4508f3a6c9e1b4d7f0258a3c6e9b1d4f7a205";

export function getAuthHeaders(): Record<string, string> {
  return { Authorization: `Bearer ${CURRENT_MEMBER_TOKEN}` };
}
