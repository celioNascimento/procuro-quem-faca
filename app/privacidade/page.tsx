'use client'

import { useRouter } from 'next/navigation'

export default function Privacidade() {
  const router = useRouter()

  return (
    <main className="min-h-screen bg-slate-50 p-6 text-slate-800 md:p-20">
      <div className="mx-auto max-w-3xl rounded-[3rem] border border-slate-100 bg-white p-8 shadow-sm md:p-16">
        <button
          onClick={() => router.back()}
          className="group mb-10 flex items-center gap-2 text-sm font-bold text-blue-600 hover:underline"
        >
          <span className="transition-transform group-hover:-translate-x-1">←</span> Voltar
        </button>

        <h1 className="mb-8 text-3xl font-black text-slate-900 md:text-4xl">Política de Privacidade</h1>

        <div className="space-y-8 leading-relaxed text-slate-600">
          <section>
            <h2 className="mb-3 text-xl font-bold text-slate-800">1. Escopo</h2>
            <p>
              Esta política explica como o PQF trata dados usados para conectar clientes e prestadores, manter contas, documentar projetos, exibir perfis públicos e operar os recursos de segurança e administração da plataforma, em conformidade com a Lei Geral de Proteção de Dados (Lei nº 13.709/2018).
            </p>
          </section>

          <section>
            <h2 className="mb-3 text-xl font-bold text-slate-800">2. Dados coletados</h2>
            <div className="space-y-3">
              <p>
                <strong className="text-slate-700">Fornecidos por você:</strong> nome, e-mail, telefone ou WhatsApp, cidade, região, categoria, habilidades, biografia, dados de acesso e informações do perfil. No login com Google, recebemos os dados básicos da conta autorizados por você.
              </p>
              <p>
                <strong className="text-slate-700">Imagens e conteúdo:</strong> foto de perfil, sessão de fotos, fotos e comentários de projetos, foto e nome do cliente em avaliações, evidências de garantia ou reclamação, solicitações e denúncias.
              </p>
              <p>
                <strong className="text-slate-700">Coletados pelo uso:</strong> cidade escolhida ou detectada, identificador de sessão, registros de acesso (com a identificação da conta quando você está logado), buscas, visitas a perfis, compartilhamentos, cliques no botão de contato do WhatsApp e outras interações. Com seu consentimento, também coletamos estatísticas de navegação.
              </p>
            </div>
          </section>

          <section>
            <h2 className="mb-3 text-xl font-bold text-slate-800">3. Como os dados são usados</h2>
            <p>
              Os dados são usados para criar e proteger contas, concluir o cadastro de prestadores, permitir busca e contato, montar perfis e portfólios, acompanhar projetos por links exclusivos, processar avaliações e garantias, responder denúncias, medir o desempenho dos perfis (como visitas e cliques) para os próprios prestadores, administrar a plataforma e melhorar sua segurança e funcionamento. Tratamos os dados conforme a finalidade: execução das funcionalidades que você usa, cumprimento de obrigações legais, legítimo interesse na segurança e na prevenção de fraudes e abusos e, quando exigido, seu consentimento, como nas estatísticas de navegação e na localização.
            </p>
          </section>

          <section>
            <h2 className="mb-3 text-xl font-bold text-slate-800">4. Imagens e fotografias</h2>
            <div className="space-y-3">
              <p>
                <strong className="text-slate-700">Onde ficam.</strong> As imagens são armazenadas em serviço de Storage. Fotos de perfil, da sessão de fotos e do portfólio ficam em área pública: qualquer pessoa que tenha o endereço do arquivo consegue abri-lo, e elas aparecem no perfil público. Evidências de garantia ou reclamação ficam em área privada, acessível às partes do caso e à moderação por sessão e permissão. Quando um caso é encerrado como resolvido, as fotos de resolução podem ser copiadas para a área pública e exibidas no perfil do prestador; as fotos que documentam o problema permanecem privadas.
              </p>
              <p>
                <strong className="text-slate-700">Pessoas e bens nas imagens.</strong> Fotos de serviços podem mostrar ambientes, imóveis, veículos, objetos e, às vezes, pessoas. Quem envia a imagem é responsável por ter autorização das pessoas identificáveis nela. Se você aparece em uma imagem ou teve seu imóvel ou bem fotografado e quer que ela seja ocultada ou removida, use a função de denúncia do perfil ou os canais de contato do PQF.
              </p>
              <p>
                <strong className="text-slate-700">Metadados.</strong> O PQF armazena as imagens como são enviadas e não remove automaticamente os metadados do arquivo (como data, modelo do aparelho e, se o celular estiver configurado para isso, localização). Antes de enviar, recomendamos desativar a gravação de localização na câmera ou remover esses metadados.
              </p>
              <p>
                <strong className="text-slate-700">Nome e foto na avaliação.</strong> O nome e a foto que o cliente informa ao avaliar podem ser exibidos no perfil público do prestador avaliado.
              </p>
              <p>
                <strong className="text-slate-700">Uso e remoção.</strong> Usamos as imagens para operar as funcionalidades da plataforma e para segurança e moderação; não as vendemos nem as usamos para marketing de terceiros. Ao substituir a foto de perfil, o PQF remove o arquivo anterior do armazenamento. Cópias técnicas e registros que precisem ser mantidos seguem o descrito na seção 7.
              </p>
            </div>
          </section>

          <section>
            <h2 className="mb-3 text-xl font-bold text-slate-800">5. Dados públicos e compartilhamento</h2>
            <p>
              Quando o prestador publica ou mantém um perfil ativo, informações profissionais escolhidas no cadastro podem ficar visíveis na busca e no perfil público, incluindo nome, cidade, categoria, biografia, habilidades, fotos, portfólio, avaliações e formas de contato, como o WhatsApp. Fotos e dados de projetos só são exibidos conforme o fluxo e as permissões aplicáveis. O link exclusivo de acompanhamento dá acesso ao projeto a quem o receber e não deve ser compartilhado. Não vendemos dados pessoais e não compartilhamos informações para marketing de terceiros. Compartilhamos dados apenas com os provedores necessários para operar a plataforma (como hospedagem, autenticação, armazenamento, geocodificação e estatísticas, descritos nas seções 6 e 7), com autoridades quando houver obrigação legal e com a moderação para tratar denúncias.
            </p>
          </section>

          <section>
            <h2 className="mb-3 text-xl font-bold text-slate-800">6. Autenticação, cookies, localização e armazenamento</h2>
            <div className="space-y-3">
              <p>
                <strong className="text-slate-700">Autenticação.</strong> Usamos o Supabase Auth para login por e-mail e senha ou Google, recuperação de senha e manutenção segura da sessão.
              </p>
              <p>
                <strong className="text-slate-700">Cookies e armazenamento local.</strong> Usamos cookies essenciais para manter a sessão e lembrar a cidade escolhida (por cerca de 30 dias) e um cookie de 24 horas para contar uma sessão de acesso uma única vez. Também guardamos no seu navegador a informação de que você aceitou o aviso de cookies. As estatísticas de navegação feitas por serviço de análise (PostHog) ficam desativadas até você aceitar o aviso de cookies.
              </p>
              <p>
                <strong className="text-slate-700">Localização.</strong> Ao abrir o site, o navegador pode pedir permissão para usar sua localização aproximada e sugerir sua cidade. Se você permitir, as coordenadas são enviadas ao serviço de geocodificação OpenStreetMap (Nominatim) apenas para identificar a cidade. O PQF guarda somente a cidade escolhida, não as coordenadas. Você pode negar a permissão e digitar sua cidade.
              </p>
              <p>
                <strong className="text-slate-700">Armazenamento.</strong> Fotos e evidências são armazenadas em serviços de Storage com regras de acesso; registros privados de projeto, garantia e administração dependem da sessão e das permissões do usuário.
              </p>
            </div>
          </section>

          <section>
            <h2 className="mb-3 text-xl font-bold text-slate-800">7. Segurança e retenção</h2>
            <p>
              Aplicamos controle de acesso por sessão, políticas de segurança no banco, validação de permissões e registros de atividades para proteger a plataforma. Mantemos dados pelo período necessário para operar os recursos, cumprir obrigações legais, resolver disputas e preservar a segurança. Logs técnicos e administrativos, e registros ligados a avaliações, garantias e denúncias, podem permanecer mesmo após a exclusão de um perfil quando forem necessários para auditoria, defesa em disputas ou prevenção de abuso.
            </p>
          </section>

          <section>
            <h2 className="mb-3 text-xl font-bold text-slate-800">8. Seus direitos e contato</h2>
            <p>
              Nos termos da LGPD, você pode pedir confirmação de que tratamos seus dados, acesso, correção, anonimização ou exclusão de dados desnecessários, informações sobre compartilhamento e a revogação do consentimento. Você pode atualizar os dados do perfil pelos painéis disponíveis e solicitar a exclusão da conta pelo fluxo de confirmação. A exclusão pode estar sujeita à preservação de registros exigidos por lei ou necessários para segurança. Para dúvidas, correções, pedidos de remoção de imagens ou outras solicitações relacionadas aos seus dados, utilize os canais de contato disponibilizados pelo PQF.
            </p>
          </section>

          <section className="border-t border-slate-100 pt-8">
            <p className="text-sm text-slate-400">Última atualização: novembro de 2026.</p>
          </section>
        </div>
      </div>
    </main>
  )
}
