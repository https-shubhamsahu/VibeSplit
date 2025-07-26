import React, { useState } from "react";
import { db } from "../firebase";
import { doc, updateDoc, arrayUnion } from "firebase/firestore";

const AVATAR_EMOJIS = ["👤", "👩", "👨", "🧑", "👱"];

export default function AddMember({ tripId, isGuest }) {
  const [addMethod, setAddMethod] = useState("manual");
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [error, setError] = useState("");

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");

    const newMember = {
      id: `member-${Date.now()}`,
      name: name.trim(),
      avatar: AVATAR_EMOJIS[Math.floor(Math.random() * AVATAR_EMOJIS.length)],
      addedOn: new Date().toISOString(),
      type: addMethod
    };

    if (addMethod === "email") {
      newMember.email = email.trim();
    }

    try {
      if (isGuest) {
        // Add to localStorage
        const trips = JSON.parse(localStorage.getItem("trips") || "[]");
        const tripIndex = trips.findIndex(t => t.id === tripId);
        if (tripIndex !== -1) {
          trips[tripIndex].members.push(newMember);
          localStorage.setItem("trips", JSON.stringify(trips));
        }
      } else {
        // Add to Firestore
        await updateDoc(doc(db, "trips", tripId), {
          members: arrayUnion(newMember)
        });
      }

      // Clear form
      setName("");
      setEmail("");
    } catch (err) {
      setError("Failed to add member. Please try again.");
      console.error("Error adding member:", err);
    }
  };

  return (
    <div className="add-member-section">
      <h3>Add Member</h3>
      {error && <div className="error-message">{error}</div>}
      
      <div className="add-method-toggle">
        <button
          className={`method-btn ${addMethod === "manual" ? "active" : ""}`}
          onClick={() => setAddMethod("manual")}
          type="button"
        >
          Manual
        </button>
        {!isGuest && (
          <>
            <button
              className={`method-btn ${addMethod === "email" ? "active" : ""}`}
              onClick={() => setAddMethod("email")}
              type="button"
            >
              Email
            </button>
            <button
              className={`method-btn ${addMethod === "code" ? "active" : ""}`}
              onClick={() => setAddMethod("code")}
              type="button"
            >
              Share Code
            </button>
          </>
        )}
      </div>

      <form onSubmit={handleSubmit} className="add-member-form">
        <input
          type="text"
          value={name}
          onChange={(e) => setName(e.target.value)}
          placeholder="Member name"
          required
        />
        
        {addMethod === "email" && (
          <input
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="Email address"
            required
          />
        )}

        <button type="submit" className="main-btn">
          Add Member
        </button>
      </form>
    </div>
  );
}