import { afterEach, beforeEach, describe, expect, test, vi } from "vitest";
import { sendMessage } from "./actions";
import { HONEYPOT, MAX_LENGTH } from "./limits";

const SENT = { ok: true, message: "Thanks! Your message has been sent." };

function form(fields: Record<string, string>) {
  const data = new FormData();
  for (const [name, value] of Object.entries({ name: "Anna", email: "anna@example.com", message: "Hello", ...fields })) {
    data.set(name, value);
  }
  return data;
}

let log: ReturnType<typeof vi.spyOn>;
beforeEach(() => {
  log = vi.spyOn(console, "log").mockImplementation(() => {});
});
afterEach(() => {
  log.mockRestore();
});

describe("sendMessage", () => {
  test("accepts a filled in form", async () => {
    expect(await sendMessage(null, form({}))).toEqual(SENT);
    expect(log).toHaveBeenCalledWith("Contact form submission:", {
      name: "Anna",
      email: "anna@example.com",
      message: "Hello",
    });
  });

  test("pretends to send when the honeypot is filled in", async () => {
    expect(await sendMessage(null, form({ [HONEYPOT]: "spam.example", email: "" }))).toEqual(SENT);
    expect(log).not.toHaveBeenCalled();
  });

  test.each(["name", "email", "message"])("needs a %s", async (field) => {
    expect(await sendMessage(null, form({ [field]: "   " }))).toEqual({
      ok: false,
      message: "Please fill in all fields.",
    });
  });

  test.each(["anna", "anna@example", "an na@example.com", "@example.com"])("rejects the email %s", async (email) => {
    expect(await sendMessage(null, form({ email }))).toEqual({
      ok: false,
      message: "Please enter a valid email address.",
    });
  });

  test("rejects values over the length limits", async () => {
    expect(await sendMessage(null, form({ name: "a".repeat(MAX_LENGTH.name + 1) }))).toMatchObject({ ok: false });
    expect(
      await sendMessage(null, form({ email: `${"a".repeat(MAX_LENGTH.email)}@example.com` })),
    ).toMatchObject({ ok: false });
    expect(await sendMessage(null, form({ message: "a".repeat(MAX_LENGTH.message + 1) }))).toEqual({
      ok: false,
      message: "Please keep your message under 5,000 characters.",
    });
  });

  test("tidies up spacing before checking and sending", async () => {
    await sendMessage(
      null,
      form({
        name: "  Anna \t  Grygoryeva ",
        email: " anna@example.com ",
        message: "  Hi   there,  \r\n\r\n\r\n\r\nBye\t \n",
      }),
    );
    expect(log).toHaveBeenCalledWith("Contact form submission:", {
      name: "Anna Grygoryeva",
      email: "anna@example.com",
      message: "Hi there,\n\nBye",
    });
  });

  test("spaces don't count towards the length limit", async () => {
    const message = "a".repeat(MAX_LENGTH.message - 1) + "     ";
    expect(await sendMessage(null, form({ message }))).toEqual(SENT);
  });
});
