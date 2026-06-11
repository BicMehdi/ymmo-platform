import React, { useState } from "react";

const EMPTY = { title: "", city: "", price: "", area_m2: "", property_type: "Appartement", description: "", rooms: 2, status: "published" };

export function PropertyForm({ onCreated, token }) {
  const [form, setForm] = useState(EMPTY);
  const [publishing, setPublishing] = useState(false);
  const [feedback, setFeedback] = useState(null); // { type: "success"|"error", msg }

  const set = (key, val) => setForm((f) => ({ ...f, [key]: val }));

  const submit = async (event) => {
    event.preventDefault();
    setPublishing(true);
    setFeedback(null);

    const payload = { ...form, price: Number(form.price), area_m2: Number(form.area_m2), rooms: Number(form.rooms) };

    try {
      const res = await fetch("http://localhost:8000/api/v1/properties", {
        method: "POST",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
        body: JSON.stringify(payload),
      });
      if (!res.ok) {
        setFeedback({ type: "error", msg: "Erreur lors de la publication. Vérifiez votre compte." });
        return;
      }
      setForm(EMPTY);
      setFeedback({ type: "success", msg: "Bien publié avec succès ✓" });
      onCreated();
    } catch (_) {
      setFeedback({ type: "error", msg: "Serveur inaccessible." });
    } finally {
      setPublishing(false);
    }
  };

  return (
    <form onSubmit={submit} className="card" aria-label="Formulaire ajout de bien">
      <h2>Publier un bien</h2>

      <div className="form-grid">
        {/* Titre — full width */}
        <div className="field">
          <label htmlFor="f-title">Titre du bien *</label>
          <input id="f-title" placeholder="Ex: Appartement lumineux 3 pièces" value={form.title} onChange={(e) => set("title", e.target.value)} required aria-required="true" />
        </div>

        {/* Ville | Type */}
        <div className="form-row">
          <div className="field">
            <label htmlFor="f-city">Ville *</label>
            <input id="f-city" placeholder="Ex: Lyon" value={form.city} onChange={(e) => set("city", e.target.value)} required aria-required="true" />
          </div>
          <div className="field">
            <label htmlFor="f-type">Type de bien *</label>
            <select id="f-type" value={form.property_type} onChange={(e) => set("property_type", e.target.value)}>
              <option>Appartement</option>
              <option>Maison</option>
              <option>Studio</option>
              <option>Bureau</option>
              <option>Local commercial</option>
            </select>
          </div>
        </div>

        {/* Prix | Surface */}
        <div className="form-row">
          <div className="field">
            <label htmlFor="f-price">Prix (€) *</label>
            <input id="f-price" type="number" placeholder="Ex: 250 000" value={form.price} onChange={(e) => set("price", e.target.value)} required aria-required="true" min="1" />
          </div>
          <div className="field">
            <label htmlFor="f-area">Surface (m²) *</label>
            <input id="f-area" type="number" placeholder="Ex: 75" value={form.area_m2} onChange={(e) => set("area_m2", e.target.value)} required aria-required="true" min="1" />
          </div>
        </div>

        {/* Pièces | Statut */}
        <div className="form-row">
          <div className="field">
            <label htmlFor="f-rooms">Pièces *</label>
            <input id="f-rooms" type="number" value={form.rooms} onChange={(e) => set("rooms", e.target.value)} required min="1" max="20" />
          </div>
          <div className="field">
            <label htmlFor="f-status">Statut</label>
            <select id="f-status" value={form.status} onChange={(e) => set("status", e.target.value)}>
              <option value="published">Publié</option>
              <option value="draft">Brouillon</option>
            </select>
          </div>
        </div>

        {/* Description */}
        <div className="field">
          <label htmlFor="f-desc">Description</label>
          <textarea id="f-desc" placeholder="Décrivez le bien : luminosité, standing, proximité des transports..." value={form.description} onChange={(e) => set("description", e.target.value)} rows={3} />
        </div>

        {/* Actions */}
        <div className="form-actions">
          <button type="submit" className="btn-primary" disabled={publishing}>
            {publishing ? "Publication..." : "Publier le bien"}
          </button>
          <button type="button" className="btn-secondary" onClick={() => { setForm(EMPTY); setFeedback(null); }}>
            Réinitialiser
          </button>
        </div>

        {feedback && (
          <p className={`status-bar ${feedback.type === "success" ? "success" : "error"}`} role="alert">
            {feedback.msg}
          </p>
        )}
      </div>
    </form>
  );
}
