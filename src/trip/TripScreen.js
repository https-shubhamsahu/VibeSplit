import React, { useState, useEffect } from "react";
import { useParams, useLocation } from "react-router-dom";
import { db } from "../firebase";
import { doc, onSnapshot } from "firebase/firestore";
import AddMember from "./AddMember";
import ExpenseForm from "./ExpenseForm";
import MemberList from "./MemberList";
import ExpenseList from "./ExpenseList";
import BalanceSheet from "./BalanceSheet";
import ShareTrip from "./ShareTrip";
import LoadingSpinner from "../components/LoadingSpinner";

export default function TripScreen() {
  const { tripId } = useParams();
  const location = useLocation();
  const isGuest = location.state?.mode === "guest";
  const [trip, setTrip] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const loadTrip = () => {
      if (isGuest) {
        // Load from localStorage
        const trips = JSON.parse(localStorage.getItem("trips") || "[]");
        const currentTrip = trips.find((t) => t.id === tripId);
        setTrip(currentTrip);
        setLoading(false);
      } else {
        // Load from Firestore
        const unsubscribe = onSnapshot(
          doc(db, "trips", tripId),
          (doc) => {
            if (doc.exists()) {
              setTrip({ id: doc.id, ...doc.data() });
            }
            setLoading(false);
          }
        );
        return () => unsubscribe();
      }
    };

    loadTrip();
  }, [tripId, isGuest]);

  if (loading) return <LoadingSpinner />;
  if (!trip) return <div>Trip not found!</div>;

  return (
    <div className="trip-screen">
      <header>
        <h1>
          {trip.emoji} {trip.name}
        </h1>
      </header>

      <div className="trip-content">
        <div className="left-panel">
          <ShareTrip trip={trip} isGuest={isGuest} />
          <AddMember tripId={tripId} isGuest={isGuest} />
          <MemberList members={trip.members} />
          <BalanceSheet
            expenses={trip.expenses}
            members={trip.members}
          />
        </div>

        <div className="right-panel">
          <ExpenseForm
            trip={trip}
            isGuest={isGuest}
          />
          <ExpenseList
            expenses={trip.expenses}
            members={trip.members}
          />
        </div>
      </div>
    </div>
  );
}