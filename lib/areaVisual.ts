//lib/areaVisual.ts
//
// Visual de cada área (Construção, Beleza, Saúde…) para o avatar de quem ainda não tem foto.
// O nome do ícone vem do banco (categorias_grupos.icone); aqui ele vira componente e cor.
// Ícone desconhecido devolve null e o card cai nas iniciais coloridas.

import { Book, Cpu, Hammer, Heart, Home, Sparkles, Star, type LucideIcon } from 'lucide-react'

export type VisualDaArea = { Icone: LucideIcon; cores: string }

const VISUAL_POR_ICONE: Record<string, VisualDaArea> = {
  sparkles: { Icone: Sparkles, cores: 'bg-violet-50 text-violet-600 border-violet-100' },
  hammer:   { Icone: Hammer,   cores: 'bg-amber-50 text-amber-600 border-amber-100' },
  home:     { Icone: Home,     cores: 'bg-emerald-50 text-emerald-600 border-emerald-100' },
  cpu:      { Icone: Cpu,      cores: 'bg-blue-50 text-blue-600 border-blue-100' },
  heart:    { Icone: Heart,    cores: 'bg-rose-50 text-rose-600 border-rose-100' },
  book:     { Icone: Book,     cores: 'bg-sky-50 text-sky-600 border-sky-100' },
  star:     { Icone: Star,     cores: 'bg-orange-50 text-orange-600 border-orange-100' },
}

export function visualDaArea(icone?: string | null): VisualDaArea | null {
  if (!icone) return null
  return VISUAL_POR_ICONE[icone.trim().toLowerCase()] ?? null
}
