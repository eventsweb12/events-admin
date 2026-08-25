"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import './dashboard.css'

export default function DashboardPage() {
  const [events, setEvents] = useState([]);
  const [posts, setPosts] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function load() {
      const [eventsRes, postsRes] = await Promise.all([
        fetch("/api/events"),
        fetch("/api/blog"),
      ]);
      setEvents(await eventsRes.json());
      setPosts(await postsRes.json());
      setLoading(false);
    }
    load();
  }, []);

  async function handleLogout() {
    await fetch("/api/auth/logout", { method: "POST" });
    window.location.href = "/login";
  }

  return (
    <div className="dash-shell">
      <div className="dash-topbar">
        <div className="dash-topbar-inner">
          <div className="dash-brand">
            <div className="dash-brand-mark">M</div>
            <span className="dash-brand-text">Motion Concept Admin</span>
          </div>
          <button onClick={handleLogout} className="dash-logout-btn">
            გასვლა
          </button>
        </div>
      </div>

      <div className="dash-container">
        <h1 className="dash-heading">დეშბორდი</h1>
        <p className="dash-subtitle">ივენთებისა და ბლოგის მართვა ერთი ადგილიდან</p>

        <div className="dash-grid">
          <Link href="/events" className="dash-resource-card">
            <div className="dash-resource-top">
              <div className="dash-resource-icon">
                <CalendarIcon />
              </div>
              <span className="dash-badge">{loading ? "…" : events.length}</span>
            </div>
            <h2 className="dash-resource-title">ივენთები</h2>
            <p className="dash-resource-desc">დამატება, რედაქტირება და წაშლა</p>
          </Link>

          <Link href="/blog" className="dash-resource-card">
            <div className="dash-resource-top">
              <div className="dash-resource-icon">
                <DocIcon />
              </div>
              <span className="dash-badge">{loading ? "…" : posts.length}</span>
            </div>
            <h2 className="dash-resource-title">ბლოგი</h2>
            <p className="dash-resource-desc">დამატება, რედაქტირება და წაშლა</p>
          </Link>
        </div>

        <div className="dash-section">
          <div className="dash-section-header">
            <h3 className="dash-section-title">ბოლო ივენთები</h3>
            <Link href="/events" className="dash-viewall-link">ყველას ნახვა</Link>
          </div>

          <div className="dash-list">
            {loading ? (
              <div className="dash-empty">იტვირთება...</div>
            ) : events.length === 0 ? (
              <div className="dash-empty">ჯერ არცერთი ივენთი არ დამატებულა</div>
            ) : (
              events.slice(0, 5).map((ev) => (
                <Link href={`/events/${ev._id}`} key={ev._id} className="dash-list-item">
                  {ev.mainImage ? (
                    <img src={ev.mainImage} alt="" className="dash-item-thumb" />
                  ) : (
                    <div className="dash-item-thumb-placeholder"><CalendarIcon /></div>
                  )}
                  <div className="dash-item-info">
                    <p className="dash-item-title">
                      {ev.eventName?.geo || ev.eventName?.eng || "უსახელო ივენთი"}
                    </p>
                    <p className="dash-item-meta">
                      {ev.year ? ev.year : ""}
                      {(ev.venue?.geo || ev.venue?.eng)
                        ? ` · ${ev.venue?.geo || ev.venue?.eng}`
                        : ""}
                    </p>
                  </div>
                  <div className="dash-item-chevron"><ChevronIcon /></div>
                </Link>
              ))
            )}
          </div>
        </div>

        <div className="dash-section">
          <div className="dash-section-header">
            <h3 className="dash-section-title">ბოლო ბლოგ პოსტები</h3>
            <Link href="/blog" className="dash-viewall-link">ყველას ნახვა</Link>
          </div>

          <div className="dash-list">
            {loading ? (
              <div className="dash-empty">იტვირთება...</div>
            ) : posts.length === 0 ? (
              <div className="dash-empty">ჯერ არცერთი პოსტი არ დამატებულა</div>
            ) : (
              posts.slice(0, 5).map((post) => {
                const thumbUrl = post.images?.[0]?.url;
                return (
                  <Link href={`/blog/${post._id}`} key={post._id} className="dash-list-item">
                    {thumbUrl ? (
                      <img src={thumbUrl} alt="" className="dash-item-thumb" />
                    ) : (
                      <div className="dash-item-thumb-placeholder"><DocIcon /></div>
                    )}
                    <div className="dash-item-info">
                      <p className="dash-item-title">
                        {post.title?.ka || post.title?.en || "უსახელო პოსტი"}
                      </p>
                      <p className="dash-item-meta">/{post.slug}</p>
                    </div>
                    <div className="dash-item-chevron"><ChevronIcon /></div>
                  </Link>
                );
              })
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

function CalendarIcon() {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
      <rect x="3" y="4.5" width="18" height="16" rx="3" />
      <path d="M3 9.5h18" />
      <path d="M8 3v3" />
      <path d="M16 3v3" />
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

function ChevronIcon() {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M9 6l6 6-6 6" />
    </svg>
  );
}