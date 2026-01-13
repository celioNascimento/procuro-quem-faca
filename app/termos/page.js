'use client'
import { useRouter } from 'next/navigation'

export default function Termos() {
  const router = useRouter()

  return (
    <main className="min-h-screen bg-slate-50 p-6 md:p-20 text-slate-800">
      <div className="max-w-3xl mx-auto bg-white p-8 md:p-16 rounded-[3rem] shadow-sm border border-slate-100">
        
        {/* BOTÃO VOLTAR */}
        <button 
          onClick={() => router.back()}
          className="text-blue-600 font-bold text-sm mb-10 flex items-center gap-2 hover:underline group"
        >
          <span className="group-hover:-translate-x-1 transition-transform">←</span> Voltar
        </button>
        
        <h1 className="text-3xl md:text-4xl font-black mb-8 text-slate-900">Termos de Uso</h1>
        
        <div className="space-y-8 text-slate-600 leading-relaxed">
          <section>
            <h2 className="text-xl font-bold text-slate-800 mb-3">1. Aceitação dos Termos</h2>
            <p>
              Ao acessar e utilizar este portal, você concorda em cumprir estes termos de uso. 
              Esta plataforma atua exclusivamente como uma vitrine de aproximação entre prestadores de serviços e potenciais clientes.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-bold text-slate-800 mb-3">2. Responsabilidade do Prestador</h2>
            <p>
              O prestador de serviço é o único responsável pela veracidade das informações cadastradas (nome, especialidade, cidade e contato). 
              É proibido o cadastro de serviços ilegais ou informações fraudulentas.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-bold text-slate-800 mb-3">3. Limitação de Responsabilidade</h2>
            <p>
              O portal não garante a qualidade, segurança ou entrega dos serviços contratados. 
              Toda e qualquer negociação, pagamento e execução do serviço ocorre fora da plataforma, 
              sendo de inteira responsabilidade das partes envolvidas.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-bold text-slate-800 mb-3">4. Exclusão de Conteúdo</h2>
            <p>
              Reservamo-nos o direito de remover, sem aviso prévio, perfis que violem as regras de boa convivência, 
              apresentem informações falsas ou recebam denúncias recorrentes de usuários.
            </p>
          </section>

          <section className="pt-8 border-t border-slate-100">
            <p className="text-sm text-slate-400">
              O uso da plataforma é gratuito para busca e cadastro básico. Estes termos podem ser modificados a qualquer momento.
            </p>
            <p className="text-sm text-slate-400 mt-2 font-bold">
              Última atualização: Janeiro de 2026.
            </p>
          </section>
        </div>
      </div>
    </main>
  )
}