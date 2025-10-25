#!/usr/bin/env bun

import { fileTypeFromBuffer } from "file-type";

const API_KEY = process.env.API_KEY;
const PORT = Number(process.env.PORT) || 3000;
const AUDIO_VIDEO_MIME_TYPES = [
  "audio/mpeg",
  "audio/mp3",
  "audio/wav",
  "audio/x-wav",
  "audio/flac",
  "audio/aac",
  "audio/ogg",
  "audio/x-m4a",
  "video/mp4",
  "video/x-msvideo",
  "video/x-matroska",
  "video/quicktime",
  "video/x-ms-wmv",
  "video/x-flv",
  "video/webm",
];

if (!API_KEY) {
  console.error("API_KEY is required in .env");
  process.exit(1);
}

function generateOutputFilename(inputFilename: string): string {
  const lastDotIndex = inputFilename.lastIndexOf(".");
  return lastDotIndex > 0
    ? inputFilename.substring(0, lastDotIndex) + ".mp3"
    : inputFilename + ".mp3";
}

const server = Bun.serve({
  port: PORT,
  async fetch(request) {
    const url = new URL(request.url);

    if (url.pathname !== "/convert") {
      return new Response("Not found", { status: 404 });
    }

    if (request.method !== "POST") {
      return new Response("Not found", { status: 404 });
    }

    const apiKey = request.headers.get("x-api-key");
    if (apiKey !== API_KEY) {
      return new Response("Unauthorized", { status: 401 });
    }

    const contentType = request.headers.get("content-type");
    if (!contentType?.includes("multipart/form-data")) {
      return new Response("Content-Type must be multipart/form-data", { status: 400 });
    }

    try {
      const formData = await request.formData();
      const file = formData.get("file") as File;

      if (!file) {
        return new Response("No file provided", { status: 400 });
      }

      const inputBuffer = await file.arrayBuffer();
      const fileType = await fileTypeFromBuffer(new Uint8Array(inputBuffer));

      if (!fileType || !AUDIO_VIDEO_MIME_TYPES.includes(fileType.mime)) {
        return new Response("Unsupported file format", { status: 400 });
      }

      const outputFilename = generateOutputFilename(file.name);

      if (fileType.mime === "audio/mpeg" || fileType.mime === "audio/mp3") {
        return new Response(inputBuffer, {
          headers: {
            "Content-Type": "audio/mpeg",
            "Content-Disposition": `attachment; filename="${outputFilename}"`,
          },
        });
      }

      const process = Bun.spawn([
        "ffmpeg",
        "-i",
        "pipe:0",
        "-vn",
        "-ar",
        "44100",
        "-ac",
        "2",
        "-q:a",
        "2",
        "-compression_level",
        "9",
        "-id3v2_version",
        "3",
        "-f",
        "mp3",
        "pipe:1",
      ], {
        stdin: "pipe",
        stdout: "pipe",
        stderr: "pipe",
      });

      process.stdin.write(inputBuffer);
      process.stdin.end();

      const output = await new Response(process.stdout).arrayBuffer();
      await process.exited;

      if (process.exitCode !== 0) {
        return new Response("Conversion failed", { status: 500 });
      }

      return new Response(output, {
        headers: {
          "Content-Type": "audio/mpeg",
          "Content-Disposition": `attachment; filename="${outputFilename}"`,
        },
      });
    } catch (error) {
      return new Response("Internal server error", { status: 500 });
    }
  },
});

console.log(`Server running on http://localhost:${PORT}`);
