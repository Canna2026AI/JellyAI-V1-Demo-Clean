import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "JellyAI",
  description: "JellyAI multi-tenant customer service system",
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="zh-CN">
      <body>{children}</body>
    </html>
  );
}
