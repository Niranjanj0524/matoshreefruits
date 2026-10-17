"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import {
  btnGhost,
  btnPrimary,
  card,
  cardPad,
  input,
  label,
  statusPill,
} from "./ui";

const UNITS = ["crate", "box", "kg", "quintal", "truck", "bunch"];
const QUALITIES = ["premium", "grade-a", "grade-b", "ripening", "mixed"];

const EMPTY = {
  variety: "",
  varietyMr: "",
  varietyHi: "",
  quantity: "",
  unit: "crate",
  quality: "grade-a",
  location: "",
  available: true,
  notes: "",
  notesMr: "",
  notesHi: "",
};

/**
 * Stock table + inline create/edit form. Every write goes through the
 * protected /api/admin/stock routes (session-checked) and refreshes the
 * cached public stock page.
 */
export default function StockManager({ initialItems }) {
  const router = useRouter();
  const [items, setItems] = useState(initialItems);
  const [editing, setEditing] = useState(null); // _id | "new" | null
  const [form, setForm] = useState(EMPTY);
  const [message, setMessage] = useState(null);
  const [busy, setBusy] = useState(false);

  function set(key, value) {
    setForm((prev) => ({ ...prev, [key]: value }));
  }

  function startCreate() {
    setForm(EMPTY);
    setEditing("new");
    setMessage(null);
  }

  function startEdit(item) {
    setForm({
      variety: item.variety ?? "",
      varietyMr: item.varietyMr ?? "",
      varietyHi: item.varietyHi ?? "",
      quantity: String(item.quantity ?? ""),
      unit: item.unit ?? "crate",
      quality: item.quality ?? "grade-a",
      location: item.location ?? "",
      available: Boolean(item.available),
      notes: item.notes ?? "",
      notesMr: item.notesMr ?? "",
      notesHi: item.notesHi ?? "",
    });
    setEditing(item._id);
    setMessage(null);
  }

  async function save(event) {
    event.preventDefault();
    setBusy(true);
    setMessage(null);
    try {
      const payload = { ...form, quantity: Number(form.quantity) };
      const isNew = editing === "new";
      const res = await fetch(
        isNew ? "/api/admin/stock" : `/api/admin/stock/${editing}`,
        {
          method: isNew ? "POST" : "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(payload),
        }
      );
      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        setMessage({ kind: "error", text: data.message || `Save failed (${res.status})` });
        return;
      }
      setEditing(null);
      setItems((prev) => {
        if (isNew) return [data.item, ...prev];
        return prev.map((item) => (item._id === editing ? data.item : item));
      });
      setMessage({ kind: "ok", text: isNew ? "Lot added." : "Lot updated." });
      router.refresh();
    } catch {
      setMessage({ kind: "error", text: "Network error — nothing was saved." });
    } finally {
      setBusy(false);
    }
  }

  async function toggle(item) {
    setBusy(true);
    try {
      const res = await fetch(`/api/admin/stock/${item._id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ available: !item.available }),
      });
      if (res.ok) {
        const data = await res.json();
        setItems((prev) =>
          prev.map((row) => (row._id === item._id ? data.item : row))
        );
        router.refresh();
      }
    } finally {
      setBusy(false);
    }
  }

  async function remove(item) {
    if (
      !window.confirm(
        `Remove "${item.variety}" (${item.quantity} ${item.unit}) from stock?`
      )
    ) {
      return;
    }
    setBusy(true);
    try {
      const res = await fetch(`/api/admin/stock/${item._id}`, {
        method: "DELETE",
      });
      if (res.ok) {
        setItems((prev) => prev.filter((row) => row._id !== item._id));
        router.refresh();
      } else {
        const data = await res.json().catch(() => ({}));
        setMessage({ kind: "error", text: data.message || "Delete failed." });
      }
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="space-y-5">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <p className="text-sm text-muted">
          {items.length} lot{items.length === 1 ? "" : "s"} on record ·{" "}
          {items.filter((i) => i.available).length} available
        </p>
        <button
          type="button"
          onClick={startCreate}
          className={btnPrimary}
          disabled={busy}
        >
          + Add lot
        </button>
      </div>

      {message && (
        <p
          className={`rounded-lg px-3 py-2 text-sm font-medium ${
            message.kind === "ok"
              ? "bg-brand-soft text-brand-dark"
              : "bg-red-50 text-red-700"
          }`}
        >
          {message.text}
        </p>
      )}

      {/* Inline form */}
      {editing && (
        <form onSubmit={save} className={`${card} ${cardPad} space-y-4`}>
          <h2 className="font-bold text-brand-dark">
            {editing === "new" ? "Add stock lot" : "Edit stock lot"}
          </h2>

          <div className="grid gap-4 sm:grid-cols-3">
            <div>
              <label className={label} htmlFor="variety">
                Variety (English)
              </label>
              <input
                id="variety"
                required
                minLength={2}
                maxLength={120}
                className={input}
                value={form.variety}
                onChange={(e) => set("variety", e.target.value)}
                placeholder="Rajapuri"
              />
            </div>
            <div>
              <label className={label} htmlFor="varietyMr">
                Variety (Marathi)
              </label>
              <input
                id="varietyMr"
                className={input}
                maxLength={120}
                value={form.varietyMr}
                onChange={(e) => set("varietyMr", e.target.value)}
              />
            </div>
            <div>
              <label className={label} htmlFor="varietyHi">
                Variety (Hindi)
              </label>
              <input
                id="varietyHi"
                className={input}
                maxLength={120}
                value={form.varietyHi}
                onChange={(e) => set("varietyHi", e.target.value)}
              />
            </div>
          </div>

          <div className="grid gap-4 sm:grid-cols-4">
            <div>
              <label className={label} htmlFor="quantity">
                Quantity
              </label>
              <input
                id="quantity"
                required
                type="number"
                min={0}
                step="any"
                className={input}
                value={form.quantity}
                onChange={(e) => set("quantity", e.target.value)}
              />
            </div>
            <div>
              <label className={label} htmlFor="unit">
                Unit
              </label>
              <select
                id="unit"
                className={input}
                value={form.unit}
                onChange={(e) => set("unit", e.target.value)}
              >
                {UNITS.map((unit) => (
                  <option key={unit} value={unit}>
                    {unit}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className={label} htmlFor="quality">
                Quality
              </label>
              <select
                id="quality"
                className={input}
                value={form.quality}
                onChange={(e) => set("quality", e.target.value)}
              >
                {QUALITIES.map((quality) => (
                  <option key={quality} value={quality}>
                    {quality}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className={label} htmlFor="location">
                Location
              </label>
              <input
                id="location"
                required
                minLength={2}
                maxLength={200}
                className={input}
                value={form.location}
                onChange={(e) => set("location", e.target.value)}
                placeholder="Lasalgaon Market Yard"
              />
            </div>
          </div>

          <div className="grid gap-4 sm:grid-cols-3">
            <div>
              <label className={label} htmlFor="notes">
                Notes (English)
              </label>
              <input
                id="notes"
                className={input}
                maxLength={1000}
                value={form.notes}
                onChange={(e) => set("notes", e.target.value)}
              />
            </div>
            <div>
              <label className={label} htmlFor="notesMr">
                Notes (Marathi)
              </label>
              <input
                id="notesMr"
                className={input}
                maxLength={1000}
                value={form.notesMr}
                onChange={(e) => set("notesMr", e.target.value)}
              />
            </div>
            <div>
              <label className={label} htmlFor="notesHi">
                Notes (Hindi)
              </label>
              <input
                id="notesHi"
                className={input}
                maxLength={1000}
                value={form.notesHi}
                onChange={(e) => set("notesHi", e.target.value)}
              />
            </div>
          </div>

          <label className="flex items-center gap-2 text-sm font-medium text-foreground">
            <input
              type="checkbox"
              checked={form.available}
              onChange={(e) => set("available", e.target.checked)}
              className="h-4 w-4 accent-[var(--brand-green)]"
            />
            Available for buyers
          </label>

          <div className="flex flex-wrap gap-3">
            <button type="submit" disabled={busy} className={btnPrimary}>
              {busy ? "Saving…" : editing === "new" ? "Add lot" : "Save changes"}
            </button>
            <button
              type="button"
              onClick={() => setEditing(null)}
              className={btnGhost}
            >
              Cancel
            </button>
          </div>
        </form>
      )}

      {/* Table */}
      {items.length === 0 ? (
        <div className={`${card} p-8 text-center text-sm text-muted`}>
          No stock lots yet.
        </div>
      ) : (
        <div className={`${card} overflow-x-auto`}>
          <table className="w-full min-w-[720px] text-left text-sm">
            <thead className="border-b border-line bg-background text-[11px] uppercase tracking-wide text-muted">
              <tr>
                <th className="px-4 py-3 font-semibold">Variety</th>
                <th className="px-4 py-3 font-semibold">Quantity</th>
                <th className="px-4 py-3 font-semibold">Quality</th>
                <th className="px-4 py-3 font-semibold">Location</th>
                <th className="px-4 py-3 font-semibold">Status</th>
                <th className="px-4 py-3 text-right font-semibold">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-line">
              {items.map((item) => (
                <tr key={item._id} className="align-top">
                  <td className="px-4 py-3">
                    <p className="font-semibold text-foreground">{item.variety}</p>
                    {item.varietyMr && (
                      <p className="text-xs text-muted">{item.varietyMr}</p>
                    )}
                  </td>
                  <td className="px-4 py-3">
                    {item.quantity} {item.unit}
                  </td>
                  <td className="px-4 py-3">{item.quality}</td>
                  <td className="px-4 py-3">{item.location}</td>
                  <td className="px-4 py-3">
                    <span className={item.available ? statusPill.available : statusPill.unavailable}>
                      {item.available ? "available" : "unavailable"}
                    </span>
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex justify-end gap-2">
                      <button
                        type="button"
                        disabled={busy}
                        onClick={() => startEdit(item)}
                        className="rounded-lg border border-line bg-white px-2.5 py-1 text-xs font-medium hover:bg-brand-soft"
                      >
                        Edit
                      </button>
                      <button
                        type="button"
                        disabled={busy}
                        onClick={() => toggle(item)}
                        className="rounded-lg border border-line bg-white px-2.5 py-1 text-xs font-medium hover:bg-brand-soft"
                      >
                        {item.available ? "Mark out" : "Mark in"}
                      </button>
                      <button
                        type="button"
                        disabled={busy}
                        onClick={() => remove(item)}
                        className="rounded-lg border border-red-200 bg-red-50 px-2.5 py-1 text-xs font-semibold text-red-700 hover:bg-red-100"
                      >
                        Delete
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
