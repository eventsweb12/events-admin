"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import "./events.css";

export default function EventsPage() {
  const [events, setEvents] = useState([]);
  const [form, setForm] = useState({ title: "", description: "", date: "", location: "" });
  const [imageFile, setImageFile] = useState(null);
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

  async function handleCreate(e) {
    e.preventDefault();

    if (!imageFile) {
      alert("მთავარი სურათი სავალდებულოა");
      return;
    }

    setLoading(true);
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

    await fetch("/api/events", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ ...form, image: uploadResult.url }),
    });

    setForm({ title: "", description: "", date: "", location: "" });
    setImageFile(null);
    await loadEvents();
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
            <div className="ev-field">
              <label className="ev-field-label">სათაური<span className="required">*</span></label>
              <input
                className="ev-input"
                value={form.title}
                onChange={(e) => setForm({ ...form, title: e.target.value })}
                required
              />
            </div>

            <div className="ev-field">
              <label className="ev-field-label">აღწერა<span className="required">*</span></label>
              <textarea
                className="ev-textarea"
                value={form.description}
                onChange={(e) => setForm({ ...form, description: e.target.value })}
                required
              />
            </div>

            <div className="ev-row">
              <div className="ev-field">
                <label className="ev-field-label">თარიღი<span className="required">*</span></label>
                <input
                  type="date"
                  className="ev-input"
                  value={form.date}
                  onChange={(e) => setForm({ ...form, date: e.target.value })}
                  required
                />
              </div>
              <div className="ev-field">
                <label className="ev-field-label">ლოკაცია<span className="optional">(არასავალდებულო)</span></label>
                <input
                  className="ev-input"
                  value={form.location}
                  onChange={(e) => setForm({ ...form, location: e.target.value })}
                />
              </div>
            </div>

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

            <button type="submit" disabled={loading} className="ev-submit-btn">
              {uploading ? "სურათი იტვირთება..." : loading ? "ემატება..." : "ივენთის დამატება"}
            </button>
          </form>
        </div>

        <div className="ev-list">
          {events.length === 0 ? (
            <div className="ev-empty">ჯერ არცერთი ივენთი არ დამატებულა</div>
          ) : (
            events.map((ev) => (
              <div key={ev._id} className="ev-item">
                {ev.image && <img src={ev.image} alt={ev.title} className="ev-thumb" />}
                <div className="ev-item-info">
                  <h3 className="ev-item-title">{ev.title}</h3>
                  <p className="ev-item-meta">
                    <CalendarSmallIcon />
                    {new Date(ev.date).toLocaleDateString("ka-GE")}
                    {ev.location ? ` · ${ev.location}` : ""}
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