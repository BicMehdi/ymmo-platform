import React, { useEffect, useState } from "react";

const API_URL = "http://localhost:8000";

/* ── Galeries par type (4 photos chacune) ─────────────────────── */
const GALLERY = {
  Appartement: [
    "https://images.unsplash.com/photo-1545324418-cc1a3fa10c00?w=1200&h=600&fit=crop",
    "https://images.unsplash.com/photo-1502672260266-1c1ef2d93688?w=400&h=260&fit=crop",
    "https://images.unsplash.com/photo-1560448204-e02f11c3d0e2?w=400&h=260&fit=crop",
    "https://images.unsplash.com/photo-1493809842364-78817add7ffb?w=400&h=260&fit=crop",
  ],
  Maison: [
    "https://images.unsplash.com/photo-1568605114967-8130f3a36994?w=1200&h=600&fit=crop",
    "https://images.unsplash.com/photo-1570129477492-45c003edd2be?w=400&h=260&fit=crop",
    "https://images.unsplash.com/photo-1449844908441-8829872d2607?w=400&h=260&fit=crop",
    "https://images.unsplash.com/photo-1518780664697-55e3ad937233?w=400&h=260&fit=crop",
  ],
  Studio: [
    "https://images.unsplash.com/photo-1536376072261-38c75010e6c9?w=1200&h=600&fit=crop",
    "https://images.unsplash.com/photo-1522708323590-d24dbb6b0267?w=400&h=260&fit=crop",
    "https://images.unsplash.com/photo-1554995207-c18c203602cb?w=400&h=260&fit=crop",
  ],
  Bureau: [
    "https://images.unsplash.com/photo-1497366216548-37526070297c?w=1200&h=600&fit=crop",
    "https://images.unsplash.com/photo-1497366811353-6870744d04b2?w=400&h=260&fit=crop",
    "https://images.unsplash.com/photo-1504384308090-c894fdcc538d?w=400&h=260&fit=crop",
  ],
  "Local commercial": [
    "https://images.unsplash.com/photo-1528698827591-e19ccd7bc23d?w=1200&h=600&fit=crop",
    "https://images.unsplash.com/photo-1556742049-0cfed4f6a45d?w=400&h=260&fit=crop",
  ],
};
const DEFAULT_GALLERY = [
  "https://images.unsplash.com/photo-1560185127-6ed189bf02f4?w=1200&h=600&fit=crop",
  "https://images.unsplash.com/photo-1512917774080-9991f1c4c750?w=400&h=260&fit=crop",
];
function getGallery(type) { return GALLERY[type] || DEFAULT_GALLERY; }

const STATUS_CONFIG = {
  published: { label: "Disponible", cls: "badge-success" },
  draft:     { label: "Brouillon",  cls: "badge-muted"   },
  sold:      { label: "Vendu",      cls: "badge-danger"  },
};
const TYPE_ICONS = {
  Appartement: "🏢", Maison: "🏠", Studio: "🛏",
  Bureau: "🏬", "Local commercial": "🏪",
};

/* ── Mini-carte pour biens similaires ────────────────────────── */
function SimilarCard({ item, onNavigate }) {
  const imgs = getGallery(item.property_type);
  const mainImg = imgs[item.id % imgs.length];
  const st = STATUS_CONFIG[item.status] || STATUS_CONFIG.draft;
  return (
    <div
      className="similar-card"
      onClick={() => onNavigate(item.id)}
      role="button"
      tabIndex={0}
      onKeyDown={(e) => e.key === "Enter" && onNavigate(item.id)}
    >
      <div className="similar-card-img">
        <img src={mainImg} alt={item.title} loading="lazy" />
        <span className={`badge ${st.cls}`} style={{ position: "absolute", top: 8, left: 8 }}>{st.label}</span>
      </div>
      <div className="similar-card-body">
        <h4 title={item.title}>{item.title}</h4>
        <p>📍 {item.city} · {item.area_m2} m²</p>
        <strong>{item.price.toLocaleString("fr-FR")} €</strong>
      </div>
    </div>
  );
}

