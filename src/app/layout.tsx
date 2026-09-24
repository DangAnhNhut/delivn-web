import type { Metadata } from "next";
import { Be_Vietnam_Pro, Playfair_Display } from "next/font/google";
import "./globals.css";

const beVietnamPro = Be_Vietnam_Pro({
  variable: "--font-be-vietnam-pro",
  subsets: ["latin", "vietnamese"],
  weight: ["300", "400", "500", "600", "700"],
  display: "swap",
});

const playfairDisplay = Playfair_Display({
  variable: "--font-playfair-display",
  subsets: ["latin", "vietnamese"],
  style: ["normal", "italic"],
  weight: ["400", "500", "600", "700"],
  display: "swap",
});

export const metadata: Metadata = {
  title: {
    default: "DELIVN — Cà Phê Việt Nam Từ Tây Nguyên",
    template: "%s | DELIVN",
  },
  description:
    "DELIVN mang đến hai dòng cà phê với tinh thần hiện đại, được khơi nguồn từ bản sắc Tây Nguyên và hoàn thiện cho trải nghiệm thưởng thức mỗi ngày.",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html
      lang="vi"
      className={`${beVietnamPro.variable} ${playfairDisplay.variable} antialiased`}
    >
      <body className="flex flex-col min-h-dvh font-sans">{children}</body>
    </html>
  );
}
