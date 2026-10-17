"use client";

import { useRef, useState } from "react";
import { btnGhost, label } from "./ui";

/**
 * Media picker → signed direct upload to Cloudinary with per-file progress,
 * thumbnail/video previews, and removal (which also deletes the asset from
 * Cloudinary after a confirmation).
 *
 * The file goes browser → Cloudinary (the server only signs the request), so
 * no serverless body-size limit applies to videos.
 */

const MAX_IMAGE_BYTES = 12 * 1024 * 1024; // Cloudinary free tier allows more; keep uploads snappy
const MAX_VIDEO_BYTES = 100 * 1024 * 1024;
const ACCEPT = "image/*,video/*";

function uploadToCloudinary(file, signature, onProgress) {
  return new Promise((resolve, reject) => {
    const form = new FormData();
    form.append("file", file);
    form.append("api_key", signature.apiKey);
    form.append("timestamp", String(signature.timestamp));
    form.append("folder", signature.folder);
    form.append("signature", signature.signature);

    const xhr = new XMLHttpRequest();
    xhr.open("POST", signature.uploadUrl);
    xhr.upload.onprogress = (event) => {
      if (event.lengthComputable) {
        onProgress(Math.round((event.loaded / event.total) * 100));
      }
    };
    xhr.onload = () => {
      try {
        const data = JSON.parse(xhr.responseText);
        if (xhr.status >= 200 && xhr.status < 300) resolve(data);
        else reject(new Error(data?.error?.message || `Upload failed (${xhr.status})`));
      } catch {
        reject(new Error("Upload failed: invalid response"));
      }
    };
    xhr.onerror = () => reject(new Error("Network error during upload"));
    xhr.send(form);
  });
}

function toMediaItem(result) {
  const resourceType = result.resource_type === "video" ? "video" : "image";
  return {
    provider: "cloudinary",
    publicId: result.public_id,
    url: result.url || result.secure_url,
    secureUrl: result.secure_url || result.url,
    resourceType,
    format: result.format || "",
    bytes: result.bytes || 0,
    width: result.width || 0,
    height: result.height || 0,
    duration: result.duration || 0,
  };
}

