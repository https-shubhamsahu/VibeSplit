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

export default function TripScreen({ type }) {
  const params = useParams();
  const screenType = type || params.type || "trip";
  const { tripId } = useParams();
  const location = useLocation();
  const isGuest = location.state?.mode === "guest";
  const [trip, setTrip] = useState(null);
  const [loading, setLoading] = useState(true);
  const [refreshKey, setRefreshKey] = useState(0);
  
  // Get title and labels based on type
  const getTypeInfo = () => {
    switch(screenType) {
      case "canteen":
        return {
          title: "Canteen Tracker",
          memberLabel: "Add Person",
          expenseLabel: "Add Food Item"
        };
      case "outing":
        return {
          title: "Outing Split",
          memberLabel: "Add Friend",
          expenseLabel: "Add Expense"
        };
      case "project":
        return {
          title: "Project Pool",
          memberLabel: "Add Team Member",
          expenseLabel: "Add Purchase"
        };
      default:
        return {
          title: "Trip",
          memberLabel: "Add Member",
          expenseLabel: "Add Expense"
        };
    }
  };
  
  const typeInfo = getTypeInfo();


  useEffect(() => {
    const loadTrip = () => {
      if (isGuest) {
        // Load from localStorage
        const items = JSON.parse(localStorage.getItem(screenType + "s") || "[]");
        const currentItem = items.find((t) => t.id === tripId);
        setTrip(currentItem);
        setLoading(false);
      } else {
        // Load from Firestore
        const unsub = onSnapshot(doc(db, screenType + "s", tripId), (docSnap) => {
            if (docSnap.exists()) {
              setTrip({ id: docSnap.id, ...docSnap.data() });
            }
            setLoading(false);
          }
        );
        return () => unsub();
      }
    };

    loadTrip();
  }, [tripId, isGuest, screenType, refreshKey]);

  if (loading) return <LoadingSpinner />;
  if (!trip) return <div>{typeInfo.title} not found!</div>;

  return (
    <div className="trip-screen">
      <header>
        <h1>
          {trip.emoji} {trip.name}
        </h1>
        <div className="type-badge">{typeInfo.title}</div>
      </header>

      <div className="trip-content">
        <div className="left-panel">
          <ShareTrip trip={trip} isGuest={isGuest} type={screenType} />
          <AddMember 
            tripId={tripId} 
            isGuest={isGuest} 
            type={screenType} 
            label={typeInfo.memberLabel} 
            onMemberAdded={() => setRefreshKey(prev => prev + 1)}
          />
          <MemberList members={trip.members} type={screenType} />
          <BalanceSheet
            expenses={trip.expenses}
            members={trip.members}
            type={screenType}
          />
        </div>

        <div className="right-panel">
          <ExpenseForm
            trip={trip}
            isGuest={isGuest}
            type={screenType}
            label={typeInfo.expenseLabel}
            onExpenseAdd={() => setRefreshKey(prev => prev + 1)}
          />
          <ExpenseList
            expenses={trip.expenses}
            members={trip.members}
            type={screenType}
          />
        </div>
      </div>
    </div>
  );
}