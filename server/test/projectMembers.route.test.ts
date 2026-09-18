import request from "supertest";
import { describe, expect, it } from "vitest";
import { getTokenForMember } from "../src/auth/memberTokens.js";
import { app } from "../src/app.js";

describe("GET /api/project-members", () => {
  it("rejects an unauthenticated request", async () => {
    const res = await request(app).get("/api/project-members");

    expect(res.status).toBe(401);
  });

  it("rejects a request authenticated with a member's public id instead of their token", async () => {
    const res = await request(app).get("/api/project-members").set("Authorization", "Bearer u1");

    expect(res.status).toBe(401);
  });

  it("returns the list of project members for an authenticated caller", async () => {
    const res = await request(app)
      .get("/api/project-members")
      .set("Authorization", `Bearer ${getTokenForMember("u1")}`);

    expect(res.status).toBe(200);
    expect(res.body).toEqual(expect.arrayContaining([expect.objectContaining({ id: "u1", name: "Jane Doe" })]));
  });
});
