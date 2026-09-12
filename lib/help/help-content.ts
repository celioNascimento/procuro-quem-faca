export type HelpAudience = 'cliente' | 'publico' | 'prestador' | 'admin'

export interface HelpArticle {
  id: string
  title: string
  summary: string
  category: string
  audiences: HelpAudience[]
  contexts: string[]
  steps?: string[]
  related?: string[]
}

export const helpArticles: HelpArticle[] = [
  {
    id: 'encontrar-prestador', title: 'Como encontrar um prestador', summary: 'Use a busca e os filtros para encontrar profissionais adequados ao que você precisa.', category: 'Encontrar ajuda', audiences: ['cliente', 'publico'], contexts: ['home', 'prestadores'],
    steps: ['Descreva o serviço que você procura na busca.', 'Escolha uma categoria ou região para refinar os resultados.', 'Abra um perfil para conhecer o trabalho, portfólio e avaliações do prestador.'], related: ['ler-perfil-publico', 'entrar-em-contato']
  },
  {
    id: 'ler-perfil-publico', title: 'Como consultar um perfil público', summary: 'Veja especialidades, fotos, avaliações e formas de contato antes de decidir.', category: 'Encontrar ajuda', audiences: ['cliente', 'publico'], contexts: ['perfil-publico'],
    steps: ['Confira a descrição e as especialidades do profissional.', 'Veja o portfólio e as avaliações de outros clientes.', 'Use o botão de contato para solicitar um orçamento diretamente ao prestador.'], related: ['entrar-em-contato', 'avaliar-servico']
  },
  {
    id: 'entrar-em-contato', title: 'Como entrar em contato', summary: 'O contato acontece pelo WhatsApp informado no perfil do prestador.', category: 'Contratar', audiences: ['cliente', 'publico'], contexts: ['perfil-publico'],
    steps: ['Abra o perfil do prestador escolhido.', 'Toque em solicitar orçamento ou no botão de WhatsApp.', 'Combine detalhes, prazo e valores diretamente com o profissional.']
  },
  {
    id: 'acompanhar-servico', title: 'Como acompanhar um serviço', summary: 'O painel do cliente reúne os serviços pendentes, em andamento, concluídos e casos de garantia.', category: 'Meus serviços', audiences: ['cliente'], contexts: ['meus-servicos', 'dashboard', 'dashboard-cliente'],
    steps: ['Acesse Meus serviços com a mesma conta usada no contato.', 'Use os filtros para encontrar o serviço desejado.', 'Abra o cartão para aceitar, acompanhar ou consultar uma garantia/reclamação.'], related: ['avaliar-servico', 'garantia']
  },
  {
    id: 'avaliar-servico', title: 'Como avaliar um serviço', summary: 'Após a conclusão, use o link de avaliação para registrar sua experiência.', category: 'Meus serviços', audiences: ['cliente'], contexts: ['meus-servicos', 'avaliacao', 'acompanhamento'],
    steps: ['Abra o acompanhamento do serviço concluído.', 'Acesse o link de avaliação recebido.', 'Escolha a nota e escreva um comentário honesto antes de enviar.']
  },
  {
    id: 'garantia', title: 'Como funciona a garantia ou reclamação', summary: 'Use o acompanhamento para registrar uma situação relacionada a um serviço concluído.', category: 'Meus serviços', audiences: ['cliente'], contexts: ['meus-servicos', 'acompanhamento'],
    steps: ['Abra o serviço no painel do cliente.', 'Entre na seção Garantia ou Reclamação.', 'Descreva o ocorrido e, quando solicitado, envie fotos para contextualizar o caso.']
  },
  {
    id: 'editar-perfil-prestador', title: 'Como editar meu perfil profissional', summary: 'Mantenha seus dados, especialidades e formas de contato atualizados para aparecer melhor nas buscas.', category: 'Meu perfil', audiences: ['prestador'], contexts: ['dashboard-prestador'],
    steps: ['Abra a aba Dados Profissionais no painel.', 'Atualize sua descrição, localização, especialidades e WhatsApp.', 'Salve as alterações e confira como seu perfil aparece publicamente.'], related: ['portfolio-prestador', 'ativacao-perfil-prestador']
  },
  {
    id: 'portfolio-prestador', title: 'Como publicar projetos no portfólio', summary: 'Adicione fotos e informações de trabalhos realizados para apresentar sua experiência aos clientes.', category: 'Meu perfil', audiences: ['prestador'], contexts: ['dashboard-prestador'],
    steps: ['Acesse a aba Meus Projetos.', 'Envie fotos nítidas e escolha trabalhos que representem seu serviço.', 'Revise o conteúdo antes de publicar para manter seu portfólio atualizado.']
  },
  {
    id: 'avaliacoes-prestador', title: 'Como consultar minhas avaliações', summary: 'Acompanhe as avaliações recebidas dos clientes diretamente no seu painel profissional.', category: 'Meu perfil', audiences: ['prestador'], contexts: ['dashboard-prestador'],
    steps: ['Abra a aba Avaliações no painel.', 'Leia os comentários e confira sua nota geral.', 'Use os retornos para melhorar a comunicação e a qualidade dos serviços.']
  },
  {
    id: 'ativacao-perfil-prestador', title: 'Ativação ou bloqueio do perfil', summary: 'Entenda o que acontece quando seu perfil está incompleto, em análise ou bloqueado pela moderação.', category: 'Conta', audiences: ['prestador'], contexts: ['dashboard-prestador'],
    steps: ['Complete os dados obrigatórios indicados na aba Dados Profissionais.', 'Aguarde a análise quando o perfil estiver em revisão.', 'Se houver bloqueio, leia o motivo informado e use o canal de suporte do painel para pedir esclarecimentos.']
  },
  {
    id: 'conta-e-seguranca', title: 'Conta, privacidade e segurança', summary: 'Mantenha seus dados atualizados e use somente os canais oficiais do projeto.', category: 'Conta', audiences: ['cliente', 'publico'], contexts: ['login', 'cadastro', 'perfil-cliente'],
    steps: ['Entre com seu e-mail para acessar a conta.', 'Use a recuperação de senha caso não consiga entrar.', 'Para excluir a conta, siga o fluxo de confirmação e leia a política de privacidade.']
  },
]

export function getHelpArticles(audience: HelpAudience, context?: string) {
  return helpArticles.filter((article) => article.audiences.includes(audience) && (!context || article.contexts.includes(context)))
}

export function findHelpArticle(id: string) { return helpArticles.find((article) => article.id === id) }

export function searchHelpArticles(query: string, audience: HelpAudience = 'cliente') {
  const normalized = query.trim().toLocaleLowerCase('pt-BR')
  return helpArticles.filter((article) => article.audiences.includes(audience) && (!normalized || [article.title, article.summary, article.category, ...(article.steps || [])].join(' ').toLocaleLowerCase('pt-BR').includes(normalized)))
}

export const helpCategories = [...new Set(helpArticles.map((article) => article.category))]

export function helpAudienceLabel(audience: HelpAudience) { return audience === 'publico' ? 'Visitante' : audience === 'cliente' ? 'Cliente' : audience === 'prestador' ? 'Prestador' : 'Admin' }

// Conteúdo público e do cliente: a documentação técnica fica separada na área administrativa.
// Referência de manutenção: documentacao/docs/02-arquitetura.md#central-de-ajuda
