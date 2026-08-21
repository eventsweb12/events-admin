import sharp from "sharp";
import cloudinary from "@/lib/cloudinary";

// Match this to your Cloudinary upload preset's limit.
const MAX_BYTES = 10 * 1024 * 1024; // 10 MB

export async function POST(request) {
  const formData = await request.formData();
  const file = formData.get("file");

  if (!file) {
    return Response.json({ error: "ფაილი არ მოიძებნა" }, { status: 400 });
  }

  const bytes = await file.arrayBuffer();
  let buffer = Buffer.from(bytes);

  // Only touch the file if it's actually over the limit — a file that
  // already fits gets uploaded untouched, so there's zero quality loss
  // unless it's genuinely necessary.
  if (buffer.length > MAX_BYTES) {
    try {
      buffer = await compressToFit(buffer, MAX_BYTES);
    } catch (err) {
      console.error("Compression failed:", err);
      return Response.json(
        { error: "სურათის დამუშავება ვერ მოხერხდა" },
        { status: 500 }
      );
    }
  }

  const result = await new Promise((resolve, reject) => {
    const stream = cloudinary.uploader.upload_stream(
      { folder: "admin-uploads" },
      (error, result) => {
        if (error) reject(error);
        else resolve(result);
      }
    );
    stream.end(buffer);
  });

  return Response.json({ url: result.secure_url });
}

/**
 * Re-encodes an oversized image to WebP, only reducing quality/size as
 * far as actually needed to fit under maxBytes.
 *
 * Strategy (best quality first):
 *   1. Re-encode at quality 92 (visually lossless for almost any photo).
 *   2. Step quality down in small increments only if still too large.
 *   3. Only as a last resort (huge source dimensions, e.g. 6000px+
 *      photos) start scaling dimensions down, keeping quality high.
 *
 * WebP is used because at equal visual quality it's routinely 25–35%
 * smaller than JPEG, and — unlike JPEG — it also supports transparency,
 * so PNG uploads with alpha channels keep working correctly.
 */
async function compressToFit(buffer, maxBytes) {
  const image = sharp(buffer).rotate(); // respect EXIF orientation
  const metadata = await image.metadata();

  let quality = 92;
  let output = await sharp(buffer)
    .rotate()
    .webp({ quality, effort: 6 })
    .toBuffer();

  while (output.length > maxBytes && quality > 40) {
    quality -= 6;
    output = await sharp(buffer)
      .rotate()
      .webp({ quality, effort: 6 })
      .toBuffer();
  }

  if (output.length <= maxBytes) return output;

  // Quality reduction alone wasn't enough — the source dimensions are
  // just very large. Scale down gradually, keeping quality high, until
  // it fits.
  let width = metadata.width || 4000;
  quality = 85;

  while (output.length > maxBytes && width > 1000) {
    width = Math.round(width * 0.85);
    output = await sharp(buffer)
      .rotate()
      .resize({ width })
      .webp({ quality, effort: 6 })
      .toBuffer();
  }

  return output;
}