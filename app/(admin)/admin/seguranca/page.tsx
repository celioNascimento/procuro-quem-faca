import { SegurancaConta } from '@/components/admin/seguranca/SegurancaConta'

export default async function SegurancaContaPage({ searchParams }: { searchParams: Promise<{ obrigatorio?: string }> }) {
  const { obrigatorio } = await searchParams
  return <SegurancaConta obrigatorio={obrigatorio === '1'} />
}
