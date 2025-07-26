import React from "react";

export default function BalanceSheet({ expenses, members }) {
  // Calculate balances
  const calculateBalances = () => {
    const balances = {};
    
    // Initialize balances
    members.forEach(member => {
      balances[member.id] = 0;
    });

    // Process each expense
    expenses.forEach(expense => {
      const paidBy = expense.paidBy;
      const amount = expense.amount;
      const sharedBy = expense.sharedBy;
      const splitAmount = amount / sharedBy.length;

      // Add amount to payer's balance
      balances[paidBy] += amount;

      // Subtract split amount from each sharing member
      sharedBy.forEach(memberId => {
        balances[memberId] -= splitAmount;
      });
    });

    return balances;
  };

  const balances = calculateBalances();

  return (
    <div className="balance-sheet-section">
      <h3>Balance Sheet</h3>
      <div className="balance-list">
        {members.map(member => (
          <div 
            key={member.id} 
            className={`balance-item ${balances[member.id] > 0 ? 'positive' : 'negative'}`}
          >
            <span className="member-info">
              <span className="member-avatar">{member.avatar}</span>
              <span className="member-name">{member.name}</span>
            </span>
            <span className="balance-amount">
              {balances[member.id] > 0 ? 'Gets back ' : 'Owes '}
              ₹{Math.abs(balances[member.id]).toFixed(2)}
            </span>
          </div>
        ))}
      </div>
    </div>
  );
}