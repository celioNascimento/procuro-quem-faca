'use client'

import { useRouter } from 'next/navigation'

export default function Termos() {
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

        <h1 className="mb-8 text-3xl font-black text-slate-900 md:text-4xl">Termos de Uso</h1>

        <div className="space-y-8 leading-relaxed text-slate-600">
          <section>
            <h2 className="mb-3 text-xl font-bold text-slate-800">1. Sobre o PQF</h2>
            <p>
              O PQF é uma plataforma local de aproximação entre clientes e prestadores de serviços. A plataforma permite pesquisar profissionais, consultar perfis públicos, registrar projetos, acompanhar evidências fotográficas e compartilhar avaliações vinculadas a serviços realizados.
            </p>
          </section>

          <section>
            <h2 className="mb-3 text-xl font-bold text-slate-800">2. Contas e responsabilidades</h2>
            <p>
              O usuário deve fornecer informações verdadeiras, manter suas credenciais em segurança e utilizar apenas a própria conta. O prestador é responsável pelos dados profissionais, disponibilidade, orçamento, comunicação, execução e condições do serviço. O cliente é responsável pelas informações fornecidas para acompanhamento, avaliação e contato.
            </p>
          </section>

          <section>
            <h2 className="mb-3 text-xl font-bold text-slate-800">3. Registro e acompanhamento de projetos</h2>
            <p>
              O prestador pode documentar um serviço com registros de antes, durante e depois, descrições, comentários e fotos. O cliente pode acompanhar o projeto por um link exclusivo e, ao final, enviar uma avaliação. Esse link não deve ser compartilhado com pessoas que não estejam envolvidas no serviço.
            </p>
          </section>

          <section>
            <h2 className="mb-3 text-xl font-bold text-slate-800">4. Avaliações, garantia e denúncias</h2>
            <p>
              Avaliações devem refletir uma experiência real e não podem conter conteúdo ofensivo, falso, discriminatório ou informações pessoais desnecessárias. A plataforma pode registrar avaliações, respostas e evidências relacionadas ao projeto. Solicitações de garantia ou reclamações seguem os prazos e status apresentados no sistema e não substituem os direitos previstos na legislação aplicável.
            </p>
          </section>

          <section>
            <h2 className="mb-3 text-xl font-bold text-slate-800">5. Conteúdo proibido e moderação</h2>
            <p>
              É proibido cadastrar serviços ilegais, usar dados de terceiros sem autorização, publicar conteúdo enganoso, tentar burlar os fluxos de avaliação, praticar discriminação ou utilizar a plataforma para spam, fraude ou assédio. O PQF pode ocultar conteúdo, bloquear perfis e remover registros que violem estes termos ou apresentem risco à comunidade.
            </p>
          </section>

          <section>
            <h2 className="mb-3 text-xl font-bold text-slate-800">6. Limitação de responsabilidade</h2>
            <p>
              O PQF não é parte dos contratos, não define preços e não garante a contratação, qualidade, segurança, prazo ou resultado de qualquer serviço. Negociação, pagamento, execução e solução de conflitos entre cliente e prestador são de responsabilidade das partes, sem prejuízo dos mecanismos de registro e garantia disponibilizados pela plataforma.
            </p>
          </section>

          <section>
            <h2 className="mb-3 text-xl font-bold text-slate-800">7. Encerramento e alterações</h2>
            <p>
              O usuário pode solicitar a exclusão da conta pelos fluxos disponíveis. O PQF pode alterar funcionalidades e estes termos para refletir a evolução do produto, a legislação ou melhorias de segurança. A versão vigente será publicada nesta página.
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
