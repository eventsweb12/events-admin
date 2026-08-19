"use client";

import { useEffect, useState } from "react";
import { useRouter, useParams } from "next/navigation";
import Link from "next/link";
import "./eventsid.css";

export default function EditEventPage() {
  const router = useRouter();
  const { id } = useParams();
  const [form, setForm] = useState(null);
  const [mainImageFile, setMainImageFile] = useState(null);
  const [loading, setLoading] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [galleryUploading, setGalleryUploading] = useState(false);

  useEffect(() => {
    fetch(`/api/events/${id}`)
      .then((res) => res.json())
      .then((data) => setForm(data));
  }, [id]);

  function updateBilingual(field, lang, value) {
    setForm({ ...form, [field]: { ...(form[field] || {}), [lang]: value } });
  }

  async function uploadFile(file) {
    const uploadData = new FormData();
    uploadData.append("file", file);
    const res = await fetch("/api/upload", { method: "POST", body: uploadData });
    const result = await res.json();
    if (!res.ok) throw new Error("upload failed");
    return result.url;
  }

  function cleanBilingual(obj) {
    if (!obj) return undefined;
    if (!obj.geo && !obj.eng) return undefined;
    return obj;
  }

  async function handleUpdate(e) {
    e.preventDefault();

    if (!form.eventName?.geo && !form.eventName?.eng) {
      alert("ივენთის დასახელება სავალდებულოა");
      return;
    }

    setLoading(true);

    let mainImage = form.mainImage;

    try {
      if (mainImageFile) {
        setUploading(true);
        mainImage = await uploadFile(mainImageFile);
        setUploading(false);
      }

      if (!mainImage) {
        alert("მთავარი სურათი სავალდებულოა");
        setLoading(false);
        return;
      }

      const payload = {
        eventName: form.eventName,
        mainImage,
        gallery: form.gallery || [],
      };

      const title = cleanBilingual(form.title);
      const client = cleanBilingual(form.client);
      const venue = cleanBilingual(form.venue);
      const format = cleanBilingual(form.format);
      const audience = cleanBilingual(form.audience);
      const role = cleanBilingual(form.role);
      const about = cleanBilingual(form.about);

      if (title) payload.title = title;
      if (client) payload.client = client;
      if (venue) payload.venue = venue;
      if (format) payload.format = format;
      if (audience) payload.audience = audience;
      if (role) payload.role = role;
      if (about) payload.about = about;
      if (form.year) payload.year = Number(form.year);
      if (form.slug) payload.slug = form.slug;

      const res = await fetch(`/api/events/${id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        alert(err.error || "შენახვა ვერ მოხერხდა");
        setLoading(false);
        return;
      }

      router.push("/events");
    } catch (err) {
      alert("სურათის ატვირთვა ვერ მოხერხდა");
      setUploading(false);
      setLoading(false);
    }
  }

  async function handleGalleryAdd(e) {
    const files = Array.from(e.target.files || []);
    if (files.length === 0) return;

    setGalleryUploading(true);
    try {
      const urls = await Promise.all(files.map(uploadFile));
      setForm({ ...form, gallery: [...(form.gallery || []), ...urls] });
    } catch (err) {
      alert("სურათების ატვირთვა ვერ მოხერხდა");
    }
    setGalleryUploading(false);
    e.target.value = "";
  }

  function handleGalleryRemove(index) {
    const next = [...form.gallery];
    next.splice(index, 1);
    setForm({ ...form, gallery: next });
  }

  async function handleDelete() {
    if (!confirm("წავშალო ეს ივენთი?")) return;
    await fetch(`/api/events/${id}`, { method: "DELETE" });
    router.push("/events");
  }

  if (!form) {
    return (
      <div className="evid-shell">
        <div className="evid-loading">იტვირთება...</div>
      </div>
    );
  }

  return (
    <div className="evid-shell">
      <div className="evid-topbar">
        <div className="evid-topbar-inner">
          <Link href="/events" className="evid-back">
            <ChevronLeftIcon />
            ივენთები
          </Link>
        </div>
      </div>

      <div className="evid-container">
        <h1 className="evid-heading">ივენთის რედაქტირება</h1>
        <p className="evid-subtitle">შეცვალეთ დეტალები ან წაშალეთ ივენთი</p>

        <div className="evid-card">
          <form onSubmit={handleUpdate} className="evid-form">
            {/* Title */}
            <div className="evid-field">
              <label className="evid-field-label">სათაური<span className="optional">(არასავალდებულო)</span></label>
              <div className="evid-lang-row">
                <input
                  className="evid-input"
                  placeholder="ქართულად"
                  value={form.title?.geo || ""}
                  onChange={(e) => updateBilingual("title", "geo", e.target.value)}
                />
                <input
                  className="evid-input"
                  placeholder="English"
                  value={form.title?.eng || ""}
                  onChange={(e) => updateBilingual("title", "eng", e.target.value)}
                />
              </div>
            </div>

            {/* Client */}
            <div className="evid-field">
              <label className="evid-field-label">დამკვეთი<span className="optional">(არასავალდებულო)</span></label>
              <div className="evid-lang-row">
                <input
                  className="evid-input"
                  placeholder="ქართულად"
                  value={form.client?.geo || ""}
                  onChange={(e) => updateBilingual("client", "geo", e.target.value)}
                />
                <input
                  className="evid-input"
                  placeholder="English"
                  value={form.client?.eng || ""}
                  onChange={(e) => updateBilingual("client", "eng", e.target.value)}
                />
              </div>
            </div>

            {/* Venue */}
            <div className="evid-field">
              <label className="evid-field-label">ლოკაცია<span className="optional">(არასავალდებულო)</span></label>
              <div className="evid-lang-row">
                <input
                  className="evid-input"
                  placeholder="ქართულად"
                  value={form.venue?.geo || ""}
                  onChange={(e) => updateBilingual("venue", "geo", e.target.value)}
                />
                <input
                  className="evid-input"
                  placeholder="English"
                  value={form.venue?.eng || ""}
                  onChange={(e) => updateBilingual("venue", "eng", e.target.value)}
                />
              </div>
            </div>

            {/* Year */}
            <div className="evid-field">
              <label className="evid-field-label">წელი<span className="optional">(არასავალდებულო)</span></label>
              <input
                type="number"
                className="evid-input"
                value={form.year || ""}
                onChange={(e) => setForm({ ...form, year: e.target.value })}
              />
            </div>

            {/* Event name (required) */}
            <div className="evid-field">
              <label className="evid-field-label">ივენთის დასახელება<span className="required">*</span></label>
              <div className="evid-lang-row">
                <input
                  className="evid-input"
                  placeholder="ქართულად"
                  value={form.eventName?.geo || ""}
                  onChange={(e) => updateBilingual("eventName", "geo", e.target.value)}
                  required
                />
                <input
                  className="evid-input"
                  placeholder="English"
                  value={form.eventName?.eng || ""}
                  onChange={(e) => updateBilingual("eventName", "eng", e.target.value)}
                />
              </div>
            </div>

            {/* Format */}
            <div className="evid-field">
              <label className="evid-field-label">ფორმატი<span className="optional">(არასავალდებულო)</span></label>
              <div className="evid-lang-row">
                <input
                  className="evid-input"
                  placeholder="ქართულად"
                  value={form.format?.geo || ""}
                  onChange={(e) => updateBilingual("format", "geo", e.target.value)}
                />
                <input
                  className="evid-input"
                  placeholder="English"
                  value={form.format?.eng || ""}
                  onChange={(e) => updateBilingual("format", "eng", e.target.value)}
                />
              </div>
            </div>

            {/* Audience */}
            <div className="evid-field">
              <label className="evid-field-label">აუდიტორია<span className="optional">(არასავალდებულო)</span></label>
              <div className="evid-lang-row">
                <input
                  className="evid-input"
                  placeholder="ქართულად"
                  value={form.audience?.geo || ""}
                  onChange={(e) => updateBilingual("audience", "geo", e.target.value)}
                />
                <input
                  className="evid-input"
                  placeholder="English"
                  value={form.audience?.eng || ""}
                  onChange={(e) => updateBilingual("audience", "eng", e.target.value)}
                />
              </div>
            </div>

            {/* Role */}
            <div className="evid-field">
              <label className="evid-field-label">როლი<span className="optional">(არასავალდებულო)</span></label>
              <div className="evid-lang-row">
                <textarea
                  className="evid-textarea"
                  placeholder="ქართულად"
                  value={form.role?.geo || ""}
                  onChange={(e) => updateBilingual("role", "geo", e.target.value)}
                />
                <textarea
                  className="evid-textarea"
                  placeholder="English"
                  value={form.role?.eng || ""}
                  onChange={(e) => updateBilingual("role", "eng", e.target.value)}
                />
              </div>
            </div>

            {/* About */}
            <div className="evid-field">
              <label className="evid-field-label">ივენთის შესახებ<span className="optional">(არასავალდებულო)</span></label>
              <div className="evid-lang-row">
                <textarea
                  className="evid-textarea tall"
                  placeholder="ქართულად"
                  value={form.about?.geo || ""}
                  onChange={(e) => updateBilingual("about", "geo", e.target.value)}
                />
                <textarea
                  className="evid-textarea tall"
                  placeholder="English"
                  value={form.about?.eng || ""}
                  onChange={(e) => updateBilingual("about", "eng", e.target.value)}
                />
              </div>
            </div>

            {/* Main image (required — pre-filled from existing) */}
            <div className="evid-field">
              <label className="evid-field-label">მთავარი სურათი<span className="required">*</span></label>
              <div className="evid-preview-wrap">
                {form.mainImage && <img src={form.mainImage} alt="" className="evid-preview" />}
                <input
                  type="file"
                  accept="image/*"
                  className="evid-file-input"
                  onChange={(e) => setMainImageFile(e.target.files[0])}
                />
              </div>
            </div>

            {/* Gallery */}
            <div className="evid-field">
              <label className="evid-field-label">დამატებითი ფოტოები<span className="optional">(არასავალდებულო)</span></label>

              {form.gallery && form.gallery.length > 0 && (
                <div className="evid-gallery-grid">
                  {form.gallery.map((url, index) => (
                    <div key={index} className="evid-gallery-item">
                      <img src={url} alt="" className="evid-gallery-thumb" />
                      <button
                        type="button"
                        className="evid-gallery-remove"
                        onClick={() => handleGalleryRemove(index)}
                        aria-label="წაშლა"
                      >
                        <TrashIcon />
                      </button>
                    </div>
                  ))}
                </div>
              )}

              <input
                type="file"
                accept="image/*"
                multiple
                className="evid-file-input"
                onChange={handleGalleryAdd}
              />
              {galleryUploading && <p className="evid-hint">ფოტოები იტვირთება...</p>}
            </div>

            <div className="evid-actions">
              <button type="submit" disabled={loading} className="evid-save-btn">
                {uploading ? "სურათი იტვირთება..." : loading ? "ინახება..." : "შენახვა"}
              </button>
              <button type="button" onClick={handleDelete} className="evid-delete-btn">
                წაშლა
              </button>
            </div>
          </form>
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

function TrashIcon() {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M3 6h18" />
      <path d="M8 6V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2" />
      <path d="M19 6l-1 14a2 2 0 0 1-2 2H8a2 2 0 0 1-2-2L5 6" />
    </svg>
  );
}