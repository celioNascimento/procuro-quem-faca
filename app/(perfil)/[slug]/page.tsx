import type { Metadata } from 'next'
import { createClient } from '@/lib/supabase/server'
import PerfilPublicoClient from './PerfilPublicoClient'

type PerfilSeo = {
  nome: string | null
  slug: string | null
  bio: string | null
  categoria: string | null
  cidade: string | null
  estado: string | null
  fotoPerfil: string | null
}

const baseUrl = 'https://procuroquemfaca.com.br'
const fallbackTitle = 'Perfil não encontrado | Procuro Quem Faça'
const fallbackDescription = 'Encontre profissionais confiáveis na sua região com contato direto via WhatsApp.'

function normalizarDescricao(bio: string | null) {
  const descricao = bio?.replace(/\\s+/g, ' ').trim()
  if (!descricao) return fallbackDescription
  if (descricao.length <= 155) return descricao
  return `${descricao.slice(0, 152).replace(/\\s+\\S*$/, '').trim()}...`
}

async function buscarPerfil(slug: string): Promise<PerfilSeo | null> {
  const supabase = await createClient()
  const { data, error } = await supabase
    .from('prestadores')
    .select('nome, slug, bio, categoria, foto_perfil, status, categorias(nome), cidades(nome, estado_sigla)')
    .eq('slug', slug)
    .eq('status', 'ativo')
    .maybeSingle()

  if (error || !data) return null

  const categoriaRelacionada = Array.isArray(data.categorias) ? data.categorias[0] : data.categorias
  const cidadeRelacionada = Array.isArray(data.cidades) ? data.cidades[0] : data.cidades

  return {
    nome: data.nome,
    slug: data.slug,
    bio: data.bio,
    categoria: categoriaRelacionada?.nome ?? data.categoria ?? null,
    cidade: cidadeRelacionada?.nome ?? null,
    estado: cidadeRelacionada?.estado_sigla ?? null,
    fotoPerfil: data.foto_perfil,
  }
}

function criarTitulo(perfil: PerfilSeo) {
  const categoria = perfil.categoria || 'Profissional'
  const local = [perfil.cidade, perfil.estado].filter(Boolean).join(' - ')
  return `${perfil.nome || categoria}${local ? ` | ${categoria} em ${local}` : ` | ${categoria}`} | Procuro Quem Faça`
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>
}): Promise<Metadata> {
  const { slug } = await params
  const perfil = await buscarPerfil(slug)

  if (!perfil) {
    return {
      title: fallbackTitle,
      description: fallbackDescription,
    }
  }

  const title = criarTitulo(perfil)
  const description = normalizarDescricao(perfil.bio)
  const image = perfil.fotoPerfil || `${baseUrl}/logo.png`

  return {
    title,
    description,
    alternates: { canonical: `${baseUrl}/${perfil.slug || slug}` },
    openGraph: {
      title,
      description,
      url: `${baseUrl}/${perfil.slug || slug}`,
      siteName: 'Procuro Quem Faça',
      locale: 'pt_BR',
      type: 'profile',
      images: [{ url: image, alt: `${perfil.nome || 'Profissional'} no Procuro Quem Faça` }],
    },
    twitter: {
      card: 'summary_large_image',
      title,
      description,
      images: [image],
    },
  }
}

export default function PerfilPublicoPage() {
  return <PerfilPublicoClient />
}
