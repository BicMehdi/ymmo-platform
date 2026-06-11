import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, it, expect, vi } from "vitest";
import { PropertyList } from "../components/PropertyList";
import { PropertyFilters } from "../components/PropertyFilters";
import { AnalyticsBox } from "../components/AnalyticsBox";

// ---------- PropertyList ----------
describe("PropertyList", () => {
  it("affiche le message vide quand aucun bien", () => {
    render(<PropertyList properties={[]} onOpenDetail={() => {}} />);
    expect(screen.getByText(/aucun bien/i)).toBeInTheDocument();
  });

  it("affiche les biens et le bouton detail", () => {
    const biens = [
      { id: 1, title: "Appart Lyon", city: "Lyon", area_m2: 65, rooms: 3, price: 250000 },
    ];
    render(<PropertyList properties={biens} onOpenDetail={() => {}} />);
    expect(screen.getByText("Appart Lyon")).toBeInTheDocument();
    expect(screen.getByRole("button", { name: /voir detail/i })).toBeInTheDocument();
  });

  it("appelle onOpenDetail avec le bon id", async () => {
    const handler = vi.fn();
    const biens = [
      { id: 42, title: "Studio Paris", city: "Paris", area_m2: 28, rooms: 1, price: 95000 },
    ];
    render(<PropertyList properties={biens} onOpenDetail={handler} />);
    await userEvent.click(screen.getByRole("button", { name: /voir detail/i }));
    expect(handler).toHaveBeenCalledWith(42);
  });
});

// ---------- PropertyFilters ----------
describe("PropertyFilters", () => {
  it("contient tous les champs avec labels", () => {
    const filters = { city: "", property_type: "", min_price: "", max_price: "", min_area: "", max_area: "", rooms: "" };
    render(<PropertyFilters filters={filters} setFilters={() => {}} onApply={() => {}} />);
    expect(screen.getByLabelText(/ville/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/type de bien/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/prix min/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/prix max/i)).toBeInTheDocument();
    expect(screen.getByRole("button", { name: /rechercher/i })).toBeInTheDocument();
  });
});

// ---------- AnalyticsBox ----------
describe("AnalyticsBox", () => {
  it("affiche les stats du dashboard", () => {
    const overview = { properties_count: 12, leads_count: 5, avg_price: 320000 };
    render(<AnalyticsBox overview={overview} onEstimate={() => {}} />);
    expect(screen.getByText(/12/)).toBeInTheDocument();
    expect(screen.getByText(/5/)).toBeInTheDocument();
    expect(screen.getByRole("button", { name: /estimer/i })).toBeInTheDocument();
  });
});
