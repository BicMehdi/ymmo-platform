import React from "react";

const STATUS_CONFIG = {
  published: { label: "À vendre",   cls: "badge-success" },
  draft:     { label: "Brouillon",  cls: "badge-muted"   },
  sold:      { label: "Vendu",      cls: "badge-danger"  },
};

const TYPE_ICONS = {
  Appartement:       "🏢",
  Maison:            "🏠",
  Studio:            "🛏",
  Bureau:            "🏬",
  "Local commercial":"🏪",
};

const GRADIENT_MAP = [
  "linear-gradient(135deg, #2f5d3a 0%, #1a3d23 100%)",
  "linear-gradient(135deg, #1e3d5e 0%, #0f2236 100%)",
  "linear-gradient(135deg, #5d3a2f 0%, #3d1a0f 100%)",
  "linear-gradient(135deg, #3a2f5d 0%, #1a0f3d 100%)",
  "linear-gradient(135deg, #2f5d50 0%, #0f3d30 100%)",
];

export function PropertyList({ properties, onOpenDetail, loading }) {
  if (loading) {
    return (
      <section className="card">
        <h2>Biens disponibles</h2>
        <div className="empty-state">
          <div className="empty-state-icon">⏳</div>
          <p>Chargement des biens...</p>
        </div>
      </section>
    );
  }

  if (properties.length === 0) {
    return (
      <section className="card">
        <h2>Biens disponibles</h2>
        <div className="empty-state">
          <div className="empty-state-icon">🏡</div>
          <p>Aucun bien pour le moment.<br />Lancez une recherche ou publiez le premier bien.</p>
        </div>
      </section>
    );
  }

  return (
    <section className="card">
      <h2>Biens disponibles <span style={{ color: "var(--text-soft)", fontWeight: 400, fontSize: "0.85rem" }}>({properties.length})</span></h2>
      <ul className="property-list" style={{ gridTemplateColumns: "repeat(auto-fill, minmax(260px, 1fr))" }}>
        {properties.map((item, idx) => {
          const st = STATUS_CONFIG[item.status] || STATUS_CONFIG.draft;
          const icon = TYPE_ICONS[item.property_type] || "🏠";
          const gradient = GRADIENT_MAP[idx % GRADIENT_MAP.length];
          const pricePerM2 = item.area_m2 > 0 ? Math.round(item.price / item.area_m2) : null;

          return (
            <li key={item.id} className="property-card">
              {/* Image placeholder */}
              <div className="property-card-img" style={{ background: gradient }}>
                <span className="property-card-img-icon">{icon}</span>
                <div className="property-card-img-badges">
                  <span className={`badge ${st.cls}`}>{st.label}</span>
                  <span className="badge badge-primary" style={{ background: "rgba(255,255,255,0.18)", color: "white" }}>
                    {item.property_type}
                  </span>
                </div>
              </div>

              {/* Body */}
              <div className="property-card-body">
                <h3 title={item.title}>{item.title}</h3>
                <p className="property-meta">📍 {item.city}</p>

                <div className="property-specs">
                  <span className="property-spec">📐 {item.area_m2} m²</span>
                  <span className="property-spec">🚪 {item.rooms} pièce{item.rooms > 1 ? "s" : ""}</span>
                  {pricePerM2 && (
                    <span className="property-spec" style={{ color: "var(--primary)", fontWeight: 600 }}>
                      {pricePerM2.toLocaleString("fr-FR")} €/m²
                    </span>
                  )}
                </div>

                <div className="property-card-footer">
                  <strong className="property-price">{item.price.toLocaleString("fr-FR")} €</strong>
                  <button
                    type="button"
                    className="btn-primary"
                    style={{ height: "36px", fontSize: "0.82rem", padding: "0 0.9rem" }}
                    onClick={() => onOpenDetail(item.id)}
                  >
                    Voir le détail →
                  </button>
                </div>
              </div>
            </li>
          );
        })}
      </ul>
    </section>
  );
}
