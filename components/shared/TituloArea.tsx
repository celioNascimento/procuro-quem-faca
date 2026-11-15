// components/shared/TituloArea.tsx

// Título padrão das áreas do cliente e do profissional: o nome da área em cima
// (igual ao do cabeçalho) e o nome da tela embaixo, com o mesmo estilo nas duas.
interface TituloAreaProps {
  area: 'Área do cliente' | 'Área do profissional'
  titulo: string
}

export function TituloArea({ area, titulo }: TituloAreaProps) {
  return (
    <div className="flex max-w-2xl flex-col gap-2">
      <p className="text-[13px] font-semibold text-blue-700">{area}</p>
      <h1 className="text-balance text-2xl font-black tracking-tight text-slate-900 sm:text-3xl">{titulo}</h1>
    </div>
  )
}

export default TituloArea
