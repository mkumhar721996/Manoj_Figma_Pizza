import { fireEvent, render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import { DefectForm } from "./DefectForm";

describe("DefectForm", () => {
  it("shows an inline validation error for a missing required field and does not submit", () => {
    const onSubmit = vi.fn();
    render(<DefectForm onSubmit={onSubmit} />);

    fireEvent.click(screen.getByRole("button", { name: /create defect/i }));

    expect(screen.getByText(/title is required/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/title/i)).toHaveAttribute("aria-invalid", "true");
    expect(onSubmit).not.toHaveBeenCalled();
  });

  it("submits the entered values once all required fields are filled", () => {
    const onSubmit = vi.fn();
    render(<DefectForm onSubmit={onSubmit} />);

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

  it("keeps every field and the submit action usable at a mobile viewport width", () => {
    window.innerWidth = 375;
    window.dispatchEvent(new Event("resize"));

    render(<DefectForm onSubmit={vi.fn()} />);

    for (const name of [/^title/i, /description/i, /severity/i, /priority/i, /^reporter/i]) {
      expect(screen.getByLabelText(name)).toBeVisible();
    }
    expect(screen.getByRole("button", { name: /create defect/i })).toBeVisible();
  });
});
