//components/home/HeroSection.tsx

'use client'
import { Suspense } from 'react'
import { HeaderBotoes } from './HeaderBotoes'

export default function HeroSection() {
  return (
    <header className="w-full max-w-5xl mx-auto px-4 md:px-6 flex justify-end items-center gap-2 absolute top-0 left-0 right-0 z-50 h-16 md:h-20">
      <Suspense fallback={
        <div className="flex gap-2">
          <div className="h-8 md:h-9 w-28 md:w-36 rounded-full animate-pulse bg-slate-100" />
          <div className="h-8 md:h-9 w-28 md:w-32 rounded-full animate-pulse bg-slate-100" />
        </div>
      }>
        <HeaderBotoes />
      </Suspense>
    </header>
  )
}