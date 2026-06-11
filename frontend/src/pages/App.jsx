import React, { useEffect, useState } from "react";
import { AdminPanel } from "../components/AdminPanel";
import { AnalyticsBox } from "../components/AnalyticsBox";
import { AuthPanel } from "../components/AuthPanel";
import { ChartsBox } from "../components/ChartsBox";
import { LeadsPanel } from "../components/LeadsPanel";
import { PropertyFilters } from "../components/PropertyFilters";
import { PropertyForm } from "../components/PropertyForm";
import { PropertyList } from "../components/PropertyList";
import { TransactionsPanel } from "../components/TransactionsPanel";
import { PropertyDetailPage } from "./PropertyDetailPage";
import { ReservationPage } from "./ReservationPage";

const API_URL = "http://localhost:8000";

export function App() {
  const [token, setToken] = useState(localStorage.getItem("ymmo_token") || "");
  const [properties, setProperties] = useState([]);
  const [overview, setOverview] = useState({ properties_count: 0, leads_count: 0, users_count: 0, avg_price: 0 });
  const [estimatedPrice, setEstimatedPrice] = useState(null);
  const [selectedPropertyId, setSelectedPropertyId] = useState(null);
  const [currentUser, setCurrentUser] = useState(null);
  const [filters, setFilters] = useState({ city: "", property_type: "", min_price: "", max_price: "", min_area: "", max_area: "", rooms: "", status: "published" });
  const [loadError, setLoadError] = useState(false);
  const [loading, setLoading] = useState(false);
  const [favoriteIds, setFavoriteIds] = useState(new Set());
  const [reservingProperty, setReservingProperty] = useState(null);

  const saveToken = (value) => {
    setToken(value);
    value ? localStorage.setItem("ymmo_token", value) : localStorage.removeItem("ymmo_token");
  };

  const loadCurrentUser = async () => {
    if (!token) { setCurrentUser(null); setFavoriteIds(new Set()); return; }
    const res = await fetch(`${API_URL}/api/v1/auth/me`, { headers: { Authorization: `Bearer ${token}` } });
    if (!res.ok) { setCurrentUser(null); setFavoriteIds(new Set()); return; }
    setCurrentUser(await res.json());
  };

  const loadFavorites = async () => {
    if (!token) { setFavoriteIds(new Set()); return; }
    try {
      const res = await fetch(`${API_URL}/api/v1/favorites`, { headers: { Authorization: `Bearer ${token}` } });
      if (!res.ok) return;
      const data = await res.json();
      setFavoriteIds(new Set(data.map((f) => f.property_id)));
    } catch (_) {}
  };

  const toggleFavorite = async (propertyId) => {
    if (!token) return;
    if (favoriteIds.has(propertyId)) {
      await fetch(`${API_URL}/api/v1/favorites/${propertyId}`, { method: "DELETE", headers: { Authorization: `Bearer ${token}` } });
      setFavoriteIds((prev) => { const s = new Set(prev); s.delete(propertyId); return s; });
    } else {
      const res = await fetch(`${API_URL}/api/v1/favorites/${propertyId}`, { method: "POST", headers: { Authorization: `Bearer ${token}` } });
      if (res.ok) setFavoriteIds((prev) => new Set([...prev, propertyId]));
    }
  };

  const loadProperties = async () => {
    const params = new URLSearchParams();
    Object.entries(filters).forEach(([k, v]) => { if (v !== "") params.set(k, v); });
    const q = params.toString();
    try {
      const res = await fetch(`${API_URL}/api/v1/properties${q ? `?${q}` : ""}`);
      setProperties(await res.json());
      setLoadError(false);
    } catch (_) { setLoadError(true); }
  };

  const loadOverview = async () => {
    try {
      const res = await fetch(`${API_URL}/api/v1/analytics/overview`);
      setOverview(await res.json());
    } catch (_) {}
  };

  const estimatePrice = async (payload) => {
    const res = await fetch(`${API_URL}/api/v1/analytics/estimate-price`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    });
    const data = await res.json();
    setEstimatedPrice(data.estimated_price);
  };

  const refreshAll = async () => {
    setLoading(true);
    await Promise.all([loadProperties(), loadOverview()]);
    setLoading(false);
  };

  useEffect(() => { refreshAll(); }, []);
  useEffect(() => { loadCurrentUser(); loadFavorites(); }, [token]);

  const isAgent = currentUser?.role === "agent" || currentUser?.role === "admin";

  /* ── Reservation page ── */
  if (reservingProperty !== null) {
    return (
      <>
        <header className="app-header">
          <div className="app-header-inner">
            <div className="app-logo"><span className="app-logo-icon">🏡</span><span>Ym<em>mo</em></span></div>
            <nav className="app-nav">
              <button className="btn-ghost" onClick={() => setReservingProperty(null)}>← Retour</button>
            </nav>
          </div>
        </header>
        <div className="detail-layout">
          <ReservationPage
            property={reservingProperty}
            token={token}
            onBack={() => setReservingProperty(null)}
            onSuccess={() => {
              setReservingProperty(null);
              setSelectedPropertyId(null);
              refreshAll();
            }}
          />
        </div>
      </>
    );
 }

  /* ── Detail page ── */
  if (selectedPropertyId !== null) {
    return (
      <>
        <header className="app-header">
          <div className="app-header-inner">
            <div className="app-logo">
              <span className="app-logo-icon">🏡</span>
              <span>Ym<em>mo</em></span>
            </div>
            <nav className="app-nav">
              <button className="btn-ghost" onClick={() => setSelectedPropertyId(null)}>← Retour aux biens</button>
              {token && <button className="btn-ghost" onClick={() => saveToken("")}>Déconnexion</button>}
            </nav>
          </div>
        </header>
        <div className="detail-layout">
          <PropertyDetailPage
            propertyId={selectedPropertyId}
            token={token}
            userRole={currentUser?.role || null}
            onBack={() => setSelectedPropertyId(null)}
            onNavigate={(id) => setSelectedPropertyId(id)}
            favoriteIds={favoriteIds}
            onToggleFavorite={toggleFavorite}
            onReserve={(prop) => setReservingProperty(prop)}
          />
        </div>
      </>
    );
  }

  return (
    <>
      {/* ── HEADER ── */}
      <header className="app-header">
        <div className="app-header-inner">
          <div className="app-logo">
            <span className="app-logo-icon">🏡</span>
            <span>Ym<em>mo</em></span>
          </div>
          <nav className="app-nav">
            {!token && (
              <>
                <span style={{ fontSize: "0.85rem", color: "var(--text-soft)" }}>
                  Démo&nbsp;:&nbsp;agent@ymmo.fr / ymmo1234
                </span>
              </>
            )}
            {token && currentUser && (
              <span style={{ fontSize: "0.85rem", color: "var(--text-soft)" }}>
                {currentUser.email} · <em style={{ color: "var(--primary)", fontStyle: "normal", fontWeight: 600 }}>{currentUser.role}</em>
              </span>
            )}
            {token && <button className="btn-nav" onClick={() => saveToken("")}>Déconnexion</button>}
          </nav>
        </div>
      </header>

      {/* ── HERO ── */}
      <section className="app-hero">
        <div className="app-hero-inner">
          <h1>La plateforme immobilière Ymmo</h1>
          <p>Achetez, vendez et analysez le marché en temps réel.</p>
          <div className="hero-kpis">
            <div className="hero-kpi">
              <div className="hero-kpi-value">{overview.properties_count}</div>
              <div className="hero-kpi-label">Biens publiés</div>
            </div>
            <div className="hero-kpi">
              <div className="hero-kpi-value">{overview.leads_count}</div>
              <div className="hero-kpi-label">Demandes actives</div>
            </div>
            <div className="hero-kpi">
              <div className="hero-kpi-value">
                {overview.avg_price > 0 ? `${(overview.avg_price / 1000).toFixed(0)}k €` : "—"}
              </div>
              <div className="hero-kpi-label">Prix moyen</div>
            </div>
            {overview.avg_price > 0 && overview.properties_count > 0 && (
              <div className="hero-kpi">
                <div className="hero-kpi-value">
                  {Math.round(overview.avg_price / 65).toLocaleString("fr-FR")} €
                </div>
                <div className="hero-kpi-label">Estimation / m²</div>
              </div>
            )}
          </div>
          {loadError && (
            <p style={{ marginTop: "1rem", color: "rgba(255,255,255,0.7)", fontSize: "0.85rem" }}>
              ⚠ Serveur injoignable.{" "}
              <button className="btn-ghost" onClick={refreshAll} style={{ color: "white", background: "rgba(255,255,255,0.2)", height: "30px", padding: "0 0.7rem", fontSize: "0.82rem" }}>
                Réessayer
              </button>
            </p>
          )}
        </div>
      </section>

      {/* ── BODY ── */}
      <div className="app-body">
        {/* Sidebar */}
        <aside className="app-sidebar">
          <AuthPanel token={token} onAuthChange={saveToken} />
          {currentUser?.role === "admin" && <AdminPanel token={token} />}
          {currentUser?.role === "admin" && <TransactionsPanel token={token} />}
          {isAgent && <PropertyForm onCreated={refreshAll} token={token} />}
          <AnalyticsBox overview={overview} onEstimate={estimatePrice} estimatedPrice={estimatedPrice} />
          <LeadsPanel token={token} userRole={currentUser?.role || null} />
        </aside>

        {/* Main */}
        <main className="app-main">
          <PropertyFilters filters={filters} setFilters={setFilters} onApply={loadProperties} isAgent={isAgent} />
          <PropertyList properties={properties} onOpenDetail={setSelectedPropertyId} loading={loading} />
          <ChartsBox />
        </main>
      </div>

      {/* ── FOOTER ── */}
      <footer className="app-footer">
        <div className="app-footer-inner">
          <p>© 2026 Ymmo — Projet Ynov B2 INFRA &amp; DEV</p>
          <div style={{ display: "flex", gap: "1.25rem" }}>
            <a href="mailto:contact@ymmo.fr">Contact</a>
            <a href="#">Mentions légales</a>
          </div>
        </div>
      </footer>
    </>
  );
}
