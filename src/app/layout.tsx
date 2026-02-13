import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import Header from '@/components/layout/header/header';
import Footer from '@/components/layout/footer/footer';

import { Abel } from 'next/font/google';

// Abel 폰트 설정 (단일 weight: 400만 지원)
const abel = Abel({
                    weight: '400',          // Abel은 Regular(400)만 있음
                    subsets: ['latin'],     // latin 지원 (필수, 한글 없음)
                    display: 'swap',        // 폰트 로딩 중 fallback 보여줌 (CLS 방지)
                    variable: '--font-abel', // CSS 변수로 사용할 이름 (Tailwind에서 편함)
                  });

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "digitalsummerfilm",
  description: "digitalsummerfilm",
  icons: {
    icon: [
      { url: '/favicon.svg', sizes: 'any' },               // 기본 favicon
      { url: '/favicon.svg', type: 'image/svg+xml' },         // SVG 버전 (현대 브라우저)
    ],
    // shortcut: '/shortcut-icon.png',                        // shortcut (옵션)
    // apple: [
    //   { url: '/apple-touch-icon.png', sizes: '180x180' },  // iOS 홈스크린 아이콘
    //   { url: '/apple-touch-icon-152x152.png', sizes: '152x152' },
    // ],
    // 다크모드 별도 아이콘 (prefers-color-scheme)
    other: [
      {
        rel: 'icon',
        url: '/favicon.svg',
        media: '(prefers-color-scheme: dark)',
      },
    ],
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className={`${abel.variable}`}>
      <body className={`${geistSans.variable} ${geistMono.variable}`}>
        <Header/>
        {children}
        <Footer/>
      </body>
    </html>
  );
}
