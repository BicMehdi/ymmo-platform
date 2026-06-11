import React from "react";

export function PropertyFilters({ filters, setFilters, onApply }) {
  return (
    <section className="card">
      <h2>Filtres avances</h2>
      <div className="filters-grid">
        <input
          placeholder="Ville"
          value={filters.city}
          onChange={(e) => setFilters({ ...filters, city: e.target.value })}
        />
        <input
          placeholder="Type"
          value={filters.property_type}
          onChange={(e) => setFilters({ ...filters, property_type: e.target.value })}
        />
        <input
          type="number"
          placeholder="Prix min"
          value={filters.min_price}
          onChange={(e) => setFilters({ ...filters, min_price: e.target.value })}
        />
        <input
          type="number"
          placeholder="Prix max"
          value={filters.max_price}
          onChange={(e) => setFilters({ ...filters, max_price: e.target.value })}
        />
        <input
          type="number"
          placeholder="Surface min"
          value={filters.min_area}
          onChange={(e) => setFilters({ ...filters, min_area: e.target.value })}
        />
        <input
          type="number"
          placeholder="Surface max"
          value={filters.max_area}
          onChange={(e) => setFilters({ ...filters, max_area: e.target.value })}
        />
        <input
          type="number"
          placeholder="Pieces"
          value={filters.rooms}
          onChange={(e) => setFilters({ ...filters, rooms: e.target.value })}
        />
      </div>
      <button type="button" onClick={onApply}>Appliquer filtres</button>
    </section>
  );
}
