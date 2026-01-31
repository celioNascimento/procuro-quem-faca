// Arquivo: app/layout.js
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import FooterWrapper from "@/components/FooterWrapper";
import CookieConsent from "@/components/CookieConsent"; 
import LogAcesso from "@/components/LogAcesso"; // <--- 1. Importar o monitor de tráfego

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

export const metadata = {
  metadataBase: new URL('https://procuroquemfaca.com.br'), 
  title: {
    default: "Encontre Profissionais na Sua Região",
    template: "%s | Procuro Quem Faça"
  },
  description: "A plataforma mais rápida para encontrar eletricistas, encanadores e especialistas. Contato direto via WhatsApp.",
  icons: {
    icon: '/favicon.png',
  },
  openGraph: {
    title: "Procuro Quem Faça | Encontre Profissionais",
    description: "Eletricistas, encanadores e especialistas a um clique de distância. Contato direto via WhatsApp.",
    url: './',
    siteName: 'Procuro Quem Faça',
    locale: 'pt_BR',
    type: 'website',
    images: [
      {
        url: '/logo.png',
        width: 1200,
        height: 630,
        alt: 'Logo Procuro Quem Faça',
      },
    ],
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Encontre Profissionais na Sua Região',
    description: 'Serviços qualificados a um clique de distância.',
    images: ['/logo.png'],
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="pt-br" className={`${geistSans.variable} ${geistMono.variable}`}>
      <body className={`font-sans antialiased min-h-screen flex flex-col bg-white text-slate-900`}>
        
        <div className="flex-grow flex flex-col">
          {children}
        </div>
        
        <FooterWrapper />
        
        {/* --- COMPONENTES GLOBAIS (MONITORAMENTO & UX) --- */}
        
        {/* 1. Gerencia o aviso legal de Cookies (só aparece se não aceitou) */}
        <CookieConsent /> 
        
        {/* 2. Registra o log de visita no banco (invisível, roda em toda sessão) */}
        <LogAcesso />
        
      </body>
    </html>
  );
}