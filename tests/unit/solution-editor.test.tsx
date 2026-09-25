import { fireEvent, render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import { SolutionEditor } from "@/components/code/solution-editor";

describe("SolutionEditor", () => {
  it("loads initial solution values and submits edited values", () => {
    const onSubmit = vi.fn();

    render(
      <SolutionEditor
        initial={{ title: "Two pointers", language: "typescript", code: "const answer = 42;" }}
        onSubmit={onSubmit}
        onCancel={vi.fn()}
        submitLabel="Update solution"
      />,
    );

    expect((screen.getByLabelText("Title") as HTMLInputElement).value).toBe("Two pointers");
    expect((screen.getByLabelText("Language") as HTMLSelectElement).value).toBe("typescript");
    expect(screen.getByRole("button", { name: "Update solution" })).toBeTruthy();

    fireEvent.change(screen.getByLabelText("Title"), {
      target: { value: "Updated solution" },
    });
    fireEvent.submit(
      screen.getByRole("button", { name: "Update solution" }).closest("form")!,
    );

    expect(onSubmit).toHaveBeenCalledWith({
      title: "Updated solution",
      language: "typescript",
      code: "const answer = 42;",
    });
  });

  it("does not replace existing code when changing language", () => {
    const onSubmit = vi.fn();

    render(
      <SolutionEditor
        initial={{ title: "Solution", language: "python", code: "print('custom')" }}
        onSubmit={onSubmit}
      />,
    );

    fireEvent.change(screen.getByLabelText("Language"), {
      target: { value: "rust" },
    });
    fireEvent.submit(
      screen.getByRole("button", { name: "Save solution" }).closest("form")!,
    );

    expect(onSubmit).toHaveBeenCalledWith({
      title: "Solution",
      language: "rust",
      code: "print('custom')",
    });
  });
});
