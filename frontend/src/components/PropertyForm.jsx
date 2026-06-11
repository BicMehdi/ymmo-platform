import React, { useState } from "react";

export function PropertyForm({ onCreated, token }) {
  const [form, setForm] = useState({
    title: "",
    city: "",
    price: "",
    area_m2: "",
    property_type: "Appartement",
    description: "",
    rooms: 2,
  });

  const submit = async (event) => {
    event.preventDefault();

    const payload = {
      ...form,
      price: Number(form.price),
      area_m2: Number(form.area_m2),
      rooms: Number(form.rooms),
    };

    const response = await fetch("http://localhost:8000/api/v1/properties", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        ...(token ? { Authorization: `Bearer ${token}` } : {}),
      },
      body: JSON.stringify(payload),
    });

    if (!response.ok) {
      alert("Erreur: connexion requise avec un compte agent/admin");
      return;
    }

    setForm({
      title: "",
      city: "",
      price: "",
      area_m2: "",
      property_type: "Appartement",
      description: "",
      rooms: 2,
    });

    onCreated();
  };

  return (
    <form onSubmit={submit} className="card form-grid" aria-label="Formulaire ajout de bien">
      <h2 id="form-bien-title">Ajouter un bien</h2>

      <div className="field">
        <label htmlFor="f-title">Titre *</label>
        <input
          id="f-title"
          placeholder="Ex: Appartement lumineux 3 pièces"
          value={form.title}
          onChange={(e) => setForm({ ...form, title: e.target.value })}
          required
          aria-required="true"
        />
      </div>

      <div className="field">
        <label htmlFor="f-city">Ville *</label>
        <input
          id="f-city"
          placeholder="Ex: Lyon"
          value={form.city}
          onChange={(e) => setForm({ ...form, city: e.target.value })}
          required
          aria-required="true"
        />
      </div>

      <div className="field">
        <label htmlFor="f-price">Prix (EUR) *</label>
        <input
          id="f-price"
          type="number"
          placeholder="Ex: 250000"
          value={form.price}
          onChange={(e) => setForm({ ...form, price: e.target.value })}
          required
          aria-required="true"
          min="1"
        />
      </div>

      <div className="field">
        <label htmlFor="f-area">Surface (m²) *</label>
        <input
          id="f-area"
          type="number"
          placeholder="Ex: 75"
          value={form.area_m2}
          onChange={(e) => setForm({ ...form, area_m2: e.target.value })}
          required
          aria-required="true"
          min="1"
        />
      </div>

      <div className="field">
        <label htmlFor="f-type">Type de bien *</label>
        <select
          id="f-type"
          value={form.property_type}
          onChange={(e) => setForm({ ...form, property_type: e.target.value })}
          required
          aria-required="true"
        >
          <option>Appartement</option>
          <option>Maison</option>
          <option>Studio</option>
          <option>Bureau</option>
          <option>Local commercial</option>
        </select>
      </div>

      <div className="field">
        <label htmlFor="f-rooms">Nombre de pièces *</label>
        <input
          id="f-rooms"
          type="number"
          value={form.rooms}
          onChange={(e) => setForm({ ...form, rooms: e.target.value })}
          required
          aria-required="true"
          min="1"
        />
      </div>

      <div className="field">
        <label htmlFor="f-desc">Description</label>
        <textarea
          id="f-desc"
          placeholder="Description du bien..."
          value={form.description}
          onChange={(e) => setForm({ ...form, description: e.target.value })}
          rows={3}
        />
      </div>

      <button type="submit">Publier</button>
    </form>
  );
}
