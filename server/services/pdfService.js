/**
 * PDF extraction using the official Mozilla pdf.js build (pdfjs-dist).
 *
 * Text items are grouped by their baseline Y coordinate and ordered by X, which
 * rebuilds readable lines even for multi-page resumes - important because the
 * resume parser works line by line.
 *
 * The same document pass also picks up the largest embedded raster image (the
 * profile photo on most resumes) and re-encodes it as PNG, so photos survive
 * regardless of whether the PDF stored them as JPEG or as a Flate bitmap.
 */
const zlib = require('zlib');

let pdfjsPromise;

const loadPdfjs = () => {
  if (!pdfjsPromise) {
    pdfjsPromise = import('pdfjs-dist/legacy/build/pdf.mjs');
  }
  return pdfjsPromise;
};

const reconstructLines = (items = []) => {
  const buckets = new Map();

  items.forEach((item) => {
    if (!item || typeof item.str !== 'string' || !item.str.trim()) return;
    const transform = item.transform || [1, 0, 0, 1, 0, 0];
    const x = transform[4];
    const y = transform[5];
    const key = Math.round(y / 2.5) * 2.5;
    if (!buckets.has(key)) buckets.set(key, []);
    buckets.get(key).push({ x, y, str: item.str, width: item.width || 0 });
  });

  return [...buckets.entries()]
    .sort((a, b) => b[0] - a[0])
    .map(([, lineItems]) => {
      lineItems.sort((a, b) => a.x - b.x);
      let line = '';
      let previous = null;
      lineItems.forEach((item) => {
        if (!previous) {
          line = item.str;
        } else {
          const gap = item.x - (previous.x + previous.width);
          const needsSpace = gap > 1 && !/\s$/.test(line) && !/^\s/.test(item.str);
          line += needsSpace ? ` ${item.str}` : item.str;
        }
        previous = item;
      });
      return line.replace(/\s+/g, ' ').trim();
    })
    .filter((line) => line.length > 0);
};

/* ------------------------------------------------------------------ */
/* Minimal PNG encoder (no native dependencies)                        */
/* ------------------------------------------------------------------ */

let crcTable;

const getCrcTable = () => {
  if (crcTable) return crcTable;
  crcTable = new Int32Array(256);
  for (let n = 0; n < 256; n += 1) {
    let c = n;
    for (let k = 0; k < 8; k += 1) c = c & 1 ? 0xedb88320 ^ (c >>> 1) : c >>> 1;
    crcTable[n] = c;
  }
  return crcTable;
};

const crc32 = (buffer) => {
  const table = getCrcTable();
  let crc = 0xffffffff;
  for (let i = 0; i < buffer.length; i += 1) crc = table[(crc ^ buffer[i]) & 0xff] ^ (crc >>> 8);
  return (crc ^ 0xffffffff) >>> 0;
};

const pngChunk = (type, data) => {
  const length = Buffer.alloc(4);
  length.writeUInt32BE(data.length, 0);
  const typeBuffer = Buffer.from(type, 'latin1');
  const crc = Buffer.alloc(4);
  crc.writeUInt32BE(crc32(Buffer.concat([typeBuffer, data])), 0);
  return Buffer.concat([length, typeBuffer, data, crc]);
};

const encodePng = (pixels, width, height, channels) => {
  const stride = width * channels;
  const raw = Buffer.alloc((stride + 1) * height);

  for (let y = 0; y < height; y += 1) {
    raw[y * (stride + 1)] = 0; // filter: none
    for (let x = 0; x < stride; x += 1) {
      raw[y * (stride + 1) + 1 + x] = pixels[y * stride + x];
    }
  }

  const ihdr = Buffer.alloc(13);
  ihdr.writeUInt32BE(width, 0);
  ihdr.writeUInt32BE(height, 4);
  ihdr[8] = 8; // bit depth
  ihdr[9] = channels === 4 ? 6 : 2; // colour type: RGBA / RGB
  ihdr[10] = 0;
  ihdr[11] = 0;
  ihdr[12] = 0;

  return Buffer.concat([
    Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]),
    pngChunk('IHDR', ihdr),
    pngChunk('IDAT', zlib.deflateSync(raw, { level: 9 })),
    pngChunk('IEND', Buffer.alloc(0)),
  ]);
};

/** RGB_24BPP (kind 2) or RGBA_32BPP (kind 3) image object -> PNG buffer. */
const imageToPng = (image) => {
  if (!image || !image.data || !image.width || !image.height) return null;
  const channels = image.kind === 2 ? 3 : image.kind === 3 ? 4 : 0;
  if (!channels) return null;
  try {
    return encodePng(image.data, image.width, image.height, channels);
  } catch (error) {
    return null;
  }
};

/** Upper bound for a stored photo; matches the limit enforced by the API. */
const MAX_PHOTO_BYTES = 400 * 1024;

const withTimeout = (promise, ms) =>
  Promise.race([promise, new Promise((resolve) => setTimeout(() => resolve(null), ms))]);

const resolveImage = (page, name) =>
  withTimeout(
    new Promise((resolve) => {
      try {
        page.objs.get(name, (image) => resolve(image || null));
      } catch (error) {
        resolve(null);
      }
    }),
    1200
  );

