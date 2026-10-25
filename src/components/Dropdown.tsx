"use client";

import { useEffect, useId, useRef, useState, type KeyboardEvent } from "react";

export type DropdownOption<T extends string> = {
  value: T;
  label: string;
  disabled?: boolean; // Shown crossed out and can't be picked
};

type Props<T extends string> = {
  label: string;
  options: DropdownOption<T>[];
  value: T;
  onChange: (value: T) => void;
  className?: string; // For the whole thing: the label and the dropdown
};

// A styled replacement for <select>: the open list of a native select is drawn by
// the operating system and can't be styled. Follows the ARIA "select-only
// combobox" pattern so it works with the keyboard and screen readers. Used for
// sorting products and for picking the brushes in a set.
export default function Dropdown<T extends string>({ label, options, value, onChange, className }: Props<T>) {
  const id = useId();
  const rootRef = useRef<HTMLDivElement>(null);
  const [open, setOpen] = useState(false);
  // The option highlighted while the list is open (moved with the arrow keys or the mouse)
  const [active, setActive] = useState(0);

  const selectedIndex = Math.max(
    0,
    options.findIndex((o) => o.value === value),
  );
  const optionId = (index: number) => `${id}-option-${index}`;

  function openList() {
    setActive(selectedIndex);
    setOpen(true);
  }

  function choose(index: number) {
    if (options[index].disabled) return;
    onChange(options[index].value);
    setOpen(false);
  }

  // The nearest option that can be picked from `from` in a direction (1 or -1),
  // or `fallback` when there's none
  function nextEnabled(from: number, step: number, fallback: number) {
    for (let i = from; i >= 0 && i < options.length; i += step) {
      if (!options[i].disabled) return i;
    }
    return fallback;
  }

  // Close when clicking anywhere else on the page
  useEffect(() => {
    if (!open) return;
    const onPointerDown = (e: PointerEvent) => {
      if (!rootRef.current?.contains(e.target as Node)) setOpen(false);
    };
    document.addEventListener("pointerdown", onPointerDown);
    return () => document.removeEventListener("pointerdown", onPointerDown);
  }, [open]);

  function onKeyDown(e: KeyboardEvent) {
    if (!open) {
      if (["Enter", " ", "ArrowDown", "ArrowUp"].includes(e.key)) {
        e.preventDefault();
        openList();
      }
      return;
    }

    switch (e.key) {
      case "ArrowDown":
        e.preventDefault();
        setActive((i) => nextEnabled(i + 1, 1, i));
        break;
      case "ArrowUp":
        e.preventDefault();
        setActive((i) => nextEnabled(i - 1, -1, i));
        break;
      case "Home":
        e.preventDefault();
        setActive((i) => nextEnabled(0, 1, i));
        break;
      case "End":
        e.preventDefault();
        setActive((i) => nextEnabled(options.length - 1, -1, i));
        break;
      case "Enter":
      case " ":
        e.preventDefault();
        choose(active);
        break;
      case "Escape":
        e.preventDefault();
        setOpen(false);
        break;
      case "Tab":
        setOpen(false);
        break;
    }
  }

  return (
    <div className={className} ref={rootRef}>
      <span id={`${id}-label`}>{label}</span>
      <div className="dropdown">
        <div
          role="combobox"
          tabIndex={0}
          className="dropdown__button"
          aria-labelledby={`${id}-label ${id}-value`}
          aria-haspopup="listbox"
          aria-expanded={open}
          aria-controls={`${id}-list`}
          aria-activedescendant={open ? optionId(active) : undefined}
          onClick={() => (open ? setOpen(false) : openList())}
          onKeyDown={onKeyDown}
        >
          <span id={`${id}-value`}>{options[selectedIndex].label}</span>
          <svg className="dropdown__chevron" viewBox="0 0 24 24" aria-hidden="true">
            <path d="M6 9l6 6 6-6" />
          </svg>
        </div>
        <ul id={`${id}-list`} role="listbox" aria-labelledby={`${id}-label`} className="dropdown__list" hidden={!open}>
          {options.map((option, index) => (
            <li
              key={option.value}
              id={optionId(index)}
              role="option"
              aria-selected={index === selectedIndex}
              aria-disabled={option.disabled || undefined}
              data-active={index === active || undefined}
              className="dropdown__option"
              onPointerEnter={() => !option.disabled && setActive(index)}
              // Keep focus on the combobox while clicking an option
              onPointerDown={(e) => e.preventDefault()}
              onClick={() => choose(index)}
            >
              {option.label}
            </li>
          ))}
        </ul>
      </div>
    </div>
  );
}
