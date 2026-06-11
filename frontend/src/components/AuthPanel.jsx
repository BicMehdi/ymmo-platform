import React, { useState } from "react";

const API_URL = "http://localhost:8000";

export function AuthPanel({ token, onAuthChange }) {
  const [mode, setMode] = useState("login");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [role, setRole] = useState("agent");
  const [status, setStatus] = useState("");

  const submit = async (event) => {
    event.preventDefault();
    setStatus("");

    if (mode === "register") {
      const response = await fetch(`${API_URL}/api/v1/auth/register`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, password, role }),
      });

      if (!response.ok) {
        setStatus("Inscription echouee");
        return;
      }
      setStatus("Inscription reussie, connecte-toi.");
      setMode("login");
      return;
    }

    const response = await fetch(`${API_URL}/api/v1/auth/login`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email, password }),
    });

    if (!response.ok) {
      setStatus("Connexion echouee");
      return;
    }

    const data = await response.json();
    onAuthChange(data.access_token);
    setStatus("Connecte");
  };

  return (
    <section className="card" aria-label="Authentification">
      <h2>Authentification</h2>
      {token ? <p role="status">Session active</p> : <p>Connecte-toi pour publier un bien.</p>}
      <form onSubmit={submit} className="form-grid" aria-label={mode === "login" ? "Formulaire connexion" : "Formulaire inscription"}>
        <div className="field">
          <label htmlFor="auth-email">Email *</label>
          <input
            id="auth-email"
            type="email"
            placeholder="votre@email.fr"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
            aria-required="true"
            autoComplete="email"
          />
        </div>
        <div className="field">
          <label htmlFor="auth-password">Mot de passe *</label>
          <input
            id="auth-password"
            type="password"
            placeholder="••••••••"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
            aria-required="true"
            autoComplete={mode === "login" ? "current-password" : "new-password"}
          />
        </div>
        {mode === "register" && (
          <div className="field">
            <label htmlFor="auth-role">Rôle</label>
            <select id="auth-role" value={role} onChange={(e) => setRole(e.target.value)}>
              <option value="agent">Agent</option>
              <option value="client">Client</option>
              <option value="admin">Admin</option>
            </select>
          </div>
        )}
        <button type="submit">{mode === "login" ? "Se connecter" : "S'inscrire"}</button>
      </form>

      <div className="inline-actions" role="group" aria-label="Changer de mode">
        <button type="button" onClick={() => setMode("login")} aria-pressed={mode === "login"}>Connexion</button>
        <button type="button" onClick={() => setMode("register")} aria-pressed={mode === "register"}>Inscription</button>
        {token && (
          <button type="button" onClick={() => onAuthChange("")}>
            Se déconnecter
          </button>
        )}
      </div>
      {status && <p role="alert">{status}</p>}
    </section>
  );
}
