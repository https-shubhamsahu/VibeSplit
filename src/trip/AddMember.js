import React, { useState } from "react";
import { db } from "../firebase";
import { doc, updateDoc, arrayUnion } from "firebase/firestore";
import { useToast } from "../contexts/ToastContext";

const AVATAR_EMOJIS = ["👤", "👩", "👨", "🧑", "👱"];

export default function AddMember({ tripId, isGuest, type = "trip", label = "Add Member", onMemberAdded }) {
  const [addMethod, setAddMethod] = useState("manual");
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [error, setError] = useState("");
  const { showSuccess, showError } = useToast();

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
        const items = JSON.parse(localStorage.getItem(type + "s") || "[]");
        const itemIndex = items.findIndex(t => t.id === tripId);
        if (itemIndex !== -1) {
          items[itemIndex].members.push(newMember);
          localStorage.setItem(type + "s", JSON.stringify(items));

          if (onMemberAdded) onMemberAdded();
         }
      } else {
        // Add to Firestore
        await updateDoc(doc(db, type + "s", tripId), {
          members: arrayUnion(newMember)
        });
        // Fetch the updated trip doc and update memberCount in trip_history
        import('../services/tripHistoryService').then(async ({ default: tripHistoryService }) => {
          const { getDoc, doc: firestoreDoc } = await import('firebase/firestore');
          const tripDoc = await getDoc(firestoreDoc(db, type + "s", tripId));
          const data = tripDoc.data();
          const memberCount = data?.members?.length || 0;
          tripHistoryService.updateMemberCountInHistory(tripId, memberCount);
        });
      }

      // Clear form
      setName("");
      setEmail("");
      
      // Show success toast
       showSuccess(`${newMember.name} added to the ${type}!`);
       if (onMemberAdded) onMemberAdded();
    } catch (err) {
      setError("Failed to add member. Please try again.");
      showError("Failed to add member. Please try again.");
      console.error("Error adding member:", err);
    }
  };

  return (
    <div className="add-member-section">
      <h3>{label}</h3>
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