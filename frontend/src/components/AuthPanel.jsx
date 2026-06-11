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
    <section className="card">
      <h2>Authentification</h2>
      {token ? <p>Session active</p> : <p>Connecte-toi pour publier un bien.</p>}
      <form onSubmit={submit} className="form-grid">
        <input
          type="email"
          placeholder="Email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          required
        />
        <input
          type="password"
          placeholder="Mot de passe"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          required
        />
        {mode === "register" && (
          <select value={role} onChange={(e) => setRole(e.target.value)}>
            <option value="agent">Agent</option>
            <option value="client">Client</option>
            <option value="admin">Admin</option>
          </select>
        )}
        <button type="submit">{mode === "login" ? "Se connecter" : "S'inscrire"}</button>
      </form>

      <div className="inline-actions">
        <button type="button" onClick={() => setMode("login")}>Mode connexion</button>
        <button type="button" onClick={() => setMode("register")}>Mode inscription</button>
        {token && (
          <button type="button" onClick={() => onAuthChange("")}>
            Se deconnecter
          </button>
        )}
      </div>
      {status && <p>{status}</p>}
    </section>
  );
}
