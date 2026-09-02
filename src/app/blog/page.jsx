"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import RichTextEditor from "./RichTextEditor";
import "./blog.css";
import { uploadImage } from "../api/upload/route";

const emptyForm = {
  title: { ka: "", en: "" },
  excerpt: { ka: "", en: "" },
  content: { ka: "", en: "" },
  source: { name: "", url: "" },
};

export default function BlogPage() {
  const [posts, setPosts] = useState([]);
  const [form, setForm] = useState(emptyForm);
  const [activeLang, setActiveLang] = useState("ka");
  const [images, setImages] = useState([]); // [{ url, alt: {ka, en} }]
  const [loading, setLoading] = useState(false);
  const [uploading, setUploading] = useState(false);

  async function loadPosts() {
    const res = await fetch("/api/blog");
    const data = await res.json();
    setPosts(data);
  }

  useEffect(() => {
    loadPosts();
  }, []);

  function updateField(field, lang, value) {
    setForm((prev) => ({
      ...prev,
      [field]: { ...prev[field], [lang]: value },
    }));
  }

  function updateSource(key, value) {
    setForm((prev) => ({
      ...prev,
      source: { ...prev.source, [key]: value },
    }));
  }

  // Uploads straight to Cloudinary from the browser (compressing first
  // if needed) instead of going through our own /api/upload route —
  // Vercel's serverless functions hard-cap request bodies at 4.5MB,
  // which was causing 413s on larger photos.
  async function handleImageSelect(e) {
    const files = Array.from(e.target.files || []);
    if (files.length === 0) return;

    setUploading(true);
    const uploaded = [];

    for (const file of files) {
      try {
        const result = await uploadImage(file);
        uploaded.push({ url: result.secure_url, alt: { ka: "", en: "" } });
      } catch (err) {
        console.error("Image upload failed:", err);
        alert("სურათის ატვირთვა ვერ მოხერხდა");
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

  async function handleCreate(e) {
    e.preventDefault();

    if (!form.title.ka || !form.title.en) {
      alert("სათაური საჭიროა ორივე ენაზე");
      return;
    }
    if (!form.content.ka || !form.content.en) {
      alert("კონტენტი საჭიროა ორივე ენაზე");
      return;
    }
    if ((form.source.name && !form.source.url) || (!form.source.name && form.source.url)) {
      alert("წყაროს დამატებისას საჭიროა სახელიც და ლინკიც");
      return;
    }

    setLoading(true);

    const payload = {
      ...form,
      images,
      source: form.source.name && form.source.url ? form.source : undefined,
    };

    const res = await fetch("/api/blog", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    });

    if (!res.ok) {
      const err = await res.json();
      alert(err.error || "შეცდომა პოსტის დამატებისას");
      setLoading(false);
      return;
    }

    setForm(emptyForm);
    setImages([]);
    setActiveLang("ka");
    await loadPosts();
    setLoading(false);
  }

  async function handleDelete(id) {
    if (!confirm("წავშალო ეს პოსტი?")) return;
    await fetch(`/api/blog/${id}`, { method: "DELETE" });
    await loadPosts();
  }

  return (
    <div className="blog-shell">
      <div className="blog-topbar">
        <div className="blog-topbar-inner">
          <Link href="/dashboard" className="blog-back">
            <ChevronLeftIcon />
            დეშბორდი
          </Link>
        </div>
      </div>

      <div className="blog-container">
        <div className="blog-heading-row">
          <div>
            <h1 className="blog-heading">ბლოგი</h1>
            <p className="blog-subtitle">დაამატეთ, შეცვალეთ ან წაშალეთ ბლოგ პოსტები</p>
          </div>
          <span className="blog-count-badge">{posts.length} პოსტი</span>
        </div>

        <div className="blog-create-card">
          <h2 className="blog-create-title">ახალი პოსტის დამატება</h2>

          <div className="blog-lang-tabs">
            <button type="button" className={activeLang === "ka" ? "blog-lang-tab active" : "blog-lang-tab"} onClick={() => setActiveLang("ka")}>
              ქართული
              {(!form.title.ka || !form.content.ka) && <span className="blog-lang-dot" />}
            </button>
            <button type="button" className={activeLang === "en" ? "blog-lang-tab active" : "blog-lang-tab"} onClick={() => setActiveLang("en")}>
              English
              {(!form.title.en || !form.content.en) && <span className="blog-lang-dot" />}
            </button>
          </div>

          <form onSubmit={handleCreate} className="blog-form">
            <div className="blog-field">
              <label className="blog-field-label">
                სათაური {activeLang === "ka" ? "(ქართულად)" : "(ინგლისურად)"}<span className="required">*</span>
              </label>
              <input
                className="blog-input"
                value={form.title[activeLang]}
                onChange={(e) => updateField("title", activeLang, e.target.value)}
                required
              />
            </div>

            <div className="blog-field">
              <label className="blog-field-label">
                მოკლე აღწერა {activeLang === "ka" ? "(ქართულად)" : "(ინგლისურად)"}<span className="optional">(არასავალდებულო)</span>
              </label>
              <input
                className="blog-input"
                value={form.excerpt[activeLang]}
                onChange={(e) => updateField("excerpt", activeLang, e.target.value)}
              />
            </div>

            <div className="blog-field">
              <label className="blog-field-label">
                შინაარსი {activeLang === "ka" ? "(ქართულად)" : "(ინგლისურად)"}<span className="required">*</span>
              </label>

              {/* Two independent, permanently-mounted editors — one per
                  language. Tabs only toggle CSS visibility, never unmount
                  either editor, so ka/en content can't collide or fail to
                  update. */}
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

            <div className="blog-field">
              <label className="blog-field-label">
                წყარო<span className="optional">(არასავალდებულო — თუ ტექსტი სხვა საიტიდანაა გადმოცემული)</span>
              </label>
              <div className="blog-source-row">
                <input
                  className="blog-input"
                  placeholder="საიტის სახელი (მაგ. Forbes.ge)"
                  value={form.source.name}
                  onChange={(e) => updateSource("name", e.target.value)}
                />
                <input
                  className="blog-input"
                  placeholder="ლინკი ორიგინალ სტატიაზე"
                  value={form.source.url}
                  onChange={(e) => updateSource("url", e.target.value)}
                />
              </div>
            </div>

            <div className="blog-field">
              <label className="blog-field-label">
                სურათები<span className="optional">(არასავალდებულო — სურათი)</span>
              </label>
              <input
                type="file"
                accept="image/*"
                multiple
                className="blog-file-input"
                onChange={handleImageSelect}
              />

              {images.length > 0 && (
                <div className="blog-image-gallery">
                  {images.map((img, i) => (
                    <div key={img.url + i} className="blog-image-item">
                      <img src={img.url} alt="" />
                      <div className="blog-image-item-actions">
                        <button type="button" onClick={() => moveImage(i, -1)} disabled={i === 0} title="მარცხნივ">←</button>
                        <button type="button" onClick={() => moveImage(i, 1)} disabled={i === images.length - 1} title="მარჯვნივ">→</button>
                        <button type="button" onClick={() => removeImage(i)} title="წაშლა" className="danger">✕</button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

            <button type="submit" disabled={loading || uploading} className="blog-submit-btn">
              {uploading ? "სურათები იტვირთება..." : loading ? "ემატება..." : "პოსტის დამატება"}
            </button>
          </form>
        </div>

        <div className="blog-list">
          {posts.length === 0 ? (
            <div className="blog-empty">ჯერ არცერთი პოსტი არ დამატებულა</div>
          ) : (
            posts.map((post) => (
              <div key={post._id} className="blog-item">
                {post.images?.[0]?.url ? (
                  <img src={post.images[0].url} alt="" className="blog-thumb" />
                ) : (
                  <div className="blog-thumb-placeholder"><DocIcon /></div>
                )}
                <div className="blog-item-info">
                  <h3 className="blog-item-title">{post.title?.ka} <span className="blog-item-title-en">/ {post.title?.en}</span></h3>
                </div>
                <div className="blog-item-actions">
                  <Link href={`/blog/${post._id}`} className="blog-edit-btn">რედაქტირება</Link>
                  <button onClick={() => handleDelete(post._id)} className="blog-delete-btn">წაშლა</button>
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

function DocIcon() {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
      <path d="M6 3h9l5 5v13H6z" />
      <path d="M14 3v5h5" />
      <path d="M9 13h6" />
      <path d="M9 17h6" />
    </svg>
  );
}