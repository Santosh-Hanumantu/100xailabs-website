import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Contact — 100x AI Labs",
  description: "Get in touch with 100x AI Labs.",
  alternates: {
    canonical: "https://100xailabs.in/contact",
  },
};

const CONTACT_METHODS = [
  {
    label: "Email",
    display: "praveen.geddam@100xailabs.in",
    href: "mailto:praveen.geddam@100xailabs.in",
  },
  {
    label: "Phone",
    display: "+91 70325 50670",
    href: "tel:+917032550670",
  },
  {
    label: "Phone",
    display: "+91 88008 19618",
    href: "tel:+918800819618",
  },
];

export default function ContactPage() {
  return (
    <main id="main-content" className="contact-main">
      <h1>Contact us</h1>
      <p className="contact-intro">
        Reach out to 100x AI Labs using any of the details below.
      </p>

      <ul className="contact-list">
        {CONTACT_METHODS.map((method, i) => (
          <li key={`${method.label}-${i}`} className="contact-item">
            <span className="contact-label">{method.label}</span>
            <a href={method.href} className="contact-value">
              {method.display}
            </a>
          </li>
        ))}
      </ul>
    </main>
  );
}
