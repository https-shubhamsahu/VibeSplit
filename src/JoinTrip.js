import React, { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { db } from "./firebase";
import { collection, query, where, getDocs } from "firebase/firestore";

export default function JoinTrip() {
  const { code } = useParams();
  const navigate = useNavigate();
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const findAndJoinTrip = async () => {
      if (!code) {
        setError("Invalid join link");
        setLoading(false);
        return;
      }

      try {
        const tripsRef = collection(db, "trips");
        const q = query(tripsRef, where("joinCode", "==", code.toUpperCase()));
        const querySnapshot = await getDocs(q);

        if (querySnapshot.empty) {
          setError("Trip not found. The link might be expired or invalid.");
          setLoading(false);
          return;
        }

        const tripDoc = querySnapshot.docs[0];
        navigate(`/trip/${tripDoc.id}`, { 
          state: { mode: "guest", joined: true } 
        });

      } catch (err) {
        console.error("Error joining trip:", err);
        setError("Failed to join trip. Please try again.");
        setLoading(false);
      }
    };

    findAndJoinTrip();
  }, [code, navigate]);

  if (loading) {
    return (
      <div className="join-trip-screen">
        <div className="loading">Looking for your trip...</div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="join-trip-screen">
        <div className="error-message">{error}</div>
        <button 
          onClick={() => navigate("/")} 
          className="main-btn"
        >
          Go Home
        </button>
      </div>
    );
  }

  return null;
}