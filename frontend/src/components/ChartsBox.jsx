import React, { useEffect, useState } from "react";
import {
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  Legend,
  Line,
  LineChart,
  Pie,
  PieChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";

const API_URL = "http://localhost:8000";

const COLORS = ["#1d6b5d", "#2d9e8e", "#5bbfb0", "#94d4cc", "#c8eae6", "#e8a020", "#f0c060"];

export function ChartsBox() {
  const [charts, setCharts] = useState(null);

  const load = async () => {
    try {
      const resp = await fetch(`${API_URL}/api/v1/analytics/charts`);
      if (!resp.ok) return;
      setCharts(await resp.json());
    } catch (_) {}
  };

  useEffect(() => {
    load();
  }, []);

  if (!charts) return null;

  const hasCityData = charts.avg_price_by_city?.length > 0;
  const hasTypeData = charts.avg_price_by_type?.length > 0;
  const hasMonthData = charts.monthly_listings?.length > 0;
  const hasLeadsData = charts.top_cities_by_leads?.length > 0;
  const dist = charts.price_distribution;

  if (!hasCityData && !hasMonthData) {
    return (
      <section className="card">
        <h2>Analyses du marché</h2>
        <p>Aucune donnée disponible. Publiez des biens pour voir les graphiques.</p>
      </section>
    );
  }

  return (
    <section className="card charts-section" aria-label="Analyses et graphiques du marché">
      <h2>Analyses du marché</h2>

      {dist && dist.mean > 0 && (
        <div className="stat-row" role="list" aria-label="Indicateurs clés">
          <div className="stat-item" role="listitem">
            <span className="stat-label">Prix min</span>
            <strong>{dist.min.toLocaleString("fr-FR")} €</strong>
          </div>
          <div className="stat-item" role="listitem">
            <span className="stat-label">Médiane</span>
            <strong>{dist.median.toLocaleString("fr-FR")} €</strong>
          </div>
          <div className="stat-item" role="listitem">
            <span className="stat-label">Prix moyen</span>
            <strong>{dist.mean.toLocaleString("fr-FR")} €</strong>
          </div>
          <div className="stat-item" role="listitem">
            <span className="stat-label">Prix max</span>
            <strong>{dist.max.toLocaleString("fr-FR")} €</strong>
          </div>
        </div>
      )}

      {hasCityData && (
        <div className="chart-block">
          <h3>Prix moyen par ville</h3>
          <ResponsiveContainer width="100%" height={240}>
            <BarChart data={charts.avg_price_by_city} margin={{ top: 5, right: 10, left: 10, bottom: 40 }}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="city" angle={-30} textAnchor="end" tick={{ fontSize: 12 }} />
              <YAxis tickFormatter={(v) => `${(v / 1000).toFixed(0)}k`} />
              <Tooltip formatter={(v) => `${v.toLocaleString("fr-FR")} €`} />
              <Bar dataKey="avg_price" name="Prix moyen (€)" fill="#1d6b5d" />
            </BarChart>
          </ResponsiveContainer>
        </div>
      )}

      {hasMonthData && (
        <div className="chart-block">
          <h3>Publications par mois</h3>
          <ResponsiveContainer width="100%" height={220}>
            <LineChart data={charts.monthly_listings} margin={{ top: 5, right: 10, left: 0, bottom: 20 }}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="month" tick={{ fontSize: 11 }} />
              <YAxis allowDecimals={false} />
              <Tooltip />
              <Line type="monotone" dataKey="count" name="Biens publiés" stroke="#1d6b5d" strokeWidth={2} dot />
            </LineChart>
          </ResponsiveContainer>
        </div>
      )}

      {hasTypeData && (
        <div className="chart-block">
          <h3>Répartition par type</h3>
          <ResponsiveContainer width="100%" height={220}>
            <PieChart>
              <Pie
                data={charts.avg_price_by_type}
                dataKey="count"
                nameKey="property_type"
                outerRadius={80}
                label={({ property_type, percent }) =>
                  `${property_type} ${(percent * 100).toFixed(0)}%`
                }
              >
                {charts.avg_price_by_type.map((_, i) => (
                  <Cell key={i} fill={COLORS[i % COLORS.length]} />
                ))}
              </Pie>
              <Tooltip formatter={(v, name) => [v, name]} />
            </PieChart>
          </ResponsiveContainer>
        </div>
      )}

      {hasLeadsData && (
        <div className="chart-block">
          <h3>Villes les plus demandées</h3>
          <ResponsiveContainer width="100%" height={200}>
            <BarChart data={charts.top_cities_by_leads} layout="vertical" margin={{ left: 20 }}>
              <XAxis type="number" allowDecimals={false} />
              <YAxis type="category" dataKey="city" width={90} tick={{ fontSize: 12 }} />
              <Tooltip />
              <Bar dataKey="leads" name="Demandes" fill="#e8a020" />
            </BarChart>
          </ResponsiveContainer>
        </div>
      )}
    </section>
  );
}
