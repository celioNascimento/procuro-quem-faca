// lib/ativacao/lista.ts
//
// Apoio da lista da tela /admin/ativacao. A tabela `prestadores` tem perfis sem nome (cadastros
// iniciados e não concluídos), então nome e slug podem vir vazios: nada aqui pode assumir texto.

interface PerfilDaLista {
  nome?: string | null
  slug?: string | null
}

export const NOME_PADRAO = '(sem nome)'

export function nomeDoPerfil(perfil: PerfilDaLista): string {
  return perfil.nome?.trim() || NOME_PADRAO
}

// Busca por trecho do nome ou do slug, sem diferenciar maiúsculas de minúsculas
export function correspondeABusca(perfil: PerfilDaLista, busca: string): boolean {
  const termo = busca.trim().toLowerCase()
  if (!termo) return true
  return (
    (perfil.nome ?? '').toLowerCase().includes(termo) ||
    (perfil.slug ?? '').toLowerCase().includes(termo)
  )
}
