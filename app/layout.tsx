import type { Metadata, Viewport } from "next";
// Header removed for now (kept at components/SiteHeader.tsx) so the
// homepage is a full-bleed video with no chrome — bring it back by
// restoring this import and the <SiteHeader /> line below.
// import SiteHeader from "@/components/SiteHeader";
import "./globals.css";

// REQ-021 (mobile/cross-browser compatibility): viewportFit "cover" lets the
// full-bleed hero extend under the iPhone notch/home-indicator safe areas
// instead of leaving a plain-color band there; the two overlay buttons in
// globals.css add matching safe-area padding so they're never hidden behind
// that same area on notched phones.
export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  viewportFit: "cover",
  themeColor: "#0b1220",
};

export const metadata: Metadata = {
  metadataBase: new URL("https://100xailabs.in"),
  title: "100x AI Labs",
  description: "100x AI Labs — AI products and services across industries.",
  openGraph: {
    title: "100x AI Labs",
    description: "AI products and services across industries.",
    url: "https://100xailabs.in/",
    type: "website",
    images: ["/images/hero-poster.jpg"],
  },
  twitter: {
    card: "summary_large_image",
  },
  alternates: {
    canonical: "https://100xailabs.in/",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <head>
        {/* Minimal Organization structured data (Schema.org) — expand once
            corporate pages exist, per Section 5 of the project spec doc. */}
        <script
          type="application/ld+json"
          // eslint-disable-next-line react/no-danger
          dangerouslySetInnerHTML={{
            __html: JSON.stringify({
              "@context": "https://schema.org",
              "@type": "Organization",
              name: "100x AI Labs",
              url: "https://100xailabs.in/",
              contactPoint: [
                {
                  "@type": "ContactPoint",
                  email: "praveen.geddam@100xailabs.in",
                  telephone: "+91-70325-50670",
                  contactType: "customer service",
                },
                {
                  "@type": "ContactPoint",
                  telephone: "+91-88008-19618",
                  contactType: "customer service",
                },
              ],
            }),
          }}
        />
      </head>
      <body>
        <a className="skip-link" href="#main-content">
          Skip to content
        </a>
        {/* <SiteHeader /> */}
        {children}
      </body>
    </html>
  );
}
