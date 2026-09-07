# Busca e listagem de prestadores

## Busca por serviço e cidade

A busca combina o serviço informado com a localização atual do usuário. Quando o termo é simples — por exemplo, `Massoterapia` — os resultados ficam restritos à cidade atual, como Londrina.

Uma cidade só substitui a localização atual quando é informada explicitamente na consulta, no formato `serviço em cidade`. Por exemplo, `Massoterapia em Maringá` pesquisa prestadores cuja cidade principal é Maringá.

A busca não usa `cidades_atendidas` para ampliar automaticamente os resultados. Esse campo não faz um prestador de outra cidade aparecer na cidade atual do usuário.

## Prioridade dos filtros

1. Cidade informada explicitamente no texto da busca.
2. Cidade escolhida manualmente nos filtros ou já definida na URL.
3. Cidade atual do usuário.

A cidade identificada no texto não deve alterar os filtros visuais de forma inesperada nem provocar navegação adicional enquanto o usuário digita. Nomes são comparados de forma normalizada, aceitando tanto `Londrina` quanto `Londrina - PR`.

## Exemplos

| Consulta | Resultado esperado |
| --- | --- |
| `Massoterapia` em Londrina | Prestadores cuja cidade principal é Londrina |
| Sugestão de `Massoterapia` em Londrina | Prestadores cuja cidade principal é Londrina |
| `Massoterapia em Maringá` | Prestadores cuja cidade principal é Maringá |
| Filtro manual para Maringá | Prestadores cuja cidade principal é Maringá |

## Implementação relacionada

- `app/page.tsx`
- `hooks/usePrestadores.ts`
- `hooks/useFiltrosParams.ts`
