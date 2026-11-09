# PQF: plano de confiança e conformidade

Nov 9, 2026 · @Celio

## Objetivo e princípios

O PQF vai subir a barra de qualidade em quatro etapas, cada uma entregue como uma atualização própria, premiando com selos quem comprova mais e sem rebaixar quem está começando.

- **Entrada inclusiva:** o cadastro básico continua livre. Selos só premiam, nunca bloqueiam.
- **Selo honesto:** cada selo diz apenas o que foi verificado e quando (ex.: "CNPJ ativo, consultado em dd/mm").
- **Dados mínimos:** guardar o resultado da verificação, não o documento do prestador.
- **Automação com revisão humana:** consultas automáticas; aprovação manual onde há julgamento (conselhos, seguro, diplomas em papel).
- **Ordem das etapas:** 1) LGPD, 2) CNPJ, 3) formação e capacitação, 4) seguro.

## Ponto de partida

Grande parte do blueprint original já existe no Supabase do PQF, então o plano é acrescentar camadas e não recriar tabelas. O que falta é consentimento, direitos do titular, verificações e selos.

| Tema do blueprint | O que o PQF já tem | O que falta |
| --- | --- | --- |
| Lead e ciclo do serviço | `portfolio_projetos` (aceite, concluído, token de avaliação) e `cliques` com sessão anônima | Nada nesta frente |
| Avaliação e direito de resposta | `avaliacoes` com `resposta_prestador` | Nada nesta frente |
| Reputação mútua | `avaliacoes_clientes` (nota e motivos) | Nada nesta frente |
| Incidentes e disputas | `solicitacoes_garantia`, `contestacoes`, `denuncias` | Nada nesta frente |
| Curadoria e auditoria | `perfis_admin` (owner, moderator, editor) e `logs_atividades` | Fila de verificações |
| Perfil do prestador | `prestadores` (id numérico), com o boolean `verificado` sem critério documentado | Tabela de verificações e selos |
| Perfil do cliente | `profiles` (nome, endereço, WhatsApp) | Registro de consentimento |
| Privacidade | Sessão anônima em `visitas_perfil` e `cliques`, sem IP | Termos, direitos do titular, retenção, consentimento de fotos |

Observação: o SQL do blueprint original usa uma tabela `profiles` única com uuid. Ela não serve como está, porque no PQF os prestadores ficam em `prestadores` e `profiles` é de clientes.

## Estrutura comum das verificações

Uma única tabela, `prestador_verificacoes`, serve a CNPJ, formação, conselho e seguro. Ela nasce na Etapa 2 e é reaproveitada nas Etapas 3 e 4.

| Campo | Para que serve |
| --- | --- |
| `prestador_id` (bigint) | Liga ao prestador |
| `tipo` | `cnpj`, `formacao`, `conselho` ou `seguro` |
| `status` | `pendente`, `em_analise`, `aprovada`, `rejeitada` ou `expirada` |
| `dados` (jsonb) | Resumo do que foi conferido, sem o documento |
| `valido_ate` | Data de vencimento, para o job de expiração |
| `verificado_por`, `verificado_em` | Quem aprovou e quando (ligado a `perfis_admin`) |

Os selos são independentes (CNPJ, Formação, Seguro) e o nível do prestador é calculado a partir das verificações aprovadas, nunca editado à mão. Isso cobre casos que uma escada linear não cobre, como o eletricista com CNPJ e seguro, mas sem diploma. Decisão pendente: o boolean `verificado` de `prestadores` vira o nível Bronze ou é substituído.

## Etapa 1: LGPD completa

**Andamento (09/11/2026):** a fatia 1 (banco) está aplicada no Supabase e versionada em `supabase/migrations/20261109190000_lgpd_etapa1_estrutura.sql`. Também fechamos a RPC `verificar_usuario_existe`, que permitia descobrir quais e-mails têm conta (migration restritiva `20261109190100`, a aplicar após o deploy do app sem essa chamada). Fatia 2 (telas e aceite nos cadastros) e fatia 3 (textos legais) seguem pendentes. Retenção de IP e expiração dos backups aguardam a definição do prazo.

**Achados do levantamento:** 940 dos 955 prestadores vêm de curadoria pública (`origem_tipo`), então a base legal e o canal de saída são o item mais sensível. `perfis` é uma tabela legada, vazia e sem uso no código, mas com três policies de leitura pública que expõem `whatsapp` se um dia receber dados; vale remover. O Auth está com a proteção contra senhas vazadas desligada (configuração no painel do Supabase).

A primeira atualização deixa a plataforma em conformidade com a LGPD (lei brasileira, 13.709) antes de coletar qualquer dado novo. Boas práticas do GDPR europeu valem como referência, mas só se aplicam se houver atendimento a residentes na UE.

