// Stand-in for a real session/login mechanism (owned by a separate auth story).
// The defect creation screens assume an already-authenticated project member;
// this identifies that member for the purpose of authorizing API calls.
export const CURRENT_MEMBER_ID = "u1";

export function getAuthHeaders(): Record<string, string> {
  return { Authorization: `Bearer ${CURRENT_MEMBER_ID}` };
}
