import "@testing-library/jest-dom/vitest";
import { cleanup } from "@testing-library/react";
import { createElement, type ImgHTMLAttributes } from "react";
import { afterEach, vi } from "vitest";

afterEach(() => {
  cleanup();
  localStorage.clear();
});

// next/image needs the Next build (static imports give it width and height), so
// draw a plain <img> in tests instead
type ImageProps = ImgHTMLAttributes<HTMLImageElement> & {
  src: string | { src: string };
  fill?: boolean;
  priority?: boolean;
};
vi.mock("next/image", () => ({
  default: (props: ImageProps) => {
    // fill and priority are next/image only, not <img> attributes
    const imgProps: Partial<ImageProps> = { ...props };
    delete imgProps.fill;
    delete imgProps.priority;
    return createElement("img", { ...imgProps, src: typeof props.src === "string" ? props.src : props.src.src });
  },
}));

// jsdom has <dialog> but not its methods
HTMLDialogElement.prototype.showModal ??= function (this: HTMLDialogElement) {
  this.open = true;
};
HTMLDialogElement.prototype.close ??= function (this: HTMLDialogElement) {
  this.open = false;
  this.dispatchEvent(new Event("close"));
};

// jsdom has no matchMedia; default to a light-mode device
if (!window.matchMedia) {
  window.matchMedia = (query: string) =>
    ({
      matches: false,
      media: query,
      onchange: null,
      addEventListener() {},
      removeEventListener() {},
      addListener() {},
      removeListener() {},
      dispatchEvent: () => false,
    }) as MediaQueryList;
}
