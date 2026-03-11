import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import FooterWrapper from "@/components/FooterWrapper";
import CookieConsent from "@/components/CookieConsent";
import LogAcesso from "@/components/LogAcesso";
import Script from "next/script";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
  display: 'swap',
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
  display: 'swap',
});

// NOTA: Para que o Geist seja aplicado via Tailwind `font-sans`,
// o globals.css deve mapear a variável CSS:
//   @layer base { body { font-family: var(--font-geist-sans), sans-serif; } }
// Sem isso, `font-sans` usa a stack padrão do Tailwind (não Geist).

export const metadata = {
  metadataBase: new URL('https://procuroquemfaca.com.br'),
  title: {
    default: "Encontre Profissionais na Sua Região",
    template: "%s | Procuro Quem Faça"
  },
  description: "A plataforma mais rápida para encontrar eletricistas, encanadores e especialistas. Contato direto via WhatsApp.",
  // Sem icons manual — Next.js 14 detecta /app/icon.png automaticamente
  // e gera <link rel="icon"> correto para todos os browsers
  openGraph: {
    title: "Procuro Quem Faça | Encontre Profissionais",
    description: "Eletricistas, encanadores e especialistas a um clique de distância. Contato direto via WhatsApp.",
    url: './',
    siteName: 'Procuro Quem Faça',
    locale: 'pt_BR',
    type: 'website',
    images: [
      {
        url: '/og-image.png',
        width: 1200,
        height: 630,
        alt: 'Procuro Quem Faça — Encontre Profissionais',
      },
    ],
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Encontre Profissionais na Sua Região',
    description: 'Serviços qualificados a um clique de distância.',
    images: ['/og-image.png'],
  },
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html
      lang="pt-br"
      className={`${geistSans.variable} ${geistMono.variable}`}
      suppressHydrationWarning
    >
      <body className="font-sans antialiased min-h-screen flex flex-col bg-white text-slate-900">

        <div className="flex-grow flex flex-col">
          {children}
        </div>

        <FooterWrapper />
        <CookieConsent />
        <LogAcesso />

        <Script
          async
          src="https://pagead2.googlesyndication.com/pagead/js/adsbygoogle.js?client=ca-pub-7818876710105434"
          crossOrigin="anonymous"
          strategy="afterInteractive"
        />
      </body>
    </html>
  )
}