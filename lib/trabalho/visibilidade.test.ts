import { describe, expect, it } from 'vitest'
import { visibilidadeDasFotos } from '@/lib/trabalho/visibilidade'

describe('visibilidadeDasFotos', () => {
  it.each(['em_registro', 'pendente', 'aguardando_aceite', 'em_disputa', 'recusado', null, undefined])(
    'status %s: as fotos ainda não aparecem no perfil e o texto explica o motivo',
    (status) => {
      const v = visibilidadeDasFotos(status)
      expect(v.publico).toBe(false)
      expect(v.texto).toMatch(/depois que o cliente aceitar/i)
      expect(v.texto).toMatch(/só você e o cliente veem/i)
    },
  )

  it.each(['em_execucao', 'finalizado', 'EM_EXECUCAO'])('status %s: as fotos já aparecem no perfil', (status) => {
    const v = visibilidadeDasFotos(status)
    expect(v.publico).toBe(true)
    expect(v.titulo).toMatch(/já aparecem no seu perfil/i)
  })

  it('não usa palavras técnicas de status', () => {
    for (const s of ['em_registro', 'pendente', 'em_execucao']) {
      const { titulo, texto, resumo } = visibilidadeDasFotos(s)
      expect(`${titulo} ${texto} ${resumo}`).not.toMatch(/em_registro|pendente|em_execucao|status/i)
    }
  })
})
