// Avatar: o arquivo escolhido vira uma imagem quadrada de 256px (data URL) antes de ir para a API.
// Assim uma foto grande do celular não lota o localStorage do banco simulado.
export const AVATAR_ACCEPT = 'image/png,image/jpeg,image/webp'
export const AVATAR_MAX_BYTES = 5 * 1024 * 1024 // 5 MB
const SIZE = 256

export async function toAvatarDataUrl(file: File): Promise<string> {
  const bitmap = await createImageBitmap(file)
  const side = Math.min(bitmap.width, bitmap.height) // recorte central quadrado
  const canvas = document.createElement('canvas')
  canvas.width = SIZE
  canvas.height = SIZE
  canvas
    .getContext('2d')!
    .drawImage(bitmap, (bitmap.width - side) / 2, (bitmap.height - side) / 2, side, side, 0, 0, SIZE, SIZE)
  bitmap.close()
  return canvas.toDataURL('image/jpeg', 0.85)
}
