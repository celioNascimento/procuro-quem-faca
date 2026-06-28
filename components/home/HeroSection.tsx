'use client'
import { HeaderBotoes } from './HeaderBotoes'

type Props = {
  onLog?: (acao: string) => void
}

export default function HeroSection({ onLog }: Props) {
  return (
    <header className="w-full max-w-5xl mx-auto px-4 md:px-6 flex justify-end items-center gap-2 absolute top-0 left-0 right-0 z-50 h-16 md:h-20">
      <HeroSection />
    </header>
  )
} 