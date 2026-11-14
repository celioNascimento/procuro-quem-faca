import { beforeEach, describe, expect, it, vi } from 'vitest'

const upload = vi.fn()
const remove = vi.fn()
vi.mock('@/lib/supabase', () => ({
  supabase: { storage: { from: () => ({ upload, remove, getPublicUrl: (n: string) => ({ data: { publicUrl: `https://x/${n}` } }) }) } },
}))

import { fazerUploadFoto, removerFotoAntiga } from '@/lib/uploadFoto'

const arquivo = (nome: string, tipo: string, kb = 10) => new File([new Uint8Array(kb * 1024)], nome, { type: tipo })

beforeEach(() => { upload.mockReset(); remove.mockReset(); upload.mockResolvedValue({ error: null }) })

describe('fazerUploadFoto', () => {
  it('envia e devolve a URL; a extensão vem do tipo da imagem, não do nome', async () => {
    const r = await fazerUploadFoto(arquivo('minha.foto.exe', 'image/png'), 'u1')
    expect(r.ok).toBe(true)
    expect(upload.mock.calls[0][0]).toMatch(/^u1-\d+\.png$/)
    expect(upload.mock.calls[0][2]).toEqual({ contentType: 'image/png' })
  })

  it('aparelho que entrega a foto sem tipo: vale a extensão, se for de imagem', async () => {
    const r = await fazerUploadFoto(arquivo('IMG_0001.HEIC', ''), 'u1')
    expect(r.ok).toBe(true)
    expect(upload.mock.calls[0][0]).toMatch(/\.heic$/)
    expect((await fazerUploadFoto(arquivo('virus.exe', ''), 'u1')).ok).toBe(false)
  })

  it('recusa arquivo que não é imagem', async () => {
    const r = await fazerUploadFoto(arquivo('x.html', 'text/html'), 'u1')
    expect(r).toEqual({ ok: false, error: 'UPLOAD_FAILED' })
    expect(upload).not.toHaveBeenCalled()
  })

  it('recusa arquivo acima de 10 MB', async () => {
    const r = await fazerUploadFoto(arquivo('g.png', 'image/png', 11 * 1024), 'u1')
    expect(r).toMatchObject({ ok: false, error: 'TOO_LARGE' })
  })

  it('NUNCA apaga a foto antiga durante o envio (se falhar, o perfil continua com a foto que tinha)', async () => {
    upload.mockResolvedValue({ error: { message: 'rede' } })
    const r = await fazerUploadFoto(arquivo('a.jpg', 'image/jpeg'), 'u1')
    expect(r).toEqual({ ok: false, error: 'UPLOAD_FAILED' })
    expect(remove).not.toHaveBeenCalled()
  })
})

describe('removerFotoAntiga', () => {
  it('remove pelo caminho dentro do bucket', async () => {
    remove.mockResolvedValue({})
    await removerFotoAntiga('https://p.supabase.co/storage/v1/object/public/fotos-perfil/u1-123.jpg?x=1')
    expect(remove).toHaveBeenCalledWith(['u1-123.jpg'])
  })
})
