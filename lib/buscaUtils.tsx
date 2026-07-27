//lib/buscaUtils.tsx

function simplificar(txt) {
  if (!txt) return '';
  return txt
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, "")
    .trim();
}

export function normalizarTermo(queryBusca, filtroHab) {
  // Se ambos existirem e forem iguais, retorna apenas um para não duplicar o termo
  if (simplificar(queryBusca) === simplificar(filtroHab)) return queryBusca || '';
  return `${queryBusca || ''} ${filtroHab || ''}`.trim();
}

export function filtrarPrestadores(lista, termo) {
  if (!termo || !lista) return lista;

  const termoSimplificado = simplificar(termo);
  const palavrasChave = termoSimplificado.split(/\s+/).filter(Boolean);

  return lista.filter(p => {
    // 1. Tratamento robusto para Habilidades (evita erro se for null ou objeto)
    const habilidadesStr = Array.isArray(p.habilidades)
      ? p.habilidades.join(' ')
      : (typeof p.habilidades === 'string' ? p.habilidades : '');

    // 2. Montamos o alvo da busca incluindo o nome da cidade para ajudar
    const alvoBusca = simplificar(`
      ${p.nome || ''} 
      ${p.categoria || ''} 
      ${habilidadesStr}
      ${p.cidades?.nome || ''}
    `);

    // 3. Verificação: O prestador deve conter as palavras-chave
    // Usamos o 'some' se quiser uma busca mais aberta ou 'every' para restrita.
    // Vamos manter 'every', mas garantir que o alvoBusca não esteja vazio.
    return palavrasChave.every(palavra => alvoBusca.includes(palavra));
  });
}
