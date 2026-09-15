import { fireEvent, render, screen, waitForElementToBeRemoved } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";
import * as defectsApi from "../api/defectsApi";
import { Defect } from "../api/defectsApi";
import { DefectCreatePage } from "./DefectCreatePage";

const navigate = vi.fn();

vi.mock("react-router-dom", async (importOriginal) => {
  const actual = await importOriginal<typeof import("react-router-dom")>();
  return { ...actual, useNavigate: () => navigate };
});

function fillRequiredFieldsAndSubmit() {
  fireEvent.change(screen.getByLabelText(/^title/i), { target: { value: "Checkout broken" } });
  fireEvent.change(screen.getByLabelText(/description/i), { target: { value: "It does not work." } });
  fireEvent.change(screen.getByLabelText(/severity/i), { target: { value: "High" } });
  fireEvent.change(screen.getByLabelText(/priority/i), { target: { value: "Urgent" } });
  fireEvent.change(screen.getByLabelText(/^reporter/i), { target: { value: "Jane Doe" } });
  fireEvent.click(screen.getByRole("button", { name: /create defect/i }));
}

describe("DefectCreatePage", () => {
  beforeEach(() => {
    navigate.mockReset();
    vi.restoreAllMocks();
  });

  it("navigates to the new defect's detail view after a successful submit", async () => {
    vi.spyOn(defectsApi, "createDefect").mockResolvedValue({ id: "d1", title: "X" } as Defect);
    render(<DefectCreatePage />);

    fillRequiredFieldsAndSubmit();

    await vi.waitFor(() => expect(navigate).toHaveBeenCalledWith("/defects/d1"));
  });

  it("shows a loading indicator while the save is in progress", async () => {
    let resolveCreate!: (defect: Defect) => void;
    vi.spyOn(defectsApi, "createDefect").mockReturnValue(
      new Promise((resolve) => {
        resolveCreate = resolve;
      }),
    );
    render(<DefectCreatePage />);

    fillRequiredFieldsAndSubmit();

    expect(screen.getByRole("status")).toHaveTextContent(/saving/i);

    resolveCreate({ id: "d1" } as Defect);
    await waitForElementToBeRemoved(() => screen.queryByRole("status"));
  });

  it("does not navigate or leave a loading indicator when the save is interrupted", async () => {
    vi.spyOn(defectsApi, "createDefect").mockRejectedValue(new DOMException("Aborted", "AbortError"));
    render(<DefectCreatePage />);

    fillRequiredFieldsAndSubmit();

    await vi.waitFor(() => expect(screen.queryByRole("status")).not.toBeInTheDocument());
    expect(navigate).not.toHaveBeenCalled();
  });
});
