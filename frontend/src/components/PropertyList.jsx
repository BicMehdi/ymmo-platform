import React from "react";

const STATUS_CONFIG = {
  published: { label: "À vendre",   cls: "badge-success" },
  draft:     { label: "Brouillon",  cls: "badge-muted"   },
  sold:      { label: "Vendu",      cls: "badge-danger"  },  reserved:  { label: "R\u00e9serv\u00e9",    cls: "badge-warning" },};

const TYPE_ICONS = {
  Appartement:       "🏢",
  Maison:            "🏠",
  Studio:            "🛏",
  Bureau:            "🏬",
  "Local commercial":"🏪",
};

const IMAGES = {
  Appartement: [
    "https://images.unsplash.com/photo-1545324418-cc1a3fa10c00?w=480&h=200&fit=crop",
    "https://images.unsplash.com/photo-1502672260266-1c1ef2d93688?w=480&h=200&fit=crop",
    "https://images.unsplash.com/photo-1560448204-e02f11c3d0e2?w=480&h=200&fit=crop",
    "https://images.unsplash.com/photo-1493809842364-78817add7ffb?w=480&h=200&fit=crop",
  ],
  Maison: [
    "https://images.unsplash.com/photo-1568605114967-8130f3a36994?w=480&h=200&fit=crop",
    "https://images.unsplash.com/photo-1570129477492-45c003edd2be?w=480&h=200&fit=crop",
    "https://images.unsplash.com/photo-1449844908441-8829872d2607?w=480&h=200&fit=crop",
    "https://images.unsplash.com/photo-1518780664697-55e3ad937233?w=480&h=200&fit=crop",
  ],
  Studio: [
    "https://images.unsplash.com/photo-1536376072261-38c75010e6c9?w=480&h=200&fit=crop",
    "https://images.unsplash.com/photo-1522708323590-d24dbb6b0267?w=480&h=200&fit=crop",
    "https://images.unsplash.com/photo-1554995207-c18c203602cb?w=480&h=200&fit=crop",
  ],
  Bureau: [
    "https://images.unsplash.com/photo-1497366216548-37526070297c?w=480&h=200&fit=crop",
    "https://images.unsplash.com/photo-1497366811353-6870744d04b2?w=480&h=200&fit=crop",
    "https://images.unsplash.com/photo-1504384308090-c894fdcc538d?w=480&h=200&fit=crop",
  ],
  "Local commercial": [
    "https://images.unsplash.com/photo-1528698827591-e19ccd7bc23d?w=480&h=200&fit=crop",
    "https://images.unsplash.com/photo-1556742049-0cfed4f6a45d?w=480&h=200&fit=crop",
  ],
};

const DEFAULT_IMAGES = [
  "https://images.unsplash.com/photo-1560185127-6ed189bf02f4?w=480&h=200&fit=crop",
  "https://images.unsplash.com/photo-1512917774080-9991f1c4c750?w=480&h=200&fit=crop",
];

function getImage(type, id) {
  const pool = IMAGES[type] || DEFAULT_IMAGES;
  return pool[id % pool.length];
}

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
      <h2>
        Biens disponibles{" "}
        <span style={{ color: "var(--text-soft)", fontWeight: 400, fontSize: "0.85rem" }}>
          ({properties.length})
        </span>
      </h2>
      <ul className="property-list" style={{ gridTemplateColumns: "repeat(auto-fill, minmax(260px, 1fr))" }}>
        {properties.map((item) => {
          const st = STATUS_CONFIG[item.status] || STATUS_CONFIG.draft;
          const icon = TYPE_ICONS[item.property_type] || "🏠";
          const imgUrl = getImage(item.property_type, item.id);
          const pricePerM2 = item.area_m2 > 0 ? Math.round(item.price / item.area_m2) : null;

          return (
            <li key={item.id} className="property-card">
              {/* Photo */}
              <div className="property-card-img">
                <img
                  src={imgUrl}
                  alt={`${item.property_type} à ${item.city}`}
                  style={{ width: "100%", height: "100%", objectFit: "cover", display: "block" }}
                  loading="lazy"
                  onError={(e) => {
                    e.target.style.display = "none";
                    e.target.nextSibling.style.display = "flex";
                  }}
                />
                <div
                  style={{
                    display: "none",
                    position: "absolute", inset: 0,
                    background: "linear-gradient(135deg, #2f5d3a 0%, #1a3d23 100%)",
                    alignItems: "center", justifyContent: "center",
                    fontSize: "3rem", opacity: 0.4,
                  }}
                >
                  {icon}
                </div>
                <div className="property-card-img-badges">
                  <span className={`badge ${st.cls}`}>{st.label}</span>
                  <span className="badge" style={{ background: "rgba(0,0,0,0.45)", color: "white" }}>
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
                    Voir →
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
