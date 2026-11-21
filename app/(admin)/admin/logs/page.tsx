// Endereço antigo: a tela agora é a aba Atividade de Análises.
import { redirect } from 'next/navigation'

export default function LogsRedirect() {
  redirect('/admin/analises/atividade')
}
