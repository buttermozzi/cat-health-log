import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "나비 건강일지",
  description: "고양이 건강 기록 앱",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="ko" className="h-full">
      <body className="min-h-full flex flex-col">{children}</body>
    </html>
  );
}
