import "./globals.css"
import { geistSans, geistMono } from "@/lib/fonts"
import { AdSenseScript } from "@/lib/scripts/AdSenseScript"
import FooterWrapper from "@/components/FooterWrapper"
import CookieConsent from "@/components/CookieConsent"
import LogAcesso from "@/components/LogAcesso"
import { PostHogProvider } from "@/components/PostHogProvider"    
import { PostHogPageview } from "@/components/PostHogPageview"
import { LocationProvider } from "../lib/contexts/LocationContext"
import LocationModal from "@/components/location/LocationModal" // <-- Importe aqui

export { metadata } from "./metadata"

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="pt-br" className={`${geistSans.variable} ${geistMono.variable}`} suppressHydrationWarning>
      <body className="font-sans antialiased min-h-screen flex flex-col bg-white text-slate-900">
        <PostHogProvider>                                          
          <PostHogPageview />                                      
          
          <LocationProvider>
            <div className="flex-grow flex flex-col">
              {children}
            </div>
            
            <LocationModal /> {/* <-- Injetado aqui */}
            
            <FooterWrapper />
            <CookieConsent />
            <LogAcesso />
            <AdSenseScript />
          </LocationProvider>
          
        </PostHogProvider>                                         
      </body>
    </html>
  )
}