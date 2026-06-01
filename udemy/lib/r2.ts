import {
  S3Client,
  PutObjectCommand,
  GetObjectCommand,
  DeleteObjectCommand,
} from "@aws-sdk/client-s3";
import { getSignedUrl } from "@aws-sdk/s3-request-presigner";

function getR2Client() {
  const accountId = process.env.R2_ACCOUNT_ID;
  const accessKeyId = process.env.R2_ACCESS_KEY_ID;
  const secretAccessKey = process.env.R2_SECRET_ACCESS_KEY;

  if (!accountId || !accessKeyId || !secretAccessKey) {
    return null;
  }

  return new S3Client({
    region: "auto",
    endpoint:
      process.env.R2_ENDPOINT ??
      `https://${accountId}.r2.cloudflarestorage.com`,
    credentials: { accessKeyId, secretAccessKey },
  });
}

export function getBucket(): string {
  return process.env.R2_BUCKET_NAME ?? "lumina-videos";
}

export async function getUploadSignedUrl(
  key: string,
  contentType: string,
  expiresIn = 3600
): Promise<string | null> {
  const client = getR2Client();
  if (!client) return null;

  const command = new PutObjectCommand({
    Bucket: getBucket(),
    Key: key,
    ContentType: contentType,
  });

  return getSignedUrl(client, command, { expiresIn });
}

export async function getDownloadSignedUrl(
  key: string,
  expiresIn = 300
): Promise<string | null> {
  const client = getR2Client();
  if (!client) return null;

  const command = new GetObjectCommand({
    Bucket: getBucket(),
    Key: key,
  });

  return getSignedUrl(client, command, { expiresIn });
}

export async function deleteObject(key: string): Promise<void> {
  const client = getR2Client();
  if (!client) return;

  await client.send(
    new DeleteObjectCommand({ Bucket: getBucket(), Key: key })
  );
}

export function buildVideoKey(
  courseId: string,
  lessonId: string,
  filename: string
): string {
  return `courses/${courseId}/lessons/${lessonId}/original/${filename}`;
}

export function buildHlsPrefix(courseId: string, lessonId: string): string {
  return `courses/${courseId}/lessons/${lessonId}/hls`;
}
