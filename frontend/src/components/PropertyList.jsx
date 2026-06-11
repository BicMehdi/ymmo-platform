import React from "react";

const STATUS_LABELS = {
  published: { label: "Publié", color: "#1d6b5d" },
  draft: { label: "Brouillon", color: "#888" },
  sold: { label: "Vendu", color: "#c0392b" },
};

export function PropertyList({ properties, onOpenDetail, loading }) {
  return (
    <section className="card">
      <h2>Biens publiés</h2>
      {loading ? (
        <p className="loading-text" aria-live="polite">Chargement...</p>
      ) : properties.length === 0 ? (
        <p>Aucun bien pour le moment.</p>
      ) : (
        <ul className="property-list">
          {properties.map((item) => {
            const st = STATUS_LABELS[item.status] || STATUS_LABELS.draft;
            return (
              <li key={item.id} className="property-card">
                <div className="property-card-header">
                  <h3>{item.title}</h3>
                  <span className="badge" style={{ backgroundColor: st.color }}>{st.label}</span>
                </div>
                <p className="property-meta">
                  {item.city} • {item.area_m2} m² • {item.rooms} pièce{item.rooms > 1 ? "s" : ""} • {item.property_type}
                </p>
                <div className="property-card-footer">
                  <strong className="property-price">{item.price.toLocaleString("fr-FR")} €</strong>
                  <button type="button" onClick={() => onOpenDetail(item.id)}>
                    Voir le détail
                  </button>
                </div>
              </li>
            );
          })}
        </ul>
      )}
    </section>
  );
}
