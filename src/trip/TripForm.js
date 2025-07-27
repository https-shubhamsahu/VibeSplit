import React, { useState } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { db, auth } from "../firebase";
import { collection, addDoc, serverTimestamp } from "firebase/firestore";
import { useToast } from "../contexts/ToastContext";
import tripHistoryService from "../services/tripHistoryService";
import analyticsService from "../services/analyticsService";

// Different emoji options based on type
const emojiOptions = {
  trip: ["🌴", "🎉", "🏖️", "🏕️", "🎓", "🚌", "🎸"],
  canteen: ["🍔", "🍕", "🍟", "🍗", "🍜", "🍱", "☕"],
  outing: ["🎬", "🎮", "🎯", "🎪", "🎭", "🎨", "🎡"],
  project: ["📚", "💻", "🔬", "📊", "📝", "🧪", "🔍"]
};

function generateLocalId() {
  // Simple unique id for guest trips
  return "local-" + Math.random().toString(36).substr(2, 9);
}

export default function TripForm({ type = "trip" }) {
  const [name, setName] = useState("");
  const [emoji, setEmoji] = useState(emojiOptions[type][0]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const navigate = useNavigate();
  const location = useLocation();
  const isGuest = location.state?.mode === "guest";
  const { showSuccess, showError } = useToast();
  
  // Get title and labels based on type
  const getTypeInfo = () => {
    switch(type) {
      case "canteen":
        return {
          title: "Create a Canteen Tracker",
          nameLabel: "Tracker Name",
          namePlaceholder: "Lunch Group",
          buttonText: "Start Tracking"
        };
      case "outing":
        return {
          title: "Create an Outing Split",
          nameLabel: "Outing Name",
          namePlaceholder: "Movie Night",
          buttonText: "Start Splitting"
        };
      case "project":
        return {
          title: "Create a Project Pool",
          nameLabel: "Project Name",
          namePlaceholder: "Final Year Project",
          buttonText: "Start Pool"
        };
      default:
        return {
          title: "Create a Trip",
          nameLabel: "Trip Name",
          namePlaceholder: "Goa Trip",
          buttonText: "Start Trip"
        };
    }
  };
  
  const typeInfo = getTypeInfo();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);

    // Check if user is authenticated
    if (!auth.currentUser && !isGuest) {
      console.error("User not authenticated");
      showError(`You need to be logged in to create a ${type}.`);
      setLoading(false);
      return;
    }

    let itemId;
    if (isGuest) {
      // Save to localStorage
      itemId = generateLocalId();
      const item = {
        id: itemId,
        title: name, // Use 'title' for consistency with history service
        name,
        emoji,
        type, // Store the type
        createdBy: "guest",
        createdAt: new Date().toISOString(),
        members: [],
        expenses: [],
      };
      // Save under the appropriate type in localStorage
      const items = JSON.parse(localStorage.getItem(type + "s") || "[]");
      items.push(item);
      localStorage.setItem(type + "s", JSON.stringify(items));
      
      // Save to trip history
      await tripHistoryService.saveTripToHistory(item, type, true);
    } else {
      // Save to Firestore
      try {
        const user = auth.currentUser;
        const docRef = await addDoc(collection(db, type + "s"), {
          title: name, // Use 'title' for consistency with history service
          name,
          emoji,
          type, // Store the type
          createdBy: user ? user.uid : "unknown",
          createdAt: serverTimestamp(),
          members: [],
          expenses: [],
        });
        itemId = docRef.id;
        
        // Save to trip history
        const tripData = {
          id: itemId,
          title: name,
          name,
          emoji,
          type,
          createdBy: user ? user.uid : "unknown",
          createdAt: new Date().toISOString(),
          members: [],
          expenses: [],
        };
        await tripHistoryService.saveTripToHistory(tripData, type, false);
      } catch (error) {
        console.error(`Error creating ${type}:`, error);
        setError(`Error creating ${type}. Please try again.`);
        showError(`Error creating ${type}. Please try again.`);
        setLoading(false);
        return;
      }
    }

    setLoading(false);
    
    // Track analytics
    analyticsService.trackTripAction('create_trip', type, itemId);
    
    showSuccess(`${typeInfo.title.replace('Create ', '')} "${name}" created successfully!`);
    navigate(`/${type}/${itemId}`, { state: { mode: isGuest ? "guest" : "auth" } });
  };

  return (
    <div className="trip-form">
      <h2>{typeInfo.title}</h2>
      {error && <div className="error-message">{error}</div>}
      <form onSubmit={handleSubmit}>
        <label>
          {typeInfo.nameLabel}
          <input
            value={name}
            onChange={e => setName(e.target.value)}
            placeholder={typeInfo.namePlaceholder}
            required
          />
        </label>
        <label>
          Emoji
          <select value={emoji} onChange={e => setEmoji(e.target.value)}>
            {emojiOptions[type].map(e => (
              <option key={e} value={e}>{e}</option>
            ))}
          </select>
        </label>
        <button type="submit" className="main-btn" disabled={loading}>
          {loading ? "Creating..." : typeInfo.buttonText}
        </button>
      </form>
    </div>
  );
}