"use client";

import { useEffect, useMemo, useState } from "react";
import { STATUSES, statusById, type Job, type Group } from "@/lib/statuses";

function fmtDate(ts: number) {
  return new Date(ts).toLocaleDateString("cs-CZ", {
    day: "numeric",
    month: "numeric",
    year: "numeric",
  });
}
function uid() {
  return Date.now().toString(36) + Math.floor(Math.random() * 1e9).toString(36);
}

type FormState = {
  id: string;
  title: string;
  company: string;
  link: string;
  note: string;
  status: string;
  group: Group;
};

const emptyForm: FormState = {
  id: "",
  title: "",
  company: "",
  link: "",
  note: "",
  status: "todo",
  group: "basic",
};

export default function Page() {
  const [jobs, setJobs] = useState<Job[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("");
  const [modalOpen, setModalOpen] = useState(false);
  const [form, setForm] = useState<FormState>(emptyForm);
  const [toastMsg, setToastMsg] = useState("");

  // ---- načtení ----
  useEffect(() => {
    fetch("/api/jobs")
      .then((r) => r.json())
      .then((data) => {
        if (Array.isArray(data)) setJobs(data);
      })
      .catch(() => toast("Nepodařilo se načíst data"))
      .finally(() => setLoading(false));
  }, []);

  function toast(msg: string) {
    setToastMsg(msg);
    setTimeout(() => setToastMsg(""), 2200);
  }

  // ---- API operace ----
  async function persist(job: Job) {
    // optimistický update ve stavu
    setJobs((prev) => prev.map((j) => (j.id === job.id ? job : j)));
    try {
      await fetch(`/api/jobs/${job.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(job),
      });
    } catch {
      toast("Chyba uložení");
    }
  }

  async function changeStatus(id: string, status: string) {
    const j = jobs.find((x) => x.id === id);
    if (j) {
      await persist({ ...j, status });
      toast("Stav změněn");
    }
  }
  async function moveJob(id: string) {
    const j = jobs.find((x) => x.id === id);
    if (j) {
      const group: Group = j.group === "top" ? "basic" : "top";
      await persist({ ...j, group });
      toast("Přesunuto do: " + (group === "top" ? "Top" : "Basic"));
    }
  }
  async function delJob(id: string) {
    const j = jobs.find((x) => x.id === id);
    if (j && confirm(`Smazat pozici „${j.title}" (${j.company})?`)) {
      setJobs((prev) => prev.filter((x) => x.id !== id));
      try {
        await fetch(`/api/jobs/${id}`, { method: "DELETE" });
        toast("Smazáno");
      } catch {
        toast("Chyba mazání");
      }
    }
  }
  async function addComment(id: string, text: string) {
    const j = jobs.find((x) => x.id === id);
    if (j && text.trim()) {
      const comments = [...j.comments, { id: uid(), text: text.trim(), ts: Date.now() }];
      await persist({ ...j, comments });
    }
  }
  async function delComment(jobId: string, cId: string) {
    const j = jobs.find((x) => x.id === jobId);
    if (j) {
      await persist({ ...j, comments: j.comments.filter((c) => c.id !== cId) });
    }
  }

  // ---- modal ----
  function openAdd() {
    setForm(emptyForm);
    setModalOpen(true);
  }
  function openEdit(j: Job) {
    setForm({
      id: j.id,
      title: j.title,
      company: j.company,
      link: j.link,
      note: j.note,
      status: j.status,
      group: j.group,
    });
    setModalOpen(true);
  }
  async function saveJob() {
    if (!form.title.trim() || !form.company.trim()) {
      toast("Vyplň název pozice a firmu");
      return;
    }
    if (form.id) {
      const existing = jobs.find((x) => x.id === form.id);
      if (existing) {
        await persist({ ...existing, ...form });
        toast("Uloženo");
      }
    } else {
      const res = await fetch("/api/jobs", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form),
      });
      const data = await res.json();
      if (res.ok) {
        const newJob: Job = {
          ...form,
          id: data.id,
          created: data.created,
          comments: [],
        };
        setJobs((prev) => [newJob, ...prev]);
        toast("Pozice přidána");
      } else {
        toast(data.error || "Chyba");
        return;
      }
    }
    setModalOpen(false);
  }

  // ---- statistiky ----
  const stats = useMemo(() => {
    const total = jobs.length;
    const active = jobs.filter((j) => !["rejected", "offer"].includes(j.status)).length;
    const offers = jobs.filter((j) => j.status === "offer").length;
    const interviews = jobs.filter((j) => ["interview", "waiting_int"].includes(j.status)).length;
    return { total, active, offers, interviews };
  }, [jobs]);

  function filtered(group: Group) {
    const s = search.toLowerCase().trim();
    return jobs
      .filter((j) => j.group === group)
      .filter((j) => !statusFilter || j.status === statusFilter)
      .filter(
        (j) =>
          !s ||
          j.title.toLowerCase().includes(s) ||
          j.company.toLowerCase().includes(s)
      )
      .sort((a, b) => b.created - a.created);
  }

  return (
    <>
      <header>
        <div className="brand">
          <div className="logo">JT</div>
          <h1>Job Tracker</h1>
        </div>
        <div className="header-actions">
          <button className="btn-ghost" onClick={() => (window.location.href = "/api/logout")}>
            Odhlásit
          </button>
          <button className="btn-primary" onClick={openAdd}>
            ＋ Přidat pozici
          </button>
        </div>
      </header>

      <main>
        <div className="stats">
          <Stat num={stats.total} lbl="Celkem pozic" />
          <Stat num={stats.active} lbl="Aktivní" color="var(--accent)" />
          <Stat num={stats.interviews} lbl="Pohovory" color="#4f8cff" />
          <Stat num={stats.offers} lbl="Nabídky" color="#3fd68b" />
        </div>

        <div className="toolbar">
          <div className="search">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <circle cx="11" cy="11" r="8" />
              <path d="m21 21-4.3-4.3" />
            </svg>
            <input
              type="text"
              placeholder="Hledat pozici nebo firmu…"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
          </div>
          <select className="filter" value={statusFilter} onChange={(e) => setStatusFilter(e.target.value)}>
            <option value="">Všechny stavy</option>
            {STATUSES.map((s) => (
              <option key={s.id} value={s.id}>
                {s.label}
              </option>
            ))}
          </select>
        </div>

        {loading ? (
          <div className="loading">Načítám…</div>
        ) : (
          <div className="groups">
            <GroupCol
              group="top"
              title="Top firmy"
              total={jobs.filter((j) => j.group === "top").length}
              list={filtered("top")}
              filterActive={!!(search || statusFilter)}
              onStatus={changeStatus}
              onMove={moveJob}
              onDel={delJob}
              onEdit={openEdit}
              onAddComment={addComment}
              onDelComment={delComment}
            />
            <GroupCol
              group="basic"
              title="Basic firmy"
              total={jobs.filter((j) => j.group === "basic").length}
              list={filtered("basic")}
              filterActive={!!(search || statusFilter)}
              onStatus={changeStatus}
              onMove={moveJob}
              onDel={delJob}
              onEdit={openEdit}
              onAddComment={addComment}
              onDelComment={delComment}
            />
          </div>
        )}
      </main>

      {modalOpen && (
        <div className="overlay" onClick={(e) => e.target === e.currentTarget && setModalOpen(false)}>
          <div className="modal">
            <h2>{form.id ? "Upravit pozici" : "Přidat pozici"}</h2>
            <div className="field">
              <label>Název pozice *</label>
              <input
                autoFocus
                value={form.title}
                onChange={(e) => setForm({ ...form, title: e.target.value })}
                placeholder="např. Senior Backend Developer"
              />
            </div>
            <div className="field">
              <label>Firma *</label>
              <input
                value={form.company}
                onChange={(e) => setForm({ ...form, company: e.target.value })}
                placeholder="např. Acme s.r.o."
              />
            </div>
            <div className="field">
              <label>Odkaz na LinkedIn</label>
              <input
                value={form.link}
                onChange={(e) => setForm({ ...form, link: e.target.value })}
                placeholder="https://www.linkedin.com/jobs/…"
              />
            </div>
            <div className="field">
              <label>Skupina</label>
              <div className="seg">
                <label className={form.group === "top" ? "active-top" : ""}>
                  <input
                    type="radio"
                    name="group"
                    checked={form.group === "top"}
                    onChange={() => setForm({ ...form, group: "top" })}
                  />
                  ⭐ Top
                </label>
                <label className={form.group === "basic" ? "active-basic" : ""}>
                  <input
                    type="radio"
                    name="group"
                    checked={form.group === "basic"}
                    onChange={() => setForm({ ...form, group: "basic" })}
                  />
                  Basic
                </label>
              </div>
            </div>
            <div className="field">
              <label>Stav</label>
              <select value={form.status} onChange={(e) => setForm({ ...form, status: e.target.value })}>
                {STATUSES.map((s) => (
                  <option key={s.id} value={s.id}>
                    {s.label}
                  </option>
                ))}
              </select>
            </div>
            <div className="field">
              <label>Poznámka (volitelné)</label>
              <textarea
                value={form.note}
                onChange={(e) => setForm({ ...form, note: e.target.value })}
                placeholder="Plat, kontakt, deadline…"
              />
            </div>
            <div className="modal-actions">
              <button className="btn-ghost" onClick={() => setModalOpen(false)}>
                Zrušit
              </button>
              <button className="btn-primary" onClick={saveJob}>
                Uložit
              </button>
            </div>
          </div>
        </div>
      )}

      <div className={"toast" + (toastMsg ? " show" : "")}>{toastMsg}</div>
    </>
  );
}

