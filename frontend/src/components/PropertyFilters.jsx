import React from "react";

export function PropertyFilters({ filters, setFilters, onApply }) {
  return (
    <section className="card" aria-label="Filtres de recherche">
      <h2>Filtres avancés</h2>
      <div className="filters-grid" role="group" aria-label="Critères de filtre">
        <div className="field">
          <label htmlFor="f-city-filter">Ville</label>
          <input
            id="f-city-filter"
            placeholder="Ex: Paris"
            value={filters.city}
            onChange={(e) => setFilters({ ...filters, city: e.target.value })}
          />
        </div>
        <div className="field">
          <label htmlFor="f-type-filter">Type de bien</label>
          <input
            id="f-type-filter"
            placeholder="Ex: Appartement"
            value={filters.property_type}
            onChange={(e) => setFilters({ ...filters, property_type: e.target.value })}
          />
        </div>
        <div className="field">
          <label htmlFor="f-min-price">Prix min (EUR)</label>
          <input
            id="f-min-price"
            type="number"
            placeholder="Ex: 100000"
            value={filters.min_price}
            onChange={(e) => setFilters({ ...filters, min_price: e.target.value })}
            min="0"
          />
        </div>
        <div className="field">
          <label htmlFor="f-max-price">Prix max (EUR)</label>
          <input
            id="f-max-price"
            type="number"
            placeholder="Ex: 500000"
            value={filters.max_price}
            onChange={(e) => setFilters({ ...filters, max_price: e.target.value })}
            min="0"
          />
        </div>
        <div className="field">
          <label htmlFor="f-min-area">Surface min (m²)</label>
          <input
            id="f-min-area"
            type="number"
            placeholder="Ex: 30"
            value={filters.min_area}
            onChange={(e) => setFilters({ ...filters, min_area: e.target.value })}
            min="0"
          />
        </div>
        <div className="field">
          <label htmlFor="f-max-area">Surface max (m²)</label>
          <input
            id="f-max-area"
            type="number"
            placeholder="Ex: 200"
            value={filters.max_area}
            onChange={(e) => setFilters({ ...filters, max_area: e.target.value })}
            min="0"
          />
        </div>
        <div className="field">
          <label htmlFor="f-rooms">Nombre de pièces</label>
          <input
            id="f-rooms-filter"
            type="number"
            placeholder="Ex: 3"
            value={filters.rooms}
            onChange={(e) => setFilters({ ...filters, rooms: e.target.value })}
            min="1"
          />
        </div>
      </div>
      <button type="button" onClick={onApply} className="btn-primary" style={{ width: "100%" }}>Rechercher</button>
    </section>
  );
}
