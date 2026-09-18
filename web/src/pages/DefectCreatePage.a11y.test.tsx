import { render } from "@testing-library/react";
import { axe, toHaveNoViolations } from "jest-axe";
import { MemoryRouter } from "react-router-dom";
import { beforeEach, describe, expect, it, vi } from "vitest";
import * as defectsApi from "../api/defectsApi";
import { DefectCreatePage } from "./DefectCreatePage";

expect.extend(toHaveNoViolations);

describe("DefectCreatePage accessibility", () => {
  beforeEach(() => {
    vi.restoreAllMocks();
    vi.spyOn(defectsApi, "getProjectMembers").mockResolvedValue([
      { id: "u1", name: "Jane Doe" },
      { id: "u2", name: "Alex Chen" },
    ]);
  });

  it("has no axe violations", async () => {
    const { container } = render(
      <MemoryRouter>
        <DefectCreatePage />
      </MemoryRouter>,
    );

    const results = await axe(container);
    expect(results).toHaveNoViolations();
  });
});
