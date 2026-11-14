// components/shared/ModalFotoBase.test.tsx
//
// A moldura dos modais de foto: diálogo acessível, um único botão de fechar, Esc, foco, rolagem da página
// travada e troca de foto por teclado e por arrastar com o dedo.

import { afterEach, describe, expect, it, vi } from 'vitest'
import { cleanup, fireEvent, render, screen } from '@testing-library/react'
import { ModalFotoBase } from '@/components/shared/ModalFotoBase'

afterEach(() => {
  cleanup()
  document.body.style.overflow = ''
})

function montar(extra: Partial<React.ComponentProps<typeof ModalFotoBase>> = {}) {
  const onClose = vi.fn()
  const onPrev = vi.fn()
  const onNext = vi.fn()
  const utils = render(
    <ModalFotoBase fotoUrl="/f.png" ordemLabel="Depois" titulo="Reforma da cozinha" onClose={onClose} navegacao={{ onPrev, onNext }} {...extra}>
      <p>conteúdo</p>
    </ModalFotoBase>,
  )
  return { onClose, onPrev, onNext, ...utils }
}

describe('ModalFotoBase', () => {
  it('é um diálogo com nome, e tem um só botão de fechar', () => {
    montar()

    expect(screen.getByRole('dialog', { name: 'Reforma da cozinha' }).getAttribute('aria-modal')).toBe('true')
    expect(screen.getAllByRole('button', { name: 'Fechar' })).toHaveLength(1)
  })

  it('leva o foco ao botão de fechar e trava a rolagem da página enquanto está aberto', () => {
    const { unmount } = montar()

    expect(document.activeElement).toBe(screen.getByRole('button', { name: 'Fechar' }))
    expect(document.body.style.overflow).toBe('hidden')

    unmount()
    expect(document.body.style.overflow).toBe('')
  })

  it('Esc e o botão fecham; tocar na conteúdo não fecha', () => {
    const { onClose } = montar()

    fireEvent.click(screen.getByText('conteúdo'))
    expect(onClose).not.toHaveBeenCalled()

    fireEvent.keyDown(document, { key: 'Escape' })
    expect(onClose).toHaveBeenCalledTimes(1)

    fireEvent.click(screen.getByRole('button', { name: 'Fechar' }))
    expect(onClose).toHaveBeenCalledTimes(2)
  })

  it('tocar fora do cartão (no fundo) fecha', () => {
    const { onClose } = montar()

    fireEvent.click(screen.getByRole('dialog'))
    expect(onClose).toHaveBeenCalledTimes(1)
  })

  it('as setas do teclado e os botões com nome trocam de foto', () => {
    const { onPrev, onNext } = montar()

    fireEvent.keyDown(document, { key: 'ArrowRight' })
    fireEvent.keyDown(document, { key: 'ArrowLeft' })
    expect(onNext).toHaveBeenCalledTimes(1)
    expect(onPrev).toHaveBeenCalledTimes(1)

    fireEvent.click(screen.getByRole('button', { name: 'Próxima foto' }))
    fireEvent.click(screen.getByRole('button', { name: 'Foto anterior' }))
    expect(onNext).toHaveBeenCalledTimes(2)
    expect(onPrev).toHaveBeenCalledTimes(2)
  })

  describe('arrastar com o dedo', () => {
    const arrastar = (alvo: HTMLElement, de: [number, number], para: [number, number]) => {
      fireEvent.touchStart(alvo, { touches: [{ clientX: de[0], clientY: de[1] }] })
      fireEvent.touchEnd(alvo, { changedTouches: [{ clientX: para[0], clientY: para[1] }] })
    }

    it('para a esquerda vai à próxima foto; para a direita, à anterior', () => {
      const { onPrev, onNext } = montar()
      const area = screen.getByAltText('Depois').parentElement as HTMLElement

      arrastar(area, [250, 100], [100, 110])
      expect(onNext).toHaveBeenCalledTimes(1)

      arrastar(area, [100, 100], [260, 90])
      expect(onPrev).toHaveBeenCalledTimes(1)
    })

    it('ignora toque curto e arrastar na vertical (rolar a página)', () => {
      const { onPrev, onNext } = montar()
      const area = screen.getByAltText('Depois').parentElement as HTMLElement

      arrastar(area, [100, 100], [120, 100])
      arrastar(area, [100, 100], [180, 300])
      expect(onNext).not.toHaveBeenCalled()
      expect(onPrev).not.toHaveBeenCalled()
    })
  })

  it('sem navegação (uma foto só), não mostra setas', () => {
    montar({ navegacao: undefined })

    expect(screen.queryByRole('button', { name: 'Próxima foto' })).toBeNull()
  })
})
