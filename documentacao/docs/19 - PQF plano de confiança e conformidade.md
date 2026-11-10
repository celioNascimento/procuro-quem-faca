# PQF: plano de confiança e conformidade

Nov 9, 2026 · atualizado em Nov 10, 2026 · @Celio

## Objetivo e princípios

O PQF vai subir a barra de qualidade em seis etapas, cada uma entregue como uma atualização própria, premiando com selos quem comprova mais e sem rebaixar quem está começando. O PQF é uma vitrine de contato entre clientes e prestadores. Não vende serviços de seguro nem de capacitação.

- **Entrada inclusiva:** o cadastro básico continua livre. Selos só premiam, nunca bloqueiam.
- **Selo honesto:** cada selo diz apenas o que foi verificado e quando (ex.: "CNPJ ativo, consultado em dd/mm").
- **Dados mínimos:** guardar o resultado da verificação, não o documento do prestador.
- **Automação com revisão humana:** consultas automáticas; aprovação manual onde há julgamento (conselhos, seguro, diplomas em papel, CND).
- **Consentimento ativo:** uso de conteúdo de terceiros (fotos, projetos, nomes) só com aceite explícito e revogável.
- **Independência:** verificação, anúncio e selo são funções separadas (ver regras abaixo).
- **Ordem das etapas:** 1) LGPD, 2) CNPJ, 3) formação e capacitação, 4) seguro, 5) camada corporativa (B2B), 6) feed de projetos concluídos.

## Regras de independência

Estas regras valem desde já, independentemente de haver ou não parceiros comerciais.

1. **Quem anuncia não verifica.** Seguradoras e escolas que anunciem no PQF não conferem apólices nem formações e não participam da fila de curadoria. A verificação é feita pela equipe da plataforma, com base nas regras deste plano.
2. **Quem paga não ganha selo nem posição.** Nenhum valor pago, direto ou indireto (anúncio, comissão, patrocínio, indicação), altera o status de verificação de prestador ou parceiro, nem a ordem de exibição no feed ou na vitrine.
3. **Quem recebe comissão não emite nem valida nada.** Se houver comissão sobre seguro ou curso, ela fica fora do fluxo de verificação e exige análise jurídica própria, incluindo a possível exigência de registro como intermediário de seguros na SUSEP.
4. **Capacitação é conteúdo orientativo.** Não há venda de certificado nem patrocínio de escolas. Se um curso for indicado, a indicação é editorial, sem remuneração, e isso é declarado.
5. **Transparência ao usuário.** Anúncios são sinalizados como "Publicidade" e separados visualmente dos selos e dos resultados. Nenhum anúncio aparece no card do prestador como se fosse verificação.
6. **Registro de conflitos.** Quando um parceiro comercial também for prestador verificado, o caso é registrado em `prestador_verificacoes` com a indicação do conflito, e a análise passa por um revisor sem relação com o parceiro.
7. **Anúncio não compra selo.** A home permanece limpa, com busca e acesso ao painel do profissional. Anúncios ficam em posições definidas nas páginas internas.

## Ponto de partida

Grande parte do blueprint original já existe no Supabase do PQF, então o plano é acrescentar camadas e não recriar tabelas. O que falta é consentimento, direitos do titular, verificações, selos e o feed.

| Tema do blueprint | O que o PQF já tem | O que falta |
| --- | --- | --- |
| Lead e ciclo do serviço | `portfolio_projetos` (aceite, concluído, token de avaliação) e `cliques` com sessão anônima | Nada nesta frente |
| Avaliação e direito de resposta | `avaliacoes` com `resposta_prestador` e fluxo `/avaliar/[token]` | Aceite de publicação no feed (Etapa 6) |
| Reputação mútua | `avaliacoes_clientes` (nota e motivos) | Nada nesta frente |
| Incidentes e disputas | `solicitacoes_garantia`, `contestacoes`, `denuncias` | Nada nesta frente |
| Curadoria e auditoria | `perfis_admin` (owner, moderator, editor) e `logs_atividades` | Fila de verificações |
| Perfil do prestador | `prestadores` (id numérico), com o boolean `verificado` sem critério documentado | Tabela de verificações e selos |
| Perfil do cliente | `profiles` (nome, endereço, WhatsApp) | Registro de consentimento |
| Privacidade | Sessão anônima em `visitas_perfil` e `cliques`, sem IP | Termos, direitos do titular, retenção, consentimento de fotos |
| Anúncios | Sistema de anunciantes e posições por praça, admin-only | Regras de independência e sinalização de "Publicidade" |

