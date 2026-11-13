import type { Metadata } from "next";
import ContactForm from "./ContactForm";

export const metadata: Metadata = { title: "Contact" };

export default function ContactPage() {
  return (
    <div className="contact-page">
      <h1>Contact</h1>
      <p>
        Questions about an order, a piece, or a custom request? Send a message below, or email me at{" "}
        <a href="mailto:annagryceramics@gmail.com">annagryceramics@gmail.com</a>.
      </p>
      <ContactForm />
    </div>
  );
}
