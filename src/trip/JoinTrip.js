import React, { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { db, auth } from "../firebase";
import { collection, query, where, getDocs, updateDoc, doc, arrayUnion } from "firebase/firestore";
import { useToast } from "../contexts/ToastContext";

export default function JoinTrip() {
  const { type = "trip", code } = useParams();
  const navigate = useNavigate();
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(true);
  const { showSuccess, showError } = useToast();

  useEffect(() => {
    const findAndJoinTrip = async () => {
      try {
        // Query Firestore for item with matching join code
        const itemsRef = collection(db, type + "s");
        const q = query(itemsRef, where("joinCode", "==", code));
        const querySnapshot = await getDocs(q);

        if (querySnapshot.empty) {
          setError("Invalid join code or trip not found");
          showError("Invalid join code or trip not found");
          setLoading(false);
          return;
        }

        // Get the first matching item
        const itemDoc = querySnapshot.docs[0];
        const itemId = itemDoc.id;
        const itemData = itemDoc.data();

        // Check if user is authenticated
        const user = auth.currentUser;
        
        if (user) {
          // Add authenticated user to item members
          await updateDoc(doc(db, type + "s", itemId), {
            members: arrayUnion({
              id: user.uid,
              name: user.displayName || user.email,
              email: user.email,
              avatar: "👤",
              type: "email",
              joinedAt: new Date().toISOString()
            })
          });
          showSuccess(`You've successfully joined the ${type}!`);
          navigate(`/${type}/${itemId}`, { state: { mode: "auth" } });
        } else {
          // Handle guest join
          const guestId = `guest-${Date.now()}`;
          const items = JSON.parse(localStorage.getItem(type + "s") || "[]");
          
          // Add item to localStorage for guest access
          items.push({
            ...itemData,
            id: itemId,
            members: [
              ...itemData.members,
              {
                id: guestId,
                name: "Guest User",
                avatar: "👤",
                type: "manual",
                joinedAt: new Date().toISOString()
              }
            ]
          });
          
          localStorage.setItem(type + "s", JSON.stringify(items));
          showSuccess(`You've joined the ${type} as a guest!`);
          navigate(`/${type}/${itemId}`, { state: { mode: "guest" } });
        }

      } catch (err) {
        console.error(`Error joining ${type}:`, err);
        setError(`Failed to join ${type}. Please try again.`);
        showError("Failed to join trip. Please try again.");
        setLoading(false);
      }
    };

    if (code) {
      findAndJoinTrip();
    }
  }, [code, navigate, showError, showSuccess, type]);

  if (loading) {
    return (
      <div className="join-trip-screen">
        <div className="loading-spinner-container">
          <div className="loading-spinner"></div>
          <p>Looking for your trip...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="join-trip-screen">
        <div className="error-message">{error}</div>
        <button 
          onClick={() => navigate("/dashboard")} 
          className="main-btn"
        >
          Go to Dashboard
        </button>
      </div>
    );
  }

  return null;
}