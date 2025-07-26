import React, { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { db, auth } from "../firebase";
import { collection, query, where, getDocs, updateDoc, doc, arrayUnion } from "firebase/firestore";
import { onAuthStateChanged } from 'firebase/auth';

export default function JoinTrip() {
  const { code } = useParams();
  const navigate = useNavigate();
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const findAndJoinTrip = async () => {
      try {
        // Query Firestore for trip with matching join code
        const tripsRef = collection(db, "trips");
        const q = query(tripsRef, where("joinCode", "==", code));
        const querySnapshot = await getDocs(q);

        if (querySnapshot.empty) {
          setError("Invalid join code or trip not found");
          setLoading(false);
          return;
        }

        // Get the first matching trip
        const tripDoc = querySnapshot.docs[0];
        const tripId = tripDoc.id;
        const tripData = tripDoc.data();

        // Check if user is authenticated
        const user = auth.currentUser;
        
        if (user) {
          // Add authenticated user to trip members
          await updateDoc(doc(db, "trips", tripId), {
            members: arrayUnion({
              id: user.uid,
              name: user.displayName || user.email,
              email: user.email,
              avatar: "👤",
              type: "email",
              joinedAt: new Date().toISOString()
            })
          });
          navigate(`/trip/${tripId}`, { state: { mode: "auth" } });
        } else {
          // Handle guest join
          const guestId = `guest-${Date.now()}`;
          const trips = JSON.parse(localStorage.getItem("trips") || "[]");
          
          // Add trip to localStorage for guest access
          trips.push({
            ...tripData,
            id: tripId,
            members: [
              ...tripData.members,
              {
                id: guestId,
                name: "Guest User",
                avatar: "👤",
                type: "manual",
                joinedAt: new Date().toISOString()
              }
            ]
          });
          
          localStorage.setItem("trips", JSON.stringify(trips));
          navigate(`/trip/${tripId}`, { state: { mode: "guest" } });
        }

      } catch (err) {
        console.error("Error joining trip:", err);
        setError("Failed to join trip. Please try again.");
        setLoading(false);
      }
    };

    if (code) {
      findAndJoinTrip();
    }
  }, [code, navigate]);

  if (loading) {
    return (
      <div className="join-trip-screen">
        <div className="loading-spinner">Looking for your trip...</div>
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