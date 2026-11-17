// components/dashboard/dados-profissionais/AbaCnpj.tsx
// Aba "CNPJ": conduz o prestador pelo selo, uma tela por fase. Só exibe e dispara ações do hook.
import { BadgeCheck, Hourglass, Loader2, ShieldQuestion } from 'lucide-react'
import { CartaoSecao, estiloCampo } from '@/components/perfil/CartaoSecao'
import { mascararCnpj } from '@/lib/cnpj/validacao'
import type { SeloCnpj } from '@/hooks/useSeloCnpj'

const BOTAO_PRIMARIO =
  'flex min-h-12 w-full items-center justify-center gap-2 rounded-xl bg-blue-600 px-6 py-3 text-base font-black text-white shadow-sm transition-colors hover:bg-blue-700 focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-blue-100 disabled:cursor-not-allowed disabled:opacity-60 sm:w-auto'
const BOTAO_SECUNDARIO =
  'flex min-h-11 items-center justify-center gap-2 rounded-xl border border-slate-200 bg-white px-4 text-sm font-bold text-slate-700 transition-colors hover:border-red-300 hover:bg-red-50 hover:text-red-700 focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-red-100 disabled:opacity-60'

function dataBr(iso: string): string {
  return new Date(iso).toLocaleDateString('pt-BR')
}

export function AbaCnpj({ selo, temPerfil }: { selo: SeloCnpj; temPerfil: boolean }) {
  const { fase, dados, carregando, enviando, removendo, digitado, erro, aviso, digitar, enviar, remover } = selo

  if (!temPerfil) {
    return (
      <CartaoSecao titulo="CNPJ" descricao="Salve os seus dados primeiro." icone={<ShieldQuestion size={20} />}>
        <p className="text-sm text-slate-600">
          Para conferir o CNPJ, antes termine de preencher e salvar a aba <strong>Meu perfil</strong>.
        </p>
      </CartaoSecao>
    )
  }

  if (carregando) {
    return <div className="h-48 animate-pulse rounded-3xl bg-slate-100" role="status" aria-label="Carregando CNPJ" />
  }

  const podeInformar = fase === 'sem' || fase === 'rejeitado' || fase === 'expirado'
  const cnpjMostrado = dados.cnpj ? mascararCnpj(dados.cnpj.cnpj) : null
  const cnpjForaDeAtividade = !!dados.cnpj?.situacao && dados.cnpj.situacao !== 'ATIVA'

  return (
    <div className="flex flex-col gap-6">
      {fase === 'aprovado' && dados.cnpj && (
        <CartaoSecao titulo="Selo conquistado" descricao="Seu CNPJ está ativo e aparece no seu perfil." icone={<BadgeCheck size={20} />}>
          <div className="rounded-2xl bg-green-50 p-4 text-green-900" data-testid="cnpj-fase-aprovado">
            <p className="text-sm font-bold">CNPJ ativo, consultado em {dataBr(dados.cnpj.consultado_em)}</p>
            <p className="mt-1 text-sm">{cnpjMostrado}{dados.cnpj.razao_social ? ` · ${dados.cnpj.razao_social}` : ''}</p>
          </div>
        </CartaoSecao>
      )}

      {fase === 'em_conferencia' && (
        <CartaoSecao titulo="Estamos conferindo" descricao="Nossa equipe confere o seu CNPJ." icone={<Hourglass size={20} />}>
          <div className="rounded-2xl bg-amber-50 p-4 text-amber-900" data-testid="cnpj-fase-conferencia">
            <p className="text-sm font-bold">
              {cnpjForaDeAtividade ? 'A Receita não mostra o seu CNPJ como ativo.' : 'Seu CNPJ está em conferência.'}
            </p>
            {cnpjForaDeAtividade && (
              <p className="mt-1 text-sm" data-testid="cnpj-aviso-inativo">
                Por isso o selo foi pausado e nossa equipe vai conferir. Se o CNPJ já foi regularizado, é só aguardar.
              </p>
            )}
            <p className="mt-1 text-sm">
              {cnpjMostrado ? `${cnpjMostrado}${dados.cnpj?.razao_social ? ` · ${dados.cnpj.razao_social}` : ''}. ` : ''}
              Volte a esta aba mais tarde para ver o resultado. Enquanto isso, seu perfil continua normal na busca.
            </p>
          </div>
        </CartaoSecao>
      )}

      {podeInformar && (
        <CartaoSecao
          titulo={fase === 'sem' ? 'Mostre que o seu CNPJ está ativo' : 'Conferir o CNPJ de novo'}
          descricao="Opcional. Conferimos na Receita Federal e mostramos o selo no seu perfil."
          icone={<BadgeCheck size={20} />}
        >
          {fase === 'rejeitado' && (
            <p className="mb-4 rounded-xl bg-slate-50 p-3 text-sm text-slate-700" data-testid="cnpj-fase-rejeitado">
              Não conseguimos confirmar o CNPJ enviado. Confira o número e tente de novo.
            </p>
          )}
          {fase === 'expirado' && (
            <p className="mb-4 rounded-xl bg-slate-50 p-3 text-sm text-slate-700" data-testid="cnpj-fase-expirado">
              A conferência do seu selo venceu. Informe o CNPJ de novo para renová-lo.
            </p>
          )}
          <form
            onSubmit={(e) => {
              e.preventDefault()
              void enviar()
            }}
            className="flex flex-col gap-3"
            noValidate
          >
            <label htmlFor="campo-cnpj" className="text-sm font-bold text-slate-700">Número do CNPJ</label>
            <input
              id="campo-cnpj"
              value={digitado}
              onChange={(e) => digitar(e.target.value)}
              placeholder="00.000.000/0000-00"
              inputMode="text"
              autoCapitalize="characters"
              autoComplete="off"
              maxLength={18}
              aria-invalid={erro ? true : undefined}
              aria-describedby={erro ? 'erro-cnpj' : 'ajuda-cnpj'}
              className={estiloCampo}
            />
            <p id="ajuda-cnpj" className="text-xs text-slate-500">Pode digitar com ou sem pontos. Os novos CNPJs podem ter letras.</p>
            <button type="submit" disabled={enviando || digitado.length === 0} className={BOTAO_PRIMARIO}>
              {enviando ? <><Loader2 size={18} className="animate-spin" aria-hidden="true" /> Conferindo...</> : 'Conferir meu CNPJ'}
            </button>
          </form>
        </CartaoSecao>
      )}

      {erro && <p id="erro-cnpj" role="alert" className="rounded-xl bg-red-50 p-3 text-sm font-semibold text-red-700">{erro}</p>}
      {aviso && !erro && <p role="status" className="rounded-xl bg-blue-50 p-3 text-sm font-semibold text-blue-800">{aviso}</p>}

      {(fase === 'aprovado' || fase === 'em_conferencia') && (
        <div>
          <button type="button" onClick={() => void remover()} disabled={removendo} className={BOTAO_SECUNDARIO}>
            {removendo ? <><Loader2 size={16} className="animate-spin" aria-hidden="true" /> Removendo...</> : 'Remover meu CNPJ'}
          </button>
          <p className="mt-2 text-xs text-slate-500">
            Remove o número e o selo. Você pode informar este ou outro CNPJ quando quiser.
          </p>
        </div>
      )}
    </div>
  )
}
