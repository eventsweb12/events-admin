// lib/uploadImage.js
//
// Uploads an IMAGE file straight from the browser to Cloudinary,
// bypassing our own Vercel API route entirely (Vercel serverless
// functions cap request bodies at 4.5MB, causing 413s on anything
// bigger — Cloudinary has no such limit for direct browser uploads).
//
// If the image is over Cloudinary's preset limit (10MB here), it's
// compressed client-side first, quality-first: try near-lossless
// quality, only step down as far as actually needed, only resize
// dimensions as an absolute last resort.
//
// Video is no longer handled here — events store a `youtubeUrl`
// link instead of an uploaded video file.

const CLOUD_NAME = 'bhczkack'
const UPLOAD_PRESET = 'admin_uploads_unsigned'
const MAX_BYTES = 10 * 1024 * 1024 // 10 MB — match your preset's limit

/**
 * Compresses an image File to WebP if it's over maxBytes, stepping
 * quality down only as far as needed. Returns the original File
 * untouched if it already fits — zero quality loss unless necessary.
 */
async function compressToFit(file, maxBytes = MAX_BYTES) {
  if (file.size <= maxBytes) return file

  const bitmap = await createImageBitmap(file)
  const canvas = document.createElement('canvas')
  canvas.width = bitmap.width
  canvas.height = bitmap.height
  const ctx = canvas.getContext('2d')
  ctx.drawImage(bitmap, 0, 0)

  const toBlob = (width, height, quality) =>
    new Promise((resolve) => {
      if (width !== canvas.width || height !== canvas.height) {
        const c = document.createElement('canvas')
        c.width = width
        c.height = height
        c.getContext('2d').drawImage(bitmap, 0, 0, width, height)
        c.toBlob(resolve, 'image/webp', quality)
      } else {
        canvas.toBlob(resolve, 'image/webp', quality)
      }
    })

  let quality = 0.92
  let blob = await toBlob(canvas.width, canvas.height, quality)

  while (blob.size > maxBytes && quality > 0.4) {
    quality -= 0.06
    blob = await toBlob(canvas.width, canvas.height, quality)
  }

  let width = canvas.width
  while (blob.size > maxBytes && width > 1000) {
    width = Math.round(width * 0.85)
    const height = Math.round((canvas.height / canvas.width) * width)
    blob = await toBlob(width, height, 0.85)
  }

  const baseName = file.name.replace(/\.[^.]+$/, '')
  return new File([blob], `${baseName}.webp`, { type: 'image/webp' })
}

/**
 * Compresses (if needed) and uploads an image File directly to
 * Cloudinary. Returns the Cloudinary response (use .secure_url for
 * the URL to store in your event/blog document).
 */
export async function uploadImage(file, { onProgress } = {}) {
  if (!file.type.startsWith('image/')) {
    console.warn('uploadImage: expected an image file, got:', file.type)
  }

  const toUpload = await compressToFit(file)

  const formData = new FormData()
  formData.append('file', toUpload)
  formData.append('upload_preset', UPLOAD_PRESET)

  return new Promise((resolve, reject) => {
    const xhr = new XMLHttpRequest()
    xhr.open('POST', `https://api.cloudinary.com/v1_1/${CLOUD_NAME}/image/upload`)

    xhr.upload.onprogress = (e) => {
      if (onProgress && e.lengthComputable) {
        onProgress(Math.round((e.loaded / e.total) * 100))
      }
    }

    xhr.onload = () => {
      if (xhr.status >= 200 && xhr.status < 300) {
        const json = JSON.parse(xhr.responseText)
        console.log('uploadImage success:', file.name, '->', json.secure_url)
        resolve(json)
      } else {
        console.error('uploadImage failed:', file.name, xhr.status, xhr.responseText)
        reject(new Error(`Upload failed: ${xhr.status} ${xhr.responseText}`))
      }
    }

    xhr.onerror = () => {
      console.error('uploadImage network error:', file.name)
      reject(new Error('Network error during upload'))
    }
    xhr.send(formData)
  })
}