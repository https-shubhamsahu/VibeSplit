import React, { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import historyService from '../services/historyService';
import tripHistoryService from '../services/tripHistoryService';
import authService from '../services/authService';
import analyticsService from '../services/analyticsService';

const UserHistory = ({ isGuest = false }) => {
  const [history, setHistory] = useState([]);
  const [statistics, setStatistics] = useState(null);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('recent');
  const [error, setError] = useState(null);
  const navigate = useNavigate();

  useEffect(() => {
    const loadHistory = async () => {
      setLoading(true);
      try {
        const user = authService.getCurrentUser();
        const userId = user?.uid;
        
        let history = [];
        
        if (userId) {
          // Get authenticated user history from historyService (includes trip_history collection)
          history = await historyService.getUserHistory(userId);
        } else {
          // Get guest history from localStorage
          history = historyService.getGuestHistory();
        }
        
        // Also get trip history from tripHistoryService as backup
        try {
          const tripHistory = await tripHistoryService.getUserHistory(userId);
          
          // Combine and deduplicate by ID
          const combinedHistory = [...history];
          tripHistory.forEach(trip => {
            if (!combinedHistory.find(h => h.id === trip.id)) {
              combinedHistory.push({
                ...trip,
                category: trip.category || trip.type,
                title: trip.title || trip.tripName
              });
            }
          });
          
          history = combinedHistory;
        } catch (error) {
          console.warn('Error loading trip history service:', error);
        }
        
        // Sort by creation date (most recent first)
        history.sort((a, b) => {
          const aDate = new Date(a.createdAt || a.timestamp);
          const bDate = new Date(b.createdAt || b.timestamp);
          return bDate - aDate;
        });
        
        setHistory(history);
        
        // Get statistics
        try {
          const stats = await historyService.getUserStats(userId);
          setStatistics(stats);
        } catch (error) {
          console.warn('Error loading stats:', error);
          setStatistics({ totalTrips: history.length, totalExpenses: 0, totalAmount: 0 });
        }
      } catch (error) {
        console.error('Error loading history:', error);
        setError('Failed to load history');
      } finally {
        setLoading(false);
      }
    };

    loadHistory();
  }, [isGuest]);

  const handleItemClick = (item) => {
    analyticsService.trackUserAction('open_from_history', {
      itemType: item.type,
      itemId: item.id
    });
    
    navigate(`/${item.type}/${item.id}`, { 
      state: { mode: isGuest ? 'guest' : 'auth' } 
    });
  };

  const getStatusIcon = (status) => {
    const icons = {
      active: '🟢',
      recent: '🟡',
      inactive: '🟠',
      archived: '⚪'
    };
    return icons[status] || '⚪';
  };

  const getTypeIcon = (type) => {
    const icons = {
      trip: '🧳',
      canteen: '🍔',
      outing: '🎉',
      project: '📚'
    };
    return icons[type] || '📝';
  };

  const formatDate = (dateString) => {
    const date = new Date(dateString);
    const now = new Date();
    // Compare local date parts
    const dateYMD = [date.getFullYear(), date.getMonth(), date.getDate()];
    const nowYMD = [now.getFullYear(), now.getMonth(), now.getDate()];
    if (dateYMD[0] === nowYMD[0] && dateYMD[1] === nowYMD[1] && dateYMD[2] === nowYMD[2]) {
      return 'Today';
    }
    // Check for yesterday
    const yesterday = new Date(now);
    yesterday.setDate(now.getDate() - 1);
    const yYMD = [yesterday.getFullYear(), yesterday.getMonth(), yesterday.getDate()];
    if (dateYMD[0] === yYMD[0] && dateYMD[1] === yYMD[1] && dateYMD[2] === yYMD[2]) {
      return 'Yesterday';
    }
    // Otherwise, show local date string
    return date.toLocaleDateString(undefined, { year: 'numeric', month: 'short', day: 'numeric' });
  };

  const formatCurrency = (amount) => {
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0
    }).format(amount);
  };

  if (loading) {
    return (
      <div className="user-history loading">
        <div className="loading-spinner"></div>
        <p>Loading your history...</p>
      </div>
    );
  }

  if (history.length === 0) {
    return (
      <div className="user-history empty">
        <div className="empty-state">
          <div className="empty-icon">📝</div>
          <h3>No History Yet</h3>
          <p>Start creating trips and tracking expenses to see your history here!</p>
          <p className="empty-hint">Go back to dashboard to create your first trip.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="user-history">
      <div className="history-header">
        <h2>Your Activity</h2>
        <div className="tab-buttons">
          <button 
            className={`tab-btn ${activeTab === 'recent' ? 'active' : ''}`}
            onClick={() => setActiveTab('recent')}
          >
            Recent
          </button>
          <button 
            className={`tab-btn ${activeTab === 'stats' ? 'active' : ''}`}
            onClick={() => setActiveTab('stats')}
          >
            Statistics
          </button>
        </div>
      </div>

      {activeTab === 'recent' && (
        <div className="history-list">
          {history.map((item) => (
            <div 
              key={`${item.type}-${item.id}`}
              className={`history-item ${item.status}`}
              onClick={() => handleItemClick(item)}
            >
              <div className="item-icon">
                {tripHistoryService.getCategoryIcon(item.category || item.type)}
              </div>
              <div className="item-details">
                <div className="item-header">
                  <div className="item-title-section">
                    <span className="item-category">
                      {tripHistoryService.getCategoryDisplayName(item.category || item.type)}
                    </span>
                    <h4 className="item-title">{item.title}</h4>
                  </div>
                  <span className="item-status">
                    {getStatusIcon(item.status)}
                  </span>
                </div>
                <div className="item-meta">
                  <span className="item-date-created">
                    📅 Created: {formatDate(item.createdAt)}
                  </span>
                  <span className="item-date-activity">
                    🕒 Last activity: {formatDate(item.lastActivity || item.createdAt)}
                  </span>
                  {item.isGuest && <span className="guest-badge">Guest</span>}
                </div>
                <div className="item-stats">
                  {item.totalExpenses > 0 && (
                    <span className="expenses-count">
                      💰 {item.totalExpenses} expense{item.totalExpenses !== 1 ? 's' : ''}
                    </span>
                  )}
                  {item.totalAmount > 0 && (
                    <span className="total-amount">
                      {formatCurrency(item.totalAmount)}
                    </span>
                  )}
                </div>
              </div>
              <div className="item-arrow">→</div>
            </div>
          ))}
        </div>
      )}

      {activeTab === 'stats' && statistics && (
        <div className="statistics-panel">
          <div className="stats-grid">
            <div className="stat-card">
              <div className="stat-icon">🧳</div>
              <div className="stat-value">{statistics.totalTrips}</div>
              <div className="stat-label">Total Trips</div>
            </div>
            <div className="stat-card">
              <div className="stat-icon">💰</div>
              <div className="stat-value">{statistics.totalExpenses}</div>
              <div className="stat-label">Total Expenses</div>
            </div>
            <div className="stat-card">
              <div className="stat-icon">💸</div>
              <div className="stat-value">{formatCurrency(statistics.totalAmount)}</div>
              <div className="stat-label">Total Amount</div>
            </div>
            <div className="stat-card">
              <div className="stat-icon">👥</div>
              <div className="stat-value">{statistics.averageGroupSize}</div>
              <div className="stat-label">Avg Group Size</div>
            </div>
          </div>
          
          {statistics.favoriteType && (
            <div className="favorite-type">
              <h4>Your Favorite Activity</h4>
              <div className="favorite-item">
                {getTypeIcon(statistics.favoriteType)} {statistics.favoriteType}
              </div>
            </div>
          )}
          
          {statistics.mostActiveMonth && (
            <div className="most-active">
              <h4>Most Active Month</h4>
              <div className="active-month">{statistics.mostActiveMonth}</div>
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default UserHistory;
