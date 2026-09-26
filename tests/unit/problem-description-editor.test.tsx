import { cleanup, fireEvent, render, screen } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";
import { ProblemDescriptionEditor } from "@/components/journal/problem-description-editor";

afterEach(() => {
  cleanup();
});

describe("ProblemDescriptionEditor", () => {
  it("loads the current description and submits the edited markdown", () => {
    const onSubmit = vi.fn();

    render(
      <ProblemDescriptionEditor
        initial="Given an array of integers."
        onSubmit={onSubmit}
        onCancel={vi.fn()}
        submitLabel="Save description"
      />,
    );

    const textarea = screen.getByLabelText("Description") as HTMLTextAreaElement;
    expect(textarea.value).toBe("Given an array of integers.");
    expect(screen.getByRole("button", { name: "Save description" })).toBeTruthy();

    fireEvent.change(textarea, {
      target: { value: "Given an array of integers, return two indices." },
    });
    fireEvent.submit(
      screen.getByRole("button", { name: "Save description" }).closest("form")!,
    );

    expect(onSubmit).toHaveBeenCalledWith(
      "Given an array of integers, return two indices.",
    );
  });

  it("cancels without submitting", () => {
    const onSubmit = vi.fn();
    const onCancel = vi.fn();

    render(
      <ProblemDescriptionEditor
        initial="Original"
        onSubmit={onSubmit}
        onCancel={onCancel}
      />,
    );

    fireEvent.click(screen.getByRole("button", { name: "Cancel" }));

    expect(onCancel).toHaveBeenCalledTimes(1);
    expect(onSubmit).not.toHaveBeenCalled();
  });
});
