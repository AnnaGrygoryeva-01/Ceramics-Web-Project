"use client";

import { useActionState } from "react";
import { sendMessage } from "./actions";

export default function ContactForm() {
  const [state, formAction, pending] = useActionState(sendMessage, null);

  if (state?.ok) return <p role="status">{state.message}</p>;

  return (
    <form action={formAction}>
      <p>
        <label htmlFor="name">Name</label>
        <br />
        <input id="name" name="name" required />
      </p>
      <p>
        <label htmlFor="email">Email</label>
        <br />
        <input id="email" name="email" type="email" required />
      </p>
      <p>
        <label htmlFor="message">Message</label>
        <br />
        <textarea id="message" name="message" rows={6} required />
      </p>
      {state && !state.ok && <p role="alert">{state.message}</p>}
      <button type="submit" disabled={pending}>
        {pending ? "Sending…" : "Send message"}
      </button>
    </form>
  );
}
