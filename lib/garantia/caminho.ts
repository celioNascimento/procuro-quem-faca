// lib/garantia/caminho.ts
//
// Os arquivos de um caso de garantia ficam no bucket privado em `<casoId>/<nome>` (ver useGarantiaWizard).
// Esta checagem existe porque garantia_fotos.url_foto é texto livre: sem ela, alguém poderia registrar
// uma foto apontando para o arquivo de OUTRO caso e, ao promovê-la, publicá-lo.

/** O path precisa estar dentro da pasta do caso e não pode "subir" de pasta. */
export function caminhoPertenceAoCaso(path: unknown, casoId: string): path is string {
  return (
    typeof path === 'string' &&
    path.startsWith(`${casoId}/`) &&
    !path.includes('..') &&
    !path.includes('//') &&
    !path.includes('\\') &&
    path.length <= 300
  )
}
