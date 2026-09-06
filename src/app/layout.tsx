import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Navil",
  description: "A semantic dialogue assistant for autistic children to practice social conversations with familiar characters in Tamil and English.",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" className="h-full antialiased light">
      <head>
        <link
          rel="stylesheet"
          href="https://fonts.googleapis.com/css2?family=Plus+Jakarta+Sans:wght@400;500;600;700&display=swap"
        />
        <link
          rel="stylesheet"
          href="https://fonts.googleapis.com/css2?family=Material+Symbols+Outlined:wght,FILL@100..700,0..1&display=swap"
        />
      </head>
      <body className="min-h-full flex flex-col bg-soft-gradient text-on-background">
        {children}
      </body>
    </html>
  );
}
