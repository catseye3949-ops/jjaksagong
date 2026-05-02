/**
 * Browser-only: resize + JPEG compress so stored data URLs stay small (localStorage).
 */

const MAX_STORE_BYTES = 2 * 1024 * 1024;
const TARGET_MAX_BYTES = 1 * 1024 * 1024;

function dataUrlByteLength(dataUrl: string): number {
  const comma = dataUrl.indexOf(",");
  if (comma === -1) return dataUrl.length * 0.75;
  const base64 = dataUrl.slice(comma + 1);
  const padding = base64.endsWith("==") ? 2 : base64.endsWith("=") ? 1 : 0;
  return (base64.length * 3) / 4 - padding;
}

function loadImage(src: string): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.onload = () => resolve(img);
    img.onerror = () => reject(new Error("이미지를 불러올 수 없습니다."));
    img.src = src;
  });
}

export type CompressPartnerPhotoResult =
  | { ok: true; dataUrl: string }
  | { ok: false; error: string };

/**
 * Produces a JPEG data URL at most TARGET_MAX_BYTES when possible,
 * never returns if final size still exceeds MAX_STORE_BYTES.
 */
export async function compressPartnerPhotoFile(
  file: File,
): Promise<CompressPartnerPhotoResult> {
  if (typeof window === "undefined") {
    return { ok: false, error: "브라우저에서만 처리할 수 있습니다." };
  }
  if (!file.type.startsWith("image/")) {
    return { ok: false, error: "이미지 파일만 선택할 수 있습니다." };
  }

  const objectUrl = URL.createObjectURL(file);
  try {
    const img = await loadImage(objectUrl);
    const maxSideSizes = [1024, 896, 768, 640, 512, 384];

    for (const maxSide of maxSideSizes) {
      let w = img.naturalWidth;
      let h = img.naturalHeight;
      if (!w || !h) {
        return { ok: false, error: "이미지 크기를 읽을 수 없습니다." };
      }
      const scale = Math.min(1, maxSide / Math.max(w, h));
      w = Math.round(w * scale);
      h = Math.round(h * scale);

      const canvas = document.createElement("canvas");
      canvas.width = w;
      canvas.height = h;
      const ctx = canvas.getContext("2d");
      if (!ctx) {
        return { ok: false, error: "이미지 처리를 초기화할 수 없습니다." };
      }
      ctx.drawImage(img, 0, 0, w, h);

      let quality = 0.88;
      while (quality >= 0.42) {
        const dataUrl = canvas.toDataURL("image/jpeg", quality);
        const bytes = dataUrlByteLength(dataUrl);
        if (bytes <= TARGET_MAX_BYTES) {
          if (bytes <= MAX_STORE_BYTES) {
            return { ok: true, dataUrl };
          }
          break;
        }
        quality -= 0.06;
      }

      const lastAttempt = canvas.toDataURL("image/jpeg", 0.4);
      if (dataUrlByteLength(lastAttempt) <= MAX_STORE_BYTES) {
        return { ok: true, dataUrl: lastAttempt };
      }
    }

    return {
      ok: false,
      error:
        "용량을 줄여도 너무 큽니다. 다른 사진을 선택하거나 해상도가 낮은 이미지를 사용해 주세요.",
    };
  } finally {
    URL.revokeObjectURL(objectUrl);
  }
}
