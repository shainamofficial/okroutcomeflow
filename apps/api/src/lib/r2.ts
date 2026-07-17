// Cloudflare R2 object storage via the S3-compatible API. Uploads are proxied
// through the API (see the /files/upload route) so the browser never needs R2
// bucket CORS; downloads use short-lived presigned GET URLs.
import {
  DeleteObjectCommand,
  GetObjectCommand,
  PutObjectCommand,
  S3Client,
} from "@aws-sdk/client-s3";
import { getSignedUrl } from "@aws-sdk/s3-request-presigner";

const accountId = process.env.R2_ACCOUNT_ID;
const accessKeyId = process.env.R2_ACCESS_KEY_ID;
const secretAccessKey = process.env.R2_SECRET_ACCESS_KEY;
export const R2_BUCKET = process.env.R2_BUCKET ?? "";

/** True when all R2 env vars are present. */
export function isR2Configured(): boolean {
  return !!(accountId && accessKeyId && secretAccessKey && R2_BUCKET);
}

let cached: S3Client | null = null;
function client(): S3Client {
  if (!isR2Configured()) {
    throw new Error("R2 storage is not configured (set R2_* env vars)");
  }
  if (!cached) {
    cached = new S3Client({
      region: "auto",
      endpoint: `https://${accountId}.r2.cloudflarestorage.com`,
      credentials: { accessKeyId: accessKeyId!, secretAccessKey: secretAccessKey! },
    });
  }
  return cached;
}

/** Upload bytes to R2 (server-side; used by the upload proxy route). */
export async function putObject(
  key: string,
  body: Uint8Array | Buffer,
  contentType?: string
): Promise<void> {
  await client().send(
    new PutObjectCommand({ Bucket: R2_BUCKET, Key: key, Body: body, ContentType: contentType })
  );
}

/** A short-lived presigned GET URL, with an attachment filename if given. */
export function presignDownload(key: string, downloadName?: string): Promise<string> {
  return getSignedUrl(
    client(),
    new GetObjectCommand({
      Bucket: R2_BUCKET,
      Key: key,
      ...(downloadName
        ? { ResponseContentDisposition: `attachment; filename="${downloadName.replace(/"/g, "")}"` }
        : {}),
    }),
    { expiresIn: 3600 }
  );
}

export async function deleteObject(key: string): Promise<void> {
  await client().send(new DeleteObjectCommand({ Bucket: R2_BUCKET, Key: key }));
}
