'use client'

import type { ReactNode } from 'react'
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
                <Destaque>Fornecidos por você:</Destaque> nome, e-mail, telefone ou WhatsApp, cidade, região, categoria, habilidades, biografia, dados de acesso e informações do perfil. No login com Google, recebemos os dados básicos da conta autorizados por você.
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
                informando o nome do perfil e o WhatsApp cadastrado nele, para que possamos confirmar que o perfil é seu.
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
              Quando o prestador publica ou mantém um perfil ativo, informações profissionais escolhidas no cadastro podem ficar visíveis na busca e no perfil público, incluindo nome, cidade, categoria, biografia, habilidades, fotos, portfólio, avaliações e formas de contato, como o WhatsApp. Fotos e dados de projetos só são exibidos conforme o fluxo e as permissões aplicáveis. O link exclusivo de acompanhamento dá acesso ao projeto a quem o receber e não deve ser compartilhado. Não vendemos dados pessoais e não compartilhamos informações para marketing de terceiros. Compartilhamos dados apenas com os provedores necessários para operar a plataforma (como hospedagem, autenticação, armazenamento, geocodificação e estatísticas, descritos nas seções 8 e 9), com autoridades quando houver obrigação legal e com a moderação para tratar denúncias.
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
                <Destaque>Localização.</Destaque> Ao abrir o site, o navegador pode pedir permissão para usar sua localização aproximada e sugerir sua cidade. Se você permitir, as coordenadas são enviadas ao serviço de geocodificação OpenStreetMap (Nominatim) apenas para identificar a cidade. O PQF guarda somente a cidade escolhida, não as coordenadas. Você pode negar a permissão e digitar sua cidade.
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
                . Para sua segurança, podemos pedir informações que confirmem que você é o titular antes de atender o pedido.
              </p>
              <p>
                <Destaque>Prazo.</Destaque> Respondemos aos pedidos em até {prazoRespostaDias} dias. A exclusão pode estar sujeita à preservação de registros exigidos por lei ou necessários para segurança, nos termos da seção 9. Você também pode apresentar reclamação à Autoridade Nacional de Proteção de Dados (ANPD).
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
