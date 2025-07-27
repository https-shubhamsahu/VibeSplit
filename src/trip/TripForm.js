import React, { useState } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { db, auth } from "../firebase";
import { collection, addDoc, serverTimestamp } from "firebase/firestore";
import { useToast } from "../contexts/ToastContext";

const emojiOptions = ["🌴", "🎉", "🏖️", "🏕️", "🎓", "🚌", "🍔", "🎸"];

function generateLocalId() {
  // Simple unique id for guest trips
  return "local-" + Math.random().toString(36).substr(2, 9);
}

export default function TripForm() {
  const [name, setName] = useState("");
  const [emoji, setEmoji] = useState(emojiOptions[0]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(""); // Add this line
  const navigate = useNavigate();
  const location = useLocation();
  const isGuest = location.state?.mode === "guest";
  const { showSuccess, showError } = useToast();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);

    // Check if user is authenticated
    if (!auth.currentUser && !isGuest) {
      console.error("User not authenticated");
      showError("You need to be logged in to create a trip.");
      setLoading(false);
      return;
    }

    let tripId;
    if (isGuest) {
      // Save to localStorage
      tripId = generateLocalId();
      const trip = {
        id: tripId,
        name,
        emoji,
        createdBy: "guest",
        createdAt: new Date().toISOString(),
        members: [],
        expenses: [],
      };
      // Save under "trips" in localStorage
      const trips = JSON.parse(localStorage.getItem("trips") || "[]");
      trips.push(trip);
      localStorage.setItem("trips", JSON.stringify(trips));
    } else {
      // Save to Firestore
      try {
        const user = auth.currentUser;
        const docRef = await addDoc(collection(db, "trips"), {
          name,
          emoji,
          createdBy: user ? user.uid : "unknown",
          createdAt: serverTimestamp(),
          members: [],
          expenses: [],
        });
        tripId = docRef.id;
      } catch (error) {
        console.error("Error creating trip:", error);
        setError("Error creating trip. Please try again."); // Update this line
        showError("Error creating trip. Please try again.");
        setLoading(false);
        return;
      }
    }

    setLoading(false);
    showSuccess(`Trip "${name}" created successfully!`);
    navigate(`/trip/${tripId}`, { state: { mode: isGuest ? "guest" : "auth" } });
  };

  return (
    <div className="trip-form">
      <h2>Create a Trip</h2>
      {error && <div className="error-message">{error}</div>} {/* Add this line */}
      <form onSubmit={handleSubmit}>
        <label>
          Trip Name
          <input
            value={name}
            onChange={e => setName(e.target.value)}
            placeholder="Goa Trip"
            required
          />
        </label>
        <label>
          Emoji
          <select value={emoji} onChange={e => setEmoji(e.target.value)}>
            {emojiOptions.map(e => (
              <option key={e} value={e}>{e}</option>
            ))}
          </select>
        </label>
        <button type="submit" className="main-btn" disabled={loading}>
          {loading ? "Creating..." : "Start Trip"}
        </button>
      </form>
    </div>
  );
}