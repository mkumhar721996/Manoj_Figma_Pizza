import request from "supertest";
import { beforeEach, describe, expect, it } from "vitest";
import { app } from "../src/app.js";
import { listDefects, resetStore } from "../src/store/defectStore.js";

const validPayload = {
  title: "Checkout button unresponsive",
  description: "Clicking checkout does nothing on Safari.",
  severity: "High",
  priority: "Urgent",
  reporter: "Jane Doe",
};

describe("POST /api/defects", () => {
  beforeEach(() => {
    resetStore();
  });

  it("creates a defect from a valid payload", async () => {
    const res = await request(app).post("/api/defects").send(validPayload);

    expect(res.status).toBe(201);
    expect(res.body).toMatchObject({ title: validPayload.title, reporter: validPayload.reporter });
    expect(res.body.id).toEqual(expect.any(String));
  });

  it("echoes optional fields back on the created defect", async () => {
    const res = await request(app)
      .post("/api/defects")
      .send({
        ...validPayload,
        component: "Checkout",
        assignee: "Jane Doe",
        attachments: ["trace.log"],
        screenshots: ["bug.png"],
      });

    expect(res.status).toBe(201);
    expect(res.body).toMatchObject({
      component: "Checkout",
      assignee: "Jane Doe",
      attachments: ["trace.log"],
      screenshots: ["bug.png"],
    });
  });

  it("rejects a payload missing a required field and does not create a defect", async () => {
    const before = listDefects().length;

    const res = await request(app)
      .post("/api/defects")
      .send({ ...validPayload, title: "" });

    expect(res.status).toBe(400);
    expect(res.body.errors.title).toBeDefined();
    expect(listDefects()).toHaveLength(before);
  });
});

describe("GET /api/defects/:id", () => {
  beforeEach(() => {
    resetStore();
  });

  it("returns the created defect by id", async () => {
    const created = await request(app).post("/api/defects").send(validPayload);

    const res = await request(app).get(`/api/defects/${created.body.id}`);

    expect(res.status).toBe(200);
    expect(res.body).toMatchObject({ id: created.body.id, title: validPayload.title });
  });

  it("returns 404 for an unknown id", async () => {
    const res = await request(app).get("/api/defects/does-not-exist");

    expect(res.status).toBe(404);
  });
});
