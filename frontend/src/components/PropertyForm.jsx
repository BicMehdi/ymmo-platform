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
    <form onSubmit={submit} className="card form-grid">
      <h2>Ajouter un bien</h2>
      <input
        placeholder="Titre"
        value={form.title}
        onChange={(e) => setForm({ ...form, title: e.target.value })}
        required
      />
      <input
        placeholder="Ville"
        value={form.city}
        onChange={(e) => setForm({ ...form, city: e.target.value })}
        required
      />
      <input
        placeholder="Prix"
        type="number"
        value={form.price}
        onChange={(e) => setForm({ ...form, price: e.target.value })}
        required
      />
      <input
        placeholder="Surface m2"
        type="number"
        value={form.area_m2}
        onChange={(e) => setForm({ ...form, area_m2: e.target.value })}
        required
      />
      <input
        placeholder="Type"
        value={form.property_type}
        onChange={(e) => setForm({ ...form, property_type: e.target.value })}
        required
      />
      <input
        placeholder="Pieces"
        type="number"
        value={form.rooms}
        onChange={(e) => setForm({ ...form, rooms: e.target.value })}
        required
      />
      <textarea
        placeholder="Description"
        value={form.description}
        onChange={(e) => setForm({ ...form, description: e.target.value })}
        rows={4}
      />
      <button type="submit">Publier</button>
    </form>
  );
}
