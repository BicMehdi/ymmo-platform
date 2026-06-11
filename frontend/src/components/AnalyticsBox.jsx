import React, { useState } from "react";

export function AnalyticsBox({ overview, onEstimate }) {
  const [city, setCity] = useState("Marseille");
  const [area, setArea] = useState(60);
  const [rooms, setRooms] = useState(3);

  const submit = async (event) => {
    event.preventDefault();
    onEstimate({ city, area_m2: Number(area), rooms: Number(rooms) });
  };

  return (
    <section className="card">
      <h2>Dashboard</h2>
      <p>Biens: {overview.properties_count}</p>
      <p>Demandes: {overview.leads_count}</p>
      <p>Prix moyen: {overview.avg_price.toLocaleString("fr-FR")} EUR</p>

      <form onSubmit={submit} className="estimate-form">
        <h3>Estimation rapide</h3>
        <input value={city} onChange={(e) => setCity(e.target.value)} required />
        <input type="number" value={area} onChange={(e) => setArea(e.target.value)} required />
        <input type="number" value={rooms} onChange={(e) => setRooms(e.target.value)} required />
        <button type="submit">Estimer</button>
      </form>
    </section>
  );
}
