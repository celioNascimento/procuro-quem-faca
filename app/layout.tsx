import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import FooterWrapper from "@/components/FooterWrapper"; // <--- Importaremos o componente que criaremos abaixo

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

// Agora o SEO volta a funcionar aqui!
export const metadata = {
  // Substitua pela URL real onde seu site está hospedado
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
    url: './', // Refere-se à página atual
    siteName: 'Procuro Quem Faça',
    locale: 'pt_BR',
    type: 'website',
    images: [
      {
        url: '/logo.png', // Agora com metadataBase, o Next.js converte para URL absoluta
        width: 1200,
        height: 630,
        alt: 'Logo Procuro Quem Faça',
      },
    ],
  },
  // Twitter também ajuda no compartilhamento mobile
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
    <html lang="pt-br">
      <body className={`${geistSans.variable} ${geistMono.variable} antialiased min-h-screen flex flex-col bg-white`}>
        <div className="flex-grow flex flex-col">
          {children}
        </div>
        
        {/* Este componente cuidará de esconder o Footer no /admin sem quebrar o site */}
        <FooterWrapper />
      </body>
    </html>
  );
}