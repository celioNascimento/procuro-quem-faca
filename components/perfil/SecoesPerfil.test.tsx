import { afterEach, describe, expect, it, vi } from 'vitest'
import { cleanup, fireEvent, render, screen, waitFor } from '@testing-library/react'
import { SecaoDadosPessoais } from '@/components/perfil/SecaoDadosPessoais'
import { SecaoGarantia } from '@/components/perfil/SecaoGarantia'
import { SecaoOQueVoceFaz } from '@/components/perfil/SecaoOQueVoceFaz'
import { SecaoLocalizacao } from '@/components/perfil/SecaoLocalizacao'
import { FotoUpload } from '@/components/perfil/FotoUpload'
import { PreferenciaFotos } from '@/components/perfil/PreferenciaFotos'
import { estiloCampo } from '@/components/perfil/CartaoSecao'

const atualizar = vi.fn()
vi.mock('@/lib/services/prestadorPerfil.service', () => ({ updatePortfolioObrigatorio: (...a: unknown[]) => atualizar(...a) }))
import { PortfolioToggle } from '@/components/dashboard/PortfolioToggle'

afterEach(() => { cleanup(); atualizar.mockReset() })

describe('Seus dados', () => {
  const props = {
    nome: 'Elétrica Silva', slug: 'eletrica-silva', whatsapp: '43999998888', bio: '',
    slugDisponivel: true, checandoSlug: false, inputStyle: estiloCampo,
    onNomeChange: vi.fn(), onSlugChange: vi.fn(), onWhatsappChange: vi.fn(), onBioChange: vi.fn(),
  }

  it('todos os campos têm rótulo visível associado (não dependem do texto de exemplo)', () => {
    render(<SecaoDadosPessoais {...props} />)
    expect((screen.getByLabelText('Nome profissional') as HTMLInputElement).value).toBe('Elétrica Silva')
    expect(screen.getByLabelText('Seu WhatsApp')).toBeTruthy()
    expect(screen.getByLabelText('Endereço do seu perfil')).toBeTruthy()
    expect(screen.getByLabelText(/Apresentação/)).toBeTruthy()
  })

  it('avisa se o endereço está livre ou já existe, e não mostra nada enquanto confere', () => {
    const { rerender } = render(<SecaoDadosPessoais {...props} />)
    expect(screen.getByText('Disponível')).toBeTruthy()
    rerender(<SecaoDadosPessoais {...props} slugDisponivel={false} />)
    expect(screen.getByText('Já existe')).toBeTruthy()
    rerender(<SecaoDadosPessoais {...props} checandoSlug />)
    expect(screen.queryByText('Disponível')).toBeNull()
    expect(screen.queryByText('Já existe')).toBeNull()
    expect(screen.getByRole('status', { name: /verificando/i })).toBeTruthy()
  })

  it('repassa o que a pessoa digita', () => {
    render(<SecaoDadosPessoais {...props} />)
    fireEvent.change(screen.getByLabelText('Nome profissional'), { target: { value: 'Novo' } })
    expect(props.onNomeChange).toHaveBeenCalledWith('Novo')
  })
})

describe('Garantia', () => {
  it('marca a opção escolhida e avisa a mudança', () => {
    const onChange = vi.fn()
    render(<SecaoGarantia garantiaDias={30} onChange={onChange} />)
    expect(screen.getByRole('button', { name: /30/ }).getAttribute('aria-pressed')).toBe('true')
    expect(screen.getByRole('button', { name: 'Sem garantia' }).getAttribute('aria-pressed')).toBe('false')
    fireEvent.click(screen.getByRole('button', { name: /90/ }))
    expect(onChange).toHaveBeenCalledWith(90)
  })
})

