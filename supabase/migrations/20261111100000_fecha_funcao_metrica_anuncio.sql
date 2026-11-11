-- JÁ APLICADO NO BANCO em 11/11/2026 (arquivo para versionar). Idempotente.
-- registrar_metrica_anuncio não é chamada por nenhum código do PQF (o app usa incrementar_metrica_anuncio,
-- só no servidor). Estava aberta ao público e aceitava custo e sessão vindos de fora, o que permitia inflar
-- impressões, cliques e custo dos anúncios. Mantida no banco, mas só o service_role executa.
revoke all on function public.registrar_metrica_anuncio(uuid, uuid, text, uuid, numeric) from public, anon, authenticated;
grant execute on function public.registrar_metrica_anuncio(uuid, uuid, text, uuid, numeric) to service_role;
