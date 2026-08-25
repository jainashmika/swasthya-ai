/**
 * Browser-only. Downscales a photo before upload.
 *
 * Vercel rejects request bodies over 4.5 MB and a modern phone camera easily
 * produces more than that, so this is not optional — it also makes the upload
 * several times faster on a slow connection.
 */
export async function resizeImage(file: File, maxSide = 1024, quality = 0.8) {
  const bitmap = await createImageBitmap(file)

  const scale = Math.min(1, maxSide / Math.max(bitmap.width, bitmap.height))
  const width = Math.round(bitmap.width * scale)
  const height = Math.round(bitmap.height * scale)

  const canvas = document.createElement('canvas')
  canvas.width = width
  canvas.height = height

  const ctx = canvas.getContext('2d')
  if (!ctx) throw new Error('Canvas not supported')
  ctx.drawImage(bitmap, 0, 0, width, height)
  bitmap.close()

  return canvas.toDataURL('image/jpeg', quality)
}
