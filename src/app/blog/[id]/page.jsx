"use client";

import { useEffect, useState } from "react";
import { useRouter, useParams } from "next/navigation";
import Link from "next/link";
import "./blogid.css";

export default function EditBlogPage() {
  const router = useRouter();
  const { id } = useParams();
  const [form, setForm] = useState(null);
  const [imageFile, setImageFile] = useState(null);
  const [loading, setLoading] = useState(false);
  const [uploading, setUploading] = useState(false);

  useEffect(() => {
    fetch(`/api/blog/${id}`)
      .then((res) => res.json())
      .then((data) => setForm(data));
  }, [id]);

  async function handleUpdate(e) {
    e.preventDefault();
    setLoading(true);

    let coverImage = form.coverImage;

    if (imageFile) {
      setUploading(true);
      const uploadData = new FormData();
      uploadData.append("file", imageFile);
      const uploadRes = await fetch("/api/upload", { method: "POST", body: uploadData });
      const uploadResult = await uploadRes.json();
      setUploading(false);

      if (!uploadRes.ok) {
        alert("სურათის ატვირთვა ვერ მოხერხდა");
        setLoading(false);
        return;
      }
      coverImage = uploadResult.url;
    }

    await fetch(`/api/blog/${id}`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ ...form, coverImage }),
    });
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
          <form onSubmit={handleUpdate} className="blid-form">
            <div className="blid-field">
              <label className="blid-field-label">სათაური<span className="required">*</span></label>
              <input
                className="blid-input"
                value={form.title}
                onChange={(e) => setForm({ ...form, title: e.target.value })}
                required
              />
            </div>

            <div className="blid-field">
              <label className="blid-field-label">სლაგი<span className="required">*</span></label>
              <input
                className="blid-input"
                value={form.slug}
                onChange={(e) => setForm({ ...form, slug: e.target.value })}
                required
              />
            </div>

            <div className="blid-field">
              <label className="blid-field-label">კონტენტი<span className="required">*</span></label>
              <textarea
                rows={6}
                className="blid-textarea"
                value={form.content}
                onChange={(e) => setForm({ ...form, content: e.target.value })}
                required
              />
            </div>

            <div className="blid-field">
              <label className="blid-field-label">ყდის სურათი<span className="optional">(არასავალდებულო)</span></label>
              <div className="blid-preview-wrap">
                {form.coverImage && <img src={form.coverImage} alt="" className="blid-preview" />}
                <input
                  type="file"
                  accept="image/*"
                  className="blid-file-input"
                  onChange={(e) => setImageFile(e.target.files[0])}
                />
              </div>
            </div>

            <div className="blid-actions">
              <button type="submit" disabled={loading} className="blid-save-btn">
                {uploading ? "სურათი იტვირთება..." : loading ? "ინახება..." : "შენახვა"}
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