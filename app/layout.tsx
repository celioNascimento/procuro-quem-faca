import "./globals.css"
import { Suspense } from 'react'
import { geistSans, geistMono } from "@/lib/fonts"
import FooterWrapper from "@/components/FooterWrapper"
import CookieConsent from "@/components/CookieConsent"
import LogAcesso from "@/components/LogAcesso"
import { PostHogProvider } from "@/components/PostHogProvider"
import { PostHogPageview } from "@/components/PostHogPageview"
import { Analytics } from "@vercel/analytics/next"
import { SpeedInsights } from "@vercel/speed-insights/next"
import { LocationProvider } from "@/lib/contexts/LocationContext"

export { metadata } from "./metadata"

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="pt-br" className={`${geistSans.variable} ${geistMono.variable}`} suppressHydrationWarning>
      <body className="font-sans antialiased min-h-screen flex flex-col bg-white text-slate-900">
        <PostHogProvider>
          <Suspense fallback={null}>
            <PostHogPageview />
          </Suspense>

          <LocationProvider>
            <div className="flex-grow flex flex-col">
              {children}
            </div>

            <FooterWrapper />
            <CookieConsent />
            <LogAcesso />
          </LocationProvider>

          <Analytics />
          <SpeedInsights />
        </PostHogProvider>
      </body>
    </html>
  )
}
