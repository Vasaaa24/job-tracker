"use client";

import { useState } from "react";

export default function LoginPage() {
  const [password, setPassword] = useState("");
  const [err, setErr] = useState("");
  const [loading, setLoading] = useState(false);

  async function submit() {
    setLoading(true);
    setErr("");
    const res = await fetch("/api/login", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ password }),
    });
    if (res.ok) {
      window.location.href = "/";
    } else {
      setErr("Špatné heslo");
      setLoading(false);
    }
  }

  return (
    <div className="login-wrap">
      <div className="login-box">
        <div className="logo">JT</div>
        <h1>Job Tracker</h1>
        <p>Zadej heslo pro přístup</p>
        <input
          type="password"
          autoFocus
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          onKeyDown={(e) => e.key === "Enter" && submit()}
          placeholder="Heslo"
        />
        {err && <div className="err">{err}</div>}
        <button className="btn-primary" style={{ width: "100%" }} onClick={submit} disabled={loading}>
          {loading ? "Přihlašuji…" : "Přihlásit se"}
        </button>
      </div>
    </div>
  );
}
