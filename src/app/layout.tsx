import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Dr. Ajith's Madhav Dental Clinic | Doctor Portal",
  description: "Secure clinical portal for patient charts, prescriptions, and schedule management.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className="dark h-full">
      <body className="h-full bg-[#070b13] text-[#f1f5f9] font-sans antialiased">
        {children}
      </body>
    </html>
  );
}
