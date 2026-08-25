"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import "./events.css";
import { uploadImage } from "../../app/api/upload/route";

const emptyForm = {
  client: { geo: "", eng: "" },
  eventName: { geo: "", eng: "" },
  venue: { geo: "", eng: "" },
  format: { geo: "", eng: "" },
  audience: { geo: "", eng: "" },
  year: "",
  role: { geo: "", eng: "" },
  about: { geo: "", eng: "" },
  youtubeUrl: "",
};

function slugify(text) {
  return text
    .toString()
    .toLowerCase()
    .trim()
    .replace(/[^\w\s-]/g, "")
    .replace(/[\s_-]+/g, "-")
    .replace(/^-+|-+$/g, "");
}

// strip empty bilingual objects so we don't send { geo: "", eng: "" } for unfilled optional fields
function cleanBilingual(obj) {
  if (!obj) return undefined;
  if (!obj.geo && !obj.eng) return undefined;
  return obj;
}

export default function EventsPage() {
  const [events, setEvents] = useState([]);
  const [form, setForm] = useState(emptyForm);
  const [imageFile, setImageFile] = useState(null);
  const [galleryFiles, setGalleryFiles] = useState([]);
  const [galleryPreviews, setGalleryPreviews] = useState([]);
  const [carouselSelected, setCarouselSelected] = useState(new Set());
  const [loading, setLoading] = useState(false);
  const [uploading, setUploading] = useState(false);

  async function loadEvents() {
    const res = await fetch("/api/events");
    const data = await res.json();
    setEvents(data);
  }

  useEffect(() => {
    loadEvents();
  }, []);

  // build/revoke object-URL previews whenever the gallery selection changes
  useEffect(() => {
    const urls = galleryFiles.map((file) => URL.createObjectURL(file));
    setGalleryPreviews(urls);
    return () => urls.forEach((url) => URL.revokeObjectURL(url));
  }, [galleryFiles]);

  function updateBilingual(field, lang, value) {
    setForm({ ...form, [field]: { ...form[field], [lang]: value } });
  }

  function handleGalleryChange(e) {
    const files = Array.from(e.target.files || []);
    setGalleryFiles(files);
    setCarouselSelected(new Set()); // reset picks whenever the file list changes
  }

  function toggleCarouselPick(index) {
    setCarouselSelected((prev) => {
      const next = new Set(prev);
      if (next.has(index)) {
        next.delete(index);
      } else {
        next.add(index);
      }
      return next;
    });
  }

  // Uploads straight to Cloudinary from the browser (compressing first
  // if needed) instead of going through our own /api/upload route —
  // Vercel's serverless functions hard-cap request bodies at 4.5MB,
  // which was causing 413s on larger photos.
  async function uploadFile(file) {
    console.log("uploading:", file.name, file.type, `${(file.size / 1024).toFixed(0)}KB`);
    try {
      const result = await uploadImage(file);
      console.log("upload ok:", file.name, "->", result?.secure_url);
      return result.secure_url;
    } catch (err) {
      console.error("uploadImage failed for", file.name, err);
      throw err;
    }
  }

  async function handleCreate(e) {
    e.preventDefault();

    if (!form.eventName.geo && !form.eventName.eng) {
      alert("ივენთის დასახელება სავალდებულოა");
      return;
    }
    if (!imageFile) {
      alert("მთავარი სურათი სავალდებულოა");
      return;
    }

    setLoading(true);

    try {
      setUploading(true);
      const mainImage = await uploadFile(imageFile);

      let gallery = [];
      if (galleryFiles.length > 0) {
        gallery = await Promise.all(galleryFiles.map(uploadFile));
      }

      // carouselSelected holds indices into galleryFiles/gallery (same order,
      // since Promise.all preserves it) — map those back to the uploaded urls
      const carouselImages = gallery.filter((_, i) => carouselSelected.has(i));

      setUploading(false);

      const slug = slugify(form.eventName.eng || form.eventName.geo);

      const payload = {
        eventName: form.eventName,
        mainImage,
        gallery,
        slug,
      };

      if (carouselImages.length > 0) payload.carouselImages = carouselImages;
      if (form.youtubeUrl) payload.youtubeUrl = form.youtubeUrl;

      // only include optional fields if actually filled in
      const client = cleanBilingual(form.client);
      const venue = cleanBilingual(form.venue);
      const format = cleanBilingual(form.format);
      const audience = cleanBilingual(form.audience);
      const role = cleanBilingual(form.role);
      const about = cleanBilingual(form.about);

      if (client) payload.client = client;
      if (venue) payload.venue = venue;
      if (format) payload.format = format;
      if (audience) payload.audience = audience;
      if (role) payload.role = role;
      if (about) payload.about = about;
      if (form.year) payload.year = Number(form.year);

      const createRes = await fetch("/api/events", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      if (!createRes.ok) {
        const err = await createRes.json().catch(() => ({}));
        alert(err.error || "ივენთის დამატება ვერ მოხერხდა");
        setLoading(false);
        return;
      }

      setForm(emptyForm);
      setImageFile(null);
      setGalleryFiles([]);
      setCarouselSelected(new Set());
      await loadEvents();
    } catch (err) {
      console.error("handleCreate failed:", err);
      alert(`ატვირთვა ვერ მოხერხდა: ${err?.message || err}`);
    }

    setLoading(false);
  }

  async function handleDelete(id) {
    if (!confirm("წავშალო ეს ივენთი?")) return;
    await fetch(`/api/events/${id}`, { method: "DELETE" });
    await loadEvents();
  }

  return (
    <div className="ev-shell">
      <div className="ev-topbar">
        <div className="ev-topbar-inner">
          <Link href="/dashboard" className="ev-back">
            <ChevronLeftIcon />
            დეშბორდი
          </Link>
        </div>
      </div>

      <div className="ev-container">
        <div className="ev-heading-row">
          <div>
            <h1 className="ev-heading">ივენთები</h1>
            <p className="ev-subtitle">დაამატეთ, შეცვალეთ ან წაშალეთ ივენთები</p>
          </div>
          <span className="ev-count-badge">{events.length} ივენთი</span>
        </div>

        <div className="ev-create-card">
          <h2 className="ev-create-title">ახალი ივენთის დამატება</h2>
          <form onSubmit={handleCreate} className="ev-form">
            {/* Client (optional) */}
            <div className="ev-field">
              <label className="ev-field-label">დამკვეთი<span className="optional">(არასავალდებულო)</span></label>
              <div className="ev-lang-row">
                <input
                  className="ev-input"
                  placeholder="ქართულად"
                  value={form.client.geo}
                  onChange={(e) => updateBilingual("client", "geo", e.target.value)}
                />
                <input
                  className="ev-input"
                  placeholder="English"
                  value={form.client.eng}
                  onChange={(e) => updateBilingual("client", "eng", e.target.value)}
                />
              </div>
            </div>

            {/* Venue (optional) */}
            <div className="ev-field">
              <label className="ev-field-label">ლოკაცია<span className="optional">(არასავალდებულო)</span></label>
              <div className="ev-lang-row">
                <input
                  className="ev-input"
                  placeholder="ქართულად"
                  value={form.venue.geo}
                  onChange={(e) => updateBilingual("venue", "geo", e.target.value)}
                />
                <input
                  className="ev-input"
                  placeholder="English"
                  value={form.venue.eng}
                  onChange={(e) => updateBilingual("venue", "eng", e.target.value)}
                />
              </div>
            </div>

            {/* Year (optional) */}
            <div className="ev-field">
              <label className="ev-field-label">წელი<span className="optional">(არასავალდებულო)</span></label>
              <input
                type="number"
                className="ev-input"
                value={form.year}
                onChange={(e) => setForm({ ...form, year: e.target.value })}
              />
            </div>

            {/* Event name (required) */}
            <div className="ev-field">
              <label className="ev-field-label">ივენთის დასახელება<span className="required">*</span></label>
              <div className="ev-lang-row">
                <input
                  className="ev-input"
                  placeholder="ქართულად"
                  value={form.eventName.geo}
                  onChange={(e) => updateBilingual("eventName", "geo", e.target.value)}
                  required
                />
                <input
                  className="ev-input"
                  placeholder="English"
                  value={form.eventName.eng}
                  onChange={(e) => updateBilingual("eventName", "eng", e.target.value)}
                />
              </div>
            </div>

            {/* Format (optional) */}
            <div className="ev-field">
              <label className="ev-field-label">ფორმატი<span className="optional">(არასავალდებულო)</span></label>
              <div className="ev-lang-row">
                <input
                  className="ev-input"
                  placeholder="ქართულად"
                  value={form.format.geo}
                  onChange={(e) => updateBilingual("format", "geo", e.target.value)}
                />
                <input
                  className="ev-input"
                  placeholder="English"
                  value={form.format.eng}
                  onChange={(e) => updateBilingual("format", "eng", e.target.value)}
                />
              </div>
            </div>

            {/* Audience (optional) */}
            <div className="ev-field">
              <label className="ev-field-label">აუდიტორია<span className="optional">(არასავალდებულო)</span></label>
              <div className="ev-lang-row">
                <input
                  className="ev-input"
                  placeholder="ქართულად"
                  value={form.audience.geo}
                  onChange={(e) => updateBilingual("audience", "geo", e.target.value)}
                />
                <input
                  className="ev-input"
                  placeholder="English"
                  value={form.audience.eng}
                  onChange={(e) => updateBilingual("audience", "eng", e.target.value)}
                />
              </div>
            </div>

            {/* Role (optional) */}
            <div className="ev-field">
              <label className="ev-field-label">როლი<span className="optional">(არასავალდებულო)</span></label>
              <div className="ev-lang-row">
                <textarea
                  className="ev-textarea"
                  placeholder="ქართულად"
                  value={form.role.geo}
                  onChange={(e) => updateBilingual("role", "geo", e.target.value)}
                />
                <textarea
                  className="ev-textarea"
                  placeholder="English"
                  value={form.role.eng}
                  onChange={(e) => updateBilingual("role", "eng", e.target.value)}
                />
              </div>
            </div>

            {/* About (optional) */}
            <div className="ev-field">
              <label className="ev-field-label">აღწერა<span className="optional">(არასავალდებულო)</span></label>
              <div className="ev-lang-row">
                <textarea
                  className="ev-textarea"
                  placeholder="ქართულად"
                  value={form.about.geo}
                  onChange={(e) => updateBilingual("about", "geo", e.target.value)}
                />
                <textarea
                  className="ev-textarea"
                  placeholder="English"
                  value={form.about.eng}
                  onChange={(e) => updateBilingual("about", "eng", e.target.value)}
                />
              </div>
            </div>

            {/* Main image (required) */}
            <div className="ev-field">
              <label className="ev-field-label">მთავარი სურათი<span className="required">*</span></label>
              <input
                type="file"
                accept="image/*"
                className="ev-file-input"
                onChange={(e) => setImageFile(e.target.files[0])}
                required
              />
            </div>

            {/* Gallery (optional, multiple) + carousel picker */}
            <div className="ev-field">
              <label className="ev-field-label">დამატებითი ფოტოები<span className="optional">(არასავალდებულო)</span></label>
              <input
                type="file"
                accept="image/*"
                multiple
                className="ev-file-input"
                onChange={handleGalleryChange}
              />
              {galleryPreviews.length > 0 && (
                <>
                  <p className="ev-hint">
                    {galleryFiles.length} ფოტო არჩეულია — მონიშნეთ რომელი გამოჩნდეს კარუსელში
                  </p>
                  <div className="ev-gallery-grid">
                    {galleryPreviews.map((src, i) => {
                      const picked = carouselSelected.has(i);
                      return (
                        <button
                          type="button"
                          key={src}
                          className={`ev-gallery-thumb${picked ? " is-picked" : ""}`}
                          onClick={() => toggleCarouselPick(i)}
                        >
                          <img src={src} alt="" />
                          <span className="ev-gallery-check">{picked ? "✓" : ""}</span>
                        </button>
                      );
                    })}
                  </div>
                  {carouselSelected.size > 0 && (
                    <p className="ev-hint">{carouselSelected.size} ფოტო კარუსელისთვის</p>
                  )}
                </>
              )}
            </div>

            {/* YouTube link (optional) */}
            <div className="ev-field">
              <label className="ev-field-label">YouTube ბმული<span className="optional">(არასავალდებულო)</span></label>
              <input
                type="url"
                className="ev-input"
                placeholder="https://www.youtube.com/watch?v=..."
                value={form.youtubeUrl}
                onChange={(e) => setForm({ ...form, youtubeUrl: e.target.value })}
              />
            </div>

            <button type="submit" disabled={loading} className="ev-submit-btn">
              {uploading ? " იტვირთება..." : loading ? "ემატება..." : "ივენთის დამატება"}
            </button>
          </form>
        </div>

        <div className="ev-list">
          {events.length === 0 ? (
            <div className="ev-empty">ჯერ არცერთი ივენთი არ დამატებულა</div>
          ) : (
            events.map((ev) => (
              <div key={ev._id} className="ev-item">
                {ev.mainImage && (
                  <img src={ev.mainImage} alt={ev.eventName?.geo} className="ev-thumb" />
                )}
                <div className="ev-item-info">
                  <h3 className="ev-item-title">{ev.eventName?.geo}</h3>
                  <p className="ev-item-meta">
                    <CalendarSmallIcon />
                    {ev.year || ""}
                    {ev.venue?.geo ? ` · ${ev.venue.geo}` : ""}
                  </p>
                </div>
                <div className="ev-item-actions">
                  <Link href={`/events/${ev._id}`} className="ev-edit-btn">რედაქტირება</Link>
                  <button onClick={() => handleDelete(ev._id)} className="ev-delete-btn">წაშლა</button>
                </div>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
}

function ChevronLeftIcon() {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M15 6l-6 6 6 6" />
    </svg>
  );
}

function CalendarSmallIcon() {
  return (
    <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <rect x="3" y="4.5" width="18" height="16" rx="3" />
      <path d="M3 9.5h18" />
      <path d="M8 3v3" />
      <path d="M16 3v3" />
    </svg>
  );
}