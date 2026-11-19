'use client'

import type { ReactNode } from 'react'
import Link from 'next/link'
import { useVoltar } from '@/hooks/useVoltar'
import { CONTROLADOR, DATA_ATUALIZACAO_PRIVACIDADE } from '@/config/controlador'

function Secao({ titulo, children }: { titulo: string; children: ReactNode }) {
  return (
    <section>
      <h2 className="mb-3 text-xl font-bold text-slate-800">{titulo}</h2>
      {children}
    </section>
  )
}

function Destaque({ children }: { children: ReactNode }) {
  return <strong className="text-slate-700">{children}</strong>
}

export default function Privacidade() {
  const voltar = useVoltar('/')
  const { nome, razaoSocial, cnpj, emailPrivacidade, prazoRespostaDias } = CONTROLADOR
  const temEmpresa = Boolean(razaoSocial && cnpj)

  return (
    <main className="min-h-screen bg-slate-50 p-6 text-slate-800 md:p-20">
      <div className="mx-auto max-w-3xl rounded-[3rem] border border-slate-100 bg-white p-8 shadow-sm md:p-16">
        <button
          onClick={voltar}
          className="group mb-10 flex items-center gap-2 text-sm font-bold text-blue-600 hover:underline"
        >
          <span className="transition-transform group-hover:-translate-x-1">←</span> Voltar
        </button>

        <h1 className="mb-8 text-3xl font-black text-slate-900 md:text-4xl">Política de Privacidade</h1>

        <div className="space-y-8 leading-relaxed text-slate-600">
          <Secao titulo="1. Escopo">
            <p>
              Esta política explica como o PQF trata dados usados para conectar clientes e prestadores, manter contas, documentar projetos, exibir perfis públicos e operar os recursos de segurança e administração da plataforma, em conformidade com a Lei Geral de Proteção de Dados (Lei nº 13.709/2018).
            </p>
          </Secao>

          <Secao titulo="2. Quem é o responsável e como falar com a gente">
            <div className="space-y-3">
              <p>
                <Destaque>Controlador dos dados.</Destaque>{' '}
                {temEmpresa
                  ? `${razaoSocial}, CNPJ ${cnpj}, responsável pelo PQF (Procuro Quem Faça).`
                  : `${nome}, pessoa física responsável pelo PQF (Procuro Quem Faça). Quando o PQF for constituído como empresa, esta seção será atualizada com a razão social e o CNPJ.`}
              </p>
              <p>
                <Destaque>Canal de privacidade.</Destaque> O contato do encarregado pelo tratamento de dados pessoais é{' '}
                <a href={`mailto:${emailPrivacidade}`} className="font-bold text-blue-600 hover:underline">
                  {emailPrivacidade}
                </a>
                . Use esse e-mail para qualquer dúvida ou pedido sobre seus dados.
              </p>
            </div>
          </Secao>

          <Secao titulo="3. Dados coletados">
            <div className="space-y-3">
              <p>
                <Destaque>Fornecidos por você:</Destaque> nome, e-mail, telefone ou WhatsApp, cidade, região, categoria, habilidades, biografia, dados de acesso e informações do perfil, incluindo, se você quiser, o usuário do seu Instagram (campo opcional). No login com Google, recebemos os dados básicos da conta autorizados por você.
              </p>
              <p>
                <Destaque>Imagens e conteúdo:</Destaque> foto de perfil, sessão de fotos, fotos e comentários de projetos, foto e nome do cliente em avaliações, evidências de garantia ou reclamação, solicitações e denúncias.
              </p>
              <p>
                <Destaque>Coletados pelo uso:</Destaque> cidade escolhida ou detectada, identificador de sessão, registros de acesso (com a identificação da conta quando você está logado), buscas, visitas a perfis, compartilhamentos, cliques no botão de contato do WhatsApp e outras interações. Com seu consentimento, também coletamos estatísticas de navegação.
              </p>
              <p>
                <Destaque>De fontes públicas:</Destaque> alguns perfis foram criados pelo PQF a partir de informações profissionais divulgadas publicamente pelo próprio profissional. Veja a seção 4.
              </p>
            </div>
          </Secao>

          <Secao titulo="4. Perfis criados a partir de informações públicas">
            <div className="space-y-3">
              <p>
                <Destaque>O que é.</Destaque> Para que a plataforma ajude clientes a encontrar profissionais da região desde o início, o PQF criou perfis de profissionais que ainda não se cadastraram. Esses perfis foram montados com informações de contato profissional que o próprio profissional divulga publicamente em anúncios na internet, como anúncios do Google.
              </p>
              <p>
                <Destaque>Quais dados.</Destaque> Nome (ou nome do negócio), número de WhatsApp de contato profissional, categoria e descrição do serviço, cidade e, em alguns casos, bairro e cidades atendidas. Nesses perfis não coletamos e-mail, documentos, endereço completo, fotos nem dados pessoais sensíveis.
              </p>
              <p>
                <Destaque>Para quê e com que base legal.</Destaque> Usamos esses dados para permitir que clientes encontrem e contatem o profissional. A base legal é o legítimo interesse (LGPD, art. 7º, IX), considerando que se trata de contato profissional já divulgado com a finalidade de ser encontrado por clientes. Tratamos apenas o necessário para essa finalidade. Esse tratamento não depende de cadastro nem de aceite, e o profissional pode se opor a ele a qualquer momento.
              </p>
              <p>
                <Destaque>Seus direitos como titular desse perfil.</Destaque> Você pode assumir o perfil, corrigir os dados ou pedir a exclusão. O PQF envia um link pessoal para o WhatsApp do próprio perfil: quem recebe o link pode assumir ou excluir o perfil, sem precisar de cadastro para excluir. Se você não recebeu o link, escreva para{' '}
                <a href={`mailto:${emailPrivacidade}`} className="font-bold text-blue-600 hover:underline">
                  {emailPrivacidade}
                </a>{' '}
                informando o nome do perfil e o WhatsApp cadastrado nele, para que possamos confirmar que o perfil é seu. Você também pode fazer o pedido pelo{' '}
                <Link href="/titular" className="font-bold text-blue-600 hover:underline">formulário do titular</Link>.
              </p>
              <p>
                <Destaque>O que a exclusão faz.</Destaque> O perfil e os dados ligados a ele são apagados. Mantemos apenas registros anônimos, sem nome, foto, texto ou qualquer vínculo com você, de avaliações já feitas. A existência de um perfil criado pelo PQF não significa que o profissional tenha aderido à plataforma.
              </p>
            </div>
          </Secao>

          <Secao titulo="5. Como os dados são usados">
            <p>
              Os dados são usados para criar e proteger contas, concluir o cadastro de prestadores, permitir busca e contato, montar perfis e portfólios, acompanhar projetos por links exclusivos, processar avaliações e garantias, responder denúncias, medir o desempenho dos perfis (como visitas e cliques) para os próprios prestadores, administrar a plataforma e melhorar sua segurança e funcionamento. Tratamos os dados conforme a finalidade: execução das funcionalidades que você usa, cumprimento de obrigações legais, legítimo interesse na exibição de perfis profissionais públicos, na segurança e na prevenção de fraudes e abusos e, quando exigido, seu consentimento, como nas estatísticas de navegação e na localização.
            </p>
          </Secao>

          <Secao titulo="6. Imagens e fotografias">
            <div className="space-y-3">
              <p>
                <Destaque>Onde ficam.</Destaque> As imagens são armazenadas em serviço de Storage. Fotos de perfil, da sessão de fotos e do portfólio ficam em área pública: qualquer pessoa que tenha o endereço do arquivo consegue abri-lo, e elas aparecem no perfil público. Evidências de garantia ou reclamação ficam em área privada, acessível às partes do caso e à moderação por sessão e permissão. Quando um caso é encerrado como resolvido, as fotos de resolução podem ser copiadas para a área pública e exibidas no perfil do prestador; as fotos que documentam o problema permanecem privadas.
              </p>
              <p>
                <Destaque>Pessoas e bens nas imagens.</Destaque> Fotos de serviços podem mostrar ambientes, imóveis, veículos, objetos e, às vezes, pessoas. Quem envia a imagem é responsável por ter autorização das pessoas identificáveis nela. Se você aparece em uma imagem ou teve seu imóvel ou bem fotografado e quer que ela seja ocultada ou removida, use a função de denúncia do perfil ou escreva para{' '}
                <a href={`mailto:${emailPrivacidade}`} className="font-bold text-blue-600 hover:underline">
                  {emailPrivacidade}
                </a>
                .
              </p>
              <p>
                <Destaque>Metadados.</Destaque> O PQF armazena as imagens como são enviadas e não remove automaticamente os metadados do arquivo (como data, modelo do aparelho e, se o celular estiver configurado para isso, localização). Antes de enviar, recomendamos desativar a gravação de localização na câmera ou remover esses metadados.
              </p>
              <p>
                <Destaque>Nome e foto na avaliação.</Destaque> O nome e a foto que o cliente informa ao avaliar podem ser exibidos no perfil público do prestador avaliado.
              </p>
              <p>
                <Destaque>Uso e remoção.</Destaque> Usamos as imagens para operar as funcionalidades da plataforma e para segurança e moderação; não as vendemos nem as usamos para marketing de terceiros. Ao substituir a foto de perfil, o PQF remove o arquivo anterior do armazenamento. Cópias técnicas e registros que precisem ser mantidos seguem o descrito na seção 9.
              </p>
            </div>
          </Secao>

          <Secao titulo="7. Dados públicos e compartilhamento">
            <p>
              Quando o prestador publica ou mantém um perfil ativo, informações profissionais escolhidas no cadastro podem ficar visíveis na busca e no perfil público, incluindo nome, cidade, categoria, biografia, habilidades, fotos, portfólio, avaliações e formas de contato, como o WhatsApp e, se você informar, o seu Instagram (o link leva ao seu perfil na rede social, que tem política própria). Fotos e dados de projetos só são exibidos conforme o fluxo e as permissões aplicáveis. O link exclusivo de acompanhamento dá acesso ao projeto a quem o receber e não deve ser compartilhado. Não vendemos dados pessoais e não compartilhamos informações para marketing de terceiros. Compartilhamos dados apenas com os provedores necessários para operar a plataforma (como hospedagem, autenticação, armazenamento, geocodificação e estatísticas, descritos nas seções 8 e 9), com autoridades quando houver obrigação legal e com a moderação para tratar denúncias.
            </p>
          </Secao>

          <Secao titulo="8. Autenticação, cookies, localização e armazenamento">
            <div className="space-y-3">
              <p>
                <Destaque>Autenticação.</Destaque> Usamos o Supabase Auth para login por e-mail e senha ou Google, recuperação de senha e manutenção segura da sessão.
              </p>
              <p>
                <Destaque>Cookies e armazenamento local.</Destaque> Usamos cookies essenciais para manter a sessão e lembrar a cidade escolhida (por cerca de 30 dias) e um cookie de 24 horas para contar uma sessão de acesso uma única vez. Também guardamos no seu navegador a informação de que você aceitou o aviso de cookies. As estatísticas de navegação feitas por serviço de análise (PostHog) ficam desativadas até você aceitar o aviso de cookies.
              </p>
              <p>
                <Destaque>Localização.</Destaque> O PQF só pede a localização do seu aparelho quando você toca em “Usar minha localização” na lista de resultados, e o navegador ainda pede a sua permissão. Se você permitir, as coordenadas são enviadas ao serviço de geocodificação OpenStreetMap (Nominatim) apenas para identificar a cidade. O PQF guarda somente a cidade (por cerca de 30 dias), não as coordenadas. Se você preferir não permitir, é só escolher a cidade nos filtros da busca; você também pode escolher “Agora não” e o convite não aparece de novo por 30 dias.
              </p>
              <p>
                <Destaque>Armazenamento.</Destaque> Fotos e evidências são armazenadas em serviços de Storage com regras de acesso; registros privados de projeto, garantia e administração dependem da sessão e das permissões do usuário.
              </p>
            </div>
          </Secao>

          <Secao titulo="9. Segurança e retenção">
            <p>
              Aplicamos controle de acesso por sessão, políticas de segurança no banco, validação de permissões e registros de atividades para proteger a plataforma. Mantemos dados pelo período necessário para operar os recursos, cumprir obrigações legais, resolver disputas e preservar a segurança. Quando um perfil ou uma conta é excluído, apagamos os dados ligados a ele. Podem permanecer, de forma anônima ou limitada, logs técnicos e administrativos e registros ligados a avaliações, garantias e denúncias, quando forem necessários para auditoria, defesa em disputas ou prevenção de abuso.
            </p>
          </Secao>

          <Secao titulo="10. Seus direitos e como exercê-los">
            <div className="space-y-3">
              <p>
                Nos termos da LGPD, você pode pedir confirmação de que tratamos seus dados, acesso, correção, anonimização, bloqueio ou eliminação de dados desnecessários ou tratados em desacordo com a lei, portabilidade, informações sobre compartilhamento, a revogação do consentimento e a oposição a um tratamento baseado em legítimo interesse.
              </p>
              <p>
                <Destaque>Como pedir.</Destaque> Se você tem conta, pode atualizar os dados pelos painéis e solicitar a exclusão da conta pelo fluxo de confirmação. Se o seu perfil foi criado pelo PQF, use o link pessoal enviado ao WhatsApp do perfil (seção 4). Em qualquer caso, você também pode escrever para{' '}
                <a href={`mailto:${emailPrivacidade}`} className="font-bold text-blue-600 hover:underline">
                  {emailPrivacidade}
                </a>
                {' '}ou usar o{' '}
                <Link href="/titular" className="font-bold text-blue-600 hover:underline">formulário do titular</Link>
                . Para sua segurança, podemos pedir informações que confirmem que você é o titular antes de atender o pedido.
              </p>
              <p>
                <Destaque>Prazo.</Destaque> Respondemos aos pedidos em até {prazoRespostaDias} dias. A exclusão pode estar sujeita à preservação de registros exigidos por lei ou necessários para segurança, nos termos da seção 9. Você também pode apresentar reclamação à Autoridade Nacional de Proteção de Dados (ANPD).
              </p>
            </div>
          </Secao>

          <Secao titulo="11. Selos de confiança: CNPJ, seguro e CND">
            <div className="space-y-3">
              <p>
                Esta seção vale para o prestador que pede selos de confiança. É opcional: sem pedido, nada disso é tratado.
              </p>
              <p>
                <Destaque>Quais dados.</Destaque> CNPJ informado; dados abertos da Receita Federal sobre esse CNPJ (situação cadastral, razão social, nome fantasia, data de abertura, atividades registradas e, para conferir se o nome do perfil confere, os nomes dos sócios, que não são exibidos); no seguro, o nome da seguradora, o número e a validade da apólice e o arquivo do comprovante; na CND, o arquivo da certidão e a data de emissão. Em CNPJ de MEI, o nome da empresa pode ser o nome da própria pessoa.
              </p>
              <p>
                <Destaque>Para quê e base legal.</Destaque> Conferir os dados para exibir os selos no perfil, a pedido do próprio prestador (consentimento, LGPD art. 7º, I, e execução do serviço solicitado, art. 7º, V). Os dados da Receita são públicos; ainda assim, usamos só o necessário para o selo. A aprovação do selo de CNPJ pode ser automática quando o nome confere; em caso de dúvida, uma pessoa da equipe revisa. Você pode pedir a revisão por uma pessoa de qualquer decisão automatizada (art. 20).
              </p>
              <p>
                <Destaque>Quem vê e onde ficam.</Destaque> Os comprovantes ficam em área privada, sem endereço público, e só a equipe autorizada os abre, por links temporários. O perfil público mostra apenas o selo e a data de conferência ou validade: nunca o número do CNPJ, a razão social, a seguradora, o número da apólice ou o arquivo. A consulta à Receita fica em cache por até 24 horas.
              </p>
              <p>
                <Destaque>Por quanto tempo.</Destaque> O arquivo do comprovante é apagado assim que a equipe decide o pedido; se ninguém decidir em 60 dias, é apagado automaticamente e o prestador pode enviar de novo; também é apagado se a conta for excluída. Depois da conferência guardamos só o resumo (por exemplo, seguradora, número e validade da apólice, ou data de emissão da CND), a validade e o registro da decisão, enquanto o perfil existir, e o registro de atividades conforme a seção 9.
              </p>
              <p>
                <Destaque>Seus direitos.</Destaque> Você pode remover o CNPJ e o selo pelo painel a qualquer momento ou pedir a exclusão desses dados pelos canais da seção 10. Sem os selos, o perfil continua funcionando normalmente.
              </p>
            </div>
          </Secao>

          <Secao titulo="12. Feed de trabalhos, curtidas e seguidores">
            <div className="space-y-3">
              <p>
                <Destaque>O que é tratado.</Destaque> No feed público, mostramos fotos, título, descrição, categoria e cidade de trabalhos concluídos, com o nome do prestador. Também guardamos o aceite do cliente ao aviso do feed (data e versão do aviso), as curtidas que você dá (qual trabalho e quando), os trabalhos que você salva (qual e quando) e os prestadores que você segue (qual e desde quando).
              </p>
              <p>
                <Destaque>Para quê e base legal.</Destaque> Divulgar o trabalho do prestador e permitir que você acompanhe prestadores de que gosta. O trabalho só entra no feed com o aceite do cliente, que pode retirá-lo quando quiser, em Meus serviços (consentimento, LGPD art. 7º, I; a retirada vale para os próximos usos). Curtir, salvar e seguir são ações que você escolhe fazer, para executar o recurso que usa (art. 7º, V).
              </p>
              <p>
                <Destaque>O que nunca aparece.</Destaque> Nome, telefone e endereço do cliente não aparecem no feed. A lista de quem você segue e a de trabalhos que você salvou são visíveis só para você. O prestador vê apenas o total de curtidas e de seguidores, sem saber quem são, e não sabe quem salvou seus trabalhos.
              </p>
              <p>
                <Destaque>Fotos e terceiros.</Destaque> As regras de fotos e de pessoas nas imagens da seção 6 valem também no feed. Fotos do feed ficam na área pública e podem ser copiadas por terceiros fora do controle do PQF.
              </p>
              <p>
                <Destaque>Seus direitos.</Destaque> Você pode deixar de seguir, descurtir e remover dos salvos a qualquer momento. Em Meus dados, você baixa a lista do que curtiu, do que salvou e de quem segue. Ao excluir a conta, apagamos suas curtidas, seus salvos e seus seguidos. O cliente que retirar um trabalho do feed não faz o trabalho voltar. Para pedidos sobre outros dados, use os canais da seção 10.
              </p>
            </div>
          </Secao>

          <section className="border-t border-slate-100 pt-8">
            <p className="text-sm text-slate-400">Última atualização: {DATA_ATUALIZACAO_PRIVACIDADE}.</p>
          </section>
        </div>
      </div>
    </main>
  )
}