Observação: o SQL do blueprint original usa uma tabela `profiles` única com uuid. Ela não serve como está, porque no PQF os prestadores ficam em `prestadores` e `profiles` é de clientes.

## Estrutura comum das verificações

Uma única tabela, `prestador_verificacoes`, serve a CNPJ, formação, conselho, seguro e CND. Ela nasce na Etapa 2 e é reaproveitada nas Etapas 3, 4 e 5.

| Campo | Para que serve |
| --- | --- |
| `prestador_id` (bigint) | Liga ao prestador |
| `tipo` | `cnpj`, `formacao`, `conselho`, `seguro` ou `cnd` |
| `status` | `pendente`, `em_analise`, `aprovada`, `rejeitada` ou `expirada` |
| `dados` (jsonb) | Resumo do que foi conferido, sem o documento |
| `valido_ate` | Data de vencimento, para o job de expiração |
| `pais` | País da verificação (preparado para expansão futura) |
| `fonte_validacao` | Origem da conferência (ex.: BrasilAPI, e-MEC, Receita via código de autenticidade, curadoria manual) |
| `verificado_por`, `verificado_em` | Quem aprovou e quando (ligado a `perfis_admin`) |
| `conflito_parceiro` | Indica se o prestador tem relação com parceiro comercial (regra 6) |

Os selos são independentes (CNPJ, Formação, Seguro, CND) e o nível do prestador é calculado a partir das verificações aprovadas, nunca editado à mão. Isso cobre casos que uma escada linear não cobre, como o eletricista com CNPJ e seguro, mas sem diploma. Decisão pendente: o boolean `verificado` de `prestadores` vira o nível Bronze ou é substituído.

## Etapa 1: LGPD completa

A primeira atualização deixa a plataforma em conformidade com a LGPD (lei brasileira, 13.709) antes de coletar qualquer dado novo. Boas práticas do GDPR europeu podem ser adotadas como padrão de referência interno. Elas não substituem a LGPD e só se tornam obrigatórias se houver atendimento a residentes na UE.

**Consentimento e documentos legais**

- [ ] Redigir Política de Privacidade e Termos de Uso (rascunho para revisão de advogado)
- [ ] Definir o contato do encarregado de dados e publicá-lo
- [ ] Criar a tabela `consentimentos` (usuário, tipo, versão do documento, data, origem, objeto consentido, como `feed_projeto` com o id do projeto)
- [ ] Registrar o aceite de termos no cadastro de prestadores e clientes

**Direitos do titular**

- [ ] Criar `solicitacoes_titular` (acesso, correção, exclusão, portabilidade, revogação) com prazo e status
- [ ] Criar função de anonimização (ex.: nome do cliente em avaliações) em vez de apagar registros ligados a garantias
- [ ] Tela ou formulário para o titular fazer a solicitação
- [ ] Permitir a revogação do consentimento de feed a qualquer momento, com remoção imediata do projeto do feed

**Dados de terceiros e retenção**

- [ ] Mapear dados pessoais: `cliente_nome` e `cliente_whatsapp` (projetos e orçamentos), endereço em `profiles`, `cliente_foto_url` em avaliações
- [ ] Definir prazos de retenção por tipo de dado, parametrizados por configuração e não por código
- [ ] Zerar `ip_address` em `logs_atividades` após o prazo de guarda (o Marco Civil exige seis meses para provedores de aplicação)
- [ ] Apagar ou dar prazo de expiração às tabelas `bkp_cliques_20261014` e `bkp_visitas_20261014`

**Fotos de pessoas**

- [ ] Adicionar a `portfolio_fotos` os campos "contém pessoas" e "consentimento de terceiros confirmado"
- [ ] Termo de responsabilidade do prestador no upload
- [ ] Seleção manual de capa do portfólio
- [ ] Fotos com pessoas identificáveis não entram no feed sem revisão manual

**Segurança e base legal**

