"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import "./blog.css";

export default function BlogPage() {
  const [posts, setPosts] = useState([]);
  const [form, setForm] = useState({ title: "", slug: "", content: "" });
  const [imageFile, setImageFile] = useState(null);
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

  async function handleCreate(e) {
    e.preventDefault();
    setLoading(true);

    let coverImage = "";

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

    await fetch("/api/blog", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ ...form, coverImage }),
    });

    setForm({ title: "", slug: "", content: "" });
    setImageFile(null);
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
          <form onSubmit={handleCreate} className="blog-form">
            <div className="blog-field">
              <label className="blog-field-label">სათაური<span className="required">*</span></label>
              <input
                className="blog-input"
                value={form.title}
                onChange={(e) => setForm({ ...form, title: e.target.value })}
                required
              />
            </div>

            <div className="blog-field">
              <label className="blog-field-label">სლაგი<span className="required">*</span></label>
              <input
                className="blog-input"
                value={form.slug}
                onChange={(e) => setForm({ ...form, slug: e.target.value })}
                placeholder="my-post-title"
                required
              />
              <p className="blog-slug-hint">URL-ის ნაწილი, ინგლისურად, დეფისებით — მაგ: my-post-title</p>
            </div>

            <div className="blog-field">
              <label className="blog-field-label">შინაარსი<span className="required">*</span></label>
              <textarea
                className="blog-textarea"
                value={form.content}
                onChange={(e) => setForm({ ...form, content: e.target.value })}
                required
              />
            </div>

            <div className="blog-field">
              <label className="blog-field-label">ყდის სურათი<span className="optional">(არასავალდებულო)</span></label>
              <input
                type="file"
                accept="image/*"
                className="blog-file-input"
                onChange={(e) => setImageFile(e.target.files[0])}
              />
            </div>

            <button type="submit" disabled={loading} className="blog-submit-btn">
              {uploading ? "სურათი იტვირთება..." : loading ? "ემატება..." : "პოსტის დამატება"}
            </button>
          </form>
        </div>

        <div className="blog-list">
          {posts.length === 0 ? (
            <div className="blog-empty">ჯერ არცერთი პოსტი არ დამატებულა</div>
          ) : (
            posts.map((post) => (
              <div key={post._id} className="blog-item">
                {post.coverImage ? (
                  <img src={post.coverImage} alt={post.title} className="blog-thumb" />
                ) : (
                  <div className="blog-thumb-placeholder"><DocIcon /></div>
                )}
                <div className="blog-item-info">
                  <h3 className="blog-item-title">{post.title}</h3>
                  <p className="blog-item-meta">/{post.slug}</p>
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