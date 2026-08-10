import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Serene Path Therapy",
  description: "A semantic dialogue assistant platform tailored for autistic children.",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" className="h-full antialiased light">
      <body className="min-h-full flex flex-col bg-soft-gradient text-on-background">
        {children}
      </body>
    </html>
  );
}
