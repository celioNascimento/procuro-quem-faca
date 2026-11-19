//components/Header.tsx

'use client'
import BackButton from './BackButton'
import { HeaderAuthButton } from './HeaderAuthButton'
import { LinkFeed } from './LinkFeed'
import HeaderBase from './HeaderBase'
import type { HeaderProps } from './Header.types'

export default function Header({ href, larga = false, feedAtivo = false }: HeaderProps) {
  return (
    <HeaderBase
      larga={larga}
      voltar={<BackButton href={href ?? '/'} />}
      direita={
        <>
          <LinkFeed ativo={feedAtivo} />
          <HeaderAuthButton feedAtivo={feedAtivo} />
        </>
      }
    />
  )
}
