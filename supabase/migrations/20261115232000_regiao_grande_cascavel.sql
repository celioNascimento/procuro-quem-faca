-- Completa a região "Grande Cascavel" com os 24 municípios da Região Metropolitana de Cascavel (PR).
-- Já aplicada em produção; este arquivo é o registro no repositório.
-- Fonte: Agência Estadual de Notícias do Paraná (PDUI da Região Metropolitana de Cascavel).
-- Idempotente: não duplica cidade que já existe no estado.
insert into public.cidades (nome, estado_sigla, regiao_id, ativa)
select v.nome, 'PR', r.id, true
from public.regioes r
cross join (values
  ('Anahy'), ('Boa Vista da Aparecida'), ('Braganey'), ('Cafelândia'), ('Campo Bonito'),
  ('Capitão Leônidas Marques'), ('Catanduvas'), ('Céu Azul'), ('Corbélia'), ('Diamante do Sul'),
  ('Formosa do Oeste'), ('Guaraniaçu'), ('Ibema'), ('Iguatu'), ('Iracema do Oeste'), ('Jesuítas'),
  ('Lindoeste'), ('Matelândia'), ('Santa Lúcia'), ('Santa Tereza do Oeste'),
  ('Três Barras do Paraná'), ('Vera Cruz do Oeste')
) as v(nome)
where r.nome = 'Grande Cascavel' and r.estado_sigla = 'PR'
  and not exists (select 1 from public.cidades c where c.estado_sigla = 'PR' and lower(c.nome) = lower(v.nome));