/* ── Page principale ─────────────────────────────────────────── */
export function PropertyDetailPage({ propertyId, token, userRole, currentUserId, onBack, onNavigate, favoriteIds = new Set(), onToggleFavorite, onReserve }) {
  const [property, setProperty]     = useState(null);
  const [loading, setLoading]       = useState(true);
  const [activeImg, setActiveImg]   = useState(0);
  const [showLeadForm, setShowLeadForm] = useState(false);
  const [leadMessage, setLeadMessage]   = useState("");
  const [leadStatus, setLeadStatus]     = useState(null);
  const [similar, setSimilar]       = useState([]);
  const [showEdit, setShowEdit]     = useState(false);
  const [editData, setEditData]     = useState({});
  const [actionStatus, setActionStatus] = useState(null);
  const [deleting, setDeleting]     = useState(false);

  const isFavorite = favoriteIds.has(propertyId);

  useEffect(() => {
    setLoading(true);
    setActiveImg(0);
    setProperty(null);
    setSimilar([]);
    setShowEdit(false);
    setActionStatus(null);
    setLeadStatus(null);
    setShowLeadForm(false);

    (async () => {
      const res = await fetch(`${API_URL}/api/v1/properties/${propertyId}`);
      if (!res.ok) { setLoading(false); return; }
      const data = await res.json();
      setProperty(data);
      setEditData({ title: data.title, price: data.price, city: data.city, area_m2: data.area_m2, rooms: data.rooms, description: data.description, status: data.status });

      /* Biens similaires : même ville + même type */
      const [r1, r2] = await Promise.all([
        fetch(`${API_URL}/api/v1/properties?city=${encodeURIComponent(data.city)}&limit=8`),
        fetch(`${API_URL}/api/v1/properties?property_type=${encodeURIComponent(data.property_type)}&limit=8`),
      ]);
      const byCity = r1.ok ? await r1.json() : [];
      const byType = r2.ok ? await r2.json() : [];
      const seen = new Set([propertyId]);
      const merged = [];
      for (const p of [...byCity, ...byType]) {
        if (!seen.has(p.id)) { seen.add(p.id); merged.push(p); }
        if (merged.length >= 4) break;
      }
      setSimilar(merged);
      setLoading(false);
    })();
  }, [propertyId]);

  const sendLead = async (e) => {
    e.preventDefault();
    if (!token) { setLeadStatus({ type: "error", msg: "Connexion requise pour envoyer une demande." }); return; }
    const res = await fetch(`${API_URL}/api/v1/leads`, {
      method: "POST",
      headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
      body: JSON.stringify({ property_id: propertyId, message: leadMessage }),
    });
    if (!res.ok) { setLeadStatus({ type: "error", msg: "Impossible d'envoyer la demande (compte client requis)." }); return; }
    setLeadMessage("");
    setShowLeadForm(false);
    setLeadStatus({ type: "success", msg: "✅ Demande envoyée ! L'agent vous contactera bientôt." });
  };

  const handleDelete = async () => {
    if (!window.confirm(`Supprimer "${property.title}" ? Action irréversible.`)) return;
    setDeleting(true);
    const res = await fetch(`${API_URL}/api/v1/properties/${propertyId}`, {
      method: "DELETE",
      headers: { Authorization: `Bearer ${token}` },
    });
    setDeleting(false);
    if (res.ok || res.status === 204) { onBack(); }
    else { setActionStatus({ type: "error", msg: "Suppression impossible." }); }
  };

  const handleEdit = async (e) => {
    e.preventDefault();
    const res = await fetch(`${API_URL}/api/v1/properties/${propertyId}`, {
      method: "PUT",
      headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
      body: JSON.stringify(editData),
    });
    if (!res.ok) { setActionStatus({ type: "error", msg: "Modification impossible." }); return; }
    setProperty(await res.json());
    setShowEdit(false);
    setActionStatus({ type: "success", msg: "✅ Bien mis à jour." });
  };

  /* ── États de chargement / erreur ── */
  if (loading) return (
    <div className="detail-state-center">
      <div style={{ fontSize: "3rem" }}>⏳</div>
      <p>Chargement du bien...</p>
    </div>
  );

  if (!property) return (
    <div className="detail-state-center">
      <div style={{ fontSize: "3rem" }}>😞</div>
      <p>Ce bien est introuvable.</p>
      <button className="btn-primary" onClick={onBack} style={{ marginTop: "1rem" }}>← Retour</button>
    </div>
  );

  const gallery = getGallery(property.property_type);
  const st = STATUS_CONFIG[property.status] || STATUS_CONFIG.draft;
  const icon = TYPE_ICONS[property.property_type] || "🏠";
  const pricePerM2 = property.area_m2 > 0 ? Math.round(property.price / property.area_m2) : null;

  return (
    <article className="detail-page">

      {/* ── BREADCRUMB ── */}
      <nav className="detail-breadcrumb">
        <button type="button" className="btn-ghost" onClick={onBack}>← Retour aux biens</button>
        <span className="detail-bc-sep">›</span>
        <span>{property.city}</span>
        <span className="detail-bc-sep">›</span>
        <span className="detail-bc-current">{property.title}</span>
      </nav>

      {/* ── EN-TÊTE PRIX / TITRE ── */}
      <div className="detail-header">
        <div>
          <h1 className="detail-title">{property.title}</h1>
          <div className="detail-header-meta">
            <span className={`badge ${st.cls}`}>{st.label}</span>
            <span>{icon} {property.property_type}</span>
            <span>📍 {property.city}</span>
          </div>
        </div>
        <div className="detail-price-block">
          <div className="detail-price">{property.price.toLocaleString("fr-FR")} €</div>
          {pricePerM2 && <div className="detail-price-m2">{pricePerM2.toLocaleString("fr-FR")} €/m²</div>}
        </div>
      </div>

      {/* ── GALERIE ── */}
      <div className="detail-gallery-wrap">
        <div className="detail-main-img" onClick={() => window.open(gallery[activeImg].split("?")[0], "_blank")}>
          <img src={gallery[activeImg]} alt={property.title} />
          <span className="detail-zoom-hint">🔍 Agrandir</span>
        </div>
        <div className="detail-thumbs">
          {gallery.map((url, i) => (
            <button
              key={i} type="button"
              className={`detail-thumb${activeImg === i ? " active" : ""}`}
              onClick={() => setActiveImg(i)}
              aria-label={`Photo ${i + 1}`}
            >
              <img src={url} alt={`Photo ${i + 1}`} loading="lazy" />
            </button>
          ))}
        </div>
      </div>

      {/* ── CORPS 2 COLONNES ── */}
      <div className="detail-body">

        {/* GAUCHE */}
        <div className="detail-left">

          {/* Caractéristiques */}
          <section className="card">
            <h2>Caractéristiques</h2>
            <div className="detail-specs-grid">
              {[
                { icon: "📐", label: "Surface",   val: `${property.area_m2} m²` },
                { icon: "🚪", label: "Pièces",    val: property.rooms },
                { icon: "🛏", label: "Chambres",  val: Math.max(1, property.rooms - 1) },
                { icon: "🏷", label: "Type",      val: property.property_type },
                { icon: "📍", label: "Ville",     val: property.city },
                { icon: "💶", label: "Prix / m²", val: pricePerM2 ? `${pricePerM2.toLocaleString("fr-FR")} €` : "—", primary: true },
              ].map(({ icon: ic, label, val, primary }) => (
                <div key={label} className="detail-spec-item">
                  <span className="detail-spec-icon">{ic}</span>
                  <span className="detail-spec-label">{label}</span>
                  <span className={`detail-spec-val${primary ? " primary" : ""}`}>{val}</span>
                </div>
              ))}
            </div>
          </section>

          {/* Description */}
          <section className="card">
            <h2>Description</h2>
            <p className="detail-description">
              {property.description || "Aucune description disponible pour ce bien."}
            </p>
          </section>

          {/* Admin : modifier / supprimer */}
          {(userRole === "admin" || userRole === "super_admin" || (userRole === "agent" && property.owner_user_id === currentUserId)) && (
            <section className="card detail-admin-card">
              <h2>{userRole === "agent" ? "✏️ Mon annonce" : "⚙️ Administration"}</h2>
              <div style={{ display: "flex", gap: "0.75rem", flexWrap: "wrap" }}>
                <button className="btn-secondary" onClick={() => { setShowEdit(!showEdit); setActionStatus(null); }}>
                  {showEdit ? "✕ Annuler" : "✏️ Modifier ce bien"}
                </button>
                <button className="btn-danger" onClick={handleDelete} disabled={deleting}>
                  {deleting ? "Suppression..." : "🗑️ Supprimer"}
                </button>
              </div>

              {actionStatus && (
                <p className={`status-bar ${actionStatus.type === "success" ? "success" : "error"}`} style={{ marginTop: "0.75rem" }}>
                  {actionStatus.msg}
                </p>
              )}

              {showEdit && (
                <form onSubmit={handleEdit} className="detail-edit-form">
                  <div className="form-row">
                    <div className="field"><label>Titre</label>
                      <input value={editData.title} onChange={(e) => setEditData({ ...editData, title: e.target.value })} required minLength={3} maxLength={120} />
                    </div>
                    <div className="field"><label>Ville</label>
                      <input value={editData.city} onChange={(e) => setEditData({ ...editData, city: e.target.value })} required />
                    </div>
                  </div>
                  <div className="form-row">
                    <div className="field"><label>Prix (€)</label>
                      <input type="number" value={editData.price} onChange={(e) => setEditData({ ...editData, price: +e.target.value })} required min={1} />
                    </div>
                    <div className="field"><label>Surface (m²)</label>
                      <input type="number" value={editData.area_m2} onChange={(e) => setEditData({ ...editData, area_m2: +e.target.value })} required min={1} />
                    </div>
                  </div>
                  <div className="form-row">
                    <div className="field"><label>Pièces</label>
                      <input type="number" value={editData.rooms} onChange={(e) => setEditData({ ...editData, rooms: +e.target.value })} required min={1} />
                    </div>
                    <div className="field"><label>Statut</label>
                      <select value={editData.status} onChange={(e) => setEditData({ ...editData, status: e.target.value })}>
                        <option value="published">Disponible</option>
                        <option value="draft">Brouillon</option>
                        <option value="sold">Vendu</option>
                      </select>
                    </div>
                  </div>
                  <div className="field"><label>Description</label>
                    <textarea rows={4} value={editData.description} onChange={(e) => setEditData({ ...editData, description: e.target.value })} maxLength={1000} />
                  </div>
                  <button type="submit" className="btn-primary" style={{ alignSelf: "flex-start" }}>💾 Enregistrer</button>
                </form>
              )}
            </section>
          )}
        </div>

        {/* DROITE */}
        <div className="detail-right">

          {/* Actions client */}
          <section className="card detail-actions-card">
            <div className="detail-actions-btns">
              <button
                type="button"
                className={`btn-secondary detail-action-btn${isFavorite ? " fav-on" : ""}`}
                onClick={() => onToggleFavorite && onToggleFavorite(propertyId)}
              >
                {isFavorite ? "❤️ Dans mes favoris" : "🤍 Ajouter aux favoris"}
              </button>
              {property.status === "published" && (
                <button
                  type="button"
                  className="btn-primary detail-action-btn"
                  style={{ background: "var(--primary)", fontWeight: 700 }}
                  onClick={() => onReserve && onReserve(property)}
                >
                  🏠 Réserver ce bien
                </button>
              )}
              {property.status === "reserved" && (
                <div className="detail-action-btn" style={{ textAlign: "center", background: "#fff3cd", borderRadius: "12px", padding: "0.75rem", fontSize: "0.88rem", color: "#856404", border: "1px solid #ffc107" }}>
                  ⏳ Bien déjà réservé
                </div>
              )}
              <button
                type="button"
                className="btn-secondary detail-action-btn"
                onClick={() => { setShowLeadForm(!showLeadForm); setLeadStatus(null); }}
              >
                📅 Demander une visite
              </button>
              <a href="tel:+33100000000" className="btn-secondary detail-action-btn" style={{ textDecoration: "none", textAlign: "center" }}>
                📞 Contacter l'agence
              </a>
            </div>

            {leadStatus && (
              <p className={`status-bar ${leadStatus.type === "success" ? "success" : "error"}`} style={{ marginTop: "0.75rem" }}>
                {leadStatus.msg}
              </p>
            )}

            {showLeadForm && (
              <form onSubmit={sendLead} className="detail-lead-form">
                <label style={{ fontWeight: 600, fontSize: "0.9rem" }}>Votre message</label>
                <textarea
                  rows={4}
                  placeholder="Bonjour, je suis intéressé(e) par ce bien et souhaite organiser une visite..."
                  value={leadMessage}
                  onChange={(e) => setLeadMessage(e.target.value)}
                  required minLength={6}
                />
                <button type="submit" className="btn-primary">Envoyer la demande →</button>
                {!token && <p style={{ fontSize: "0.8rem", color: "var(--text-soft)" }}>ℹ️ Connexion requise pour envoyer une demande.</p>}
              </form>
            )}
          </section>

          {/* Agence */}
          <section className="card detail-agency-card">
            <h3>🏢 Agence Ymmo</h3>
            <div className="detail-agency-agent">
              <span className="detail-agency-avatar">👤</span>
              <div>
                <div style={{ fontWeight: 600, fontSize: "0.9rem" }}>Agent Ymmo</div>
                <div style={{ fontSize: "0.8rem", color: "var(--text-soft)" }}>Conseiller immobilier</div>
              </div>
            </div>
            <ul className="detail-agency-info">
              <li>📞 +33 1 00 00 00 00</li>
              <li>✉️ contact@ymmo.fr</li>
              <li>🕘 Lun–Sam, 9h–19h</li>
            </ul>
          </section>
        </div>
      </div>

      {/* ── BIENS SIMILAIRES ── */}
      {similar.length > 0 && (
        <section className="card detail-similar">
          <h2>Biens similaires</h2>
          <div className="detail-similar-tags">
            <span className="badge badge-primary">📍 {property.city}</span>
            <span className="badge badge-warning">{property.property_type}</span>
          </div>
          <div className="similar-grid">
            {similar.map((p) => (
              <SimilarCard key={p.id} item={p} onNavigate={onNavigate || onBack} />
            ))}
          </div>
        </section>
      )}
    </article>
  );
}
