import React from "react";

export default function MemberList({ members }) {
  return (
    <div className="member-list-section">
      <h3>Members ({members.length})</h3>
      <div className="member-list">
        {members.map(member => (
          <div key={member.id} className="member-item">
            <span className="member-avatar">{member.avatar}</span>
            <span className="member-name">{member.name}</span>
            {member.email && (
              <span className="member-email">({member.email})</span>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}