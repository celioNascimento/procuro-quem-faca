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
              Esta política explica como o PQF trata dados usados para conectar clientes e prestadores, manter contas, documentar projetos, exibir perfis públicos e operar os recursos de segurança e administração da plataforma.
            </p>
          </section>

          <section>
            <h2 className="mb-3 text-xl font-bold text-slate-800">2. Dados coletados</h2>
            <p>
              Podemos tratar dados fornecidos pelo usuário, como nome, e-mail, telefone ou WhatsApp, cidade, região, categoria, habilidades, biografia, foto, dados de acesso e informações do perfil. Também podem ser registrados dados de projetos, fotos, comentários, avaliações, solicitações de garantia, denúncias e interações com a plataforma.
            </p>
          </section>

          <section>
            <h2 className="mb-3 text-xl font-bold text-slate-800">3. Como os dados são usados</h2>
            <p>
              Os dados são usados para criar e proteger contas, concluir o cadastro de prestadores, permitir busca e contato, montar perfis e portfólios, acompanhar projetos por tokens exclusivos, processar avaliações e garantias, responder denúncias, administrar a plataforma e melhorar sua segurança e funcionamento.
            </p>
          </section>

          <section>
            <h2 className="mb-3 text-xl font-bold text-slate-800">4. Dados públicos e compartilhamento</h2>
            <p>
              Quando o prestador publica ou mantém um perfil ativo, informações profissionais escolhidas no cadastro podem ficar visíveis na busca e no perfil público, incluindo nome, cidade, categoria, biografia, habilidades, fotos, portfólio, avaliações e formas de contato. Fotos e dados de projetos só são exibidos conforme o fluxo e as permissões aplicáveis. Não vendemos dados pessoais e não compartilhamos informações para marketing de terceiros.
            </p>
          </section>

          <section>
            <h2 className="mb-3 text-xl font-bold text-slate-800">5. Autenticação, cookies e armazenamento</h2>
            <p>
              Usamos o Supabase Auth para login por e-mail e senha ou Google, recuperação de senha e manutenção segura da sessão. Cookies, armazenamento local e tecnologias semelhantes podem preservar a sessão, preferências e estado de autenticação. Fotos e evidências são armazenadas em serviços de Storage com regras de acesso; registros privados de projeto, garantia e administração dependem da sessão e das permissões do usuário.
            </p>
          </section>

          <section>
            <h2 className="mb-3 text-xl font-bold text-slate-800">6. Segurança e retenção</h2>
            <p>
              Aplicamos controle de acesso por sessão, políticas de segurança no banco, validação de permissões e registros de atividades para proteger a plataforma. Mantemos dados pelo período necessário para operar os recursos, cumprir obrigações legais, resolver disputas e preservar a segurança. Logs técnicos e administrativos podem permanecer mesmo após a exclusão de um perfil quando forem necessários para auditoria ou prevenção de abuso.
            </p>
          </section>

          <section>
            <h2 className="mb-3 text-xl font-bold text-slate-800">7. Seus direitos e contato</h2>
            <p>
              Você pode atualizar os dados do perfil pelos painéis disponíveis e solicitar a exclusão da conta pelo fluxo de confirmação. A exclusão pode estar sujeita à preservação de registros exigidos por lei ou necessários para segurança. Para dúvidas, correções ou solicitações relacionadas aos seus dados, utilize os canais de contato disponibilizados pelo PQF.
            </p>
          </section>

          <section className="border-t border-slate-100 pt-8">
            <p className="text-sm text-slate-400">Última atualização: setembro de 2026.</p>
          </section>
        </div>
      </div>
    </main>
  )
}
