import React from "react";

export default function ExpenseList({ expenses, members }) {
  const getMemberName = (memberId) => {
    const member = members.find(m => m.id === memberId);
    return member ? member.name : "Unknown";
  };

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric'
    });
  };

  return (
    <div className="expense-list-section">
      <h3>Expenses</h3>
      <div className="expense-list">
        {expenses.map(expense => (
          <div key={expense.id} className="expense-item">
            <div className="expense-date">
              {formatDate(expense.date)}
            </div>
            <div className="expense-details">
              <div className="expense-note">{expense.note}</div>
              <div className="expense-payer">
                Paid by {getMemberName(expense.paidBy)}
              </div>
            </div>
            <div className="expense-amount">
              ₹{expense.amount.toFixed(2)}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}