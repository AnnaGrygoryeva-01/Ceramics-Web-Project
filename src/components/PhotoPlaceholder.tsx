import styles from "./PhotoPlaceholder.module.sass";

// A vase outline, centred in the frame it's dropped into. Hidden from screen readers
// because there's no picture to describe, and the name is always next to it.
export default function PhotoPlaceholder() {
  return (
    <svg
      className={styles.placeholder}
      viewBox="0 0 64 64"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.75"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
    >
      <path d="M23 9h18" />
      <path d="M26 9c0 7-2 11-6 17-3 5-5 9-5 15 0 10 7 15 17 15s17-5 17-15c0-6-2-10-5-15-4-6-6-10-6-17" />
      <path d="M15.5 37c5.5-3 11-3 16.5 0s11 3 16.5 0" />
    </svg>
  );
}
