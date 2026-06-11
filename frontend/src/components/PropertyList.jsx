import React from "react";

export function PropertyList({ properties, onOpenDetail }) {
  return (
    <section className="card">
      <h2>Biens publies</h2>
      {properties.length === 0 ? (
        <p>Aucun bien pour le moment.</p>
      ) : (
        <ul className="property-list">
          {properties.map((item) => (
            <li key={item.id}>
              <h3>{item.title}</h3>
              <p>
                {item.city} • {item.area_m2} m2 • {item.rooms} pieces
              </p>
              <strong>{item.price.toLocaleString("fr-FR")} EUR</strong>
              <div className="inline-actions">
                <button type="button" onClick={() => onOpenDetail(item.id)}>
                  Voir detail
                </button>
              </div>
            </li>
          ))}
        </ul>
      )}
    </section>
  );
}
