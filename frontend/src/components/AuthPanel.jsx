import React, { useState } from "react";

const API_URL = "http://localhost:8000";

export function AuthPanel({ token, onAuthChange }) {
  const [mode, setMode] = useState("login");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [role, setRole] = useState("agent");
  const [status, setStatus] = useState(null); // { type, msg }
  const [loading, setLoading] = useState(false);

  const submit = async (event) => {
    event.preventDefault();
    setStatus(null);
    setLoading(true);

    try {
      if (mode === "register") {
        const res = await fetch(`${API_URL}/api/v1/auth/register`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ email, password, role }),
        });
          if (res.status === 400) { setStatus({ type: "error", msg: "Email déjà utilisé. Essayez un autre." }); return; }
          if (!res.ok) { setStatus({ type: "error", msg: "Inscription échouée (vérifiez : mot de passe min. 8 caractères)." }); return; }
        setStatus({ type: "success", msg: "Inscription réussie ✓ Connectez-vous." });
        setMode("login");
        return;
      }

      const res = await fetch(`${API_URL}/api/v1/auth/login`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, password }),
      });
      if (!res.ok) { setStatus({ type: "error", msg: "Identifiants incorrects." }); return; }
      const data = await res.json();
      onAuthChange(data.access_token);
      setStatus({ type: "success", msg: "Connexion réussie ✓" });
    } catch (_) {
      setStatus({ type: "error", msg: "Serveur inaccessible." });
    } finally {
      setLoading(false);
    }
  };

  if (token) {
    return (
      <section className="card">
        <h2>Compte</h2>
        <p role="status" style={{ color: "var(--success)", fontWeight: 600, fontSize: "0.9rem", marginBottom: "0.75rem" }}>
          ✅ Session active
        </p>
        <button type="button" className="btn-secondary" style={{ width: "100%" }} onClick={() => onAuthChange("")}>
          Se déconnecter
        </button>
      </section>
    );
  }

  return (
    <section className="card" aria-label="Authentification">
      <h2>{mode === "login" ? "Connexion" : "Créer un compte"}</h2>

      <form onSubmit={submit} className="form-grid" aria-label={mode === "login" ? "Formulaire connexion" : "Formulaire inscription"}>
        <div className="field">
          <label htmlFor="auth-email">Email</label>
          <input id="auth-email" type="email" placeholder="votre@email.fr" value={email} onChange={(e) => setEmail(e.target.value)} required autoComplete="email" />
        </div>
        <div className="field">
          <label htmlFor="auth-password">Mot de passe</label>
          <input id="auth-password" type="password" placeholder="••••••••" value={password} onChange={(e) => setPassword(e.target.value)} required minLength={mode === "register" ? 8 : undefined} autoComplete={mode === "login" ? "current-password" : "new-password"} />
        </div>
        {mode === "register" && (
          <p style={{ fontSize: "0.82rem", color: "var(--text-soft)", background: "var(--surface-muted)", padding: "0.6rem 0.8rem", borderRadius: "8px" }}>
            ℹ️ Tout nouveau compte est créé en tant que <strong>Client</strong>. Un admin peut ensuite vous attribuer le rôle Agent.
          </p>
        )}
        <button type="submit" className="btn-primary" style={{ width: "100%" }} disabled={loading}>
          {loading
            ? (mode === "login" ? "Connexion..." : "Inscription...")
            : (mode === "login" ? "Se connecter" : "S'inscrire")}
        </button>
      </form>

      <div className="inline-actions" style={{ marginTop: "0.75rem" }} role="group" aria-label="Changer de mode">
        <button type="button" className="btn-ghost" onClick={() => setMode("login")} aria-pressed={mode === "login"}>Connexion</button>
        <button type="button" className="btn-ghost" onClick={() => setMode("register")} aria-pressed={mode === "register"}>Inscription</button>
      </div>

      {status && (
        <p className={`status-bar ${status.type === "success" ? "success" : "error"}`} role="alert">
          {status.msg}
        </p>
      )}
    </section>
  );
}
