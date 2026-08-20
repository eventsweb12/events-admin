"use client";

import { useEffect, useState } from "react";
import { useRouter, useParams } from "next/navigation";
import Link from "next/link";
import RichTextEditor from "../RichTextEditor";
import "./blogid.css";

export default function EditBlogPage() {
  const router = useRouter();
  const { id } = useParams();
  const [form, setForm] = useState(null);
  const [images, setImages] = useState([]);
  const [activeLang, setActiveLang] = useState("ka");
  const [loading, setLoading] = useState(false);
  const [uploading, setUploading] = useState(false);

  useEffect(() => {
    fetch(`/api/blog/${id}`)
      .then((res) => res.json())
      .then((data) => {
        setForm({
          title: data.title || { ka: "", en: "" },
          slug: data.slug || "",
          excerpt: data.excerpt || { ka: "", en: "" },
          content: data.content || { ka: "", en: "" },
        });
        setImages(data.images || []);
      });
  }, [id]);

  function updateField(field, lang, value) {
    setForm((prev) => ({
      ...prev,
      [field]: { ...prev[field], [lang]: value },
    }));
  }

  async function handleImageSelect(e) {
    const files = Array.from(e.target.files || []);
    if (files.length === 0) return;

    setUploading(true);
    const uploaded = [];

    for (const file of files) {
      const uploadData = new FormData();
      uploadData.append("file", file);
      const res = await fetch("/api/upload", { method: "POST", body: uploadData });
      const result = await res.json();
      if (res.ok) {
        uploaded.push({ url: result.url, alt: { ka: "", en: "" } });
      }
    }

    setImages((prev) => [...prev, ...uploaded]);
    setUploading(false);
    e.target.value = "";
  }

  function removeImage(index) {
    setImages((prev) => prev.filter((_, i) => i !== index));
  }

  function moveImage(index, direction) {
    setImages((prev) => {
      const next = [...prev];
      const target = index + direction;
      if (target < 0 || target >= next.length) return prev;
      [next[index], next[target]] = [next[target], next[index]];
      return next;
    });
  }

  async function handleUpdate(e) {
    e.preventDefault();

    if (!form.title.ka || !form.title.en) {
      alert("სათაური საჭიროა ორივე ენაზე");
      return;
    }
    if (!form.content.ka || !form.content.en) {
      alert("კონტენტი საჭიროა ორივე ენაზე");
      return;
    }

    setLoading(true);

    const res = await fetch(`/api/blog/${id}`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ ...form, images }),
    });

    if (!res.ok) {
      const err = await res.json();
      alert(err.error || "შეცდომა შენახვისას");
      setLoading(false);
      return;
    }

    router.push("/blog");
  }

  async function handleDelete() {
    if (!confirm("წავშალო ეს პოსტი?")) return;
    await fetch(`/api/blog/${id}`, { method: "DELETE" });
    router.push("/blog");
  }

  if (!form) {
    return (
      <div className="blid-shell">
        <div className="blid-loading">იტვირთება...</div>
      </div>
    );
  }

  return (
    <div className="blid-shell">
      <div className="blid-topbar">
        <div className="blid-topbar-inner">
          <Link href="/blog" className="blid-back">
            <ChevronLeftIcon />
            ბლოგი
          </Link>
        </div>
      </div>

      <div className="blid-container">
        <h1 className="blid-heading">პოსტის რედაქტირება</h1>
        <p className="blid-subtitle">შეცვალეთ დეტალები ან წაშალეთ პოსტი</p>

        <div className="blid-card">
          <div className="blid-lang-tabs">
            <button type="button" className={activeLang === "ka" ? "blid-lang-tab active" : "blid-lang-tab"} onClick={() => setActiveLang("ka")}>
              ქართული
            </button>
            <button type="button" className={activeLang === "en" ? "blid-lang-tab active" : "blid-lang-tab"} onClick={() => setActiveLang("en")}>
              English
            </button>
          </div>

          <form onSubmit={handleUpdate} className="blid-form">
            <div className="blid-field">
              <label className="blid-field-label">
                სათაური {activeLang === "ka" ? "(ქართულად)" : "(ინგლისურად)"}<span className="required">*</span>
              </label>
              <input
                className="blid-input"
                value={form.title[activeLang]}
                onChange={(e) => updateField("title", activeLang, e.target.value)}
                required
              />
            </div>

            {activeLang === "en" && (
              <div className="blid-field">
                <label className="blid-field-label">სლაგი<span className="required">*</span></label>
                <input
                  className="blid-input"
                  value={form.slug}
                  onChange={(e) => setForm({ ...form, slug: e.target.value })}
                  required
                />
              </div>
            )}

            <div className="blid-field">
              <label className="blid-field-label">
                კონტენტი {activeLang === "ka" ? "(ქართულად)" : "(ინგლისურად)"}<span className="required">*</span>
              </label>

              {/* Both editors stay mounted permanently — each owns its own
                  independent Tiptap instance, so ka/en content can never
                  bleed into each other. Switching tabs just toggles CSS
                  visibility instead of unmounting/remounting the editor. */}
              <div className={activeLang === "ka" ? "rte-lang-pane" : "rte-lang-pane rte-lang-pane-hidden"}>
                <RichTextEditor
                  value={form.content.ka}
                  onChange={(html) => updateField("content", "ka", html)}
                  placeholder="დაწერეთ პოსტის ტექსტი..."
                />
              </div>
              <div className={activeLang === "en" ? "rte-lang-pane" : "rte-lang-pane rte-lang-pane-hidden"}>
                <RichTextEditor
                  value={form.content.en}
                  onChange={(html) => updateField("content", "en", html)}
                  placeholder="Write the post content..."
                />
              </div>
            </div>

            <div className="blid-field">
              <label className="blid-field-label">
                მოკლე აღწერა {activeLang === "ka" ? "(ქართულად)" : "(ინგლისურად)"}<span className="optional">(არასავალდებულო)</span>
              </label>
              <input
                className="blid-input"
                value={form.excerpt?.[activeLang] || ""}
                onChange={(e) => updateField("excerpt", activeLang, e.target.value)}
              />
            </div>

            <div className="blid-field">
              <label className="blid-field-label">
                სურათები<span className="optional">(არასავალდებულო)</span>
              </label>
              <input
                type="file"
                accept="image/*"
                multiple
                className="blid-file-input"
                onChange={handleImageSelect}
              />

              {images.length > 0 && (
                <div className="blid-image-gallery">
                  {images.map((img, i) => (
                    <div key={img.url + i} className="blid-image-item">
                      <img src={img.url} alt="" />
                      <div className="blid-image-item-actions">
                        <button type="button" onClick={() => moveImage(i, -1)} disabled={i === 0}>←</button>
                        <button type="button" onClick={() => moveImage(i, 1)} disabled={i === images.length - 1}>→</button>
                        <button type="button" onClick={() => removeImage(i)} className="danger">✕</button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

            <div className="blid-actions">
              <button type="submit" disabled={loading || uploading} className="blid-save-btn">
                {uploading ? "სურათები იტვირთება..." : loading ? "ინახება..." : "შენახვა"}
              </button>
              <button type="button" onClick={handleDelete} className="blid-delete-btn">
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