function Stat({ num, lbl, color }: { num: number; lbl: string; color?: string }) {
  return (
    <div className="stat">
      <div className="num" style={color ? { color } : undefined}>
        {num}
      </div>
      <div className="lbl">{lbl}</div>
    </div>
  );
}

type GroupColProps = {
  group: Group;
  title: string;
  total: number;
  list: Job[];
  filterActive: boolean;
  onStatus: (id: string, status: string) => void;
  onMove: (id: string) => void;
  onDel: (id: string) => void;
  onEdit: (j: Job) => void;
  onAddComment: (id: string, text: string) => void;
  onDelComment: (jobId: string, cId: string) => void;
};

function GroupCol(p: GroupColProps) {
  return (
    <section className={"group " + p.group}>
      <div className="group-head">
        <div className="group-title">
          <span className="group-dot"></span> {p.title}
        </div>
        <span className="group-count">{p.total}</span>
      </div>
      <div className="group-body">
        {p.list.length === 0 ? (
          <div className="empty">Žádné pozice{p.filterActive ? " odpovídající filtru" : ""}.</div>
        ) : (
          p.list.map((j) => (
            <JobCard
              key={j.id}
              job={j}
              onStatus={p.onStatus}
              onMove={p.onMove}
              onDel={p.onDel}
              onEdit={p.onEdit}
              onAddComment={p.onAddComment}
              onDelComment={p.onDelComment}
            />
          ))
        )}
      </div>
    </section>
  );
}

