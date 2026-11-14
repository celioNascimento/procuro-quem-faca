// app/[slug]/page.tsx
import { Metadata } from "next";

// ─── Tipos ───────────────────────────────────────────────────────────────────

interface PageParams {
  params: Promise<{ slug: string }>;
}

interface PageData {
  servico: string;
  servicoCapital: string;
  cidade: string;
  cidadeCapital: string;
  precoMin: number;
  precoMax: number;
  bairros: string[];
}

// ─── Dados por cidade ─────────────────────────────────────────────────────────

const dadosCidade: Record<string, { bairros: string[]; regiao: string }> = {
  londrina: {
    bairros: ["Centro", "Gleba Palhano", "Jardim Higienópolis", "Cambezinho", "Vila Nova"],
    regiao: "norte do Paraná",
  },
  maringa: {
    bairros: ["Centro", "Zona 7", "Jardim Alvorada", "Jardim Universo", "Vila Operária"],
    regiao: "noroeste do Paraná",
  },
  curitiba: {
    bairros: ["Batel", "Água Verde", "Portão", "Boa Vista", "Cajuru"],
    regiao: "capital do Paraná",
  },
  "sao-paulo": {
    bairros: ["Pinheiros", "Moema", "Tatuapé", "Vila Mariana", "Itaquera"],
    regiao: "maior cidade do Brasil",
  },
  "belo-horizonte": {
    bairros: ["Savassi", "Pampulha", "Barreiro", "Venda Nova", "Centro"],
    regiao: "capital de Minas Gerais",
  },
};

const dadosServico: Record<string, { precoMin: number; precoMax: number; descricao: string }> = {
  eletricista: { precoMin: 80, precoMax: 350, descricao: "instalações e reparos elétricos" },
  diarista: { precoMin: 120, precoMax: 280, descricao: "limpeza e organização residencial" },
  pedreiro: { precoMin: 150, precoMax: 600, descricao: "construção e reformas" },
  fotografo: { precoMin: 300, precoMax: 1500, descricao: "ensaios e cobertura de eventos" },
  massoterapia: { precoMin: 80, precoMax: 250, descricao: "massagens terapêuticas e relaxantes" },
  encanador: { precoMin: 100, precoMax: 400, descricao: "reparos hidráulicos e instalações" },
  pintor: { precoMin: 200, precoMax: 800, descricao: "pintura residencial e comercial" },
  jardineiro: { precoMin: 80, precoMax: 300, descricao: "manutenção de jardins e áreas externas" },
};

// ─── Parser de slug ───────────────────────────────────────────────────────────

function parseSlug(slug: string): PageData | null {
  // Formato esperado: [servico]-em-[cidade]
  const match = slug.match(/^(.+)-em-(.+)$/);
  if (!match) return null;

  const servicoSlug = match[1];
  const cidadeSlug = match[2];

  const cidadeData = dadosCidade[cidadeSlug] ?? {
    bairros: [],
    regiao: "região",
  };

  const servicoData = dadosServico[servicoSlug] ?? {
    precoMin: 100,
    precoMax: 500,
    descricao: "serviços especializados",
  };

  const capitalize = (s: string) =>
    s
      .split("-")
      .map((w) => w.charAt(0).toUpperCase() + w.slice(1))
      .join(" ");

  return {
    servico: servicoSlug,
    servicoCapital: capitalize(servicoSlug),
    cidade: cidadeSlug,
    cidadeCapital: capitalize(cidadeSlug),
    precoMin: servicoData.precoMin,
    precoMax: servicoData.precoMax,
    bairros: cidadeData.bairros,
  };
}

// ─── Metadata dinâmico ────────────────────────────────────────────────────────

export function getServicoMetadata(slug: string): Metadata {
  const data = parseSlug(slug);
  if (!data) return { title: "Página não encontrada" };

  const { servicoCapital, cidadeCapital } = data;
  const title = `${servicoCapital} em ${cidadeCapital} — Profissionais | ProcuroQuemFaça`;
  const description = `Encontre ${servicoCapital.toLowerCase()} em ${cidadeCapital}. Veja perfis, fotos de trabalhos e avaliações de clientes e fale direto com o profissional pelo WhatsApp.`;

  return {
    title,
    description,
    alternates: {
      canonical: `https://procuroquemfaca.com.br/${slug}`,
    },
    openGraph: {
      title,
      description,
      url: `https://procuroquemfaca.com.br/${slug}`,
      siteName: "ProcuroQuemFaça",
      locale: "pt_BR",
      type: "website",
    },
  };
}

