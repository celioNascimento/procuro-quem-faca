// Simplifica o texto para comparação (remove acentos e espaços extras)
function simplificar(txt) {
  if (!txt) return '';
  return txt
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, "") // Remove acentos
    .trim();
}

export function normalizarTermo(queryBusca, filtroHab) {
  return `${queryBusca || ''} ${filtroHab || ''}`.trim();
}

export function filtrarPrestadores(lista, termo) {
  if (!termo) return lista;
  const t = simplificar(termo);

  return lista.filter(p => {
    const nome = simplificar(p.nome);
    const categoria = simplificar(p.categoria);
    
    // Transforma o array de habilidades em uma string única para busca parcial
    const habilidadesStr = Array.isArray(p.habilidades) 
      ? p.habilidades.map(h => simplificar(h)).join(' ') 
      : '';

    // Lógica de correspondência: Se o termo estiver em QUALQUER um desses campos
    return (
      nome.includes(t) ||
      categoria.includes(t) ||
      habilidadesStr.includes(t)
    );
  });
}