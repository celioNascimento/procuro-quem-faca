# 22. Perfil de exemplo (divulgação)

Objetivo: uma página quase institucional que mostra ao profissional o potencial do PQF como cartão de visitas, portfólio e endereço profissional online. Não precisa ser realista; precisa ser bonita e clara. Aparece só por link direto (fora da busca, do sitemap e do Google) e leva a faixa "Perfil de exemplo" no topo. Implementação técnica: ver doc 20, seção "Perfil de exemplo".

## Conta (o dono cria pelo site, em produção, depois do release dos selos)
- E-mail: `procuroquemfaca+exemplo@gmail.com` (cai na mesma caixa; evita misturar com uma possível conta de admin). Se o e-mail principal não tiver conta, pode usá-lo.
- Telefone/WhatsApp: 43 99973 9597 (a plataforma). Foto de perfil: a logo.
- Categoria: **Marido de Aluguel** (a mais genérica; cada perfil tem uma categoria só). Cidade: Londrina.
- Nome sugerido: "PQF Exemplo · Serviços em geral". Slug resultante será o link de divulgação.
- Depois de criado, o admin liga a marca: `update public.prestadores set exemplo = true where slug = '<slug>';`

## Bio sugerida
"Este é um perfil de exemplo do Procuro Quem Faça. Aqui você vê como o seu portfólio pode ficar: fotos dos seus trabalhos, avaliações de clientes e contato direto pelo WhatsApp. Crie o seu em poucos minutos."

## Trabalhos (8) com 2 a 3 imagens cada, todas geradas por IA e marcadas como ilustrativas
Em cada trabalho, usar na descrição o final "Imagem ilustrativa." (ou na legenda da foto). Cuidados para a IA: sem rostos nítidos, sem marcas/logos de terceiros, sem texto dentro da imagem.

| # | Ofício | Título do trabalho | Descrição curta | Prompt de imagem (ideia) |
|---|---|---|---|---|
| 1 | Pedreiro | Reforma de varanda com revestimento | Demolição, regularização do piso e assentamento de porcelanato. | Varanda residencial reformada, piso de porcelanato claro, acabamento limpo, luz natural, foto realista |
| 2 | Eletricista | Troca de quadro de luz e iluminação | Quadro novo com disjuntores identificados e spots de LED na sala. | Quadro de distribuição elétrica organizado com disjuntores etiquetados, e sala com spots de LED acesos |
| 3 | Manicure | Alongamento e esmaltação em gel | Unhas em gel nude com detalhes delicados. | Mãos femininas com unhas em gel nude, fundo neutro, iluminação suave de estúdio |
| 4 | Doces | Mesa de doces para aniversário | Brigadeiros, bolo decorado e docinhos finos. | Mesa de festa com bolo decorado, brigadeiros gourmet e docinhos, decoração pastel |
| 5 | Pintor | Pintura de sala e cozinha | Preparação das paredes, massa corrida e duas demãos de tinta. | Sala de estar recém pintada em tom claro, sem móveis em excesso, boa luz |
| 6 | Encanador | Troca de torneiras e reparo de vazamento | Instalação de metais novos e vedação sem quebrar a parede. | Pia de cozinha moderna com torneira nova, bancada limpa |
| 7 | Jardineiro | Jardim frontal com paisagismo simples | Gramado, canteiros e iluminação de jardim. | Jardim frontal residencial bem cuidado, canteiros com flores, gramado verde |
| 8 | Marido de Aluguel | Montagem de móveis e instalação de prateleiras | Guarda-roupa montado e prateleiras niveladas. | Quarto com guarda-roupa recém montado e prateleiras na parede, ambiente organizado |

Dica: os 8 trabalhos devem ficar como "finalizados", com 2 a 3 fotos e legenda. Não criar avaliações nem notas fictícias (evita avaliação enganosa e não contamina os selos/nível).

## Checklist
1. Gerar as imagens (IA) e separar por trabalho.
2. Criar a conta pelo site e preencher o perfil.
3. Cadastrar os 8 trabalhos pelo painel (aba Meus Trabalhos).
4. Pedir ao admin para ligar `exemplo` (SQL acima) e conferir: fora da busca, faixa visível, `noindex`.
5. Usar o link nas abordagens e na tela de boas-vindas do profissional.
