import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
// CORREÇÃO: Adicionada a barra "/" após o @
import Footer from "@/components/Footer"; 

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata = {
  title: 'SeuPortal | Encontre Profissionais Próximos',
  description: 'Conectamos você aos melhores técnicos de ar-condicionado, eletricistas, encanadores e prestadores de serviço da região.',
  icons: {
    icon: '/logo.png', // Isso já ajuda a usar sua logo como favicon rapidamente
  },
  openGraph: {
    title: 'SeuPortal | Profissionais de Confiança',
    description: 'Precisa de um técnico ou prestador de serviço? Encontre aqui em segundos.',
    url: 'https://seudominio.com',
    siteName: 'SeuPortal',
    images: [
      {
        url: '/logo.png', // A logo que aparecerá no card do WhatsApp
        width: 800,
        height: 600,
      },
    ],
    locale: 'pt_BR',
    type: 'website',
  },
}

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="pt-br">
      <body className={`${geistSans.variable} ${geistMono.variable} antialiased min-h-screen flex flex-col bg-white`}>
        <div className="flex-grow flex flex-col">
          {children}
        </div>
        <Footer />
      </body>
    </html>
  );
}