export function aplicarFiltroBuscaNoQuery(query, termo) {
  if (!termo) return query
  
  // Pega a primeira palavra significativa para pré-filtrar no banco
  const palavras = termo.split(' ').filter(p => p.length > 2)
  const termoChave = palavras[0] || termo

  return query.or(`nome.ilike.%${termoChave}%,categoria.ilike.%${termoChave}%,bairro.ilike.%${termoChave}%`)
}