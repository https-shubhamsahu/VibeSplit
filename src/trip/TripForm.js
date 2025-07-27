import React, { useState } from "react";
import { useNavigate, useLocation, useParams } from "react-router-dom";
import { db, auth } from "../firebase";
import { collection, addDoc, serverTimestamp } from "firebase/firestore";
import { useToast } from "../contexts/ToastContext";
import tripHistoryService from "../services/tripHistoryService";
import analyticsService from "../services/analyticsService";
import historyService from "../services/historyService";


// Different emoji options based on type
const emojiOptions = {
  trip: ["🌴", "✈️", "🏖️", "🏕️", "🚗", "🚌", "🗺️", "🥾", "🎒"],
  canteen: ["🍔", "🥗", "🍣", "🍕", "🥤", "🍦", "🍩", "🍛", "🍱"],
  outing: ["🎢", "🌅", "🎳", "🎤", "🎬", "🎡", "🎯", "🚴", "🛶"],
  project: ["💡", "💻", "🧑‍💻", "🔬", "📊", "📝", "🧪", "🎨", "📚"]
};

function generateLocalId() {
  // Simple unique id for guest trips
  return "local-" + Math.random().toString(36).substr(2, 9);
}


export default function TripForm({ type }) {
  // Get type from URL if not provided as a prop
  const params = useParams();
  const formType = type || params.type || "trip";
  const [name, setName] = useState("");
  const [emoji, setEmoji] = useState(emojiOptions[formType][0]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const navigate = useNavigate();
  const location = useLocation();
  const isGuest = location.state?.mode === "guest";
  const { showSuccess, showError } = useToast();
  
  // Get title and labels based on formType
  const getTypeInfo = () => {
    switch(formType) {
      case "canteen":
        return {
          title: "🍽️ Who's hungry? Start a new canteen adventure!",
          nameLabel: "Squad Name",
          namePlaceholder: "The Foodies",
          buttonText: "Feed the Crew!"
        };
      case "outing":
        return {
          title: "🌄 Ready for fun? Plan your next outing!",
          nameLabel: "Outing Vibe",
          namePlaceholder: "Sunset Cycling",
          buttonText: "Let's Go Out!"
        };
      case "project":
        return {
          title: "💡 Got ideas? Pool your project squad!",
          nameLabel: "Project Dream Team",
          namePlaceholder: "Hackathon Heroes",
          buttonText: "Build the Future!"
        };
      default:
        return {
          title: "🌴 Wanderlust? Plan your trip in style!",
          nameLabel: "Epic Trip Name",
          namePlaceholder: "Goa Getaway",
          buttonText: "Pack Your Bags!"
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
      showError(`You need to be logged in to create a ${formType}.`);
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
        type: formType, // Store the type
        createdBy: "guest",
        createdAt: new Date().toISOString(),
        members: [],
        expenses: [],
      };
      // Save under the appropriate type in localStorage
      const joinCode = Math.random().toString(36).substring(2, 8).toUpperCase();
      item.joinCode = joinCode;
      const items = JSON.parse(localStorage.getItem(formType + "s") || "[]");
      items.push(item);
      localStorage.setItem(formType + "s", JSON.stringify(items));
      
      // Save to trip history
      await tripHistoryService.saveTripToHistory(item, formType, true);
    } else {
      // Save to Firestore
      try {
        const user = auth.currentUser;
        // Generate join code
        const joinCode = Math.random().toString(36).substring(2, 8).toUpperCase();
        // Create trip in Firestore with joinCode
        const docRef = await addDoc(collection(db, formType + "s"), {
          title: name, // Use 'title' for consistency with history service
          name,
          emoji,
          type: formType, // Store the type
          createdBy: user ? user.uid : "unknown",
          createdAt: serverTimestamp(),
          members: [],
          expenses: [],
          joinCode
        });
        itemId = docRef.id;
        // Save to trip history
        const tripData = {
          id: itemId,
          title: name,
          name,
          emoji,
          type: formType,
          createdBy: user ? user.uid : "unknown",
          createdAt: new Date().toISOString(),
          members: [],
          expenses: [],
          joinCode
        };
        await tripHistoryService.saveTripToHistory(tripData, formType, false);
      } catch (error) {
        console.error(`Error creating ${formType}:`, error);
        setError(`Error creating ${formType}. Please try again.`);
        showError(`Error creating ${formType}. Please try again.`);
        setLoading(false);
        return;
      }
    }

    setLoading(false);
    
    // Clear history cache so new trip shows up immediately
    if (!isGuest && auth.currentUser) {
      historyService.clearUserCache(auth.currentUser.uid);
    }
    
    // Track analytics
    analyticsService.trackTripAction('create_trip', formType, itemId);
    
    showSuccess(`${typeInfo.title.replace('Create ', '')} "${name}" created successfully!`);
    navigate(`/${formType}/${itemId}`, { state: { mode: isGuest ? "guest" : "auth" } });
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
            {emojiOptions[formType].map(e => (
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