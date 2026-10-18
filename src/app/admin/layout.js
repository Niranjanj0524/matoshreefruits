import "../globals.css";

export const metadata = {
  title: {
    default: "Admin | Matoshree Fruits",
    template: "%s | Admin | Matoshree Fruits",
  },
  robots: { index: false, follow: false },
};

export const viewport = {
  themeColor: "#2f6b30",
  viewportFit: "cover",
};

/**
 * Root layout for the admin area (separate tree from /[locale], which has its
 * own root layout — the multi-root-layout pattern, since there is no
 * app/layout.js). Admin is English-only: one internal user, not public UI.
 */
export default function AdminRootLayout({ children }) {
  return (
    <html lang="en" className="h-full antialiased">
      <body className="min-h-full bg-background text-foreground">{children}</body>
    </html>
  );
}
