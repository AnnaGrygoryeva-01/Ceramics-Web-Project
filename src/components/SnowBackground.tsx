"use client";

import Image from "next/image";
import { useLayoutEffect, useRef, useSyncExternalStore } from "react";
import snow from "./UI/christmas-sales-background-snow.png";

const subscribe = () => () => {};

export default function SnowBackground() {
  const ref = useRef<HTMLImageElement>(null);
  // True only when rendering as part of the initial page load (hydration)
  const hydrating = useSyncExternalStore(subscribe, () => false, () => true);
  const isInitialLoad = useRef(hydrating);

  useLayoutEffect(() => {
    const img = ref.current;
    if (!img) return;

    // Next keeps pages we navigate away from in the DOM (hidden), so the snow would still
    // match `body:has(.snow)` and keep the Christmas gradient. Flag it while it's hidden.
    img.classList.remove("snow--hidden");

    // Fade the snow in when arriving from another page, but not on a direct page load.
    // Runs both on a fresh visit and when Next shows the hidden page again.
    if (isInitialLoad.current) {
      isInitialLoad.current = false;
    } else {
      img.classList.remove("snow--fade-in");
      void img.offsetWidth; // restart the animation
      img.classList.add("snow--fade-in");
    }

    return () => img.classList.add("snow--hidden");
  }, []);

  return <Image ref={ref} className="snow" src={snow} alt="" aria-hidden="true" sizes="100vw" priority />;
}
