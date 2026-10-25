"use server";

import { HONEYPOT, MAX_LENGTH } from "./limits";

export type ContactState = { ok: boolean; message: string } | null;

const SENT: ContactState = { ok: true, message: "Thanks! Your message has been sent." };

// Tidies up spacing: runs of spaces or tabs become one space, spaces at the ends
// of lines go, and more than one empty line in a row becomes a single empty line
function tidyMessage(text: string) {
  return text
    .replace(/\r\n?/g, "\n")
    .replace(/[^\S\n]+/g, " ")
    .replace(/ ?\n ?/g, "\n")
    .replace(/\n{3,}/g, "\n\n")
    .trim();
}

export async function sendMessage(_prev: ContactState, formData: FormData): Promise<ContactState> {
  // Honeypot filled in: a bot. Pretend it worked so it doesn't try again differently.
  if (String(formData.get(HONEYPOT) ?? "") !== "") return SENT;

  const name = String(formData.get("name") ?? "").replace(/\s+/g, " ").trim();
  const email = String(formData.get("email") ?? "").trim();
  const message = tidyMessage(String(formData.get("message") ?? ""));

  if (!name || !email || !message) {
    return { ok: false, message: "Please fill in all fields." };
  }
  if (name.length > MAX_LENGTH.name) {
    return { ok: false, message: `Please keep your name under ${MAX_LENGTH.name} characters.` };
  }
  if (email.length > MAX_LENGTH.email || !/^\S+@\S+\.\S+$/.test(email)) {
    return { ok: false, message: "Please enter a valid email address." };
  }
  if (message.length > MAX_LENGTH.message) {
    return {
      ok: false,
      message: `Please keep your message under ${MAX_LENGTH.message.toLocaleString("en-GB")} characters.`,
    };
  }

  // TODO: deliver the message (email service, database, etc.)
  console.log("Contact form submission:", { name, email, message });

  return SENT;
}
