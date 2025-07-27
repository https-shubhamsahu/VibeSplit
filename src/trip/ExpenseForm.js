import React, { useState } from "react";
import { db } from "../firebase";
import { doc, updateDoc, arrayUnion } from "firebase/firestore";
import { useToast } from "../contexts/ToastContext";

export default function ExpenseForm({ trip, isGuest, onExpenseAdd }) {
  const [amount, setAmount] = useState("");
  const [note, setNote] = useState("");
  const [paidBy, setPaidBy] = useState("");
  const [sharedBy, setSharedBy] = useState([]);
  const [error, setError] = useState("");
  const { showSuccess, showError } = useToast();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");

    const newExpense = {
      id: `expense-${Date.now()}`,
      amount: parseFloat(amount),
      note: note.trim(),
      paidBy,
      sharedBy: sharedBy.length ? sharedBy : trip.members.map(m => m.id),
      date: new Date().toISOString()
    };

    try {
      if (isGuest) {
        // Add to localStorage
        const items = JSON.parse(localStorage.getItem(trip.type + "s") || "[]");
        const itemIndex = items.findIndex(t => t.id === trip.id);
        if (itemIndex !== -1) {
          items[itemIndex].expenses.push(newExpense);
          localStorage.setItem(trip.type + "s", JSON.stringify(items));
        }
      } else {
        // Add to Firestore
        await updateDoc(doc(db, "trips", trip.id), {
          expenses: arrayUnion(newExpense)
        });
      }

      // Clear form
      setAmount("");
      setNote("");
      setPaidBy("");
      setSharedBy([]);
      
      // Show success toast
      showSuccess(`Expense of ₹${newExpense.amount} added successfully!`);
      
      if (onExpenseAdd) onExpenseAdd(newExpense);
    } catch (err) {
      setError("Failed to add expense. Please try again.");
      showError("Failed to add expense. Please try again.");
      console.error("Error adding expense:", err);
    }
  };

  return (
    <div className="expense-form-section">
      <h3>Add Expense</h3>
      {error && <div className="error-message">{error}</div>}

      <form onSubmit={handleSubmit} className="expense-form">
        <input
          type="number"
          value={amount}
          onChange={(e) => setAmount(e.target.value)}
          placeholder="Amount"
          required
          min="0"
          step="0.01"
        />

        <input
          type="text"
          value={note}
          onChange={(e) => setNote(e.target.value)}
          placeholder="What's this for?"
          required
        />

        <select 
          value={paidBy} 
          onChange={(e) => setPaidBy(e.target.value)}
          required
        >
          <option value="">Who paid?</option>
          {trip.members.map(member => (
            <option key={member.id} value={member.id}>
              {member.name}
            </option>
          ))}
        </select>

        <div className="shared-by-section">
          <p>Split between:</p>
          {trip.members.map(member => (
            <label key={member.id} className="checkbox-label">
              <input
                type="checkbox"
                checked={sharedBy.includes(member.id)}
                onChange={(e) => {
                  if (e.target.checked) {
                    setSharedBy([...sharedBy, member.id]);
                  } else {
                    setSharedBy(sharedBy.filter(id => id !== member.id));
                  }
                }}
              />
              {member.name}
            </label>
          ))}
        </div>

        <button type="submit" className="main-btn">
          Add Expense
        </button>
      </form>
    </div>
  );
}