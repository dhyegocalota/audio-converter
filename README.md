# 🎧 Audio Converter

Tiny self-hosted HTTP API that turns any audio or video file into a lightweight MP3.

Send a voice note, a podcast recording or a screen capture, get back a small mono MP3 that
plays everywhere. One file of TypeScript, powered by [Bun](https://bun.sh) and
[FFmpeg](https://ffmpeg.org).

[![License: MIT](https://img.shields.io/badge/license-MIT-blue.svg)](LICENSE)
[![Bun](https://img.shields.io/badge/runtime-Bun-f9f1e1?logo=bun&logoColor=black)](https://bun.sh)
[![FFmpeg](https://img.shields.io/badge/powered%20by-FFmpeg-007808?logo=ffmpeg&logoColor=white)](https://ffmpeg.org)
[![Docker](https://img.shields.io/badge/docker-ready-2496ED?logo=docker&logoColor=white)](#-docker)

## ✨ Features

- **One endpoint**: `POST /convert` with a file, receive an MP3
- **Audio and video in**: MP3, WAV, FLAC, AAC, OGG, M4A, MP4, AVI, MKV, MOV, WMV, FLV and WebM
- **Real format detection**: reads the file's magic bytes, never trusts the extension
- **MP3 passthrough**: an MP3 comes back untouched, no re-encoding
- **Small output**: mono, 44.1 kHz, 128 kbps, ideal for speech and transcription pipelines
- **API key auth** through the `x-api-key` header
- **Docker ready**, with FFmpeg already inside the image

## 🚀 Quick start

Requirements: [Bun](https://bun.sh) and [FFmpeg](https://ffmpeg.org) on your `PATH`.

```bash
git clone https://github.com/dhyegocalota/audio-converter.git
cd audio-converter
bun install
cp .env.example .env
bun start
```

The server listens on `http://localhost:3000`.

## ⚙️ Configuration

| Variable | Required | Default | Description |
|---|---|---|---|
| `API_KEY` | Yes | | Secret every request must send in the `x-api-key` header. The server refuses to start without it |
| `PORT` | No | `3000` | Port the HTTP server listens on |

## 📡 API

### `POST /convert`

| | |
|---|---|
| **Headers** | `x-api-key: <your API_KEY>` |
| **Body** | `multipart/form-data` with the file in the `file` field |
| **Response** | `audio/mpeg`, with `Content-Disposition` set to the original name ending in `.mp3` |

```bash
curl -X POST http://localhost:3000/convert \
  -H "x-api-key: your_api_key_here" \
  -F "file=@meeting.mp4" \
  --output meeting.mp3
```

### Responses

| Status | When |
|---|---|
| `200` | Converted MP3, or the original file when it already was an MP3 |
| `400` | Missing `file`, body is not `multipart/form-data`, or unsupported format |
| `401` | Missing or wrong `x-api-key` |
| `404` | Any other path or method |
| `500` | FFmpeg failed to convert the file |

### Output format

| Setting | Value |
|---|---|
| Codec | MP3 |
| Channels | Mono |
| Sample rate | 44.1 kHz |
| Bitrate | 128 kbps (constant) |
| Video | Dropped, only the audio track is kept |
| Tags | ID3v2.3 |

## 🐳 Docker

```bash
docker build -t audio-converter .
docker run -p 3000:3000 -e API_KEY=your_api_key_here audio-converter
```

With Docker Compose:

```yaml
services:
  audio-converter:
    build: .
    ports:
      - "3000:3000"
    environment:
      - API_KEY=your_api_key_here
```

The image also works as is on platforms that build from a `Dockerfile`, such as
[Dokploy](https://dokploy.com), Railway or Fly.io. Set `API_KEY` in the platform's environment.

## 🔍 How it works

1. The upload is read into memory and its type is detected from the file's magic bytes.
2. MP3 files are returned as they are.
3. Anything else is written to a temporary file in `/tmp`, piped through FFmpeg, and the
   temporary file is deleted once the response is ready.

Uploads are held in memory while they are processed, so put a request size limit in your
reverse proxy if the service is exposed to the internet.

## 📄 License

[MIT](LICENSE) © Dhyego Calota
