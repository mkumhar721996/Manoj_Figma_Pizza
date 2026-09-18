import { fireEvent, render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import { ProjectMember } from "../api/defectsApi";
import { DefectForm } from "./DefectForm";

const PROJECT_MEMBERS: ProjectMember[] = [
  { id: "u1", name: "Jane Doe" },
  { id: "u2", name: "Alex Chen" },
];

describe("DefectForm", () => {
  it("shows an inline validation error for a missing required field and does not submit", () => {
    const onSubmit = vi.fn();
    render(<DefectForm onSubmit={onSubmit} projectMembers={PROJECT_MEMBERS} />);

    fireEvent.click(screen.getByRole("button", { name: /create defect/i }));

    expect(screen.getByText(/title is required/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/title/i)).toHaveAttribute("aria-invalid", "true");
    expect(onSubmit).not.toHaveBeenCalled();
  });

  it("submits the entered values once all required fields are filled", () => {
    const onSubmit = vi.fn();
    render(<DefectForm onSubmit={onSubmit} projectMembers={PROJECT_MEMBERS} />);

    fireEvent.change(screen.getByLabelText(/^title/i), { target: { value: "Checkout broken" } });
    fireEvent.change(screen.getByLabelText(/description/i), { target: { value: "It does not work." } });
    fireEvent.change(screen.getByLabelText(/severity/i), { target: { value: "High" } });
    fireEvent.change(screen.getByLabelText(/priority/i), { target: { value: "Urgent" } });
    fireEvent.change(screen.getByLabelText(/^reporter/i), { target: { value: "Jane Doe" } });

    fireEvent.click(screen.getByRole("button", { name: /create defect/i }));

    expect(onSubmit).toHaveBeenCalledWith({
      title: "Checkout broken",
      description: "It does not work.",
      severity: "High",
      priority: "Urgent",
      reporter: "Jane Doe",
      component: undefined,
      assignee: undefined,
      attachments: [],
      screenshots: [],
    });
  });

  it("rejects submission when the reporter has not been selected", () => {
    const onSubmit = vi.fn();
    render(<DefectForm onSubmit={onSubmit} projectMembers={PROJECT_MEMBERS} />);

    fireEvent.change(screen.getByLabelText(/^title/i), { target: { value: "Checkout broken" } });
    fireEvent.change(screen.getByLabelText(/description/i), { target: { value: "It does not work." } });
    fireEvent.change(screen.getByLabelText(/severity/i), { target: { value: "High" } });
    fireEvent.change(screen.getByLabelText(/priority/i), { target: { value: "Urgent" } });

    fireEvent.click(screen.getByRole("button", { name: /create defect/i }));

    expect(screen.getByText(/reporter is required/i)).toBeInTheDocument();
    expect(onSubmit).not.toHaveBeenCalled();
  });

  it("logs and does not let a rejected onSubmit escape as an unhandled rejection", async () => {
    const submitError = new Error("network down");
    const onSubmit = vi.fn().mockRejectedValue(submitError);
    const consoleErrorSpy = vi.spyOn(console, "error").mockImplementation(() => {});

    render(<DefectForm onSubmit={onSubmit} projectMembers={PROJECT_MEMBERS} />);

    fireEvent.change(screen.getByLabelText(/^title/i), { target: { value: "Checkout broken" } });
    fireEvent.change(screen.getByLabelText(/description/i), { target: { value: "It does not work." } });
    fireEvent.change(screen.getByLabelText(/severity/i), { target: { value: "High" } });
    fireEvent.change(screen.getByLabelText(/priority/i), { target: { value: "Urgent" } });
    fireEvent.change(screen.getByLabelText(/^reporter/i), { target: { value: "Jane Doe" } });

    fireEvent.click(screen.getByRole("button", { name: /create defect/i }));

    await vi.waitFor(() =>
      expect(consoleErrorSpy).toHaveBeenCalledWith("[DefectForm] onSubmit rejected", submitError),
    );

    consoleErrorSpy.mockRestore();
  });

  it("keeps every field and the submit action usable at a mobile viewport width", () => {
    window.innerWidth = 375;
    window.dispatchEvent(new Event("resize"));

    render(<DefectForm onSubmit={vi.fn()} projectMembers={PROJECT_MEMBERS} />);

    for (const name of [/^title/i, /description/i, /severity/i, /priority/i, /^reporter/i]) {
      expect(screen.getByLabelText(name)).toBeVisible();
    }
    expect(screen.getByRole("button", { name: /create defect/i })).toBeVisible();
  });
});
