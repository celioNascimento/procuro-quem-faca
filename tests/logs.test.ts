import { describe, it, expect, vi, beforeEach } from 'vitest'

// ─── Mocks hoisted (necessário porque vi.mock é elevado pelo vitest) ───────────
const { mockInsert, mockFrom, mockGetSession } = vi.hoisted(() => {
  const mockInsert = vi.fn()
  const mockFrom = vi.fn(() => ({ insert: mockInsert }))
  const mockGetSession = vi.fn()
  return { mockInsert, mockFrom, mockGetSession }
})

vi.mock('@/lib/supabase', () => ({
  supabase: {
    from: mockFrom,
    auth: { getSession: mockGetSession },
  },
}))

// ─── Imports após mock ─────────────────────────────────────────────────────────
import { insertLog } from '../lib/db/logs'
import { insertAcesso } from '../lib/db/acessos'

// ─── Helpers ───────────────────────────────────────────────────────────────────
const sessaoAutenticada = (id = 'user-1', email = 'celio@test.com') =>
  ({ data: { session: { user: { id, email } } } })

const semSessao = () =>
  ({ data: { session: null } })

const insertOk = () => mockInsert.mockResolvedValueOnce({ error: null })
const insertFail = (msg = 'db error') =>
  mockInsert.mockResolvedValueOnce({ error: new Error(msg) })

// ─── insertLog ─────────────────────────────────────────────────────────────────
describe('insertLog', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    mockFrom.mockReturnValue({ insert: mockInsert })
  })

  it('insere log com sessão autenticada', async () => {
    mockGetSession.mockResolvedValueOnce(sessaoAutenticada())
    insertOk()

    await insertLog({ acao: 'criar_servico', detalhes: { nome: 'Encanador' } })

    expect(mockFrom).toHaveBeenCalledWith('logs_atividades')
    expect(mockInsert).toHaveBeenCalledWith(expect.objectContaining({
      acao: 'criar_servico',
      detalhes: { nome: 'Encanador' },
      usuario_id: 'user-1',
      usuario_email: 'celio@test.com',
    }))
  })

  it('insere log sem sessão (usuário anônimo)', async () => {
    mockGetSession.mockResolvedValueOnce(semSessao())
    insertOk()

    await insertLog({ acao: 'visualizar_perfil' })

    expect(mockInsert).toHaveBeenCalledWith(expect.objectContaining({
      acao: 'visualizar_perfil',
      usuario_id: null,
      usuario_email: null,
    }))
  })

  it('inclui entidade quando fornecida', async () => {
    mockGetSession.mockResolvedValueOnce(sessaoAutenticada())
    insertOk()

    await insertLog({
      acao: 'editar_perfil',
      entidadeTipo: 'prestador',
      entidadeId: 'prest-42',
    })

    expect(mockInsert).toHaveBeenCalledWith(expect.objectContaining({
      entidade_tipo: 'prestador',
      entidade_id: 'prest-42',
    }))
  })

  it('usa detalhes vazio ({}) por padrão', async () => {
    mockGetSession.mockResolvedValueOnce(sessaoAutenticada())
    insertOk()

    await insertLog({ acao: 'login' })

    expect(mockInsert).toHaveBeenCalledWith(expect.objectContaining({
      detalhes: {},
    }))
  })

  it('lança erro quando o banco retorna error', async () => {
    mockGetSession.mockResolvedValueOnce(sessaoAutenticada())
    insertFail('violação de constraint')

    await expect(insertLog({ acao: 'teste' })).rejects.toThrow('violação de constraint')
  })
})

// ─── insertAcesso ──────────────────────────────────────────────────────────────
describe('insertAcesso', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    mockFrom.mockReturnValue({ insert: mockInsert })
  })

  it('insere acesso com dados do usuário na tabela correta', async () => {
    insertOk()

    await insertAcesso({ userId: 'user-1', userEmail: 'celio@test.com' })

    expect(mockFrom).toHaveBeenCalledWith('logs_atividades')
    expect(mockInsert).toHaveBeenCalledWith(expect.objectContaining({
      acao: 'acesso_sessao',
      usuario_id: 'user-1',
      usuario_email: 'celio@test.com',
    }))
  })

  it('insere acesso anônimo (null)', async () => {
    insertOk()

    await insertAcesso({ userId: null, userEmail: null })

    expect(mockInsert).toHaveBeenCalledWith(expect.objectContaining({
      acao: 'acesso_sessao',
      usuario_id: null,
      usuario_email: null,
    }))
  })

  it('lança erro quando o banco retorna error', async () => {
    insertFail('tabela não encontrada')

    await expect(
      insertAcesso({ userId: null, userEmail: null })
    ).rejects.toThrow('tabela não encontrada')
  })
})