"use server";

export type ContactState = { ok: boolean; message: string } | null;

export async function sendMessage(_prev: ContactState, formData: FormData): Promise<ContactState> {
  const name = String(formData.get("name") ?? "").trim();
  const email = String(formData.get("email") ?? "").trim();
  const message = String(formData.get("message") ?? "").trim();

  if (!name || !email || !message) {
    return { ok: false, message: "Please fill in all fields." };
  }
  if (!/^\S+@\S+\.\S+$/.test(email)) {
    return { ok: false, message: "Please enter a valid email address." };
  }

  // TODO: deliver the message (email service, database, etc.)
  console.log("Contact form submission:", { name, email, message });

  return { ok: true, message: "Thanks! Your message has been sent." };
}
