import React, { useEffect, useState } from "react";
import { AnalyticsBox } from "../components/AnalyticsBox";
import { AuthPanel } from "../components/AuthPanel";
import { ChartsBox } from "../components/ChartsBox";
import { LeadsPanel } from "../components/LeadsPanel";
import { PropertyFilters } from "../components/PropertyFilters";
import { PropertyForm } from "../components/PropertyForm";
import { PropertyList } from "../components/PropertyList";
import { PropertyDetailPage } from "./PropertyDetailPage";

const API_URL = "http://localhost:8000";

export function App() {
  const [token, setToken] = useState(localStorage.getItem("ymmo_token") || "");
  const [properties, setProperties] = useState([]);
  const [overview, setOverview] = useState({
    properties_count: 0,
    leads_count: 0,
    avg_price: 0,
  });
  const [estimatedPrice, setEstimatedPrice] = useState(null);
  const [selectedPropertyId, setSelectedPropertyId] = useState(null);
  const [currentUser, setCurrentUser] = useState(null);
  const [filters, setFilters] = useState({
    city: "",
    property_type: "",
    min_price: "",
    max_price: "",
    min_area: "",
    max_area: "",
    rooms: "",
  });

  const saveToken = (value) => {
    setToken(value);
    if (value) {
      localStorage.setItem("ymmo_token", value);
    } else {
      localStorage.removeItem("ymmo_token");
    }
  };

  const loadCurrentUser = async () => {
    if (!token) {
      setCurrentUser(null);
      return;
    }

    const response = await fetch(`${API_URL}/api/v1/auth/me`, {
      headers: { Authorization: `Bearer ${token}` },
    });

    if (!response.ok) {
      setCurrentUser(null);
      return;
    }

    const data = await response.json();
    setCurrentUser(data);
  };

  const [loadError, setLoadError] = useState(false);
  const [loading, setLoading] = useState(false);

  const loadProperties = async () => {
    const params = new URLSearchParams();
    Object.entries(filters).forEach(([key, value]) => {
      if (value !== "") {
        params.set(key, value);
      }
    });

    const query = params.toString();
    try {
      const response = await fetch(
        `${API_URL}/api/v1/properties${query ? `?${query}` : ""}`
      );
      const data = await response.json();
      setProperties(data);
      setLoadError(false);
    } catch (_) {
      setLoadError(true);
    }
  };

  const loadOverview = async () => {
    try {
      const response = await fetch(`${API_URL}/api/v1/analytics/overview`);
      const data = await response.json();
      setOverview(data);
    } catch (_) {}
  };

  const estimatePrice = async (payload) => {
    const response = await fetch(`${API_URL}/api/v1/analytics/estimate-price`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    });
    const data = await response.json();
    setEstimatedPrice(data.estimated_price);
  };

  const refreshAll = async () => {
    setLoading(true);
    await Promise.all([loadProperties(), loadOverview()]);
    setLoading(false);
  };

  useEffect(() => {
    refreshAll();
  }, []);

  useEffect(() => {
    loadCurrentUser();
  }, [token]);

  if (selectedPropertyId !== null) {
    return (
      <main className="layout">
        <header className="hero">
          <h1>Ymmo DEV</h1>
          <p>Detail du bien et workflow de demande client</p>
        </header>
        <PropertyDetailPage
          propertyId={selectedPropertyId}
          token={token}
          userRole={currentUser?.role || null}
          onBack={() => setSelectedPropertyId(null)}
        />
      </main>
    );
  }

  return (
    <main className="layout">
      <header className="hero">
        <h1>Ymmo DEV</h1>
        <p>Plateforme MVP achat/vente et aide a la decision</p>
        {loadError && (
          <p role="alert" style={{ color: "#c0392b", fontSize: "0.9rem" }}>
            Connexion au serveur impossible.{" "}
            <button type="button" onClick={refreshAll} style={{ textDecoration: "underline", background: "none", border: "none", color: "inherit", cursor: "pointer" }}>
              Réessayer
            </button>
          </p>
        )}
      </header>

      <div className="grid">
        <AuthPanel token={token} onAuthChange={saveToken} />
        {(currentUser?.role === "agent" || currentUser?.role === "admin") && (
          <PropertyForm onCreated={refreshAll} token={token} />
        )}
        <AnalyticsBox overview={overview} onEstimate={estimatePrice} />
        <PropertyFilters filters={filters} setFilters={setFilters} onApply={loadProperties} />
        <LeadsPanel token={token} userRole={currentUser?.role || null} />
      </div>

      {estimatedPrice !== null && (
        <section className="card">
          <h2>Estimation IA baseline</h2>
          <p>{estimatedPrice.toLocaleString("fr-FR")} EUR</p>
        </section>
      )}

      <PropertyList properties={properties} onOpenDetail={setSelectedPropertyId} loading={loading} />
      <ChartsBox />
    </main>
  );
}
