import { beforeEach, describe, expect, it, vi } from "vitest";
import { NewDefectInput } from "../src/models/defect.js";
import { createDefect, DefectValidationError, listDefects, resetStore } from "../src/store/defectStore.js";
import * as idGenerator from "../src/store/idGenerator.js";

const validInput: NewDefectInput = {
  title: "Checkout button unresponsive",
  description: "Clicking checkout does nothing on Safari.",
  severity: "High",
  priority: "Urgent",
  reporter: "Jane Doe",
};

describe("defectStore", () => {
  beforeEach(() => {
    resetStore();
    vi.restoreAllMocks();
  });

  it("creates a defect with the given fields plus generated id and createdAt", () => {
    const defect = createDefect(validInput);

    expect(defect.id).toEqual(expect.any(String));
    expect(defect.createdAt).toEqual(expect.any(String));
    expect(defect).toMatchObject({
      title: validInput.title,
      description: validInput.description,
      severity: validInput.severity,
      priority: validInput.priority,
      reporter: validInput.reporter,
    });
    expect(listDefects()).toHaveLength(1);
  });

  it("throws a DefectValidationError and does not store anything when required fields are missing", () => {
    expect(() => createDefect({ ...validInput, title: "" })).toThrow(DefectValidationError);
    expect(listDefects()).toHaveLength(0);
  });

  it("leaves no partial record when defect creation fails after validation passes", () => {
    vi.spyOn(idGenerator, "generate").mockImplementation(() => {
      throw new Error("boom");
    });

    expect(() => createDefect(validInput)).toThrow("boom");
    expect(listDefects()).toHaveLength(0);
  });
});
