"use client";

import { useEffect, useState } from "react";
import { useRouter, useParams } from "next/navigation";
import Link from "next/link";
import "./eventsid.css";
import { uploadImage } from "../../api/upload/route";

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
      .then((data) => setForm({ ...data, carouselImages: data.carouselImages || [] }));
  }, [id]);

  function updateBilingual(field, lang, value) {
    setForm({ ...form, [field]: { ...(form[field] || {}), [lang]: value } });
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

  function cleanBilingual(obj) {
    if (!obj) return undefined;
    if (!obj.geo && !obj.eng) return undefined;
    return obj;
  }

  function toggleCarouselPick(url) {
    setForm((prev) => {
      const current = prev.carouselImages || [];
      const next = current.includes(url)
        ? current.filter((u) => u !== url)
        : [...current, url];
      return { ...prev, carouselImages: next };
    });
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
      }

      if (!mainImage) {
        alert("მთავარი სურათი სავალდებულოა");
        setUploading(false);
        setLoading(false);
        return;
      }
      setUploading(false);

      const gallery = form.gallery || [];
      // keep only picks that still exist in the current gallery
      const carouselImages = (form.carouselImages || []).filter((url) =>
        gallery.includes(url)
      );

      const payload = {
        eventName: form.eventName,
        mainImage,
        gallery,
        carouselImages,
      };

      if (form.youtubeUrl) payload.youtubeUrl = form.youtubeUrl;

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
      alert("ატვირთვა ვერ მოხერხდა");
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
    const url = form.gallery[index];
    const next = [...form.gallery];
    next.splice(index, 1);
    setForm({
      ...form,
      gallery: next,
      carouselImages: (form.carouselImages || []).filter((u) => u !== url),
    });
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

            {/* Gallery + carousel picker */}
            <div className="evid-field">
              <label className="evid-field-label">დამატებითი ფოტოები<span className="optional">(არასავალდებულო)</span></label>

              {form.gallery && form.gallery.length > 0 && (
                <>
                  <p className="evid-hint">დააჭირეთ ფოტოს, რომ ჩართოთ/გამორთოთ კარუსელში</p>
                  <div className="evid-gallery-grid">
                    {form.gallery.map((url, index) => {
                      const picked = (form.carouselImages || []).includes(url);
                      return (
                        <div key={index} className={`evid-gallery-item${picked ? " is-picked" : ""}`}>
                          <button
                            type="button"
                            className="evid-gallery-pick"
                            onClick={() => toggleCarouselPick(url)}
                          >
                            <img src={url} alt="" className="evid-gallery-thumb" />
                            <span className="evid-gallery-check">{picked ? "✓" : ""}</span>
                          </button>
                          <button
                            type="button"
                            className="evid-gallery-remove"
                            onClick={() => handleGalleryRemove(index)}
                            aria-label="წაშლა"
                          >
                            <TrashIcon />
                          </button>
                        </div>
                      );
                    })}
                  </div>
                  {(form.carouselImages || []).length > 0 && (
                    <p className="evid-hint">{form.carouselImages.length} ფოტო კარუსელისთვის</p>
                  )}
                </>
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

            {/* YouTube link */}
            <div className="evid-field">
              <label className="evid-field-label">YouTube ბმული<span className="optional">(არასავალდებულო)</span></label>
              <input
                type="url"
                className="evid-input"
                placeholder="https://www.youtube.com/watch?v=..."
                value={form.youtubeUrl || ""}
                onChange={(e) => setForm({ ...form, youtubeUrl: e.target.value })}
              />
            </div>

            <div className="evid-actions">
              <button type="submit" disabled={loading} className="evid-save-btn">
                {uploading ? "იტვირთება..." : loading ? "ინახება..." : "შენახვა"}
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