type JobCardProps = Omit<GroupColProps, "group" | "title" | "total" | "list" | "filterActive"> & {
  job: Job;
};

function JobCard({ job, onStatus, onMove, onDel, onEdit, onAddComment, onDelComment }: JobCardProps) {
  const [draft, setDraft] = useState("");
  const st = statusById(job.status);

  function submitComment() {
    if (draft.trim()) {
      onAddComment(job.id, draft);
      setDraft("");
    }
  }

  return (
    <div className="card">
      <div className="card-top">
        <div>
          <div className="card-title">{job.title}</div>
          <div className="card-company">{job.company}</div>
        </div>
        <button className="icon-btn" onClick={() => onEdit(job)} title="Upravit">
          ✎
        </button>
      </div>

      {job.note && (
        <div className="card-note">{job.note}</div>
      )}

      <div className="card-meta">
        <span className="status-badge">
          <span className="sdot" style={{ background: st.color }}></span>
          {st.label}
        </span>
        {job.link && (
          <a className="card-link" href={job.link} target="_blank" rel="noopener noreferrer">
            ↗ LinkedIn
          </a>
        )}
        <span className="card-date">přidáno {fmtDate(job.created)}</span>
      </div>

      <div className="card-actions">
        <select value={job.status} onChange={(e) => onStatus(job.id, e.target.value)}>
          {STATUSES.map((s) => (
            <option key={s.id} value={s.id}>
              {s.label}
            </option>
          ))}
        </select>
        <button className="icon-btn" onClick={() => onMove(job.id)} title="Přesunout skupinu">
          ⇄
        </button>
        <button className="icon-btn" onClick={() => onDel(job.id)} title="Smazat">
          🗑
        </button>
      </div>

      <div className="comments">
        {job.comments.map((c) => (
          <div className="comment" key={c.id}>
            <span>💬 {c.text}</span>
            <span className="ctime">{fmtDate(c.ts)}</span>
            <button className="comment-del" onClick={() => onDelComment(job.id, c.id)} title="Smazat">
              ✕
            </button>
          </div>
        ))}
        <div className="comment-add">
          <input
            type="text"
            placeholder="Přidat komentář…"
            value={draft}
            onChange={(e) => setDraft(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && submitComment()}
          />
          <button className="icon-btn" onClick={submitComment}>
            ＋
          </button>
        </div>
      </div>
    </div>
  );
}
