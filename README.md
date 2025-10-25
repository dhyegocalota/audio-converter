# Audio Converter

Simple HTTP API to convert audio/video files to MP3.

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
- MP3 file (192 kbps, 44.1 kHz, stereo)
- If input is already MP3, returns original file without conversion

### Examples

Convert MP4 to MP3:
```bash
curl -X POST http://localhost:3000/convert \
  -H "x-api-key: your_secret_api_key" \
  -F "file=@video.mp4" \
  --output audio.mp3
```

Convert WAV to MP3:
```bash
curl -X POST http://localhost:3000/convert \
  -H "x-api-key: your_secret_api_key" \
  -F "file=@audio.wav" \
  --output audio.mp3
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