- [ ] Revisar RLS de todas as tabelas e rodar os advisors de segurança do Supabase
- [ ] Conferir os valores de `origem_tipo` entre os 955 prestadores e documentar a base legal de quem não veio de cadastro direto, com opção de sair
- [ ] Revisar o texto das mensagens de ativação enviadas por WhatsApp
- [ ] Verificar a região do projeto Supabase e listar os serviços que recebem dados pessoais (Vercel, WhatsApp/Meta, demais). Não bloqueia o lançamento no Brasil; a análise de transferência internacional vira prioridade na expansão

**Estrutura de base para expansão (sem custo)**

- [ ] Registrar o `pais` e a `fonte_validacao` em toda verificação
- [ ] Manter o registro de atividades de tratamento (quais dados, para quê, por quanto tempo, com quem são compartilhados) em documento simples, atualizado a cada nova funcionalidade

## Etapa 2: consulta de CNPJ

A segunda atualização cria o selo "CNPJ ativo" e a estrutura comum de verificações, que as Etapas 3 a 5 reaproveitam.

**Pontos de atenção**

- **Formato novo:** desde 31/07/2026 a Receita emite CNPJ alfanumérico, com 14 caracteres. Os CNPJs antigos continuam válidos, então os dois formatos convivem. A validação precisa aceitar letras (dígito verificador pelo módulo 11), e a Receita oferece um simulador oficial para testes.
- **Fonte dos dados:** as consultas gratuitas (BrasilAPI e espelhos como minhareceita) usam os dados abertos da Receita, atualizados mensalmente e com limite de taxa. Consulta em tempo real existe em APIs comerciais, como a CNPJá.
- **Limite do selo:** CNPJ ativo prova que a empresa existe, não que quem se cadastrou é o dono. O texto do selo deve ser "CNPJ ativo, consultado em dd/mm".

**Tarefas**

- [ ] Criar `prestador_verificacoes` (estrutura comum) e a fila de revisão no painel admin
- [ ] Criar `prestador_cnpj` (CNPJ único, razão social, situação, CNAE, data da consulta)
- [ ] Função de validação de CNPJ com suporte a alfanumérico, testada com o simulador da Receita
- [ ] Edge Function de consulta (BrasilAPI com segundo espelho de reserva), com cache
- [ ] Regra de vínculo: MEI compara nome do titular com o do perfil; divergências vão para revisão manual
- [ ] Job mensal (pg_cron) para reconsultar e rebaixar o selo de CNPJ suspenso
- [ ] Selo "CNPJ ativo" no card e no perfil público, com a data da consulta
- [ ] Cálculo do nível a partir das verificações aprovadas
- [ ] Definir o destino do boolean `verificado`
- [ ] Comunicar aos prestadores que o selo é opcional e não afeta quem não o tem

## Etapa 3: formação e capacitação

A terceira atualização começa pelo que o MEC reconhece e sobe em três degraus de força. O e-MEC confirma a instituição e o curso, mas não que a pessoa se formou; isso só se confirma pelo diploma.

| Degrau | O que prova | Como verificar |
| --- | --- | --- |
| 1. Formação declarada | Curso e instituição regulares no MEC | Consulta automática à base do e-MEC (dados abertos de cursos de graduação, especialização e instituições) |
| 2. Formação comprovada | A pessoa concluiu o curso | Diploma digital validado no verificador do MEC (XML ou código); diploma em papel ou certificado, por curadoria manual |
| 3. Registro em conselho | Habilitação legal (CREA, CREF, CRM etc.) | Upload, aprovação manual e consulta pública do conselho |

Cursos técnicos e livres ficam fora do e-MEC de graduação. O MEC também publica dados do SISTEC, mas esses casos entram por certificado com curadoria e com selo de menor peso.

**Capacitação orientativa (conteúdo do PQF, sem venda):** guias sobre abrir MEI, regularizar conselho de classe e entender o seguro de responsabilidade civil. Não há certificado vendido nem parceria remunerada com escolas (regra 4).

**Tarefas**

