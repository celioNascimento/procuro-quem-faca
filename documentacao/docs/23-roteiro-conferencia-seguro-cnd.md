# Roteiro de conferência: seguro (Ouro) e CND (Diamante)

Para quem aprova em **Admin → Verificações → aba "Seguro e CND"**. A mesma lista aparece na tela como caixas de marcação: o botão **Aprovar só libera com tudo marcado** e com a data informada. Rejeitar exige só o motivo.

## Decisões de política (19/11)
- **Titular do seguro:** o segurado tem de ser o **mesmo CNPJ aprovado no perfil** (a tela mostra o CNPJ e a razão social do perfil, para comparar). Apólice só em CPF não vale.
- **Cobertura:** não há valor mínimo. Basta ser seguro de **responsabilidade civil (RC)** válido. O selo diz apenas "apólice conferida pela equipe do PQF"; não afirma valor nem cobertura.
- **CND:** vale a **CND** e também a **CPEND** (certidão positiva com efeitos de negativa), que tem o mesmo efeito legal. Certidão apenas positiva não vale. Validade: **180 dias da emissão** (Portaria Conjunta RFB/PGFN 1.751/2014).
- O PQF **só verifica** o que o prestador já tem. Não vende, não indica e não ganha por seguro.
- Sem CNPJ no perfil não dá para conferir o titular: **rejeite** com o motivo "cadastre e confirme o CNPJ primeiro".

## Vale para todas as categorias
Seguro e CND não dependem da categoria (ao contrário da "Atividade compatível", que usa o CNAE). Qualquer prestador com CNPJ aprovado pode ter Ouro e Diamante, de pedreiro a confeiteira. Não há tabela de categorias a manter. O que muda é só o quanto cada profissional já tem um seguro contratado: o PQF não vende nem indica, só confere.

## Seguro (5 itens)
1. O segurado na apólice é o CNPJ / razão social mostrado na tela.
2. É apólice de responsabilidade civil (RC).
3. Está dentro da vigência hoje. Digite no campo a **data de término que consta no documento** (não a que o prestador digitou).
4. Seguradora e número da apólice conferem com o que o prestador informou.
5. Documento legível e completo.

## CND (5 itens)
1. O CNPJ da certidão é o mostrado na tela.
2. É CND ou CPEND.
3. Digite a **data de emissão** que consta na certidão (o sistema soma 180 dias).
4. **Confirme o código de controle no site da Receita Federal** (a autenticidade só se prova assim).
5. Documento legível e completo.

## Quando rejeitar (e o que escrever)
Sempre com motivo claro, em linguagem simples: o prestador lê o motivo na própria aba e pode reenviar. Exemplos: "O segurado é outro CNPJ", "Arquivo ilegível, envie uma foto mais nítida", "A apólice está vencida", "Certidão apenas positiva". Dúvida de autenticidade: rejeite e peça um novo envio.

## O que o sistema faz depois
- Aprovado: o arquivo é **apagado**; ficam só o resumo e a validade. O nível sobe se os selos anteriores estão em dia (Ouro exige Prata; Diamante exige Ouro).
- Vencido: o selo sai sozinho e o prestador é avisado por e-mail 30, 15 e 3 dias antes.
- Cada decisão vai para o log de atividades (inclui quais itens foram marcados).
- Renovação: o prestador pode reenviar nos últimos 30 dias; recusa de renovação não derruba o selo vigente.

## Limites conhecidos
Não há consulta automática do código de controle da CND nem de apólice na seguradora: a conferência de autenticidade é humana. Integrar a validação da CND é uma melhoria possível.

## Textos para o público (ajuda dentro do app)
Os textos que o prestador e o cliente leem estão em `lib/help/help-content.ts`: `selo-seguro-prestador`, `selo-cnd-prestador`, `selos-e-niveis-prestador` (prestador, aba CNPJ/Seguro/CND) e `selos-no-perfil` (cliente, perfil público). Se a política deste roteiro mudar (titular, cobertura, CPEND), atualize esses artigos junto; há testes que garantem as mensagens principais.
