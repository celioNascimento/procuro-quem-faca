# 22. Perfil de exemplo (divulgação)

Objetivo: uma página quase institucional que mostra ao profissional o potencial do PQF como cartão de visitas, portfólio e endereço profissional online. Não precisa ser realista; precisa ser bonita e clara. Aparece só por link direto (fora da busca, do sitemap e do Google) e leva a faixa "Perfil de exemplo" no topo. Implementação técnica: ver doc 20, seção "Perfil de exemplo".

## Decisões do dono (20/11/2026)
- Conta: **procuroquemfaca@gmail.com** (conferido em produção: conta criada em 11/08, não é admin, sem perfil de prestador). Telefone/WhatsApp: **43 99973 9597** (a plataforma).
- **Poucos trabalhos, não todos os ofícios:** 6 trabalhos escolhidos para mostrar variedade de ofícios e de formatos de portfólio.
- Imagens geradas por IA pelo dono, todas marcadas como ilustrativas. Sem avaliações nem comentários fictícios.
- **Ordem:** o dono cadastra o perfil pelo site; logo em seguida o admin liga a marca `exemplo`. O cadastro sempre coloca o perfil no ar (`status = 'ativo'`), então ele fica na busca por alguns minutos, sem trabalhos e fora do feed, até a marca ser ligada. Só depois sobem as imagens e os trabalhos.

## Conta
- Foto de perfil: a logo.
- Categoria: **Marido de Aluguel** (a mais genérica; cada perfil tem uma categoria só, mas os trabalhos podem ser de qualquer ofício). Cidade: Londrina.
- Nome: "PQF Exemplo · Serviços em geral". O slug resultante é o link de divulgação.
- Depois de criado, o admin liga a marca: `update public.prestadores set exemplo = true where slug = '<slug>';` (só admin/SQL consegue; o dono do perfil não).

## Bio
"Este é um perfil de exemplo do Procuro Quem Faça. Aqui você vê como o seu portfólio pode ficar: fotos dos seus trabalhos, avaliações de clientes e contato direto pelo WhatsApp. Crie o seu em poucos minutos."

## Trabalhos (6), 13 imagens no total
Em cada trabalho, terminar a descrição com "Imagem ilustrativa.". Cuidados para a IA: sem rostos nítidos, sem marcas/logos de terceiros, sem texto dentro da imagem. Dica para "antes/depois": gerar o "antes" primeiro e pedir ao gerador uma variação do mesmo ambiente já reformado (imagem para imagem), para o cenário parecer o mesmo.

| # | Ofício | Título | Descrição curta | Formato (o que mostra) | Fotos |
|---|---|---|---|---|---|
| 1 | Pedreiro | Reforma de varanda com revestimento | Demolição, regularização do piso e assentamento de porcelanato. Imagem ilustrativa. | Concluído, com garantia (90 dias) | Antes, Durante, Depois |
| 2 | Eletricista | Troca de quadro de luz e iluminação | Quadro novo com disjuntores identificados e spots de LED na sala. Imagem ilustrativa. | Concluído, com garantia (180 dias) | Antes, Depois |
| 3 | Manicure | Alongamento e esmaltação em gel | Unhas em gel nude com detalhes delicados. Imagem ilustrativa. | Concluído, sem garantia, só "Depois" | Depois, Depois |
| 4 | Doces | Mesa de doces para aniversário | Brigadeiros, bolo decorado e docinhos finos. Imagem ilustrativa. | Concluído, sem garantia | Durante, Depois |
| 5 | Pintor | Pintura de sala e cozinha | Preparação das paredes, massa corrida e duas demãos de tinta. Imagem ilustrativa. | **Em andamento** | Antes, Durante |
| 6 | Marido de Aluguel | Montagem de móveis e prateleiras | Guarda-roupa montado e prateleiras niveladas. Imagem ilustrativa. | Concluído, sem garantia | Antes, Depois |

## Pedidos de imagem (copiar e colar)
Sufixo em todos: "foto realista, luz natural, sem pessoas, sem texto, sem logotipos".

1. **Pedreiro, Antes:** varanda residencial com piso de cimento queimado rachado e rodapé descascado, sem móveis.
   **Durante:** a mesma varanda com piso regularizado, argamassa sendo espalhada e algumas peças de porcelanato claro já assentadas, ferramentas de pedreiro no canto.
   **Depois:** a mesma varanda com porcelanato claro assentado, rejunte limpo e acabamento perfeito.
2. **Eletricista, Antes:** quadro de distribuição elétrica antigo, aberto, com fios soltos e sem identificação.
   **Depois:** quadro novo organizado com disjuntores etiquetados e, ao lado, sala com spots de LED acesos.
3. **Manicure, Depois (foto 1):** mãos femininas com unhas em gel nude e detalhes delicados, fundo neutro, luz suave de estúdio.
   **Depois (foto 2):** close das unhas em gel nude sobre superfície clara, com um pequeno vaso de flor ao fundo.
4. **Doces, Durante:** bancada com brigadeiros sendo enrolados e forminhas separadas, ingredientes organizados.
   **Depois:** mesa de festa com bolo decorado, brigadeiros gourmet e docinhos finos, decoração em tons pastel.
5. **Pintor, Antes:** sala de estar com paredes manchadas e com pequenos buracos, móveis cobertos com lona.
   **Durante:** a mesma sala com metade da parede já pintada em tom claro, fita de proteção nos rodapés, rolo e lata de tinta no chão.
6. **Marido de Aluguel, Antes:** quarto com caixas de guarda-roupa desmontado e painéis no chão, paredes lisas sem prateleiras.
   **Depois:** o mesmo quarto com guarda-roupa montado e prateleiras niveladas na parede, ambiente organizado.

Não criar avaliações nem notas fictícias (evita avaliação enganosa e não contamina os selos/nível).

## Checklist
1. O dono entra com procuroquemfaca@gmail.com e cadastra o perfil pelo site (nome, WhatsApp, categoria, cidade, foto, bio).
2. O dono avisa o nome/endereço do perfil; o admin liga `exemplo` e confere: fora da busca, faixa visível, `noindex`, fora do sitemap.
3. O dono gera as 13 imagens e separa por trabalho.
4. O dono cadastra os 6 trabalhos pelo painel (aba Meus Trabalhos), cada um com o formato da tabela (o 5 fica "em andamento").
5. Usar o link nas abordagens (plano de divulgação) e na tela de boas-vindas do profissional.
