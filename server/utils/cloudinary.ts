import { v2 as cloudinary } from 'cloudinary'

let configured = false

function ensureCloudinary() {
  const config = useRuntimeConfig()
  const cloudName = config.cloudinaryCloudName
  const apiKey = config.cloudinaryApiKey
  const apiSecret = config.cloudinaryApiSecret

  if (!cloudName || !apiKey || !apiSecret) {
    throw createError({
      statusCode: 503,
      statusMessage:
        'Cloudinary no está configurado. Define NUXT_CLOUDINARY_CLOUD_NAME, NUXT_CLOUDINARY_API_KEY y NUXT_CLOUDINARY_API_SECRET.',
    })
  }

  if (!configured) {
    cloudinary.config({
      cloud_name: cloudName,
      api_key: apiKey,
      api_secret: apiSecret,
      secure: true,
    })
    configured = true
  }

  return cloudinary
}

export function isCloudinaryConfigured() {
  const config = useRuntimeConfig()
  return Boolean(
    config.cloudinaryCloudName && config.cloudinaryApiKey && config.cloudinaryApiSecret,
  )
}

export async function uploadImageToCloudinary(input: {
  buffer: Buffer
  filename: string
  mimeType: string
  folder?: string
}) {
  const client = ensureCloudinary()

  const result = await new Promise<{
    secure_url: string
    public_id: string
    bytes: number
    original_filename?: string
  }>((resolve, reject) => {
    const stream = client.uploader.upload_stream(
      {
        folder: input.folder ?? 'club-pink-black',
        resource_type: 'image',
        allowed_formats: ['jpg', 'jpeg', 'png', 'webp'],
      },
      (error, uploadResult) => {
        if (error || !uploadResult) {
          reject(error ?? new Error('Cloudinary upload failed'))
          return
        }
        resolve({
          secure_url: uploadResult.secure_url,
          public_id: uploadResult.public_id,
          bytes: uploadResult.bytes ?? 0,
          original_filename: uploadResult.original_filename,
        })
      },
    )

    stream.end(input.buffer)
  })

  return result
}

export async function deleteCloudinaryImage(publicId: string) {
  const client = ensureCloudinary()
  await client.uploader.destroy(publicId, { resource_type: 'image' })
}
