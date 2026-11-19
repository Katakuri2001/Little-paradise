/* eslint-disable @typescript-eslint/no-explicit-any */
/**
 * Audio metadata extraction utility.
 *
 * Extracts duration and format from audio buffers without external dependencies.
 * Supports MP3 (ID3v2 TLEN frame) and M4A/MP4 (moov/mvhd atom).
 * Falls back to undefined duration when metadata cannot be parsed.
 */
export interface AudioMetadata {
  format: "mp3" | "m4a" | "unknown";
  durationMs?: number;
  durationSeconds?: number;
}

export function extractMetadata(
  buffer: ArrayBuffer | Uint8Array,
  contentType: string,
): AudioMetadata {
  const bytes = new Uint8Array(buffer);
  console.error("DEBUG extractMetadata: bytes.length=", bytes.length);
  console.error("DEBUG extractMetadata: bytes[0..9]=", Array.from(bytes.slice(0, 10)));
  console.error("DEBUG extractMetadata: contentType=", contentType);

  // Detect format from MIME type or magic bytes
  const format = detectFormat(contentType, bytes);
  console.error("DEBUG extractMetadata: format=", format);

  if (format === "mp3") {
    return parseID3v2(bytes);
  }

  if (format === "m4a") {
    return parseMP4(bytes);
  }

  return { format: "unknown" };
}

function detectFormat(
  contentType: string,
  bytes: Uint8Array,
): "mp3" | "m4a" | "unknown" {
  const ct = contentType.toLowerCase();

  if (ct.includes("mp3") || ct.includes("mpeg")) {
    return "mp3";
  }

  if (
    ct.includes("mp4") ||
    ct.includes("m4a") ||
    ct.includes("aac") ||
    ct.includes("quicktime")
  ) {
    return "m4a";
  }

  // Fallback: detect from magic bytes
  if (
    bytes[0] === 0x49 &&
    bytes[1] === 0x44 &&
    bytes[2] === 0x33
  ) {
    return "mp3";
  }

  // MP4 boxes start with size (4 bytes) + type (4 bytes)
  if (bytes.length > 8) {
    const type = String.fromCharCode(bytes[4], bytes[5], bytes[6], bytes[7]);
    if (type === "moov" || type === "ftyp") {
      return "m4a";
    }
  }

  return "unknown";
}

function parseID3v2(bytes: Uint8Array): AudioMetadata {
  // ID3v2 header: "ID3" + version (2 bytes) + flags (1 byte) + size (4 bytes, synchsafe)
  if (bytes.length < 10) {
    return { format: "mp3" };
  }

  const id3 = bytes[0] === 0x49 && bytes[1] === 0x44 && bytes[2] === 0x33;
  if (!id3) {
    return { format: "mp3" };
  }

  console.error("DEBUG parseID3v2: bytes.length=", bytes.length);

  // Scan for TLEN frame within ID3v2 tag
  // Skip header (10 bytes)
  let offset = 10;
  const tagSize = readSynchsafeInt(bytes, 6) + 10; // total tag size including header

  console.error("DEBUG parseID3v2: tagSize=", tagSize, "tagEnd=", Math.min(tagSize, bytes.length));

  while (offset + 10 < tagSize && offset + 10 < bytes.length) {
    const frameId = String.fromCharCode(
      bytes[offset],
      bytes[offset + 1],
      bytes[offset + 2],
      bytes[offset + 3],
    );
    const frameSize = readSynchsafeInt(bytes, offset + 4);

    console.error("DEBUG parseID3v2: frameId=", frameId, "frameSize=", frameSize, "offset=", offset);

    if (frameId === "TLEN") {
      // TLEN frame: 4 bytes size + 2 bytes flags + data
      const frameDataStart = offset + 10;
      if (frameDataStart + 4 <= bytes.length) {
        const durationMs = parseInt(
          String.fromCharCode(
            bytes[frameDataStart],
            bytes[frameDataStart + 1],
            bytes[frameDataStart + 2],
            bytes[frameDataStart + 3],
          ),
          10,
        );
        console.error("DEBUG parseID3v2: found TLEN, durationMs=", durationMs);
        return { format: "mp3", durationMs };
      }
    }

    offset += frameSize + 10; // frame header (10 bytes) + frame data
  }

  console.error("DEBUG parseID3v2: returning without duration");
  return { format: "mp3" };
}

