import { spawn } from "child_process";
import { mkdir, writeFile, readFile, rm } from "fs/promises";
import { join } from "path";
import { tmpdir } from "os";
import { randomUUID } from "crypto";
import { PutObjectCommand, S3Client } from "@aws-sdk/client-s3";
import { db } from "@/lib/db";
import { buildHlsPrefix, getBucket } from "@/lib/r2";

function getR2Client(): S3Client | null {
  const accountId = process.env.R2_ACCOUNT_ID;
  const accessKeyId = process.env.R2_ACCESS_KEY_ID;
  const secretAccessKey = process.env.R2_SECRET_ACCESS_KEY;
  if (!accountId || !accessKeyId || !secretAccessKey) return null;

  return new S3Client({
    region: "auto",
    endpoint:
      process.env.R2_ENDPOINT ??
      `https://${accountId}.r2.cloudflarestorage.com`,
    credentials: { accessKeyId, secretAccessKey },
  });
}

async function uploadFile(
  client: S3Client,
  key: string,
  body: Buffer,
  contentType: string
) {
  await client.send(
    new PutObjectCommand({
      Bucket: getBucket(),
      Key: key,
      Body: body,
      ContentType: contentType,
    })
  );
}

function runFfmpeg(inputPath: string, outputDir: string): Promise<void> {
  return new Promise((resolve, reject) => {
    const args = [
      "-i", inputPath,
      "-filter_complex",
      "[0:v]split=3[v1][v2][v3];[v1]scale=w=640:h=360[v1out];[v2]scale=w=1280:h=720[v2out];[v3]scale=w=1920:h=1080[v3out]",
      "-map", "[v1out]", "-map", "0:a?",
      "-c:v", "libx264", "-b:v", "800k", "-c:a", "aac", "-b:a", "128k",
      "-f", "hls", "-hls_time", "6", "-hls_playlist_type", "vod",
      "-hls_segment_filename", join(outputDir, "360p_%03d.ts"),
      join(outputDir, "360p.m3u8"),
      "-map", "[v2out]", "-map", "0:a?",
      "-c:v", "libx264", "-b:v", "2500k", "-c:a", "aac", "-b:a", "128k",
      "-f", "hls", "-hls_time", "6", "-hls_playlist_type", "vod",
      "-hls_segment_filename", join(outputDir, "720p_%03d.ts"),
      join(outputDir, "720p.m3u8"),
      "-map", "[v3out]", "-map", "0:a?",
      "-c:v", "libx264", "-b:v", "5000k", "-c:a", "aac", "-b:a", "192k",
      "-f", "hls", "-hls_time", "6", "-hls_playlist_type", "vod",
      "-hls_segment_filename", join(outputDir, "1080p_%03d.ts"),
      join(outputDir, "1080p.m3u8"),
    ];

    const proc = spawn("ffmpeg", args, { stdio: ["ignore", "pipe", "pipe"] });
    let stderr = "";
    proc.stderr?.on("data", (d) => { stderr += d.toString(); });
    proc.on("close", (code) => {
      if (code === 0) resolve();
      else reject(new Error(`FFmpeg failed (${code}): ${stderr.slice(-500)}`));
    });
    proc.on("error", reject);
  });
}

async function createMasterPlaylist(outputDir: string) {
  const master = `#EXTM3U
#EXT-X-VERSION:3
#EXT-X-STREAM-INF:BANDWIDTH=800000,RESOLUTION=640x360
360p.m3u8
#EXT-X-STREAM-INF:BANDWIDTH=2500000,RESOLUTION=1280x720
720p.m3u8
#EXT-X-STREAM-INF:BANDWIDTH=5000000,RESOLUTION=1920x1080
1080p.m3u8
`;
  await writeFile(join(outputDir, "master.m3u8"), master);
}

export async function processVideoToHls(
  videoAssetId: string,
  localInputPath: string,
  courseId: string,
  lessonId: string
): Promise<void> {
  const client = getR2Client();
  const workDir = join(tmpdir(), `lumina-${randomUUID()}`);
  const hlsPrefix = buildHlsPrefix(courseId, lessonId);

  await db.videoAsset.update({
    where: { id: videoAssetId },
    data: { processingStatus: "PROCESSING" },
  });

  try {
    await mkdir(workDir, { recursive: true });
    await runFfmpeg(localInputPath, workDir);
    await createMasterPlaylist(workDir);

    const qualities = ["360p", "720p", "1080p"];
    const { readdir } = await import("fs/promises");
    const files = await readdir(workDir);

    if (client) {
      for (const file of files) {
        const body = await readFile(join(workDir, file));
        const contentType = file.endsWith(".m3u8")
          ? "application/vnd.apple.mpegurl"
          : "video/mp2t";
        await uploadFile(client, `${hlsPrefix}/${file}`, body, contentType);
      }
    }

    await db.videoAsset.update({
      where: { id: videoAssetId },
      data: {
        processingStatus: "COMPLETED",
        hlsManifestKey: `${hlsPrefix}/master.m3u8`,
        qualities,
      },
    });
  } catch (error) {
    await db.videoAsset.update({
      where: { id: videoAssetId },
      data: {
        processingStatus: "FAILED",
        processingError:
          error instanceof Error ? error.message : "Processing failed",
      },
    });
    throw error;
  } finally {
    await rm(workDir, { recursive: true, force: true }).catch(() => {});
  }
}