- [ ] Importar os dados abertos do e-MEC (instituições e cursos) para tabelas de apoio, com rotina de atualização
- [ ] Formulário de formação (curso, instituição, ano) com busca na base importada
- [ ] Selo "Formação em instituição reconhecida pelo MEC (declarada)"
- [ ] Upload de diploma ou certificado em bucket privado
- [ ] Validação de diploma digital pelo verificador do MEC
- [ ] Apagar o arquivo depois da aprovação e guardar só resultado, data e hash (o diploma tem CPF e filiação)
- [ ] Marcar em `categorias` quais são regulamentadas e qual conselho se aplica
- [ ] Fluxo de registro em conselho na fila de curadoria, com link para a consulta do conselho
- [ ] Selos "Formação comprovada" e "Profissional regulamentado" no card e no perfil
- [ ] Atualizar o texto de cada selo para dizer só o que foi verificado
- [ ] Publicar os guias orientativos de capacitação, sem patrocínio

## Etapa 4: seguro de responsabilidade civil

A quarta atualização reaproveita a estrutura das etapas anteriores e complementa a garantia que o prestador já declara em `garantia_dias`. O PQF não vende seguro nem recebe comissão por ele. A plataforma apenas verifica a apólice que o prestador já tem. O selo diz só o que foi conferido, por exemplo "Seguro de responsabilidade civil informado, válido até dd/mm".

**Tarefas**

- [ ] Formulário de seguro (seguradora, número da apólice, cobertura, validade) e upload do comprovante em bucket privado
- [ ] Conferência manual do comprovante na fila de curadoria
- [ ] Guardar só os dados da apólice e a validade; apagar o arquivo após a aprovação
- [ ] Job agendado que avisa o prestador 30, 15 e 3 dias antes do vencimento
- [ ] Passar o status para `expirada` e retirar o selo quando a apólice vencer
- [ ] Selo de seguro no card e no perfil, com a data de validade
- [ ] Regra de nível: combinação dos selos de CNPJ, formação e seguro
- [ ] Definir se o nível mais alto influencia a ordem de exibição na vitrine (a ordem nunca é vendida, regra 2)

## Etapa 5: camada corporativa (B2B)

A quinta atualização cria um selo voltado a empresas que contratam prestadores, o "Corporate Ready", com o objetivo de mostrar que a vitrine é confiável para contratos maiores. O nível mais alto da pirâmide (Diamante) recebe esse selo como complemento. Ele não é obrigatório e não afeta quem não o tem.

Esta etapa não cria venda de serviços. Ela organiza e apresenta o que já foi verificado nas etapas anteriores.

**Selo Corporate Ready**

- Exige selos aprovados de CNPJ, formação ou conselho e seguro, conforme a regra de nível da Etapa 4.
- Acrescenta a verificação de CND (Certidão Negativa de Débitos), registrada em `prestador_verificacoes` com `tipo = 'cnd'`.
- Não cria colunas novas em `profiles` nem edita o nível à mão. O estado é derivado das verificações aprovadas.

**CND: conferência manual por upload**

- O prestador envia o PDF. A curadoria confere o código de autenticidade no site oficial da Receita e registra resultado e validade.
- O arquivo é apagado depois da conferência.
- O selo diz "CND federal conferida em dd/mm, válida até dd/mm". A validade deve ser confirmada na regra vigente antes da implementação.

**Dossiê de verificação**

- Botão "Baixar dossiê de verificação" na página pública do prestador, visível para contas corporativas ou sob demanda.
- O dossiê reúne as verificações aprovadas, com data da consulta e fonte de cada uma. Não traz assinatura nem carimbo de conformidade da plataforma, porque isso sugeriria uma garantia que o PQF não dá (regra "selo honesto").
- Texto fixo no dossiê: "Dados verificados pela plataforma em dd/mm. Não constitui parecer jurídico nem garantia de regularidade."

**Filtro para empresas**

- Filtro "Fornecedores Corporate Ready" na vitrine, disponível para contas corporativas.

**Capacitação e cultura (gradual)**

- Campanhas dentro da plataforma incentivando a regularização de MEI, conselho e seguro, com os guias da Etapa 3. Sem patrocínio e sem gamificação que premie quem paga.

**Tarefas**

- [ ] Definir a regra de nível Corporate Ready a partir das verificações existentes
- [ ] Criar o tipo `cnd` em `prestador_verificacoes` e a fila de conferência manual
- [ ] Gerar o dossiê a partir das verificações aprovadas, sem assinatura da plataforma
- [ ] Filtro "Corporate Ready" na vitrine, com perfil de conta corporativa
- [ ] Selo "Corporate Ready" no card e no perfil público, com a data da verificação

