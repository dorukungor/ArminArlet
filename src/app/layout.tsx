import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Çikolata Değerlendirme",
  description: "Çikolata değerlendirme uygulaması",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="tr" suppressHydrationWarning>
      <body className="antialiased" suppressHydrationWarning>
        {children}
      </body>
    </html>
  );
}
