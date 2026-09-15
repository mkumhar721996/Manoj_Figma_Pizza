import { Response } from "express";
import { describe, expect, it, vi } from "vitest";
import { AuthenticatedRequest, requireAuthenticatedMember } from "../src/auth/authenticate.js";

function mockResponse(): Response {
  const res: Partial<Response> = {};
  res.status = vi.fn().mockReturnValue(res);
  res.json = vi.fn().mockReturnValue(res);
  return res as Response;
}

describe("requireAuthenticatedMember", () => {
  it("returns 401 when the Authorization header is missing", () => {
    const req = { header: () => undefined } as unknown as AuthenticatedRequest;
    const res = mockResponse();
    const next = vi.fn();

    requireAuthenticatedMember(req, res, next);

    expect(res.status).toHaveBeenCalledWith(401);
    expect(next).not.toHaveBeenCalled();
  });

  it("returns 401 when the bearer token does not match a project member", () => {
    const req = { header: () => "Bearer not-a-real-id" } as unknown as AuthenticatedRequest;
    const res = mockResponse();
    const next = vi.fn();

    requireAuthenticatedMember(req, res, next);

    expect(res.status).toHaveBeenCalledWith(401);
    expect(next).not.toHaveBeenCalled();
  });

  it("attaches the member and calls next when the bearer token matches a project member", () => {
    const req = { header: () => "Bearer u1" } as unknown as AuthenticatedRequest;
    const res = mockResponse();
    const next = vi.fn();

    requireAuthenticatedMember(req, res, next);

    expect(req.member).toMatchObject({ id: "u1", name: "Jane Doe" });
    expect(next).toHaveBeenCalledOnce();
    expect(res.status).not.toHaveBeenCalled();
  });
});
