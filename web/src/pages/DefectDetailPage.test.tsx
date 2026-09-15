import { screen } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";
import * as defectsApi from "../api/defectsApi";
import { Defect } from "../api/defectsApi";
import { renderWithRouter } from "../test/renderWithRouter";
import { DefectDetailPage } from "./DefectDetailPage";

describe("DefectDetailPage", () => {
  beforeEach(() => {
    vi.restoreAllMocks();
  });

  it("renders optional fields when present on the defect", async () => {
    vi.spyOn(defectsApi, "getDefect").mockResolvedValue({
      id: "d1",
      title: "X",
      description: "Something broke",
      severity: "High",
      priority: "Urgent",
      reporter: "Alex Chen",
      component: "Checkout",
      assignee: "Jane Doe",
      attachments: ["trace.log"],
      screenshots: ["bug.png"],
      createdAt: new Date().toISOString(),
    } as Defect);

    renderWithRouter(<DefectDetailPage />, { route: "/defects/d1" });

    expect(await screen.findByText("Checkout")).toBeInTheDocument();
    expect(screen.getByText("Jane Doe")).toBeInTheDocument();
    expect(screen.getByText("trace.log")).toBeInTheDocument();
    expect(screen.getByText("bug.png")).toBeInTheDocument();
  });

  it("omits optional fields when absent from the defect", async () => {
    vi.spyOn(defectsApi, "getDefect").mockResolvedValue({
      id: "d1",
      title: "X",
      description: "Something broke",
      severity: "High",
      priority: "Urgent",
      reporter: "Jane Doe",
      attachments: [],
      screenshots: [],
      createdAt: new Date().toISOString(),
    } as Defect);

    renderWithRouter(<DefectDetailPage />, { route: "/defects/d1" });

    await screen.findByText("X");
    expect(screen.queryByText("Component")).not.toBeInTheDocument();
    expect(screen.queryByText("Assignee")).not.toBeInTheDocument();
    expect(screen.queryByText("Attachments")).not.toBeInTheDocument();
    expect(screen.queryByText("Screenshots")).not.toBeInTheDocument();
  });
});
