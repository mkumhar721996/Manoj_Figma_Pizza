import { timingSafeEqual } from "node:crypto";

// Opaque per-member bearer tokens. These are NOT derived from the public member
// id/name (which are exposed via GET /api/project-members) so a caller cannot
// authenticate as a member by guessing or looking up their id. This is a stand-in
// for the real login/session story, which will issue these server-side after
// verifying credentials instead of hardcoding them here.
const MEMBER_TOKENS: Record<string, string> = {
  u1: "7f3a9c1e5b8d4260a1f6e9c2b7d4508f3a6c9e1b4d7f0258a3c6e9b1d4f7a205",
  u2: "b4e7a1d6c9f2508b3e6a9c1f4d7b0258e1a4c7f9b2d5083e6a1c4f7b9e2d5081",
  u3: "c9f2e5a8b1d4703c6f9a2e5b8d1c4709b2e5a8c1f4b7d0a3e6c9b2f5a8d1c470",
  u4: "d5a8f1c4b7e0d3a6c9f2b5e8d1a4709c2b5e8a1d4c7f0b3e6a9c2f5b8e1d4a70",
};

function safeEqual(a: string, b: string): boolean {
  const bufferA = Buffer.from(a);
  const bufferB = Buffer.from(b);
  return bufferA.length === bufferB.length && timingSafeEqual(bufferA, bufferB);
}

export function findMemberIdForToken(token: string): string | undefined {
  return Object.keys(MEMBER_TOKENS).find((memberId) => safeEqual(MEMBER_TOKENS[memberId], token));
}

export function getTokenForMember(memberId: string): string | undefined {
  return MEMBER_TOKENS[memberId];
}
