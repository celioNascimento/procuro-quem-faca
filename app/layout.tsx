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
  title: {
    default: "Vitrine Pro | Encontre Profissionais na Sua Região",
    template: "%s | Vitrine Pro"
  },
  description: "A plataforma mais rápida para encontrar eletricistas, encanadores e especialistas. Contato direto via WhatsApp.",
  icons: {
    icon: '/favicon.ico', // Certifique-se de que o arquivo existe em /public
  },
  openGraph: {
    title: "Vitrine Pro | Encontre Profissionais",
    description: "Serviços qualificados a um clique de distância.",
    images: ['/logo.png'], // Usa sua logo como imagem de compartilhamento
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