**Fora do escopo**

- Dados trabalhistas de empregados dos prestadores. A base legal não está clara, o risco de LGPD é alto e o ganho para a vitrine é pequeno. Não há prazo previsto para reavaliar.

## Etapa 6: feed de projetos concluídos

A sexta atualização cria uma etapa de descoberta. O cliente pode ver projetos já concluídos por prestadores antes de buscar um profissional, escolher uma ideia e seguir para o perfil de quem executou. O feed usa dados de `portfolio_projetos` e as fotos do portfólio.

**Como o projeto entra no feed (dois controles independentes)**

1. **Cliente autoriza (consentimento).** Na avaliação (fluxo `/avaliar/[token]`), o cliente marca uma autorização separada da nota e do comentário. A opção vem desmarcada, não condiciona a avaliação e declara a finalidade: exibir o projeto como divulgação do prestador. O aceite é registrado em `consentimentos` com tipo `feed_projeto`, versão do texto, data e id do projeto.
2. **Prestador mantém ou retira (curadoria).** Com o aceite do cliente, o projeto entra no feed ativado por padrão. O prestador pode desativar a exibição de cada projeto a qualquer momento, por um controle "Mostrar no feed". Desativar não apaga nada e não altera a avaliação.

**Regras que decorrem dessa combinação**

- Sem aceite do cliente, o projeto nunca entra no feed, mesmo que o prestador queira.
- Se o cliente revogar, o projeto sai do feed imediatamente, independentemente do controle do prestador. Um projeto revogado não volta ao feed sem novo aceite.
- O prestador pode desativar um projeto, mas o cliente não precisa aprovar a desativação.
- O feed é conteúdo orgânico, não anúncio. Por isso não recebe o rótulo de "Publicidade". Se algum dia houver impulsionamento pago, ele entra na regra 5 e não altera a ordem por critério de pagamento (regra 2).

**Revogação**

- O cliente pode revogar a autorização a qualquer momento, pela própria área do cliente ou por solicitação ao titular.
- A revogação não apaga a avaliação, que continua no perfil do prestador sob a regra de anonimização já prevista.

**Privacidade no feed**

- O nome do cliente não aparece. Usa-se apenas o bairro ou a região de Londrina, nunca o endereço.
- Fotos com pessoas identificáveis exigem revisão manual antes de entrar no feed.
- Dados como WhatsApp e endereço nunca aparecem no card do feed.

**Como se encaixa no fluxo**

1. O cliente descobre ideias no feed, filtrando por categoria e região.
2. Um projeto leva ao perfil do prestador, com selos verificados e avaliações.
3. Dali, o cliente segue para o contato já existente.

O feed não cria um canal novo de contato nem altera o ciclo de orçamento.

**Tarefas**

- [ ] Adicionar à tela de avaliação a opção de autorização de feed, desmarcada por padrão, com a finalidade declarada
- [ ] Gravar o aceite em `consentimentos` com tipo `feed_projeto` e o id do projeto
- [ ] Criar o campo de exibição no feed em `portfolio_projetos`, ativado automaticamente com aceite e desativável pelo prestador
- [ ] Criar o controle "Mostrar no feed" no painel do prestador, por projeto
- [ ] Criar a visualização do feed com filtros por categoria e região
- [ ] Remover do feed projetos revogados ou sem aceite, com job de verificação
- [ ] Revisão manual de fotos com pessoas antes da publicação
- [ ] Opção de revogação na área do cliente
- [ ] Testar que nenhum dado pessoal aparece no card do feed (nome, endereço, WhatsApp)

## Decisões tomadas

- **Feed:** publicação só com aceite ativo do cliente, dado na avaliação. Após o aceite, o projeto entra ativado por padrão e o prestador pode desativar por projeto.
- **CND:** conferência manual por upload, sem consulta automatizada no lançamento.
- **Dados trabalhistas:** fora da plataforma.
- **Região do Supabase:** não bloqueia o lançamento no Brasil. Um banco único atende agora; a decisão de bancos por região fica para a expansão.
- **Ordem de exibição:** nunca vendida, nem no feed nem na vitrine.

