"use client";

import { useEffect, useId, useRef, useState, type KeyboardEvent } from "react";

type Option<T extends string> = { value: T; label: string };

type Props<T extends string> = {
  label: string;
  options: Option<T>[];
  value: T;
  onChange: (value: T) => void;
};

// A styled replacement for <select>: the open list of a native select is drawn by
// the operating system and can't be styled. Follows the ARIA "select-only
// combobox" pattern so it works with the keyboard and screen readers.
export default function SortSelect<T extends string>({ label, options, value, onChange }: Props<T>) {
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
    onChange(options[index].value);
    setOpen(false);
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
    const last = options.length - 1;

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
        setActive((i) => Math.min(i + 1, last));
        break;
      case "ArrowUp":
        e.preventDefault();
        setActive((i) => Math.max(i - 1, 0));
        break;
      case "Home":
        e.preventDefault();
        setActive(0);
        break;
      case "End":
        e.preventDefault();
        setActive(last);
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
    <div className="sort" ref={rootRef}>
      <span id={`${id}-label`}>{label}</span>
      <div className="sort-select">
        <div
          role="combobox"
          tabIndex={0}
          className="sort-select__button"
          aria-labelledby={`${id}-label ${id}-value`}
          aria-haspopup="listbox"
          aria-expanded={open}
          aria-controls={`${id}-list`}
          aria-activedescendant={open ? optionId(active) : undefined}
          onClick={() => (open ? setOpen(false) : openList())}
          onKeyDown={onKeyDown}
        >
          <span id={`${id}-value`}>{options[selectedIndex].label}</span>
          <svg className="sort-select__chevron" viewBox="0 0 24 24" aria-hidden="true">
            <path d="M6 9l6 6 6-6" />
          </svg>
        </div>
        <ul id={`${id}-list`} role="listbox" aria-labelledby={`${id}-label`} className="sort-select__list" hidden={!open}>
          {options.map((option, index) => (
            <li
              key={option.value}
              id={optionId(index)}
              role="option"
              aria-selected={index === selectedIndex}
              data-active={index === active || undefined}
              className="sort-select__option"
              onPointerEnter={() => setActive(index)}
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
