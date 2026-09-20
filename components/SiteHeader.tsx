import Link from "next/link";

// Extend this list as more pages ship (Section 5 of the project spec doc) —
// the header itself never needs to change to add a link.
// Contact removed for now (kept at app/contact/page.tsx — add it back here
// by uncommenting the line below whenever it's ready to link again):
// { href: "/contact", label: "Contact" },
const NAV_LINKS: { href: string; label: string }[] = [];

export default function SiteHeader() {
  return (
    <header className="site-header">
      <Link href="/" className="brand">
        100x AI Labs
      </Link>
      <nav aria-label="Primary">
        <ul className="site-nav">
          {NAV_LINKS.map((link) => (
            <li key={link.href}>
              <Link href={link.href}>{link.label}</Link>
            </li>
          ))}
        </ul>
      </nav>
    </header>
  );
}
