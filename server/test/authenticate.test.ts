import { Response } from "express";
import { describe, expect, it, vi } from "vitest";
import { AuthenticatedRequest, requireAuthenticatedMember } from "../src/auth/authenticate.js";
import { getTokenForMember } from "../src/auth/memberTokens.js";

function mockResponse(): Response {
  const res: Partial<Response> = {};
  res.status = vi.fn().mockReturnValue(res);
  res.json = vi.fn().mockReturnValue(res);
  return res as Response;
}

function mockRequest(authorizationHeader?: string): AuthenticatedRequest {
  return { header: () => authorizationHeader } as unknown as AuthenticatedRequest;
}

describe("requireAuthenticatedMember", () => {
  it("returns 401 when the Authorization header is missing", () => {
    const req = mockRequest(undefined);
    const res = mockResponse();
    const next = vi.fn();

    requireAuthenticatedMember(req, res, next);

    expect(res.status).toHaveBeenCalledWith(401);
    expect(next).not.toHaveBeenCalled();
  });

  it("returns 401 when the bearer token is unknown", () => {
    const req = mockRequest("Bearer not-a-real-token");
    const res = mockResponse();
    const next = vi.fn();

    requireAuthenticatedMember(req, res, next);

    expect(res.status).toHaveBeenCalledWith(401);
    expect(next).not.toHaveBeenCalled();
  });

  it("returns 401 when a caller sends a member's public id instead of their token", () => {
    const req = mockRequest("Bearer u1");
    const res = mockResponse();
    const next = vi.fn();

    requireAuthenticatedMember(req, res, next);

    expect(res.status).toHaveBeenCalledWith(401);
    expect(next).not.toHaveBeenCalled();
  });

  it("attaches the member and calls next when the bearer token matches an issued member token", () => {
    const req = mockRequest(`Bearer ${getTokenForMember("u1")}`);
    const res = mockResponse();
    const next = vi.fn();

    requireAuthenticatedMember(req, res, next);

    expect(req.member).toMatchObject({ id: "u1", name: "Jane Doe" });
    expect(next).toHaveBeenCalledOnce();
    expect(res.status).not.toHaveBeenCalled();
  });
});
