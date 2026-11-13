import type { Metadata } from "next";
import Link from "next/link";

export const metadata: Metadata = { title: "Privacy" };

const EMAIL = "annagryceramics@gmail.com";
const mail = <a href={`mailto:${EMAIL}`}>{EMAIL}</a>;

// What the shop does with personal data, as UK GDPR asks. Keep it in step with
// the code: what checkout and the contact form collect, and who it goes to.
export default function PrivacyPage() {
  return (
    <div className="text-page">
      <h1>Privacy</h1>
      <p>Last updated: 13 November 2026</p>

      <p>
        This shop is run by me, Anna Grygoryeva, a ceramicist based in the UK. This page explains what personal
        information I collect when you use this website, why, who I share it with, and your rights. If you have any
        questions, email me at {mail} or use the <Link href="/contact">contact page</Link>.
      </p>

      <h2>What I collect</h2>
      <p>
        <strong>When you buy something:</strong> your name, email address and delivery address, what you ordered and
        what you paid. You enter these in the secure payment form at checkout.
      </p>
      <p>
        <strong>When you pay:</strong> your card or other payment details go straight to Stripe, my payment provider. I
        never see or store your full card number.
      </p>
      <p>
        <strong>When you send a message:</strong> your name, email address and your message.
      </p>
      <p>
        I don&rsquo;t ask for more than I need, I don&rsquo;t create accounts, and I don&rsquo;t use analytics or
        advertising trackers.
      </p>

      <h2>Why I use it</h2>
      <p>
        To take payment for your order, pack it, post it to you, send you updates about it (such as a tracking link),
        and deal with any problem, return or refund. This is needed to carry out our contract when you buy from me.
      </p>
      <p>
        To reply to your messages. This is in my legitimate interest in answering the people who contact me.
      </p>
      <p>
        To keep records of sales, which the law requires for tax and accounting.
      </p>
      <p>I don&rsquo;t send marketing emails, and I never sell your information.</p>

      <h2>Who I share it with</h2>
      <p>Only the companies that help me run the shop, and only what they need:</p>
      <ul>
        <li>
          <strong>Stripe</strong> processes payments and sends your receipt. It also uses your details to prevent
          fraud. Stripe&rsquo;s own privacy policy is at stripe.com/gb/privacy.
        </li>
        <li>
          <strong>Royal Mail</strong> delivers your order and emails you a tracking link, so it receives your name,
          delivery address and email address.
        </li>
        <li>
          <strong>DigitalOcean</strong> hosts this website in London, and <strong>Turso</strong> stores order records
          in a database in Ireland.
        </li>
      </ul>
      <p>
        Some of these companies may handle data outside the UK. When they do, they use safeguards approved under UK
        data protection law, such as the UK International Data Transfer Agreement.
      </p>

      <h2>How long I keep it</h2>
      <p>
        Order records are kept for 6 years after the end of the tax year of the sale, as HMRC requires. Messages are
        deleted once they&rsquo;ve been dealt with, and no later than 12 months after my last reply, unless they
        relate to an order.
      </p>

      <h2>Cookies and your browser</h2>
      <p>
        The site remembers what&rsquo;s in your cart and whether you chose the light or dark theme. These are kept in
        your own browser, never sent to me, and you can clear them at any time in your browser&rsquo;s settings.
      </p>
      <p>
        The payment form at checkout comes from Stripe, which sets cookies to keep payments secure and prevent fraud.
        These are needed for paying, so they don&rsquo;t need your consent. The site uses no other cookies.
      </p>

      <h2>Your rights</h2>
      <p>You can ask me to:</p>
      <ul>
        <li>give you a copy of the personal information I hold about you</li>
        <li>correct anything that&rsquo;s wrong</li>
        <li>delete your information, unless I have to keep it, for example for tax records</li>
        <li>stop or limit using your information</li>
      </ul>
      <p>
        Just email me at {mail} or use the <Link href="/contact">contact page</Link>.
      </p>
      <p>
        If you&rsquo;re unhappy with how I&rsquo;ve handled your information, you can complain to the Information
        Commissioner&rsquo;s Office (ICO) at ico.org.uk or on 0303 123 1113. I&rsquo;d appreciate the chance to put
        things right first.
      </p>
    </div>
  );
}
