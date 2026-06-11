import React, { useState } from "react";

const API_URL = "http://localhost:8000";

const DEPOSIT_OPTIONS = [0.05, 0.10, 0.20]; // 5%, 10%, 20%

function maskCard(val) {
  return val.replace(/\D/g, "").slice(0, 16).replace(/(.{4})/g, "$1 ").trim();
}
function maskExpiry(val) {
  const digits = val.replace(/\D/g, "").slice(0, 4);
  if (digits.length >= 3) return digits.slice(0, 2) + "/" + digits.slice(2);
  return digits;
}

export function ReservationPage({ property, token, onBack, onSuccess }) {
  const depositPercent = DEPOSIT_OPTIONS[1]; // 10% par défaut
  const [amount, setAmount] = useState(Math.round(property.price * depositPercent));
  const [cardName, setCardName]     = useState("");
  const [cardNumber, setCardNumber] = useState("");
  const [expiry, setExpiry]         = useState("");
  const [cvv, setCvv]               = useState("");
  const [step, setStep]             = useState("form"); // form | processing | success | error
  const [errorMsg, setErrorMsg]     = useState("");

  const handleSubmit = async (e) => {
    e.preventDefault();
    // Validation basique côté client
    const digits = cardNumber.replace(/\s/g, "");
    if (digits.length < 16)  { setErrorMsg("Numéro de carte incomplet."); return; }
    if (cvv.length < 3)       { setErrorMsg("CVV invalide."); return; }
    if (!expiry.includes("/")) { setErrorMsg("Date d'expiration invalide."); return; }
    if (!cardName.trim())     { setErrorMsg("Nom sur la carte requis."); return; }
    setErrorMsg("");
    setStep("processing");

    // Simulation d'un délai réseau
    await new Promise((r) => setTimeout(r, 1400));

    try {
      const res = await fetch(`${API_URL}/api/v1/reservations`, {
        method: "POST",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
        body: JSON.stringify({ property_id: property.id, amount }),
      });
      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        setErrorMsg(data.detail || "Réservation impossible.");
        setStep("error");
        return;
      }
      setStep("success");
      setTimeout(() => onSuccess && onSuccess(), 3000);
    } catch (_) {
      setErrorMsg("Erreur réseau. Veuillez réessayer.");
      setStep("error");
    }
  };

  // ── Page de succès ──────────────────────────────────────────
  if (step === "success") {
    return (
      <div className="reservation-success">
        <div className="reservation-success-icon">✅</div>
        <h2>Réservation confirmée !</h2>
        <p>Votre acompte de <strong>{amount.toLocaleString("fr-FR")} €</strong> a été enregistré.</p>
        <p style={{ color: "var(--text-soft)", fontSize: "0.88rem" }}>Le bien <strong>{property.title}</strong> est maintenant marqué <span className="badge badge-warning">Réservé</span>.</p>
        <p style={{ color: "var(--text-soft)", fontSize: "0.82rem", marginTop: "0.5rem" }}>Vous allez être redirigé automatiquement...</p>
        <button className="btn-primary" style={{ marginTop: "1rem" }} onClick={onBack}>← Retour aux biens</button>
      </div>
    );
  }

  // ── Page d'erreur ───────────────────────────────────────────
  if (step === "error") {
    return (
      <div className="reservation-success">
        <div className="reservation-success-icon">❌</div>
        <h2>Paiement refusé</h2>
        <p style={{ color: "var(--danger)" }}>{errorMsg}</p>
        <div style={{ display: "flex", gap: "0.75rem", marginTop: "1rem", justifyContent: "center" }}>
          <button className="btn-secondary" onClick={() => setStep("form")}>Réessayer</button>
          <button className="btn-ghost" onClick={onBack}>Annuler</button>
        </div>
      </div>
    );
  }

  return (
    <div className="reservation-page">
      {/* ── Fil d'Ariane ── */}
      <nav className="detail-breadcrumb">
        <button type="button" className="btn-ghost" onClick={onBack}>← Retour au bien</button>
        <span className="detail-bc-sep">›</span>
        <span>Réservation</span>
      </nav>

      <div className="reservation-layout">
        {/* GAUCHE : résumé du bien */}
        <aside className="reservation-summary card">
          <h2>Résumé du bien</h2>
          <div className="res-property-title">{property.title}</div>
          <div style={{ color: "var(--text-soft)", fontSize: "0.88rem", marginBottom: "0.5rem" }}>📍 {property.city} · {property.property_type}</div>
          <div className="res-property-price">{property.price.toLocaleString("fr-FR")} €</div>

          <div style={{ borderTop: "1px solid var(--border)", paddingTop: "1rem", marginTop: "1rem" }}>
            <div className="res-label">Acompte à verser</div>
            <div style={{ display: "flex", gap: "0.5rem", flexWrap: "wrap", marginBottom: "0.75rem" }}>
              {DEPOSIT_OPTIONS.map((pct) => {
                const val = Math.round(property.price * pct);
                return (
                  <button
                    key={pct}
                    type="button"
                    className={`btn-secondary${amount === val ? " selected-deposit" : ""}`}
                    style={{ flex: 1, padding: "0.5rem", fontSize: "0.82rem" }}
                    onClick={() => setAmount(val)}
                  >
                    {Math.round(pct * 100)}%<br />
                    <strong>{val.toLocaleString("fr-FR")} €</strong>
                  </button>
                );
              })}
            </div>
            <div className="res-amount-display">
              <span>Montant à payer maintenant</span>
              <strong>{amount.toLocaleString("fr-FR")} €</strong>
            </div>
          </div>

          <div style={{ background: "var(--surface-muted)", borderRadius: "10px", padding: "0.75rem", marginTop: "1rem", fontSize: "0.8rem", color: "var(--text-soft)" }}>
            🔒 Paiement 100% simulé — aucune vraie transaction bancaire
          </div>
        </aside>

        {/* DROITE : formulaire de paiement */}
        <section className="reservation-form-wrap card">
          <h2>💳 Informations de paiement</h2>
          <p style={{ color: "var(--text-soft)", fontSize: "0.85rem", marginBottom: "1rem" }}>Saisissez n'importe quelles données — aucune vraie carte n'est débitée.</p>

          <form onSubmit={handleSubmit} className="reservation-form" autoComplete="off">
            <div className="field">
              <label htmlFor="card-name">Nom sur la carte</label>
              <input
                id="card-name" type="text" placeholder="Jean Dupont"
                value={cardName} onChange={(e) => setCardName(e.target.value)}
                required autoComplete="off"
              />
            </div>

            <div className="field">
              <label htmlFor="card-number">Numéro de carte</label>
              <div className="card-number-wrap">
                <input
                  id="card-number" type="text" placeholder="1234 5678 9012 3456"
                  value={cardNumber}
                  onChange={(e) => setCardNumber(maskCard(e.target.value))}
                  maxLength={19} inputMode="numeric" required autoComplete="off"
                />
                <span className="card-brand-icon">💳</span>
              </div>
            </div>

            <div className="form-row">
              <div className="field">
                <label htmlFor="card-expiry">Date d'expiration</label>
                <input
                  id="card-expiry" type="text" placeholder="MM/AA"
                  value={expiry}
                  onChange={(e) => setExpiry(maskExpiry(e.target.value))}
                  maxLength={5} inputMode="numeric" required autoComplete="off"
                />
              </div>
              <div className="field">
                <label htmlFor="card-cvv">CVV</label>
                <input
                  id="card-cvv" type="password" placeholder="•••"
                  value={cvv} onChange={(e) => setCvv(e.target.value.replace(/\D/g, "").slice(0, 4))}
                  maxLength={4} inputMode="numeric" required autoComplete="off"
                />
              </div>
            </div>

            {errorMsg && (
              <p className="status-bar error" role="alert">{errorMsg}</p>
            )}

            <button
              type="submit"
              className="btn-primary reservation-pay-btn"
              disabled={step === "processing"}
            >
              {step === "processing" ? (
                <span>⏳ Traitement en cours...</span>
              ) : (
                <span>🔒 Payer {amount.toLocaleString("fr-FR")} € (simulé)</span>
              )}
            </button>

            <button type="button" className="btn-ghost" style={{ width: "100%", marginTop: "0.25rem" }} onClick={onBack}>
              Annuler
            </button>
          </form>
        </section>
      </div>
    </div>
  );
}