// ─── Perguntas frequentes ─────────────────────────────────────────────────────
// Um só lugar: o texto da página e o JSON-LD (que o Google compara com o texto visível)
// saem da mesma lista e nunca divergem. Só afirmamos o que a plataforma realmente faz:
// perfis com fotos e avaliações, e contato direto com o profissional pelo WhatsApp.

function montarFaqs(data: PageData) {
  const { servicoCapital, cidadeCapital, precoMin, precoMax } = data;
  const servico = servicoCapital.toLowerCase();

  return [
    {
      q: `Qual o preço médio de ${servico} em ${cidadeCapital}?`,
      a: `Como referência, o valor costuma ficar entre R$${precoMin} e R$${precoMax}, mas depende do serviço, dos materiais e do profissional. O valor final é combinado direto com ele, pelo WhatsApp.`,
    },
    {
      q: `Como encontrar ${servico} de confiança em ${cidadeCapital}?`,
      a: `No ProcuroQuemFaça você vê o perfil de cada profissional, com fotos de trabalhos e avaliações de clientes que contrataram o serviço, e conversa direto com ele pelo WhatsApp antes de decidir. Combine valor e prazo antes de fechar.`,
    },
    {
      q: `${servicoCapital} em ${cidadeCapital} atende quais bairros?`,
      a: `Cada profissional informa a cidade em que atua. Confira no perfil e combine com ele o atendimento no seu bairro.`,
    },
    {
      q: `Quanto tempo leva um serviço de ${servico} em ${cidadeCapital}?`,
      a: `O prazo varia conforme o serviço. Pergunte ao profissional na conversa pelo WhatsApp e combine antes de contratar.`,
    },
    {
      q: `${servicoCapital} em ${cidadeCapital} trabalha fins de semana?`,
      a: `Depende de cada profissional. Pergunte sobre dias e horários na conversa pelo WhatsApp.`,
    },
  ];
}

// ─── Schema JSON-LD ───────────────────────────────────────────────────────────

function SchemaJsonLd({ data, slug }: { data: PageData; slug: string }) {
  const { servicoCapital, cidadeCapital, precoMin, precoMax, bairros } = data;
  const url = `https://procuroquemfaca.com.br/${slug}`;

  const schema = {
    "@context": "https://schema.org",
    "@graph": [
      {
        "@type": "LocalBusiness",
        name: `${servicoCapital} em ${cidadeCapital} — ProcuroQuemFaça`,
        description: `Encontre profissionais de ${servicoCapital.toLowerCase()} em ${cidadeCapital} e fale direto com o profissional pelo WhatsApp.`,
        url,
        areaServed: {
          "@type": "City",
          name: cidadeCapital,
          addressCountry: "BR",
        },
        priceRange: `R$${precoMin}–R$${precoMax}`,
      },
      {
        "@type": "FAQPage",
        mainEntity: montarFaqs(data).map(({ q, a }) => ({
          "@type": "Question",
          name: q,
          acceptedAnswer: { "@type": "Answer", text: a },
        })),
      },
    ],
  };

  return (
    <script
      type="application/ld+json"
      dangerouslySetInnerHTML={{ __html: JSON.stringify(schema) }}
    />
  );
}

// ─── Componente principal ─────────────────────────────────────────────────────