**Consentimento e documentos legais**

- [ ] Redigir Política de Privacidade e Termos de Uso (rascunho para revisão de advogado)
- [ ] Definir o contato do encarregado de dados e publicá-lo
- [x] Criar a tabela `consentimentos` (usuário, tipo, versão do documento, data, origem) — estrutura criada em 09/11 (migration `20261109190000`)
- [ ] Registrar o aceite de termos no cadastro de prestadores e clientes

**Direitos do titular**

- [x] Criar `solicitacoes_titular` (acesso, correção, exclusão, portabilidade, revogação) com prazo e status — criada com a RPC `registrar_solicitacao_titular` (aceita `anon`, 3 pedidos/hora por contato)
- [x] Criar função de anonimização (ex.: nome do cliente em avaliações) em vez de apagar registros ligados a garantias — `anonimizar_dados_titular`, só admin
- [ ] Tela ou formulário para o titular fazer a solicitação

**Dados de terceiros e retenção**

- [ ] Mapear dados pessoais: `cliente_nome` e `cliente_whatsapp` (projetos e orçamentos), endereço em `profiles`, `cliente_foto_url` em avaliações
- [ ] Definir prazos de retenção por tipo de dado
- [ ] Zerar `ip_address` em `logs_atividades` após o prazo de guarda (o Marco Civil exige seis meses para provedores de aplicação)
- [ ] Apagar ou dar prazo de expiração às tabelas `bkp_cliques_20261014` e `bkp_visitas_20261014`

**Fotos de pessoas**

- [x] Adicionar a `portfolio_fotos` os campos "contém pessoas" e "consentimento de terceiros confirmado" — campos e constraint criados; falta usar no upload (fatia 2)
- [ ] Termo de responsabilidade do prestador no upload
- [ ] Seleção manual de capa do portfólio

**Segurança e base legal**

- [ ] Revisar RLS de todas as tabelas e rodar os advisors de segurança do Supabase
- [ ] Conferir os valores de `origem_tipo` entre os 955 prestadores e documentar a base legal de quem não veio de cadastro direto, com opção de sair
- [ ] Revisar o texto das mensagens de ativação enviadas por WhatsApp

## Etapa 2: consulta de CNPJ

A segunda atualização cria o selo "CNPJ ativo" e a estrutura comum de verificações, que as Etapas 3 e 4 reaproveitam.

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
- [ ] Job mensal (pg\_cron) para reconsultar e rebaixar o selo de CNPJ suspenso
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

## Etapa 4: seguro de responsabilidade civil

A quarta atualização reaproveita a estrutura das etapas anteriores e complementa a garantia que o prestador já declara em `garantia_dias`. O selo diz só o que foi conferido, por exemplo "Seguro de responsabilidade civil informado, válido até dd/mm".

**Tarefas**

- [ ] Formulário de seguro (seguradora, número da apólice, cobertura, validade) e upload do comprovante em bucket privado
- [ ] Conferência manual do comprovante na fila de curadoria
- [ ] Guardar só os dados da apólice e a validade; apagar o arquivo após a aprovação
- [ ] Job agendado que avisa o prestador 30, 15 e 3 dias antes do vencimento
- [ ] Passar o status para `expirada` e retirar o selo quando a apólice vencer
- [ ] Selo de seguro no card e no perfil, com a data de validade
- [ ] Regra de nível: combinação dos selos de CNPJ, formação e seguro
- [ ] Definir se o nível mais alto (Diamante) influencia a ordem de exibição na vitrine

## Decisões em aberto e riscos

As decisões abaixo precisam de resposta antes ou durante as etapas indicadas.

- [ ] Etapa 1: quem será o encarregado de dados e qual advogado revisa os termos
- [ ] Etapa 1: base legal e opção de saída para prestadores que não vieram de cadastro direto
- [ ] Etapa 2: o boolean `verificado` vira o nível Bronze ou é substituído
- [ ] Etapa 2: fonte de consulta de CNPJ, gratuita com reserva ou API comercial em tempo real
- [ ] Etapa 3: quais categorias são regulamentadas e exigem conselho
- [ ] Etapa 4: o nível mais alto influencia a ordem de exibição na vitrine

**Riscos**

- Selo que promete mais do que foi verificado cria responsabilidade para a plataforma. Por isso cada selo tem texto restrito e data.
- A curadoria manual de conselhos, diplomas em papel e seguros cresce com o número de prestadores. Começar com poucas categorias e limite de volume.
- Documentos pessoais (diploma, apólice) elevam o risco de vazamento. A regra é guardar o resultado e apagar o arquivo.

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
