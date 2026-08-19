"use client";

import { useEffect, useState } from "react";
import { useRouter, useParams } from "next/navigation";
import Link from "next/link";
import "./eventsid.css";

export default function EditEventPage() {
  const router = useRouter();
  const { id } = useParams();
  const [form, setForm] = useState(null);
  const [imageFile, setImageFile] = useState(null);
  const [loading, setLoading] = useState(false);
  const [uploading, setUploading] = useState(false);

  useEffect(() => {
    fetch(`/api/events/${id}`)
      .then((res) => res.json())
      .then((data) => setForm({ ...data, date: data.date?.slice(0, 10) }));
  }, [id]);

  async function handleUpdate(e) {
    e.preventDefault();
    setLoading(true);

    let imageUrl = form.image;

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
      imageUrl = uploadResult.url;
    }

    await fetch(`/api/events/${id}`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ ...form, image: imageUrl }),
    });
    router.push("/events");
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
            <div className="evid-field">
              <label className="evid-field-label">სათაური<span className="required">*</span></label>
              <input
                className="evid-input"
                value={form.title}
                onChange={(e) => setForm({ ...form, title: e.target.value })}
                required
              />
            </div>

            <div className="evid-field">
              <label className="evid-field-label">აღწერა<span className="required">*</span></label>
              <textarea
                className="evid-textarea"
                value={form.description}
                onChange={(e) => setForm({ ...form, description: e.target.value })}
                required
              />
            </div>

            <div className="evid-row">
              <div className="evid-field">
                <label className="evid-field-label">თარიღი<span className="required">*</span></label>
                <input
                  type="date"
                  className="evid-input"
                  value={form.date}
                  onChange={(e) => setForm({ ...form, date: e.target.value })}
                  required
                />
              </div>
              <div className="evid-field">
                <label className="evid-field-label">ლოკაცია<span className="optional">(არასავალდებულო)</span></label>
                <input
                  className="evid-input"
                  value={form.location || ""}
                  onChange={(e) => setForm({ ...form, location: e.target.value })}
                />
              </div>
            </div>

            <div className="evid-field">
              <label className="evid-field-label">მთავარი სურათი</label>
              <div className="evid-preview-wrap">
                {form.image && <img src={form.image} alt="" className="evid-preview" />}
                <input
                  type="file"
                  accept="image/*"
                  className="evid-file-input"
                  onChange={(e) => setImageFile(e.target.files[0])}
                />
              </div>
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