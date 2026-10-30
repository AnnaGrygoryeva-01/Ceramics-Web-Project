import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { useState } from "react";
import { describe, expect, test, vi } from "vitest";
import Dropdown, { type DropdownOption } from "./Dropdown";

const options: DropdownOption<string>[] = [
  { value: "a", label: "Apple" },
  { value: "b", label: "Banana", disabled: true },
  { value: "c", label: "Cherry" },
  { value: "d", label: "Date" },
];

// Keeps the value in state like a real parent does
function Controlled({ onChange = () => {} }: { onChange?: (value: string) => void }) {
  const [value, setValue] = useState("a");
  return (
    <>
      <Dropdown
        label="Fruit"
        options={options}
        value={value}
        onChange={(v) => {
          setValue(v);
          onChange(v);
        }}
      />
      <button type="button">Elsewhere</button>
    </>
  );
}

const combobox = () => screen.getByRole("combobox");
const isOpen = () => combobox().getAttribute("aria-expanded") === "true";
const active = () => document.getElementById(combobox().getAttribute("aria-activedescendant")!)?.textContent;

describe("Dropdown", () => {
  test("is labelled and shows the picked value", () => {
    render(<Controlled />);
    expect(combobox()).toHaveAccessibleName("Fruit Apple");
    expect(isOpen()).toBe(false);
    expect(screen.queryByRole("listbox")).not.toBeInTheDocument(); // hidden
  });

  test("picks an option with the mouse", async () => {
    const user = userEvent.setup();
    const onChange = vi.fn();
    render(<Controlled onChange={onChange} />);

    await user.click(combobox());
    expect(isOpen()).toBe(true);
    expect(screen.getByRole("option", { name: "Apple" })).toHaveAttribute("aria-selected", "true");

    await user.click(screen.getByRole("option", { name: "Cherry" }));
    expect(onChange).toHaveBeenCalledWith("c");
    expect(isOpen()).toBe(false);
    expect(combobox()).toHaveAccessibleName("Fruit Cherry");
  });

  test("a disabled option can't be picked", async () => {
    const user = userEvent.setup();
    const onChange = vi.fn();
    render(<Controlled onChange={onChange} />);

    await user.click(combobox());
    const banana = screen.getByRole("option", { name: "Banana" });
    expect(banana).toHaveAttribute("aria-disabled", "true");
    await user.click(banana);
    expect(onChange).not.toHaveBeenCalled();
    expect(isOpen()).toBe(true);
  });

  test("works with the keyboard, skipping disabled options", async () => {
    const user = userEvent.setup();
    const onChange = vi.fn();
    render(<Controlled onChange={onChange} />);

    combobox().focus();
    await user.keyboard("{ArrowDown}");
    expect(isOpen()).toBe(true);
    expect(active()).toBe("Apple");

    await user.keyboard("{ArrowDown}");
    expect(active()).toBe("Cherry"); // Banana is skipped
    await user.keyboard("{ArrowUp}");
    expect(active()).toBe("Apple");
    await user.keyboard("{ArrowUp}");
    expect(active()).toBe("Apple"); // stays at the top
    await user.keyboard("{End}");
    expect(active()).toBe("Date");
    await user.keyboard("{Home}");
    expect(active()).toBe("Apple");

    await user.keyboard("{End}{Enter}");
    expect(onChange).toHaveBeenCalledWith("d");
    expect(isOpen()).toBe(false);
  });

  test("Escape, Tab and clicking elsewhere close it without picking", async () => {
    const user = userEvent.setup();
    const onChange = vi.fn();
    render(<Controlled onChange={onChange} />);

    await user.click(combobox());
    await user.keyboard("{Escape}");
    expect(isOpen()).toBe(false);

    await user.click(combobox());
    await user.keyboard("{Tab}");
    expect(isOpen()).toBe(false);

    await user.click(combobox());
    await user.click(screen.getByRole("button", { name: "Elsewhere" }));
    expect(isOpen()).toBe(false);

    expect(onChange).not.toHaveBeenCalled();
  });

  test("clicking the button again closes it", async () => {
    const user = userEvent.setup();
    render(<Controlled />);
    await user.click(combobox());
    await user.click(combobox());
    expect(isOpen()).toBe(false);
  });
});