/** Largest plausible photo on the page, encoded as PNG. */
const extractPagePhoto = async (pdfjs, page) => {
  const ops = await page.getOperatorList();
  const candidates = [];

  for (let i = 0; i < ops.fnArray.length; i += 1) {
    const fn = ops.fnArray[i];
    if (fn !== pdfjs.OPS.paintImageXObject && fn !== pdfjs.OPS.paintInlineImageXObject) continue;

    const arg = ops.argsArray[i]?.[0];
    // eslint-disable-next-line no-await-in-loop
    const image = typeof arg === 'string' ? await resolveImage(page, arg) : arg;
    if (!image || !image.width || !image.height) continue;

    const area = image.width * image.height;
    const ratio = image.width / image.height;
    if (area < 9000 || image.width < 60 || image.height < 60) continue;
    if (ratio < 0.35 || ratio > 2.8) continue; // skip banners and rules
    candidates.push({ area, image });
  }

  candidates.sort((a, b) => b.area - a.area);
  for (const candidate of candidates) {
    const png = imageToPng(candidate.image);
    if (png) return { png, area: candidate.area };
  }
  return null;
};

/**
 * @param {Buffer} buffer raw PDF bytes
 * @returns {Promise<{ text: string, numPages: number, info: object, photo: string }>}
 */
const extractTextFromPdf = async (buffer) => {
  const pdfjs = await loadPdfjs();

  let document;
  let loadingTask;
  try {
    loadingTask = pdfjs.getDocument({
      data: new Uint8Array(buffer),
      useSystemFonts: true,
      isEvalSupported: false,
      disableFontFace: true,
      verbosity: 0,
    });
    document = await loadingTask.promise;
  } catch (error) {
    if (/password/i.test(error?.message || '')) {
      throw new Error('This PDF is password protected. Please upload an unlocked PDF.');
    }
    throw new Error('Unable to read this PDF. The file may be corrupted or not a real PDF.');
  }

  const pageTexts = [];
  let bestPhoto = null;
  const numPages = document.numPages;

  // Prefer the original JPEG stream. Re-encoding a photo to PNG inflates small
  // JPEGs and can push an otherwise fine photo over the storage cap.
  const embeddedJpeg = extractEmbeddedJpeg(buffer);
  const jpegPhoto = embeddedJpeg && embeddedJpeg.length <= MAX_PHOTO_BYTES ? embeddedJpeg : null;

  try {
    for (let pageNumber = 1; pageNumber <= numPages; pageNumber += 1) {
      // eslint-disable-next-line no-await-in-loop
      const page = await document.getPage(pageNumber);
      // eslint-disable-next-line no-await-in-loop
      const content = await page.getTextContent();
      pageTexts.push(reconstructLines(content.items).join('\n'));

      // A photo normally lives on the first page; stop looking after page two.
      // The PNG path is only for PDFs that embed no JPEG at all.
      if (!embeddedJpeg && pageNumber <= 2) {
        // eslint-disable-next-line no-await-in-loop
        const photo = await extractPagePhoto(pdfjs, page).catch(() => null);
        if (photo && (!bestPhoto || photo.area > bestPhoto.area)) bestPhoto = photo;
      }

      page.cleanup();
    }
  } finally {
    if (loadingTask && typeof loadingTask.destroy === 'function') {
      await loadingTask.destroy();
    } else if (typeof document.destroy === 'function') {
      await document.destroy();
    }
  }

  const text = pageTexts
    .join('\n\n')
    .replace(/\r\n?/g, '\n')
    .replace(/[ \t]+/g, ' ')
    .replace(/\n{3,}/g, '\n\n')
    .trim();

  let photo = '';
  if (jpegPhoto) {
    photo = `data:image/jpeg;base64,${jpegPhoto.toString('base64')}`;
  } else if (!embeddedJpeg && bestPhoto && bestPhoto.png.length <= MAX_PHOTO_BYTES) {
    photo = `data:image/png;base64,${bestPhoto.png.toString('base64')}`;
  }

  return { text, numPages, info: {}, photo };
};

/**
 * Fallback: lift a JPEG straight out of the PDF bytes (DCTDecode streams).
 *
 * @param {Buffer} buffer raw PDF bytes
 * @returns {Buffer|null} JPEG bytes, or null when the PDF embeds no photo
 */
const extractEmbeddedJpeg = (buffer) => {
  if (!Buffer.isBuffer(buffer) || buffer.length < 1024) return null;

  let best = null;
  for (let i = 0; i < buffer.length - 3; i += 1) {
    if (buffer[i] !== 0xff || buffer[i + 1] !== 0xd8 || buffer[i + 2] !== 0xff) continue;

    const limit = Math.min(buffer.length - 1, i + 6 * 1024 * 1024);
    for (let j = i + 2; j < limit; j += 1) {
      if (buffer[j] === 0xff && buffer[j + 1] === 0xd9) {
        const length = j + 2 - i;
        // Skip tiny thumbnails and decorative icons.
        if (length > 6000 && (!best || length > best.length)) best = buffer.subarray(i, j + 2);
        i = j + 1;
        break;
      }
    }
  }

  return best ? Buffer.from(best) : null;
};

module.exports = { extractTextFromPdf, reconstructLines, extractEmbeddedJpeg };
