# Audio Converter

Simple HTTP API to convert audio/video files to M4A (AAC).

## Setup

1. Copy `.env.example` to `.env`:
```bash
cp .env.example .env
```

2. Set your API key in `.env`:
```
API_KEY=your_secret_api_key
PORT=3000
```

## Run

```bash
bun start
```

## API Usage

**Endpoint:** `POST /convert`

**Headers:**
- `x-api-key`: Your API key from `.env`
- `Content-Type`: `multipart/form-data`

**Body:**
- `file`: Audio or video file

**Supported Formats:**
- Audio: MP3, WAV, FLAC, AAC, OGG, M4A
- Video: MP4, AVI, MKV, MOV, WMV, FLV, WebM

**Response:**
- Optimized M4A file (AAC codec, 128 kbps, 44.1 kHz, stereo)
- Better compression and quality compared to MP3
- WhatsApp-optimized format for voice messages
- If input is already M4A, returns original file without conversion

### Examples

Convert MP4 to M4A:
```bash
curl -X POST http://localhost:3000/convert \
  -H "x-api-key: your_secret_api_key" \
  -F "file=@video.mp4" \
  --output audio.m4a
```

Convert WAV to M4A:
```bash
curl -X POST http://localhost:3000/convert \
  -H "x-api-key: your_secret_api_key" \
  -F "file=@audio.wav" \
  --output audio.m4a
```

## Requirements

- Bun
- FFmpeg

## Deployment

### Docker

Build and run:
```bash
docker build -t audio-converter .
docker run -p 3000:3000 -e API_KEY=your_secret_api_key audio-converter
```

Or use Docker Compose:
```yaml
version: '3.8'
services:
  audio-converter:
    build: .
    ports:
      - "3000:3000"
    environment:
      - API_KEY=your_secret_api_key
      - PORT=3000
```

### Dokploy

1. Create a new application in Dokploy

2. In the application settings:
   - **Build Type**: Select "Dockerfile"

3. Set environment variables:
   - `API_KEY`: your_secret_api_key
   - `PORT`: (automatically set by Dokploy)

4. Deploy from your Git repository

## Notes

- File type detection uses magic headers (not file extensions)
- Pure in-memory streaming (no disk writes)
- All other endpoints and methods return 404
- PORT environment variable is automatically set by Dokploy
- M4A (AAC) provides ~30% better compression than MP3 at equivalent quality
- Output uses fragmented MP4 format for efficient streaming
- WhatsApp natively supports M4A for voice messages on all platforms
