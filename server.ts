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
    const startTime = Date.now();

    if (url.pathname !== "/convert") {
      console.log(`404 ${request.method} ${url.pathname}`);
      return new Response("Not found", { status: 404 });
    }

    if (request.method !== "POST") {
      console.log(`404 ${request.method} ${url.pathname}`);
      return new Response("Not found", { status: 404 });
    }

    const apiKey = request.headers.get("x-api-key");
    if (apiKey !== API_KEY) {
      console.log("401 Unauthorized - Invalid API key");
      return new Response("Unauthorized", { status: 401 });
    }

    console.log(`POST /convert - Request received`);

    const contentType = request.headers.get("content-type");
    if (!contentType?.includes("multipart/form-data")) {
      return new Response("Content-Type must be multipart/form-data", { status: 400 });
    }

    try {
      const formData = await request.formData();
      const file = formData.get("file") as File;

      if (!file) {
        console.log("400 No file provided");
        return new Response("No file provided", { status: 400 });
      }

      console.log(`File received: ${file.name} (${(file.size / 1024).toFixed(2)} KB)`);

      const inputBuffer = await file.arrayBuffer();
      const fileType = await fileTypeFromBuffer(new Uint8Array(inputBuffer));

      if (!fileType || !AUDIO_VIDEO_MIME_TYPES.includes(fileType.mime)) {
        console.log(`400 Unsupported format: ${fileType?.mime || "unknown"}`);
        return new Response("Unsupported file format", { status: 400 });
      }

      console.log(`Detected format: ${fileType.mime}`);

      const outputFilename = generateOutputFilename(file.name);

      if (fileType.mime === "audio/mpeg" || fileType.mime === "audio/mp3") {
        const duration = Date.now() - startTime;
        console.log(`200 MP3 passthrough - ${file.name} (${duration}ms)`);
        return new Response(inputBuffer, {
          headers: {
            "Content-Type": "audio/mpeg",
            "Content-Disposition": `attachment; filename="${outputFilename}"`,
          },
        });
      }

      console.log(`Converting ${fileType.mime} to MP3...`);

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
        console.log(`500 Conversion failed - Exit code: ${process.exitCode}`);
        return new Response("Conversion failed", { status: 500 });
      }

      const outputSize = (output.byteLength / 1024).toFixed(2);
      const inputSize = (inputBuffer.byteLength / 1024).toFixed(2);
      const reduction = Math.round((1 - output.byteLength / inputBuffer.byteLength) * 100);
      const duration = Date.now() - startTime;

      console.log(`200 Converted ${file.name} - ${inputSize}KB → ${outputSize}KB (${reduction}% reduction) in ${duration}ms`);

      return new Response(output, {
        headers: {
          "Content-Type": "audio/mpeg",
          "Content-Disposition": `attachment; filename="${outputFilename}"`,
        },
      });
    } catch (error) {
      const duration = Date.now() - startTime;
      console.error(`500 Internal error after ${duration}ms:`, error);
      return new Response("Internal server error", { status: 500 });
    }
  },
});

console.log(`Server running on http://localhost:${PORT}`);
