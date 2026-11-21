// Endereço antigo: a tela agora é a aba Cliques de Análises.
import { redirect } from 'next/navigation'

export default function CliquesRedirect() {
  redirect('/admin/analises/cliques')
}
