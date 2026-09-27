import { cleanup, fireEvent, render, screen } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";
import { ProblemCompaniesEditor } from "@/components/journal/problem-companies-editor";

afterEach(() => {
  cleanup();
});

describe("ProblemCompaniesEditor", () => {
  it("loads the current companies and submits the edited list", () => {
    const onSubmit = vi.fn();

    render(
      <ProblemCompaniesEditor
        initial="Google, Amazon"
        onSubmit={onSubmit}
        onCancel={vi.fn()}
        submitLabel="Save companies"
      />,
    );

    const input = screen.getByLabelText("Companies") as HTMLInputElement;
    expect(input.value).toBe("Google, Amazon");

    fireEvent.change(input, { target: { value: "Meta, Netflix" } });
    fireEvent.submit(
      screen.getByRole("button", { name: "Save companies" }).closest("form")!,
    );

    expect(onSubmit).toHaveBeenCalledWith([
      { name: "Meta", slug: "meta" },
      { name: "Netflix", slug: "netflix" },
    ]);
  });

  it("cancels without submitting", () => {
    const onSubmit = vi.fn();
    const onCancel = vi.fn();

    render(
      <ProblemCompaniesEditor
        initial="Google"
        onSubmit={onSubmit}
        onCancel={onCancel}
      />,
    );

    fireEvent.click(screen.getByRole("button", { name: "Cancel" }));

    expect(onCancel).toHaveBeenCalledTimes(1);
    expect(onSubmit).not.toHaveBeenCalled();
  });
});
