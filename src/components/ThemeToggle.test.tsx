import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { afterEach, expect, test } from "vitest";
import ThemeToggle from "./ThemeToggle";

const theme = () => document.documentElement.getAttribute("data-theme");

afterEach(() => {
  document.documentElement.removeAttribute("data-theme");
});

test("applies the saved theme on mount", () => {
  localStorage.setItem("theme", "night");
  render(<ThemeToggle />);
  expect(theme()).toBe("night");
});

test("switches theme and remembers it", async () => {
  const user = userEvent.setup();
  render(<ThemeToggle className="extra" />);
  const button = screen.getByRole("button", { name: "Switch between day and night theme" });
  expect(button).toHaveClass("theme-toggle", "extra");
  expect(theme()).toBe("day");

  await user.click(button);
  expect(theme()).toBe("night");
  expect(localStorage.getItem("theme")).toBe("night");

  await user.click(button);
  expect(theme()).toBe("day");
  expect(localStorage.getItem("theme")).toBe("day");
});