export default async function ServicoPage({ params }: PageParams) {
  const { slug } = await params;
  const data = parseSlug(slug);

  if (!data) {
    return (
      <main className="min-h-screen flex items-center justify-center">
        <p className="text-gray-500">Página não encontrada.</p>
      </main>
    );
  }

  const { servicoCapital, cidadeCapital, precoMin, precoMax, bairros } = data;

  const faqs = montarFaqs(data);

  return (
    <>
      <SchemaJsonLd data={data} slug={slug} />

      <main className="max-w-3xl mx-auto px-4 py-10 font-sans text-gray-800">

        {/* Hero */}
        <h1 className="text-3xl font-bold leading-tight mb-3">
          {servicoCapital} em {cidadeCapital}
          <span className="block text-lg font-normal text-gray-500 mt-1">
            Veja perfis, fotos e avaliações e fale direto com o profissional
          </span>
        </h1>

        <p className="text-base leading-relaxed mb-8 text-gray-700">
          Contratar {servicoCapital.toLowerCase()} em {cidadeCapital} ficou mais simples.
          No ProcuroQuemFaça você encontra profissionais de {cidadeCapital}, vê fotos de
          trabalhos e avaliações de clientes e chama direto pelo WhatsApp para pedir um
          orçamento — sem intermediários e sem pagar nada para procurar.
        </p>

        {/* Preço */}
        <div className="bg-blue-50 border border-blue-100 rounded-xl p-5 mb-8">
          <p className="text-sm text-blue-600 font-medium mb-1">Preço médio em {cidadeCapital}</p>
          <p className="text-2xl font-bold text-blue-800">
            R${precoMin} – R${precoMax}
          </p>
          <p className="text-xs text-blue-500 mt-1">
            Valores de referência. Peça um orçamento ao profissional para o seu caso.
          </p>
        </div>

        {/* Por que contratar */}
        <section className="mb-10">
          <h2 className="text-xl font-bold mb-4">
            Por que contratar {servicoCapital.toLowerCase()} em {cidadeCapital} pelo ProcuroQuemFaça?
          </h2>
          <p className="mb-3 leading-relaxed">
            Encontrar um profissional de confiança sem indicação pessoal pode ser
            arriscado. No ProcuroQuemFaça cada perfil mostra a cidade de atuação, fotos de
            trabalhos realizados e as avaliações de clientes que já contrataram o serviço,
            para você escolher com mais segurança.
          </p>
          <p className="mb-3 leading-relaxed">
            Para pedir um orçamento, chame o profissional pelo WhatsApp direto do perfil
            dele. Converse com mais de um, compare valores e prazos e escolha quem
            fizer mais sentido para você. Pedir orçamento não custa nada.
          </p>
          <p className="leading-relaxed">
            Depois do serviço, você pode avaliar o profissional, e a nota fica visível
            para outros moradores de {cidadeCapital}.
          </p>
        </section>

        {/* Bairros: só para cidades de que temos a lista; não inventamos bairros para as demais */}
        {bairros.length > 0 && (
        <section className="mb-10">
          <h2 className="text-xl font-bold mb-3">
            Bairros de {cidadeCapital}
          </h2>
          <div className="flex flex-wrap gap-2">
            {bairros.map((b) => (
              <span
                key={b}
                className="bg-gray-100 text-gray-700 text-sm px-3 py-1 rounded-full"
              >
                {b}
              </span>
            ))}
            <span className="bg-gray-100 text-gray-500 text-sm px-3 py-1 rounded-full">
              + outros bairros
            </span>
          </div>
        </section>
        )}

        {/* FAQ */}
        <section className="mb-10">
          <h2 className="text-xl font-bold mb-5">
            Perguntas frequentes sobre {servicoCapital.toLowerCase()} em {cidadeCapital}
          </h2>
          <div className="space-y-5">
            {faqs.map((faq, i) => (
              <div key={i} className="border-b border-gray-100 pb-5">
                <h3 className="font-semibold text-gray-900 mb-2">{faq.q}</h3>
                <p className="text-gray-600 leading-relaxed text-sm">{faq.a}</p>
              </div>
            ))}
          </div>
        </section>

        {/* CTA */}
        <div className="bg-green-50 border border-green-100 rounded-xl p-6 text-center">
          <p className="font-semibold text-green-900 text-lg mb-1">
            Precisa de {servicoCapital.toLowerCase()} em {cidadeCapital}?
          </p>
          <p className="text-green-700 text-sm mb-4">
            Veja os profissionais e peça um orçamento direto pelo WhatsApp.
          </p>
          <a
            href={`/prestadores?q=${encodeURIComponent(`${servicoCapital.toLowerCase()} em ${cidadeCapital}`)}`}
            className="inline-block bg-green-600 hover:bg-green-700 text-white font-semibold px-6 py-3 rounded-lg transition-colors"
          >
            Ver profissionais
          </a>
        </div>
      </main>
    </>
  );
}
