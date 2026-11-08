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
            <h2 className="mb-3 text-xl font-bold text-slate-800">4. Imagens e conteúdo enviado</h2>
            <div className="space-y-3">
              <p>
                A plataforma permite enviar imagens e textos, como foto de perfil, sessão de fotos do prestador, fotos das etapas de um projeto, comentários, foto e nome do cliente na avaliação e evidências de garantia ou reclamação. Os formatos e tamanhos aceitos são indicados no momento do envio e podem mudar.
              </p>
              <p>
                <strong className="text-slate-700">Autoria e autorização.</strong> Quem envia uma imagem declara que é o autor ou que tem o direito de usá-la, e que tem autorização das pessoas identificáveis nela. A titularidade continua sendo de quem criou o conteúdo.
              </p>
              <p>
                <strong className="text-slate-700">Cuidado com terceiros.</strong> Ao fotografar um serviço, registre apenas o necessário para documentar o trabalho. Evite mostrar rostos, crianças, documentos, comprovantes, placas de veículos, números de endereço, telas com dados pessoais e outros itens que identifiquem o cliente ou terceiros, salvo com autorização deles. O prestador é responsável por avisar o cliente de que o ambiente será fotografado e de que as imagens podem aparecer no portfólio público.
              </p>
              <p>
                <strong className="text-slate-700">Licença de uso.</strong> Ao enviar conteúdo, você concede ao PQF uma licença gratuita e não exclusiva para armazenar, redimensionar, exibir e disponibilizar esse conteúdo nas funcionalidades da plataforma, como perfil público, portfólio, acompanhamento por link exclusivo, avaliações e garantia, e para proteger a plataforma contra abuso. Essa licença se limita a essas finalidades e permanece enquanto o conteúdo estiver na plataforma, ressalvadas cópias técnicas, registros de segurança e dados que precisem ser mantidos por lei ou para resolver disputas.
              </p>
              <p>
                <strong className="text-slate-700">Visibilidade.</strong> Fotos de perfil, da sessão de fotos e do portfólio podem ser vistas por qualquer visitante, mesmo sem login, e podem ser copiadas ou compartilhadas por terceiros fora do controle do PQF. Fotos de evidência de garantia ou reclamação ficam em área restrita às partes e à moderação. Quando um caso é encerrado como resolvido, as fotos de resolução podem ser exibidas no perfil público do prestador; as fotos que documentam o problema permanecem restritas.
              </p>
              <p>
                <strong className="text-slate-700">Remoção.</strong> O prestador pode substituir ou remover as imagens do próprio perfil e portfólio. Qualquer pessoa que apareça em uma imagem, ou cujo imóvel, veículo ou bem tenha sido fotografado, pode pedir a remoção ou a ocultação pela função de denúncia do perfil ou pelos canais de contato do PQF. O PQF pode ocultar ou remover imagens que violem estes termos ou os direitos de terceiros.
              </p>
            </div>
          </section>

          <section>
            <h2 className="mb-3 text-xl font-bold text-slate-800">5. Avaliações, garantia e denúncias</h2>
            <p>
              Avaliações devem refletir uma experiência real e não podem conter conteúdo ofensivo, falso, discriminatório ou informações pessoais desnecessárias. O nome e a foto informados pelo cliente na avaliação podem ser exibidos no perfil público do prestador. A plataforma pode registrar avaliações, respostas e evidências relacionadas ao projeto. Solicitações de garantia ou reclamações seguem os prazos e status apresentados no sistema e não substituem os direitos previstos na legislação aplicável.
            </p>
          </section>

          <section>
            <h2 className="mb-3 text-xl font-bold text-slate-800">6. Conteúdo proibido e moderação</h2>
            <p>
              É proibido cadastrar serviços ilegais, usar dados ou imagens de terceiros sem autorização, publicar conteúdo enganoso, imagens de nudez, violência ou que exponham crianças e adolescentes, tentar burlar os fluxos de avaliação, praticar discriminação ou utilizar a plataforma para spam, fraude ou assédio. O PQF pode ocultar conteúdo, bloquear perfis e remover registros que violem estes termos ou apresentem risco à comunidade.
            </p>
          </section>

          <section>
            <h2 className="mb-3 text-xl font-bold text-slate-800">7. Contato, anúncios e links externos</h2>
            <p>
              O contato entre cliente e prestador acontece fora da plataforma, por exemplo pelo WhatsApp, e o PQF registra o clique no botão de contato para fins de estatística. A plataforma pode exibir anúncios e banners de parceiros locais, gerenciados pela administração do PQF. O PQF não controla o conteúdo de sites e aplicativos de terceiros acessados por links.
            </p>
          </section>

          <section>
            <h2 className="mb-3 text-xl font-bold text-slate-800">8. Limitação de responsabilidade</h2>
            <p>
              O PQF não é parte dos contratos, não define preços e não garante a contratação, qualidade, segurança, prazo ou resultado de qualquer serviço. Negociação, pagamento, execução e solução de conflitos entre cliente e prestador são de responsabilidade das partes, sem prejuízo dos mecanismos de registro e garantia disponibilizados pela plataforma. O conteúdo enviado por usuários é de responsabilidade de quem o envia.
            </p>
          </section>

          <section>
            <h2 className="mb-3 text-xl font-bold text-slate-800">9. Encerramento e alterações</h2>
            <p>
              O usuário pode solicitar a exclusão da conta pelos fluxos disponíveis. O PQF pode alterar funcionalidades e estes termos para refletir a evolução do produto, a legislação ou melhorias de segurança. A versão vigente será publicada nesta página.
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
