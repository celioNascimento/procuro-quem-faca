// lib/tracking/isBot.ts
//
// Decide se o user-agent (identificação enviada pelo navegador) é de um robô.
// Robôs (Googlebot, pré-visualização de links do WhatsApp/Facebook, ferramentas de
// teste de velocidade, scripts) não devem entrar nas métricas.
// Função pura: não acessa banco nem rede, por isso é fácil de testar.

const PADROES_ROBO = new RegExp(
  [
    'bot', 'crawler', 'spider', 'crawling', 'slurp',
    'facebookexternalhit', 'facebot', 'whatsapp\\/', 'bingpreview',
    'apis-google', 'mediapartners', 'googleother', 'inspectiontool',
    'headlesschrome', 'lighthouse', 'pagespeed', 'gtmetrix',
    'python-requests', 'curl\\/', 'wget\\/', 'axios', 'node-fetch',
    'go-http-client', 'okhttp', 'postmanruntime', 'uptimerobot',
  ].join('|'),
  'i',
)

export function isBot(userAgent: string | null | undefined): boolean {
  // Sem user-agent = requisição de script, não de pessoa.
  if (!userAgent || userAgent.trim() === '') return true
  return PADROES_ROBO.test(userAgent)
}
