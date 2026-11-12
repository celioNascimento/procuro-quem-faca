// app/(admin)/admin/povoar/page.tsx

'use client'

import { UserPlus } from 'lucide-react'
import { usePovoar } from '@/hooks/usePovoar'
import { Button, Card, Field, Input, PageHeader, Select, Textarea } from '@/components/admin/ui'

export default function PovoarApp() {
  const { cidades, grupos, categorias, regioes, loading, checkLoading, existe, msg, form, setForm, handleFoneChange, handleSubmit } = usePovoar()

  return (
    <div className="mx-auto w-full max-w-4xl space-y-6 px-4 pb-20">
      <PageHeader
        titulo="Povoar base"
        descricao="Insere um prestador por curadoria manual. O perfil entra como curadoria pública."
      />

      <Card>
        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="grid grid-cols-1 gap-5 md:grid-cols-2">
            <Field label="Nome completo ou empresa" className="md:col-span-2">
              <Input required value={form.nome} onChange={e => setForm(prev => ({ ...prev, nome: e.target.value }))} placeholder="Ex.: João da Pintura" />
            </Field>

            <Field label="Grupo de atuação">
              <Select required value={form.grupo_id} onChange={e => setForm(prev => ({ ...prev, grupo_id: e.target.value, categoria_id: '' }))}>
                <option value="">Selecione o grupo</option>
                {grupos.map((g) => <option key={g.id} value={g.id}>{g.nome}</option>)}
              </Select>
            </Field>

            <Field label="Profissão ou categoria">
              <Select required disabled={!form.grupo_id} value={form.categoria_id} onChange={e => setForm(prev => ({ ...prev, categoria_id: e.target.value }))}>
                <option value="">{form.grupo_id ? 'Selecione a profissão' : 'Escolha um grupo primeiro'}</option>
                {categorias.map((cat) => <option key={cat.id} value={cat.id}>{cat.nome}</option>)}
              </Select>
            </Field>

            <Field label="Cidade sede">
              <Select required value={form.cidade_id} onChange={e => setForm(prev => ({ ...prev, cidade_id: e.target.value }))}>
                <option value="">Selecione a cidade</option>
                {cidades.map((c) => <option key={c.id} value={c.id}>{c.nome}</option>)}
              </Select>
            </Field>

            <Field label="Região (opcional)">
              <Select value={form.regiao_id} onChange={e => setForm(prev => ({ ...prev, regiao_id: e.target.value }))}>
                <option value="">Automático pela cidade</option>
                {regioes.map((r) => <option key={r.id} value={r.id}>{r.nome}</option>)}
              </Select>
            </Field>

            <Field label="WhatsApp" className="relative">
              <Input
                required
                value={form.whatsapp}
                onChange={e => handleFoneChange(e.target.value)}
                placeholder="(00) 00000-0000"
                aria-invalid={existe || undefined}
                className={existe ? 'border-red-300 bg-red-50 text-red-700' : ''}
              />
              {checkLoading && (
                <span className="absolute bottom-3 right-3 h-4 w-4 animate-spin rounded-full border-2 border-pqf-blue border-t-transparent" aria-hidden="true" />
              )}
              {existe && <span className="text-xs font-medium text-red-700">Este WhatsApp já está cadastrado.</span>}
            </Field>

            <Field label="Bairro (opcional)">
              <Input value={form.bairro} onChange={e => setForm(prev => ({ ...prev, bairro: e.target.value }))} placeholder="Ex.: Centro" />
            </Field>

            <Field label="Bio pública" className="md:col-span-2">
              <Textarea value={form.bio} onChange={e => setForm(prev => ({ ...prev, bio: e.target.value }))} className="h-24" />
            </Field>
          </div>

          {msg.texto && (
            <p
              role="status"
              className={`rounded-lg px-4 py-3 text-sm font-medium ${msg.tipo === 'sucesso' ? 'bg-emerald-50 text-emerald-700' : 'bg-red-50 text-red-700'}`}
            >
              {msg.texto}
            </p>
          )}

          <Button
            type="submit"
            variante="primario"
            disabled={loading || existe || checkLoading}
            icone={<UserPlus size={16} aria-hidden="true" />}
            className="w-full justify-center py-3"
          >
            {loading ? 'Salvando...' : existe ? 'WhatsApp duplicado' : 'Inserir profissional'}
          </Button>
        </form>
      </Card>
    </div>
  )
}