## Decisões em aberto e riscos

As decisões abaixo precisam de resposta antes ou durante as etapas indicadas.

- [ ] Etapa 1: quem será o encarregado de dados e qual advogado revisa os termos
- [ ] Etapa 1: base legal e opção de saída para prestadores que não vieram de cadastro direto
- [ ] Etapa 1: verificar a região do Supabase e listar serviços com dados pessoais (prioridade baixa no Brasil; alta na expansão)
- [ ] Etapa 2: o boolean `verificado` vira o nível Bronze ou é substituído
- [ ] Etapa 2: fonte de consulta de CNPJ, gratuita com reserva ou API comercial em tempo real
- [ ] Etapa 3: quais categorias são regulamentadas e exigem conselho
- [ ] Etapa 4: o nível mais alto influencia a ordem de exibição na vitrine
- [ ] Etapa 4 e 5: consultar advogado sobre intermediação de seguros antes de qualquer receita relacionada a seguro
- [ ] Etapa 6: texto jurídico do aceite de feed, com finalidade declarada, e consulta ao advogado sobre o uso de fotos de obras
- [ ] Anúncios: seguradoras e escolas podem anunciar? Se sim, a regra 6 entra em vigor com revisor independente
- [ ] Expansão futura (EUA, imigrantes brasileiros): critérios de verificação próprios, residência de dados e bancos por região, quando a etapa começar

**Riscos**

- Selo que promete mais do que foi verificado cria responsabilidade para a plataforma. Por isso cada selo tem texto restrito e data.
- A curadoria manual de conselhos, diplomas em papel, seguros e CNDs cresce com o número de prestadores. Começar com poucas categorias e limite de volume.
- Documentos pessoais (diploma, apólice, CND) elevam o risco de vazamento. A regra é guardar o resultado e apagar o arquivo.
- Anúncios de parceiros que também são verificados criam conflito de interesse. A separação das regras 1 a 3 e a regra 6 reduzem esse risco.
- Dossiê com aparência de parecer jurídico pode gerar expectativa indevida. O texto fixo e a ausência de assinatura da plataforma reduzem esse risco.
- Fotos de obras podem mostrar pessoas, endereços e objetos pessoais. A autorização explícita do cliente, a revisão manual e o bairro no lugar do endereço reduzem esse risco.
- Feed com exibição padrão pode levar prestadores a publicar projetos sem perceber o que mostram. O aviso ao prestador antes da primeira publicação e o controle de desativação reduzem esse risco.

## Fontes

- [CNPJ alfanumérico: o que muda](https://tecnoblog.net/noticias/cnpj-com-letras-e-numeros-comeca-a-valer-veja-o-que-muda/)
- [Cronograma da implantação do CNPJ alfanumérico](https://movimentoeconomico.com.br/economia/energia/geracao/2026/07/25/cnpj-alfanumerico-saiba-o-que-muda-para-empresas-contadores-e-desenvolvedores/)
- [Simulador da Receita e adaptação de sistemas](https://simplifique.contmatic.com.br/blogs/cnpj-alfanumerico-o-que-e-e-o-que-muda-2026)
- [Dados abertos do CNPJ via minhareceita](https://apify.com/kman-br/cnpj-lote)
- [Consulta via BrasilAPI e limites](https://apify.com/cloway/cnpj-lookup)
- [API comercial CNPJá](https://cnpja.com/api)
- [Visão pública do e-MEC](https://wp.ufpel.edu.br/cpi/files/2022/10/Manual-Visao-Publica-Sistema-e-MEC-Informacoes-sobre-Cursos-de-Graduacao-e-de-Instituicoes.pdf)
- [Dados abertos do MEC](https://www.gov.br/mec/pt-br/acesso-a-informacao/dados-abertos/demanda_1804_RelatriodeacompanhamentodoPDA2024.pdf)
- [Verificação de diploma digital](https://wp.ufpel.edu.br/cra/verificacao-de-autenticidade-de-diploma/)
- [Diploma digital e diplomas em papel](https://tribunadoplanalto.com.br/diploma-digital-passa-a-ser-obrigatorio-no-ensino-superior-brasileiro-a-partir-de-julho/)

A estrutura de tabelas descrita neste plano foi levantada no Supabase do PQF em 09/11/2026.
