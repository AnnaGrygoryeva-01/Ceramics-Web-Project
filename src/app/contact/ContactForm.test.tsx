import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { afterEach, beforeEach, describe, expect, test, vi } from "vitest";
import ContactForm from "./ContactForm";
import { MAX_LENGTH } from "./limits";

beforeEach(() => {
  vi.spyOn(console, "log").mockImplementation(() => {});
});
afterEach(() => {
  vi.restoreAllMocks();
});

async function fillIn(user: ReturnType<typeof userEvent.setup>, email = "anna@example.com") {
  await user.type(screen.getByLabelText("Name"), "Anna");
  await user.type(screen.getByLabelText("Email"), email);
  await user.type(screen.getByLabelText("Message"), "Hello!");
}

describe("ContactForm", () => {
  test("has required, length-limited fields", () => {
    render(<ContactForm />);
    for (const [label, max] of [
      ["Name", MAX_LENGTH.name],
      ["Email", MAX_LENGTH.email],
      ["Message", MAX_LENGTH.message],
    ] as const) {
      const field = screen.getByLabelText(label);
      expect(field).toBeRequired();
      expect(field).toHaveAttribute("maxLength", String(max));
    }
    expect(screen.getByLabelText("Email")).toHaveAttribute("type", "email");
  });

  test("keeps the honeypot away from people", () => {
    render(<ContactForm />);
    const trap = document.querySelector(".contact-form__trap")!;
    expect(trap).toHaveAttribute("aria-hidden", "true");
    expect(screen.getByLabelText("Leave this empty")).toHaveAttribute("tabIndex", "-1");
  });

  test("shows a thank-you message once sent", async () => {
    const user = userEvent.setup();
    render(<ContactForm />);
    await fillIn(user);
    await user.click(screen.getByRole("button", { name: "Send message" }));

    expect(await screen.findByRole("status")).toHaveTextContent("Thanks! Your message has been sent.");
    expect(screen.queryByRole("form")).not.toBeInTheDocument();
  });

  test("shows the server's error and keeps the form", async () => {
    const user = userEvent.setup();
    render(<ContactForm />);
    // Passes the browser's email check but not the server's
    await fillIn(user, "anna@example");
    await user.click(screen.getByRole("button", { name: "Send message" }));

    expect(await screen.findByRole("alert")).toHaveTextContent("Please enter a valid email address.");
    expect(screen.getByRole("button", { name: "Send message" })).toBeEnabled();
  });
});