describe('O que você faz e onde atende', () => {
  it('profissão: campos rotulados e outros serviços como botões marcáveis', () => {
    const onToggle = vi.fn()
    render(
      <SecaoOQueVoceFaz
        grupoId="1" categoriaId="10" habilidades={['Pintor']}
        listaGrupos={[{ id: 1, nome: 'Obras' }] as never}
        listaCategorias={[{ id: 10, nome: 'Eletricista' }, { id: 11, nome: 'Pintor' }, { id: 12, nome: 'Encanador' }] as never}
        inputStyle={estiloCampo} onGrupoChange={vi.fn()} onCategoriaChange={vi.fn()} onToggleHabilidade={onToggle}
      />,
    )
    expect(screen.getByLabelText('Área de atuação')).toBeTruthy()
    expect(screen.getByLabelText('Profissão principal')).toBeTruthy()
    expect(screen.getByRole('button', { name: 'Pintor' }).getAttribute('aria-pressed')).toBe('true')
    fireEvent.click(screen.getByRole('button', { name: 'Encanador' }))
    expect(onToggle).toHaveBeenCalledWith('Encanador')
    expect(screen.queryByRole('button', { name: 'Eletricista' })).toBeNull()
  })

  it('localização: campos rotulados e cidade sede sai das vizinhas ao ser escolhida', () => {
    const onToggle = vi.fn()
    const onCidade = vi.fn()
    render(
      <SecaoLocalizacao
        estadoSigla="PR" regiaoId="5" cidadeId="" bairro="" cidadesAtendidas={['Cambé']}
        listaEstados={[{ sigla: 'PR', nome: 'Paraná' }] as never}
        listaRegioes={[{ id: 5, nome: 'Norte' }] as never}
        listaCidades={[{ id: 1, nome: 'Londrina' }, { id: 2, nome: 'Cambé' }] as never}
        cidadesRegiao={[]}
        inputStyle={estiloCampo}
        onEstadoChange={vi.fn()} onRegiaoChange={vi.fn()} onCidadeChange={onCidade} onBairroChange={vi.fn()} onToggleCidade={onToggle}
      />,
    )
    expect(screen.getByLabelText('Estado')).toBeTruthy()
    expect(screen.getByLabelText(/Região/)).toBeTruthy()
    expect(screen.getByLabelText(/Bairro/)).toBeTruthy()
    fireEvent.change(screen.getByLabelText(/Cidade onde você mora/), { target: { value: '2' } })
    expect(onCidade).toHaveBeenCalledWith('2')
    expect(onToggle).toHaveBeenCalledWith('Cambé')
  })
})

describe('Foto do perfil', () => {
  it('sempre mostra um botão visível para trocar a foto (não só ao passar o mouse)', () => {
    const onChange = vi.fn()
    const { container } = render(<FotoUpload fotoUrl="https://x/f.png" uploading={false} onChange={onChange} variant="dashboard" />)
    expect(screen.getByRole('button', { name: 'Trocar foto' })).toBeTruthy()
    const arquivo = new File(['x'], 'f.png', { type: 'image/png' })
    const input = container.querySelector('input[type=file]') as HTMLInputElement
    fireEvent.change(input, { target: { files: [arquivo] } })
    expect(onChange).toHaveBeenCalledWith(arquivo)
  })

  it('sem foto: convida a escolher e, ao tentar enviar sem ela, explica em palavras', () => {
    const { rerender } = render(<FotoUpload fotoUrl={null} uploading={false} onChange={vi.fn()} variant="dashboard" />)
    expect(screen.getByRole('button', { name: 'Escolher foto' })).toBeTruthy()
    expect(screen.queryByRole('alert')).toBeNull()
    rerender(<FotoUpload fotoUrl={null} uploading={false} tentouEnviar onChange={vi.fn()} variant="dashboard" />)
    expect(screen.getByRole('alert').textContent).toMatch(/obrigatória/i)
  })
})

describe('Começar com fotos', () => {
  it('interruptor: grava na hora e mostra o novo estado', async () => {
    atualizar.mockResolvedValue(undefined)
    const onSuccess = vi.fn()
    render(<PortfolioToggle prestadorId={7} inicial onSuccess={onSuccess} />)
    const sw = screen.getByRole('switch', { name: /começar com registro de fotos/i })
    expect(sw.getAttribute('aria-checked')).toBe('true')
    fireEvent.click(sw)
    await waitFor(() => expect(onSuccess).toHaveBeenCalledWith(false))
    expect(atualizar).toHaveBeenCalledWith(7, false)
    expect(sw.getAttribute('aria-checked')).toBe('false')
  })

  it('interruptor: se falhar, volta como estava e explica', async () => {
    vi.spyOn(console, 'error').mockImplementation(() => {})
    atualizar.mockRejectedValue(new Error('x'))
    render(<PortfolioToggle prestadorId={7} inicial={false} />)
    const sw = screen.getByRole('switch')
    fireEvent.click(sw)
    expect((await screen.findByRole('alert')).textContent).toMatch(/tente de novo/i)
    expect(sw.getAttribute('aria-checked')).toBe('false')
  })

  it('cadastro: duas opções claras, com a atual marcada', () => {
    const onChange = vi.fn()
    render(<PreferenciaFotos valor onChange={onChange} modo="cadastro" />)
    expect(screen.getByRole('button', { name: /com registro de fotos/i }).getAttribute('aria-pressed')).toBe('true')
    fireEvent.click(screen.getByRole('button', { name: /sem fotos/i }))
    expect(onChange).toHaveBeenCalledWith(false)
  })
})
