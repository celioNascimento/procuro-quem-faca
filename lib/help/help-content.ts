import { MOTIVOS_CNPJ } from '@/lib/selos/motivosCnpj'

export type HelpAudience = 'cliente' | 'publico' | 'prestador' | 'admin'

export interface HelpArticle {
  id: string
  title: string
  summary: string
  category: string
  audiences: HelpAudience[]
  contexts: string[]
  steps?: string[]
  /** Motivos em destaque (cartões), mostrados antes dos passos. */
  reasons?: { heading: string; items: { title: string; text: string }[] }
  related?: string[]
}

export const helpArticles: HelpArticle[] = [
  {
    id: 'encontrar-prestador', title: 'Como encontrar um prestador', summary: 'Use a busca e os filtros para encontrar profissionais adequados ao que você precisa.', category: 'Encontrar ajuda', audiences: ['cliente', 'publico'], contexts: ['home', 'prestadores'],
    steps: ['Descreva o serviço que você procura na busca.', 'Escolha uma categoria ou região para refinar os resultados.', 'Abra um perfil para conhecer o trabalho, portfólio e avaliações do prestador.'], related: ['ler-perfil-publico', 'entrar-em-contato']
  },
  {
    id: 'ler-perfil-publico', title: 'Como consultar um perfil público', summary: 'Veja especialidades, fotos, avaliações e formas de contato antes de decidir.', category: 'Encontrar ajuda', audiences: ['cliente', 'publico'], contexts: ['perfil-publico'],
    steps: ['Confira a descrição e as especialidades do profissional.', 'Veja o portfólio e as avaliações de outros clientes. Se o profissional ainda não tiver fotos ou avaliações, a aba mostra um aviso — isso é normal para perfis novos.', 'Toque em "Chamar no WhatsApp" para falar diretamente com o prestador.'], related: ['entrar-em-contato', 'avaliar-servico']
  },
  {
    id: 'entrar-em-contato', title: 'Como entrar em contato', summary: 'O contato acontece pelo WhatsApp informado no perfil do prestador.', category: 'Contratar', audiences: ['cliente', 'publico'], contexts: ['perfil-publico'],
    steps: ['Abra o perfil do prestador escolhido.', 'Toque em "Chamar no WhatsApp" e diga o que você precisa.', 'Combine detalhes, prazo e valores diretamente com o profissional.']
  },
  {
    id: 'acompanhar-servico', title: 'Como acompanhar meus trabalhos', summary: 'A Área do cliente reúne todos os seus trabalhos: para aceitar, em andamento, para avaliar, concluídos e casos de garantia.', category: 'Meus trabalhos', audiences: ['cliente'], contexts: ['meus-servicos', 'dashboard', 'dashboard-cliente'],
    steps: ['Abra a Área do cliente e entre com a mesma conta Google que você usou ao abrir o link enviado pelo prestador.', 'Use os filtros (Todos, Para aceitar, Em andamento, Avaliar e Concluídos) para achar o trabalho. Garantia e Reclamação aparecem só quando há um caso aberto.', 'Toque no cartão do trabalho para aceitar, acompanhar o andamento, avaliar ou consultar uma garantia ou reclamação.'], related: ['status-do-trabalho', 'avaliar-servico', 'garantia']
  },
  {
    id: 'aceitar-trabalho', title: 'Como aceitar ou recusar um trabalho', summary: 'Quando o prestador registra um trabalho para você, ele só começa depois do seu aceite.', category: 'Meus trabalhos', audiences: ['cliente'], contexts: ['meus-servicos', 'dashboard-cliente'],
    steps: ['Abra o link que o prestador enviou e entre com sua conta Google. É ela que fica ligada a esse trabalho.', 'Confira os detalhes do trabalho antes de decidir. Você pode aceitar pelo WhatsApp ou direto na tela.', 'Toque em "Aceitar trabalho" para o prestador poder começar, ou em "Recusar trabalho" (o app pede uma confirmação antes e o prestador é avisado).', 'Depois de aceitar, você é levado ao acompanhamento e passa a ver as atualizações do prestador.', 'Se aparecer o aviso de que o trabalho está ligado a outra conta, entre com a conta que abriu o link.'], related: ['status-do-trabalho', 'acompanhar-atualizacoes']
  },
  {
    id: 'status-do-trabalho', title: 'O que significa cada situação do meu trabalho', summary: 'Entenda os nomes que aparecem nos cartões: Aguardando aceite, Em andamento, Avaliar agora, Concluído, Garantia e Reclamação.', category: 'Meus trabalhos', audiences: ['cliente'], contexts: ['meus-servicos', 'dashboard-cliente'],
    steps: ['Em preparo: o prestador ainda está montando o registro do trabalho.', 'Aguardando aceite: falta você aceitar para o prestador começar.', 'Em andamento: o prestador está executando e publicando atualizações.', 'Avaliar agora: o prestador terminou e falta a sua avaliação para concluir.', 'Concluído: o trabalho foi finalizado.', 'Garantia ou Reclamação: há um caso aberto sobre esse trabalho (o aviso laranja leva direto a ele).'], related: ['acompanhar-servico', 'garantia']
  },
  {
    id: 'acompanhar-atualizacoes', title: 'Como acompanhar atualizações, fotos e comentários', summary: 'Veja o andamento do trabalho na linha do tempo e participe da conversa em cada atualização publicada.', category: 'Acompanhamento', audiences: ['cliente'], contexts: ['acompanhamento', 'meus-servicos'],
    steps: ['Abra o acompanhamento pelo cartão do trabalho na Área do cliente.', 'Consulte as fotos e etapas publicadas pelo prestador na linha do tempo. Em trabalhos sem fotos, a linha do tempo mostra só aceite, execução e conclusão.', 'Toque em uma atualização para ler comentários ou enviar uma nova mensagem.'], related: ['avaliar-servico', 'garantia']
  },
  {
    id: 'avaliar-servico', title: 'Como avaliar um trabalho', summary: 'Quando o prestador termina, o trabalho fica marcado como "Avaliar agora". Sua avaliação ajuda outros clientes a escolher.', category: 'Meus trabalhos', audiences: ['cliente'], contexts: ['meus-servicos', 'avaliacao', 'acompanhamento', 'dashboard-cliente'],
    steps: ['Na Área do cliente, toque no aviso azul de avaliação ou no filtro "Avaliar".', 'Abra o trabalho e confira o resultado final nas fotos.', 'Escolha a nota, diga se indica o profissional e escreva um comentário honesto antes de enviar.'], related: ['status-do-trabalho', 'garantia']
  },
  {
    id: 'garantia', title: 'Como funciona a garantia ou reclamação', summary: 'Teve algum problema depois do trabalho? Registre o caso no acompanhamento e acompanhe a resposta do prestador.', category: 'Meus trabalhos', audiences: ['cliente'], contexts: ['meus-servicos', 'acompanhamento'],
    steps: ['Abra o trabalho na Área do cliente e vá até a seção Garantia (ou Reclamação, quando o prestador não oferece garantia).', 'Descreva o ocorrido e, quando for pedido, envie fotos para contextualizar o caso. Respeite o prazo mostrado na tela.', 'Acompanhe a resposta do prestador. Quando ele responder, o aviso laranja da Área do cliente muda para "Falta a sua resposta". Se ele oferecer um reparo, você pode aceitar ou recusar.', 'Quando o problema for resolvido, confirme a resolução. Se não foi, reabra o caso.', 'Se o prestador não responder no prazo, o caso é encerrado automaticamente como "sem resposta".', 'Depois que o caso for encerrado, o que foi escrito e a resposta do prestador podem aparecer no perfil público dele. Evite colocar telefone ou endereço no texto.'], related: ['status-do-trabalho', 'acompanhar-atualizacoes']
  },
  {
    id: 'minha-conta-cliente', title: 'Como atualizar meus dados e minha foto', summary: 'Na aba Meus dados você mantém nome, WhatsApp, endereço e foto atualizados.', category: 'Meus dados', audiences: ['cliente'], contexts: ['dashboard-cliente', 'perfil-cliente'],
    steps: ['Abra a Área do cliente e toque na aba Meus dados.', 'Para trocar a foto, toque no seu avatar no cartão de perfil (até 10 MB).', 'Atualize nome, WhatsApp (com DDD) e endereço e toque em Salvar alterações.', 'Se tentar sair com alterações não salvas, o app pergunta antes de descartar.'], related: ['conta-e-seguranca']
  },
  {
    id: 'responder-garantia', title: 'Como responder a uma garantia ou reclamação', summary: 'Quando um cliente abre um caso, você tem 5 dias úteis para responder. Também dá para oferecer reparo a uma avaliação negativa.', category: 'Garantia', audiences: ['prestador'], contexts: ['dashboard-prestador'],
    steps: ['Em Meus Trabalhos, o aviso laranja no topo mostra quantos casos esperam sua resposta e até quando. Toque nele para abrir o mais urgente.', 'Leia o problema descrito pelo cliente e veja as fotos, se houver.', 'Escreva o que você vai fazer em "Registrar proposta de solução". Só depois disso o cliente pode confirmar que resolveu ou reabrir o caso.', 'Se você não responder em 5 dias úteis, o caso é encerrado como "sem resposta" e isso aparece no seu perfil público.', 'Para oferecer reparo a uma avaliação negativa, abra o trabalho concluído e toque em "Oferecer reparo". Isso exige ter uma garantia configurada no seu perfil. O cliente decide se aceita; se confirmar que ficou resolvido, a avaliação passa a contar como 3 estrelas no seu ranking.'], related: ['avaliacoes-prestador', 'editar-perfil-prestador']
  },
  {
    id: 'editar-perfil-prestador', title: 'Como editar meu perfil profissional', summary: 'Mantenha seus dados, especialidades e formas de contato atualizados para aparecer melhor nas buscas.', category: 'Meu perfil', audiences: ['prestador'], contexts: ['dashboard-prestador'],
    steps: ['Abra a aba Dados Profissionais no painel.', 'Atualize sua descrição, localização, especialidades e WhatsApp.', 'Salve as alterações e confira como seu perfil aparece publicamente.'], related: ['portfolio-prestador', 'ativacao-perfil-prestador']
  },
  {
    id: 'portfolio-prestador', title: 'Como publicar projetos no portfólio', summary: 'Adicione fotos e informações de trabalhos realizados para apresentar sua experiência aos clientes.', category: 'Meu perfil', audiences: ['prestador'], contexts: ['dashboard-prestador'],
    steps: ['Acesse a aba Meus Trabalhos.', 'Envie fotos nítidas e escolha trabalhos que representem seu serviço.', 'Avise o cliente de que as fotos do serviço podem aparecer no seu portfólio público e evite mostrar rostos, documentos, placas e endereços completos.', 'Revise o conteúdo antes de publicar para manter seu portfólio atualizado.']
  },
  {
    id: 'avaliacoes-prestador', title: 'Como consultar minhas avaliações', summary: 'Acompanhe as avaliações recebidas dos clientes diretamente no seu painel profissional.', category: 'Meu perfil', audiences: ['prestador'], contexts: ['dashboard-prestador'],
    steps: ['Abra a aba Desempenho no painel e escolha a visão Avaliações.', 'Leia os comentários e confira sua nota geral.', 'Use os retornos para melhorar a comunicação e a qualidade dos serviços.']
  },
  {
    id: 'divulgacao-visao-geral', title: 'O que é a Central de divulgação', summary: 'Materiais prontos, gratuitos e com os dados do seu perfil, para você divulgar seu trabalho e levar clientes à sua vitrine.', category: 'Divulgação', audiences: ['prestador'], contexts: ['dashboard-prestador', 'divulgacao'],
    steps: ['Abra a aba Divulgação no painel. Ela fica liberada depois que o cadastro está completo e enquanto o perfil não está bloqueado.', 'Escolha o material: Cartão digital & WhatsApp, Adesivos & QR Code ou Links & mensagens.', 'Baixe a imagem, imprima ou copie o link e use onde seus clientes estão (cartão e mensagens têm botão para enviar direto pelo WhatsApp): WhatsApp, Instagram, veículo, cartão de visita.', 'Todo material aponta para o seu perfil público. Se você ainda não tem trabalhos concluídos, os materiais já funcionam e passam a mostrar suas fotos quando você registrar o primeiro. Se você atualizar o perfil e o portfólio, os próximos materiais já saem atualizados.'], related: ['divulgacao-cartao-digital', 'divulgacao-adesivos-qrcode', 'divulgacao-links-mensagens']
  },
  {
    id: 'divulgacao-cartao-digital', title: 'Como baixar o cartão digital para WhatsApp e redes sociais', summary: 'Gere uma imagem com a foto do seu trabalho mais recente, seu nome, categoria, cidade e o QR do seu perfil.', category: 'Divulgação', audiences: ['prestador'], contexts: ['divulgacao'],
    steps: ['Na aba Divulgação, abra Cartão digital & WhatsApp.', 'Escolha o formato: quadrado (feed), 4:3 ou Stories.', 'Toque em Baixar imagem e compartilhe pelo WhatsApp ou pelas redes sociais.', 'Se quiser só o endereço, use Copiar link do perfil.', 'O destaque da imagem é a foto final do projeto concluído mais recente. Publique trabalhos concluídos no portfólio para o cartão ficar mais forte.'], related: ['divulgacao-visao-geral', 'portfolio-prestador']
  },
  {
    id: 'divulgacao-adesivos-qrcode', title: 'Como imprimir adesivo e cartão de visita com QR Code', summary: 'Use o adesivo para veículo ou baú e o cartão de visita com QR Code que leva direto ao seu perfil.', category: 'Divulgação', audiences: ['prestador'], contexts: ['divulgacao'],
    steps: ['Na aba Divulgação, abra Adesivos & QR Code.', 'Escolha o adesivo de veículo/baú (30×15 cm) ou o cartão de visita (90×50 mm, frente e verso).', 'Toque em Baixar PNG para enviar à gráfica, ou em Imprimir / salvar PDF para imprimir no tamanho real.', 'Na janela de impressão, deixe a escala em 100% (tamanho real) para o QR Code não ficar distorcido.', 'A arte não inclui sangria: avise a gráfica ou peça para ela aplicar.', 'Antes de imprimir em quantidade, escaneie o QR Code com o celular para conferir se abre o seu perfil.'], related: ['divulgacao-visao-geral']
  },
  {
    id: 'divulgacao-links-mensagens', title: 'Como usar o link do perfil e as mensagens prontas de WhatsApp', summary: 'Copie o link da sua vitrine e use textos prontos para apresentar seu trabalho, responder quem te chamou e divulgar em grupos, e envie direto pelo WhatsApp.', category: 'Divulgação', audiences: ['prestador'], contexts: ['divulgacao'],
    steps: ['Na aba Divulgação, abra Links & mensagens.', 'Toque em Copiar link geral para pegar o endereço do seu perfil público.', 'Escolha uma mensagem: apresentação do perfil, responder quem te chamou, texto para Status/Stories ou grupos de bairro e condomínio.', 'Toque em Enviar no WhatsApp para escolher o contato e mandar na hora, ou em Copiar para colar onde quiser. Ajuste o texto ao seu jeito antes de enviar.', 'Respeite as regras de cada grupo antes de divulgar.'], related: ['divulgacao-visao-geral', 'avaliacoes-prestador']
  },
  {
    id: 'selo-cnpj-prestador', title: 'Por que mostrar meu CNPJ e como fazer', summary: 'É opcional e gratuito. O selo de CNPJ ativo dá ao cliente um motivo a mais para confiar em você antes de chamar.', category: 'Selos de confiança', audiences: ['prestador'], contexts: ['dashboard-prestador', 'dados-profissionais'],
    reasons: { heading: 'Por que vale a pena informar o CNPJ', items: MOTIVOS_CNPJ.map((m) => ({ title: m.titulo, text: m.texto })) },
    steps: ['Abra o painel, vá em Dados Profissionais e toque na aba CNPJ. Antes, salve a aba Meu perfil.', 'Digite o número do CNPJ (pode ter letras e números; a máscara aparece enquanto você digita) e toque em "Conferir meu CNPJ".', 'Consultamos os dados abertos da Receita Federal. Se o CNPJ estiver ativo e o seu nome (o do perfil ou o nome completo da sua conta) for igual à razão social, ao nome fantasia ou a um sócio, o selo é liberado na hora. No MEI, o nome costuma ser o seu próprio nome.', 'Se o CNPJ estiver ativo mas o nome não bater, o caso vai para a nossa equipe e aparece como "Em conferência". Volte à aba mais tarde para ver o resultado. Seu perfil continua normal na busca enquanto isso. Se a Receita mostrar o CNPJ como baixado, suspenso ou inapto, avisamos na hora: regularize a situação e informe o número de novo.', 'O selo vale por 35 dias e é renovado sozinho enquanto o CNPJ continuar ativo. Se a Receita deixar de mostrar o CNPJ como ativo, o selo é pausado e a aba CNPJ avisa para você regularizar a situação e informar o número de novo.', 'Para tirar o selo, use "Remover meu CNPJ" na mesma aba. Você pode informar este ou outro CNPJ quando quiser.'], related: ['selos-e-niveis-prestador']
  },
  {
    id: 'selos-e-niveis-prestador', title: 'Como ganhar selos e subir de nível', summary: 'Os selos mostram ao cliente o que foi conferido de verdade. Veja o que cada um pede e como chegar ao nível Prata.', category: 'Selos de confiança', audiences: ['prestador'], contexts: ['dados-profissionais'],
    steps: ['CNPJ ativo: conferido na Receita Federal (veja "Por que mostrar meu CNPJ e como fazer"). É a base do nível Bronze.', 'Experiência no PQF: 10 serviços concluídos aqui e avaliados por 10 clientes diferentes, cada avaliação com nota 3 ou mais. É calculado sozinho; avaliação anulada por uma garantia deixa de contar.', 'Tempo de CNPJ: aparece quando a abertura registrada na Receita tem 1 ano ou mais, e mostra a faixa de 1, 3 ou 5 anos. Precisa do CNPJ ativo.', 'Atividade compatível: aparece quando a atividade principal do CNPJ combina com a categoria do seu perfil. Se não combinar, nada muda para você: é só um selo a menos. Para algumas categorias ainda não sabemos qual atividade de CNPJ combina; nesse caso o painel avisa e você pode nos contar, pelo WhatsApp, qual código usa, para ajudar a melhorar a conferência.', 'Níveis: Bronze é o CNPJ ativo. Prata é o Bronze mais a Experiência no PQF. Novos selos e níveis poderão chegar no futuro.', 'Acompanhe o andamento na barra "Seus selos de confiança", no topo de Dados Profissionais. Nenhum selo muda a sua posição na busca: eles servem para o cliente confiar em você.'], related: ['selo-cnpj-prestador', 'avaliacoes-prestador']
  },
  {
    id: 'selos-no-perfil', title: 'O que significam os selos no perfil do profissional', summary: 'Os selos mostram o que o PQF conferiu. Eles ajudam na escolha, mas não substituem combinar tudo com o profissional.', category: 'Encontrar ajuda', audiences: ['cliente', 'publico'], contexts: ['perfil-publico'],
    steps: ['"CNPJ ativo": na data indicada, a Receita Federal mostrava o CNPJ do profissional como ativo. Não exibimos o número do CNPJ nem a razão social.', '"Experiência no PQF": o profissional tem 10 serviços concluídos aqui, avaliados por 10 clientes diferentes com nota 3 ou mais.', '"CNPJ aberto há mais de 1, 3 ou 5 anos": há quanto tempo a empresa existe, segundo a Receita.', '"Atividade compatível": a atividade registrada no CNPJ combina com o serviço que o profissional oferece.', 'Nível Bronze ou Prata: resume os selos. Bronze é o CNPJ ativo. Prata é o CNPJ ativo mais a experiência no PQF.', 'Quem não tem selo não é pior: o selo é opcional e há bons profissionais sem CNPJ. Olhe também as avaliações e o portfólio.', 'O selo não garante o resultado do serviço. Combine valores e prazos pelo WhatsApp e, se houver problema, use a garantia.'], related: ['ler-perfil-publico', 'garantia']
  },
  {
    id: 'ativacao-perfil-prestador', title: 'Ativação ou bloqueio do perfil', summary: 'Entenda o que acontece quando seu perfil está incompleto, em análise ou bloqueado pela moderação.', category: 'Conta', audiences: ['prestador'], contexts: ['dashboard-prestador'],
    steps: ['Complete os dados obrigatórios indicados na aba Dados Profissionais.', 'Aguarde a análise quando o perfil estiver em revisão.', 'Se houver bloqueio, leia o motivo informado e use o canal de suporte do painel para pedir esclarecimentos.']
  },
  {
    id: 'conta-e-seguranca', title: 'Conta, privacidade e segurança', summary: 'Mantenha seus dados atualizados e use somente os canais oficiais do projeto.', category: 'Conta', audiences: ['cliente', 'publico'], contexts: ['login', 'cadastro', 'perfil-cliente'],
    steps: ['Entre com seu e-mail para acessar a conta.', 'Use a recuperação de senha caso não consiga entrar.', 'Para ver e baixar uma cópia dos seus dados, use o link "ver e baixar seus dados" na aba Meus dados (ou a página Meus dados).', 'Para excluir a conta, siga o fluxo de confirmação e leia a política de privacidade.', 'Se aparecer em uma foto que não autorizou, use o botão de denúncia do perfil para pedir a remoção.']
  },
]

export function getHelpArticles(audience: HelpAudience, context?: string) {
  return helpArticles.filter((article) => article.audiences.includes(audience) && (!context || article.contexts.includes(context)))
}

export function findHelpArticle(id: string) { return helpArticles.find((article) => article.id === id) }

export function searchHelpArticles(query: string, audience: HelpAudience = 'cliente') {
  const normalized = query.trim().toLocaleLowerCase('pt-BR')
  return helpArticles.filter((article) => article.audiences.includes(audience) && (!normalized || [article.title, article.summary, article.category, ...(article.steps || []), ...(article.reasons?.items.flatMap((i) => [i.title, i.text]) || [])].join(' ').toLocaleLowerCase('pt-BR').includes(normalized)))
}

export const helpCategories = [...new Set(helpArticles.map((article) => article.category))]

export function helpAudienceLabel(audience: HelpAudience) { return audience === 'publico' ? 'Visitante' : audience === 'cliente' ? 'Cliente' : audience === 'prestador' ? 'Prestador' : 'Admin' }

// Conteúdo público e do cliente: a documentação técnica fica separada na área administrativa.
// Referência de manutenção: documentacao/docs/02-arquitetura.md#central-de-ajuda
