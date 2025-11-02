import type { Metadata } from "next";
import "./globals.css";
import { APP_NAME, APP_DESCRIPTION } from "@/utils/constants";

export const metadata: Metadata = {
  title: APP_NAME,
  description: APP_DESCRIPTION,
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <head>
        <link href="https://api.fontshare.com/v2/css?f[]=satoshi@300,301,400,401,500,501,700,701&f[]=clash-grotesk@200,300,400,500,600,700&display=swap" rel="stylesheet" />
      </head>
      <body
        className={`p-4 lg:p-6 antialiased`}
      >
        {children}
      </body>
    </html>
  );
}
