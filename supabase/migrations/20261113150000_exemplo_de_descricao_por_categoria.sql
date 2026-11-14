-- Exemplo de descrição por categoria.
--
-- Na tela de novo trabalho, o campo "Depois" (descrição da foto do resultado) mostra uma sugestão no
-- tom do ofício de cada prestador: um eletricista vê um exemplo de eletricista, quem faz doces vê um
-- exemplo de doces. O texto mora na própria categoria e é editado em /admin/habilidades.
--
-- REGRA DO CATÁLOGO: toda categoria nova precisa de `exemplo_descricao` (uma frase curta do que foi
-- feito, no tom do ofício). O formulário de nova categoria do admin exige o campo. Categoria sem
-- exemplo não quebra nada: a tela mostra uma frase neutra ("Conte em uma frase o que foi feito.").
--
-- Também libera a edição de categorias para administradores (antes só havia política de inserção).

alter table public.categorias add column if not exists exemplo_descricao text;

update public.categorias c
   set exemplo_descricao = v.exemplo
  from (values
    ('cabeleireiro',            'Corte e coloração em tom mel, com acabamento em escova.'),
    ('esteticista',             'Limpeza de pele profunda com hidratação, em sessão de 1 hora.'),
    ('manicure',                'Alongamento em gel com esmaltação em tom nude.'),
    ('ar-condicionado',         'Instalação de split 12.000 BTUs, com suporte e dreno.'),
    ('calheiro',                'Troca de 12 metros de calha, com vedação nas emendas.'),
    ('eletricista',             'Troca da fiação do quadro e instalação de disjuntor novo.'),
    ('encanador',               'Conserto de vazamento no banheiro e troca do registro.'),
    ('gesseiro',                'Forro de gesso rebaixado na sala, com sanca iluminada.'),
    ('pedreiro',                'Construção de muro de 10 metros, com reboco e acabamento.'),
    ('pintor',                  'Pintura da sala e dos quartos em duas demãos, com massa corrida.'),
    ('diarista',                'Limpeza completa do apartamento, com vidros e cozinha.'),
    ('jardineiro',              'Poda das árvores e plantio de grama em 40 m².'),
    ('marido-de-aluguel',       'Instalação de prateleiras e troca de chuveiro.'),
    ('celular-e-tablet',        'Troca de tela do celular, com teste de todas as funções.'),
    ('eletrodomesticos',        'Conserto da máquina de lavar, com troca da bomba de drenagem.'),
    ('informatica',             'Formatação do notebook e instalação dos programas.'),
    ('fisioterapeuta',          'Sessão de reabilitação com exercícios de fortalecimento e mobilidade.'),
    ('massoterapia',            'Massagem relaxante de 1 hora com óleos essenciais.'),
    ('nutricionista',           'Plano alimentar montado para a rotina do cliente.'),
    ('personal-trainer',        'Treino de força em 3 sessões por semana.'),
    ('aulas-de-idiomas',        'Aulas de inglês para conversação, com material próprio.'),
    ('marketing-digital',       'Criação do perfil e de 12 posts mensais para a loja.'),
    ('reforco-escolar',         'Reforço de matemática com exercícios e simulados.'),
    ('decoracao-de-festas',     'Decoração de aniversário infantil com balões e painel.'),
    ('doces-e-confeitaria',     'Bolo de dois andares com recheio de brigadeiro para 40 pessoas.'),
    ('fotografo-e-filmagem',    'Cobertura de aniversário, com 150 fotos editadas.'),
    ('papelaria-personalizada', 'Kit de festa com convites, tags e topo de bolo personalizados.'),
    ('salgados-e-buffet',       'Cento de salgados variados para festa de 30 convidados.')
  ) as v(slug, exemplo)
 where c.slug = v.slug and c.exemplo_descricao is null;

drop policy if exists "admins podem atualizar categorias" on public.categorias;
create policy "admins podem atualizar categorias" on public.categorias
  for update to authenticated
  using (exists (select 1 from public.perfis_admin where perfis_admin.user_id = (select auth.uid())))
  with check (exists (select 1 from public.perfis_admin where perfis_admin.user_id = (select auth.uid())));
