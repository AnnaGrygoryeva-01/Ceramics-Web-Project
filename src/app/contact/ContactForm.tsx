"use client";

import { useActionState } from "react";
import { sendMessage } from "./actions";
import { HONEYPOT, MAX_LENGTH } from "./limits";

export default function ContactForm() {
  const [state, formAction, pending] = useActionState(sendMessage, null);

  if (state?.ok) {
    return (
      <p className="contact-form__sent" role="status">
        {state.message}
      </p>
    );
  }

  return (
    <form action={formAction} className="contact-form">
      <div className="contact-form__row">
        <div className="field">
          <label htmlFor="name">Name</label>
          <input id="name" name="name" autoComplete="name" maxLength={MAX_LENGTH.name} required />
        </div>
        <div className="field">
          <label htmlFor="email">Email</label>
          <input
            id="email"
            name="email"
            type="email"
            autoComplete="email"
            maxLength={MAX_LENGTH.email}
            required
          />
        </div>
      </div>
      <div className="field">
        <label htmlFor="message">Message</label>
        <textarea id="message" name="message" rows={7} maxLength={MAX_LENGTH.message} required />
      </div>
      {/* Honeypot: moved off-screen and skipped by the keyboard and screen readers,
          so only bots fill it in (see actions.ts) */}
      <div className="contact-form__trap" aria-hidden="true">
        <label htmlFor={HONEYPOT}>Leave this empty</label>
        <input id={HONEYPOT} name={HONEYPOT} tabIndex={-1} autoComplete="off" />
      </div>
      {state && !state.ok && (
        <p className="contact-form__error" role="alert">
          {state.message}
        </p>
      )}
      <button type="submit" className="button" disabled={pending}>
        {pending ? "Sending…" : "Send message"}
      </button>
    </form>
  );
}