export default function MediaUploader({ media, onChange, postId, postIsSaved }) {
  const inputRef = useRef(null);
  const [uploads, setUploads] = useState([]); // { name, progress, error }
  const [signatureError, setSignatureError] = useState("");
  const [busy, setBusy] = useState(false);

  function updateUpload(index, patch) {
    setUploads((prev) => prev.map((u, i) => (i === index ? { ...u, ...patch } : u)));
  }

  async function getSignature() {
    const res = await fetch("/api/admin/upload-signature", { method: "POST" });
    const data = await res.json().catch(() => ({}));
    if (!res.ok || !data.ok) {
      throw new Error(data.message || "Uploads are not available (server not configured).");
    }
    return data;
  }

  async function handleFiles(event) {
    const files = Array.from(event.target.files || []);
    event.target.value = ""; // allow re-selecting the same file
    if (files.length === 0) return;

    setSignatureError("");
    setBusy(true);

    // One signature per batch (valid while the timestamp stays fresh).
    let signature;
    try {
      signature = await getSignature();
    } catch (err) {
      setSignatureError(err.message);
      setBusy(false);
      return;
    }

    const added = [];
    const baseIndex = uploads.length;
    let processed = 0;
    for (const file of files) {
      const isVideo = file.type.startsWith("video/");
      const max = isVideo ? MAX_VIDEO_BYTES : MAX_IMAGE_BYTES;
      if (file.size > max) {
        setUploads((prev) => [
          ...prev,
          { name: file.name, progress: 100, error: `Too large (max ${Math.round(max / 1024 / 1024)} MB)` },
        ]);
        processed += 1;
        continue;
      }

      setUploads((prev) => [...prev, { name: file.name, progress: 0, error: "" }]);
      const index = baseIndex + processed;
      processed += 1;
      try {
        const result = await uploadToCloudinary(file, signature, (progress) =>
          updateUpload(index, { progress })
        );
        added.push(toMediaItem(result));
        updateUpload(index, { progress: 100, done: true });
      } catch (err) {
        updateUpload(index, { error: err.message });
      }
    }

    if (added.length > 0) onChange([...media, ...added]);
    setBusy(false);
    // Drop finished entries shortly after so the list doesn't grow forever.
    setTimeout(() => {
      setUploads((prev) => prev.filter((u) => !u.done && !u.error));
    }, 1500);
  }

  async function removeMedia(item) {
    const confirmed = window.confirm(
      "Remove this photo/video from the post? The file will also be deleted from cloud storage."
    );
    if (!confirmed) return;

    setBusy(true);
    try {
      if (postIsSaved) {
        // Already attached to a saved post: detach + destroy server-side.
        await fetch("/api/admin/media/destroy", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            publicId: item.publicId,
            resourceType: item.resourceType,
            postId,
          }),
        });
      } else {
        // Not saved yet: destroy the orphan directly.
        await fetch("/api/admin/media/destroy", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            publicId: item.publicId,
            resourceType: item.resourceType,
          }),
        });
      }
      onChange(media.filter((m) => m.publicId !== item.publicId));
    } catch {
      // Still remove from the local list; a failed destroy just leaves an orphan.
      onChange(media.filter((m) => m.publicId !== item.publicId));
    } finally {
      setBusy(false);
    }
  }

  return (
    <div>
      <span className={label}>Photos & videos</span>

      <div className="flex flex-wrap items-center gap-3">
        <button
          type="button"
          className={btnGhost}
          disabled={busy}
          onClick={() => inputRef.current?.click()}
        >
          {busy ? "Uploading…" : "+ Add files"}
        </button>
        <span className="text-[11px] text-muted">
          Images up to 12 MB, videos up to 100 MB. Multiple files allowed.
        </span>
      </div>
      <input
        ref={inputRef}
        type="file"
        accept={ACCEPT}
        multiple
        className="hidden"
        onChange={handleFiles}
      />

      {signatureError && (
        <p className="mt-2 rounded-lg bg-red-50 px-3 py-2 text-xs font-medium text-red-700">
          {signatureError}
        </p>
      )}

      {/* Progress list */}
      {uploads.length > 0 && (
        <ul className="mt-3 space-y-2">
          {uploads.map((upload, i) => (
            <li key={`${upload.name}-${i}`} className="rounded-lg border border-line bg-white px-3 py-2">
              <div className="flex items-center justify-between gap-3 text-xs">
                <span className="truncate font-medium text-foreground">{upload.name}</span>
                <span className="shrink-0 text-muted">
                  {upload.error ? upload.error : `${upload.progress}%`}
                </span>
              </div>
              {!upload.error && (
                <div className="mt-1 h-1.5 overflow-hidden rounded-full bg-line">
                  <div
                    className="h-full rounded-full bg-brand transition-all"
                    style={{ width: `${upload.progress}%` }}
                  />
                </div>
              )}
            </li>
          ))}
        </ul>
      )}

      {/* Previews */}
      {media.length > 0 ? (
        <ul className="mt-3 grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4">
          {media.map((item) => (
            <li key={item.publicId} className="group relative overflow-hidden rounded-xl border border-line bg-brand-soft">
              <div className="aspect-[4/3]">
                {item.resourceType === "video" ? (
                  <video
                    src={item.secureUrl || item.url}
                    muted
                    preload="metadata"
                    className="h-full w-full object-cover"
                  />
                ) : (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img
                    src={item.secureUrl || item.url}
                    alt=""
                    className="h-full w-full object-cover"
                  />
                )}
              </div>
              <div className="absolute inset-x-0 bottom-0 flex items-center justify-between bg-black/55 px-2 py-1 opacity-0 transition group-hover:opacity-100">
                <span className="text-[10px] font-medium uppercase text-white">
                  {item.resourceType}
                </span>
                <button
                  type="button"
                  disabled={busy}
                  onClick={() => removeMedia(item)}
                  className="rounded bg-red-600 px-2 py-0.5 text-[10px] font-bold text-white hover:bg-red-500"
                >
                  Remove
                </button>
              </div>
            </li>
          ))}
        </ul>
      ) : (
        <p className="mt-3 rounded-lg border border-dashed border-line px-3 py-4 text-center text-xs text-muted">
          No media yet — the gallery stays empty until you upload something.
        </p>
      )}
    </div>
  );
}
