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
    bairros: ["Pinheiros", "Moema", "Tatuapé", "Santo André", "Itaquera"],
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
    bairros: ["Centro", "Zona Sul", "Zona Norte", "Zona Leste", "Zona Oeste"],
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
  const title = `${servicoCapital} em ${cidadeCapital} — Profissionais Avaliados | ProcuroQuemFaça`;
  const description = `Encontre ${servicoCapital.toLowerCase()} em ${cidadeCapital} com avaliações reais de clientes. Compare preços, veja perfis e contrate com segurança pelo ProcuroQuemFaça.`;

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
        description: `Encontre profissionais de ${servicoCapital.toLowerCase()} em ${cidadeCapital} com avaliações verificadas.`,
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
        mainEntity: [
          {
            "@type": "Question",
            name: `Qual o preço médio de ${servicoCapital.toLowerCase()} em ${cidadeCapital}?`,
            acceptedAnswer: {
              "@type": "Answer",
              text: `O preço médio de ${servicoCapital.toLowerCase()} em ${cidadeCapital} varia entre R$${precoMin} e R$${precoMax}, dependendo da complexidade do serviço e da disponibilidade do profissional.`,
            },
          },
          {
            "@type": "Question",
            name: `Como encontrar ${servicoCapital.toLowerCase()} de confiança em ${cidadeCapital}?`,
            acceptedAnswer: {
              "@type": "Answer",
              text: `No ProcuroQuemFaça você encontra profissionais verificados em ${cidadeCapital} com avaliações reais de clientes anteriores, fotos de trabalhos realizados e histórico completo.`,
            },
          },
          {
            "@type": "Question",
            name: `${servicoCapital} em ${cidadeCapital} atende quais bairros?`,
            acceptedAnswer: {
              "@type": "Answer",
              text: `Nossos profissionais de ${servicoCapital.toLowerCase()} atendem em toda ${cidadeCapital}, incluindo ${bairros.slice(0, 3).join(", ")} e demais regiões.`,
            },
          },
          {
            "@type": "Question",
            name: `${servicoCapital} em ${cidadeCapital} trabalha fins de semana?`,
            acceptedAnswer: {
              "@type": "Answer",
              text: `Sim, muitos profissionais de ${servicoCapital.toLowerCase()} em ${cidadeCapital} disponíveis no ProcuroQuemFaça atendem aos sábados e domingos. Verifique a disponibilidade no perfil de cada profissional.`,
            },
          },
          {
            "@type": "Question",
            name: `Quanto tempo leva um serviço de ${servicoCapital.toLowerCase()} em ${cidadeCapital}?`,
            acceptedAnswer: {
              "@type": "Answer",
              text: `O tempo varia conforme o serviço solicitado. Serviços simples de ${servicoCapital.toLowerCase()} em ${cidadeCapital} podem ser concluídos em poucas horas, enquanto projetos maiores podem levar dias. O profissional informa o prazo no orçamento.`,
            },
          },
        ],
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

  const faqs = [
    {
      q: `Qual o preço médio de ${servicoCapital.toLowerCase()} em ${cidadeCapital}?`,
      a: `O preço médio varia entre R$${precoMin} e R$${precoMax}, dependendo da complexidade do serviço, materiais necessários e disponibilidade do profissional na região de ${cidadeCapital}.`,
    },
    {
      q: `Como encontrar ${servicoCapital.toLowerCase()} de confiança em ${cidadeCapital}?`,
      a: `No ProcuroQuemFaça, todos os profissionais passam por verificação de identidade. Você pode ler avaliações reais, ver fotos de trabalhos anteriores e comparar orçamentos antes de contratar.`,
    },
    {
      q: `${servicoCapital} em ${cidadeCapital} atende quais bairros?`,
      a: `Atendemos em toda a cidade de ${cidadeCapital}, incluindo ${bairros.join(", ")}. Ao solicitar um orçamento, informe seu bairro para encontrar o profissional mais próximo.`,
    },
    {
      q: `Quanto tempo leva um serviço de ${servicoCapital.toLowerCase()} em ${cidadeCapital}?`,
      a: `O prazo varia conforme o escopo do trabalho. Serviços simples costumam ser concluídos no mesmo dia, enquanto projetos maiores podem levar de 2 a 5 dias. O profissional informa o prazo exato no orçamento.`,
    },
    {
      q: `${servicoCapital} em ${cidadeCapital} trabalha fins de semana?`,
      a: `Sim! Muitos profissionais de ${servicoCapital.toLowerCase()} em ${cidadeCapital} atendem aos sábados e domingos. Filtre por disponibilidade na busca para encontrar quem atende no horário que você precisa.`,
    },
  ];

  return (
    <>
      <SchemaJsonLd data={data} slug={slug} />

      <main className="max-w-3xl mx-auto px-4 py-10 font-sans text-gray-800">

        {/* Hero */}
        <h1 className="text-3xl font-bold leading-tight mb-3">
          {servicoCapital} em {cidadeCapital}
          <span className="block text-lg font-normal text-gray-500 mt-1">
            Profissionais verificados e avaliados por clientes reais
          </span>
        </h1>

        <p className="text-base leading-relaxed mb-8 text-gray-700">
          Contratar {servicoCapital.toLowerCase()} em {cidadeCapital} ficou mais simples.
          No ProcuroQuemFaça você compara profissionais locais com avaliações verificadas,
          solicita orçamentos gratuitos e contrata com segurança — sem intermediários e
          sem complicação. Nossa plataforma conecta moradores de {cidadeCapital} a
          especialistas avaliados da própria região.
        </p>

        {/* Preço */}
        <div className="bg-blue-50 border border-blue-100 rounded-xl p-5 mb-8">
          <p className="text-sm text-blue-600 font-medium mb-1">Preço médio em {cidadeCapital}</p>
          <p className="text-2xl font-bold text-blue-800">
            R${precoMin} – R${precoMax}
          </p>
          <p className="text-xs text-blue-500 mt-1">
            Valores estimados. Solicite orçamento gratuito para sua necessidade específica.
          </p>
        </div>

        {/* Por que contratar */}
        <section className="mb-10">
          <h2 className="text-xl font-bold mb-4">
            Por que contratar {servicoCapital.toLowerCase()} em {cidadeCapital} pelo ProcuroQuemFaça?
          </h2>
          <p className="mb-3 leading-relaxed">
            {cidadeCapital} tem um mercado ativo de serviços, mas encontrar um profissional
            de confiança sem indicação pessoal pode ser arriscado. Nossa plataforma resolve
            isso: todos os profissionais de {servicoCapital.toLowerCase()} em {cidadeCapital}
            são cadastrados com CPF verificado, histórico de trabalhos e avaliações reais
            de clientes anteriores.
          </p>
          <p className="mb-3 leading-relaxed">
            Ao solicitar um orçamento, você recebe respostas de profissionais disponíveis
            na sua região em {cidadeCapital} — incluindo bairros como {bairros.slice(0, 2).join(" e ")}.
            Compare preços, leia comentários e escolha com segurança, sem pagar nada
            para pedir o orçamento.
          </p>
          <p className="leading-relaxed">
            Após o serviço, você avalia o profissional e sua nota fica visível para
            outros moradores de {cidadeCapital}. Esse sistema de reputação é o que garante
            a qualidade dos {servicoCapital.toLowerCase()} disponíveis na plataforma.
          </p>
        </section>

        {/* Bairros */}
        <section className="mb-10">
          <h2 className="text-xl font-bold mb-3">
            Bairros atendidos em {cidadeCapital}
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
            Solicite orçamentos gratuitos agora e receba respostas em minutos.
          </p>
          <a
            href={`/solicitar?servico=${data.servico}&cidade=${data.cidade}`}
            className="inline-block bg-green-600 hover:bg-green-700 text-white font-semibold px-6 py-3 rounded-lg transition-colors"
          >
            Pedir orçamento grátis
          </a>
        </div>
      </main>
    </>
  );
}
