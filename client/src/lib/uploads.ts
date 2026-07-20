// Media upload helper. When object storage (Vercel Blob) is configured on the
// server, large photos/audio upload DIRECTLY from the browser to Blob storage —
// bypassing the serverless request-body limit — and we store the returned URL.
// When it is not configured, we fall back to the original base64 data-URL flow,
// so local dev and any un-configured deployment keep working unchanged.

let cachedEnabled: boolean | null = null;

export async function blobUploadsEnabled(): Promise<boolean> {
  if (cachedEnabled !== null) return cachedEnabled;
  try {
    const res = await fetch("/api/uploads/status", { credentials: "include" });
    if (!res.ok) {
      cachedEnabled = false;
    } else {
      const json = await res.json();
      cachedEnabled = !!json.enabled;
    }
  } catch {
    cachedEnabled = false;
  }
  return cachedEnabled;
}

function dataUrlToBlob(dataUrl: string): Blob {
  const [header, base64] = dataUrl.split(",");
  const mimeMatch = header.match(/data:([^;]+)/);
  const mime = mimeMatch ? mimeMatch[1] : "application/octet-stream";
  const binary = atob(base64);
  const bytes = new Uint8Array(binary.length);
  for (let i = 0; i < binary.length; i++) bytes[i] = binary.charCodeAt(i);
  return new Blob([bytes], { type: mime });
}

async function blobToDataUrl(blob: Blob): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onloadend = () => resolve(reader.result as string);
    reader.onerror = reject;
    reader.readAsDataURL(blob);
  });
}

/**
 * Persist a piece of media and return a reference to store on the item.
 * - Blob enabled  → uploads directly to object storage, returns an https URL.
 * - Blob disabled → returns a base64 data URL (legacy behavior).
 *
 * Accepts either a data URL string (e.g. the output of client-side image
 * compression) or a File/Blob (e.g. an audio recording).
 */
export async function storeMedia(
  data: string | Blob,
  filename: string,
  adminPin?: string,
): Promise<string> {
  const enabled = await blobUploadsEnabled();

  if (!enabled) {
    if (typeof data === "string") return data; // already a data URL
    return blobToDataUrl(data);
  }

  const body = typeof data === "string" ? dataUrlToBlob(data) : data;
  const { upload } = await import("@vercel/blob/client");
  const result = await upload(filename, body, {
    access: "public",
    handleUploadUrl: "/api/uploads",
    clientPayload: JSON.stringify({ adminPin: adminPin ?? null }),
  });
  return result.url;
}

/** A reference is "newly uploaded" (vs. an unchanged existing `/api/...` path). */
export function isNewMediaRef(ref: string | null | undefined): boolean {
  return !!ref && !ref.startsWith("/api/");
}
