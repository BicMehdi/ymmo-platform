import React, { useEffect, useState } from "react";

const API_URL = "http://localhost:8000";

export function PropertyDetailPage({ propertyId, token, userRole, onBack }) {
  const [property, setProperty] = useState(null);
  const [leadMessage, setLeadMessage] = useState("");
  const [status, setStatus] = useState("");

  const loadProperty = async () => {
    const response = await fetch(`${API_URL}/api/v1/properties/${propertyId}`);
    if (!response.ok) {
      setStatus("Bien introuvable");
      return;
    }
    const data = await response.json();
    setProperty(data);
  };

  const sendLead = async (event) => {
    event.preventDefault();
    if (!token) {
      setStatus("Connexion client requise");
      return;
    }

    const response = await fetch(`${API_URL}/api/v1/leads`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify({
        property_id: propertyId,
        message: leadMessage,
      }),
    });

    if (!response.ok) {
      setStatus("Envoi de demande impossible (compte client requis)");
      return;
    }

    setLeadMessage("");
    setStatus("Demande envoyee");
  };

  useEffect(() => {
    loadProperty();
  }, [propertyId]);

  return (
    <section className="card">
      <button type="button" onClick={onBack}>Retour liste</button>
      {!property ? (
        <p>Chargement...</p>
      ) : (
        <>
          <h2>{property.title}</h2>
          <p>{property.city}</p>
          <p>{property.area_m2} m2 - {property.rooms} pieces - {property.property_type}</p>
          <p>{property.price.toLocaleString("fr-FR")} EUR</p>
          <p>{property.description || "Aucune description"}</p>

          {userRole === "client" ? (
            <form onSubmit={sendLead} className="form-grid">
              <h3>Envoyer une demande</h3>
              <textarea
                rows={4}
                placeholder="Votre message"
                value={leadMessage}
                onChange={(e) => setLeadMessage(e.target.value)}
                required
              />
              <button type="submit">Envoyer la demande</button>
            </form>
          ) : (
            <p>Connecte-toi avec un compte client pour envoyer une demande.</p>
          )}
        </>
      )}
      {status && <p>{status}</p>}
    </section>
  );
}
