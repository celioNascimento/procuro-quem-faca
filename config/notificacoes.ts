// config/notificacoes.ts
//
// Avisos por e-mail ao administrador. Os e-mails NÃO levam dado pessoal de titulares: só tipo,
// protocolo e contagens, com o link do painel. Os detalhes ficam no painel, atrás do login.
//
// Variáveis de ambiente (Vercel):
//   RESEND_API_KEY               chave do Resend (sem ela, nenhum e-mail é enviado e nada quebra)
//   CRON_SECRET                  protege a rota do resumo diário (sem ela, a rota recusa)
//   NOTIFICACAO_EMAIL_DESTINO    opcional; padrão: e-mail de privacidade
//   NOTIFICACAO_EMAIL_REMETENTE  opcional; padrão: remetente de teste do Resend, que só entrega
//                                para o e-mail dono da conta Resend. Com domínio verificado, trocar.

import { CONTROLADOR } from '@/config/controlador'
import { SITE_URL } from '@/lib/divulgacao/links'

export const NOTIFICACOES = {
  destinoPadrao: CONTROLADOR.emailPrivacidade,
  remetentePadrao: 'PQF Avisos <onboarding@resend.dev>',
  urlFilaTitular: `${SITE_URL}/admin/titular`,
  urlModeracao: `${SITE_URL}/admin/moderacao`,
  // Anti-spam do aviso de denúncia: no máximo 1 e-mail por perfil nesse intervalo...
  intervaloEmailDenunciaMinutos: 30,
  // ...e no máximo esta quantidade de e-mails de denúncia a cada 10 minutos, no total
  limiteEmailsDenunciaPor10Min: 10,
} as const