function readSynchsafeInt(bytes: Uint8Array, offset: number): number {
  const result =
    ((bytes[offset] & 0x7f) << 21) |
    ((bytes[offset + 1] & 0x7f) << 14) |
    ((bytes[offset + 2] & 0x7f) << 7) |
    (bytes[offset + 3] & 0x7f);
  console.error("DEBUG readSynchsafeInt: offset=", offset, "bytes=", bytes[offset], bytes[offset+1], bytes[offset+2], bytes[offset+3], "result=", result);
  return result;
}

function parseMP4(bytes: Uint8Array): AudioMetadata {
  // MP4 is composed of boxes: [size (4 bytes)][type (4 bytes)][data]
  // We need to find the 'moov' box, then 'mvhd' box inside it, then read duration

  let offset = 0;

  while (offset + 8 <= bytes.length) {
    const boxSize = readUInt32BE(bytes, offset);
    const boxType = String.fromCharCode(
      bytes[offset + 4],
      bytes[offset + 5],
      bytes[offset + 6],
      bytes[offset + 7],
    );

    if (boxType === "moov") {
      // Found moov box, search for mvhd inside
      const moovEnd = offset + boxSize;
      const mvhdResult = findMVHD(bytes, offset + 8, moovEnd);
      if (mvhdResult) {
        return { format: "m4a", durationMs: mvhdResult, durationSeconds: mvhdResult / 1000 };
      }
      return { format: "m4a" };
    }

    if (boxSize <= 0) {
      break; // Prevent infinite loop
    }

    offset += boxSize;
  }

  return { format: "m4a" };
}

function findMVHD(bytes: Uint8Array, start: number, end: number): number | undefined {
  let offset = start;

  while (offset + 8 <= end && offset + 8 <= bytes.length) {
    const boxSize = readUInt32BE(bytes, offset);
    const boxType = String.fromCharCode(
      bytes[offset + 4],
      bytes[offset + 5],
      bytes[offset + 6],
      bytes[offset + 7],
    );

    if (boxType === "mvhd") {
      // mvhd box: [size (4)][type (4)][version (1)][flags (3)][creation_time (4)][modification_time (4)][timescale (4)][duration (4)]
      const version = bytes[offset + 8];
      const dataStart = offset + 8; // points to version+flags

      if (version === 1) {
        // Version 1: 64-bit timescale and duration
        const timescale = readUInt64BE(bytes, dataStart + 12);
        const duration = readUInt64BE(bytes, dataStart + 16);
        return timescale > 0 ? Math.round((duration / timescale) * 1000) : undefined;
      } else {
        // Version 0: 32-bit timescale and duration
        const timescale = readUInt32BE(bytes, dataStart + 12);
        const duration = readUInt32BE(bytes, dataStart + 16);
        return timescale > 0 ? Math.round((duration / timescale) * 1000) : undefined;
      }
    }

    if (boxSize <= 0) {
      break; // Prevent infinite loop
    }

    // Recurse into container boxes like 'moov', 'trak', 'mdia', 'minf'
    if (boxType === "moov" || boxType === "trak" || boxType === "mdia" || boxType === "minf") {
      const boxEnd = Math.min(offset + boxSize, end, bytes.length);
      const result = findMVHD(bytes, offset + 8, boxEnd);
      if (result !== undefined) {
        return result;
      }
    }

    offset += boxSize;
  }

  return undefined;
}

function readUInt32BE(bytes: Uint8Array, offset: number): number {
  return (
    (bytes[offset] << 24) |
    (bytes[offset + 1] << 16) |
    (bytes[offset + 2] << 8) |
    bytes[offset + 3]
  );
}

function readUInt64BE(bytes: Uint8Array, offset: number): number {
  const high = readUInt32BE(bytes, offset);
  const low = readUInt32BE(bytes, offset + 4);
  return high * 0x100000000 + low;
}