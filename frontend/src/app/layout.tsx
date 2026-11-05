import type { Metadata } from "next";
import "./globals.css";
export const metadata: Metadata = {
  title: { default: "Agency Platform", template: "%s" },
  description: "Digital solutions for ambitious businesses.",
};
export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
