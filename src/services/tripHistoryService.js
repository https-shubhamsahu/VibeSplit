import { db } from '../firebase';
import { collection, addDoc, serverTimestamp } from 'firebase/firestore';
import authService from './authService';

class TripHistoryService {
  constructor() {
    this.localStorageKey = 'vibesplit_trip_history';
  }

  /**
   * Update member count in trip_history after members change
   * @param {string} tripId - The trip ID
   * @param {number} memberCount - The new member count
   */
  async updateMemberCountInHistory(tripId, memberCount) {
    try {
      const db = (await import('../firebase')).db;
      const { getDocs, collection, query, where, updateDoc } = await import('firebase/firestore');
      const tripHistoryRef = collection(db, 'trip_history');
      const q = query(tripHistoryRef, where('tripId', '==', tripId));
      const snapshot = await getDocs(q);
      snapshot.forEach(async (docSnap) => {
        await updateDoc(docSnap.ref, { memberCount });
      });
    } catch (error) {
      console.warn('Failed to update member count in trip_history:', error);
    }
  }

  /**
   * Save a trip to history when it's created
   * @param {Object} tripData - The trip data to save
   * @param {string} category - The category (trip, canteen, outing, project)
   * @param {boolean} isGuest - Whether the user is a guest
   */
  async saveTripToHistory(tripData, category, isGuest = false) {
    const historyEntry = {
      tripId: tripData.id,
      tripName: tripData.title || tripData.name,
      category: category,
      createdAt: tripData.createdAt || new Date().toISOString(),
      createdBy: isGuest ? 'guest' : authService.getCurrentUser()?.uid,
      memberCount: tripData.members?.length || 0,
      isGuest: isGuest
    };

    try {
      if (!isGuest && authService.isAuthenticated()) {
        // Save to Firebase for authenticated users
        await addDoc(collection(db, 'trip_history'), {
          ...historyEntry,
          userId: authService.getCurrentUser().uid,
          timestamp: serverTimestamp()
        });
      }

      // Always save locally as backup
      this.saveToLocalStorage(historyEntry);
      
      return historyEntry;
    } catch (error) {
      console.warn('Failed to save trip to history:', error);
      // Fallback to local storage only
      this.saveToLocalStorage(historyEntry);
      return historyEntry;
    }
  }

  /**
   * Save history entry to localStorage
   * @param {Object} historyEntry - The history entry to save
   */
  saveToLocalStorage(historyEntry) {
    try {
      const existingHistory = this.getLocalHistory();
      existingHistory.unshift(historyEntry); // Add to beginning
      
      // Keep only last 100 entries to prevent storage overflow
      if (existingHistory.length > 100) {
        existingHistory.splice(100);
      }
      
      localStorage.setItem(this.localStorageKey, JSON.stringify(existingHistory));
    } catch (error) {
      console.warn('Failed to save to localStorage:', error);
    }
  }

  /**
   * Get history from localStorage
   * @returns {Array} Array of history entries
   */
  getLocalHistory() {
    try {
      const history = localStorage.getItem(this.localStorageKey);
      return history ? JSON.parse(history) : [];
    } catch (error) {
      console.warn('Failed to get local history:', error);
      return [];
    }
  }

  /**
   * Update trip activity (when expenses are added, members join, etc.)
   * @param {string} tripId - The trip ID
   * @param {string} category - The category
   * @param {string} activity - The activity type
   */
  async updateTripActivity(tripId, category, activity) {
    const activityEntry = {
      tripId,
      category,
      activity,
      timestamp: new Date().toISOString(),
      userId: authService.getCurrentUser()?.uid || 'guest'
    };

    try {
      // Save activity to Firebase if authenticated
      if (authService.isAuthenticated()) {
        await addDoc(collection(db, 'trip_activities'), {
          ...activityEntry,
          serverTimestamp: serverTimestamp()
        });
      }

      // Update local history
      this.updateLocalTripActivity(tripId, activity);
    } catch (error) {
      console.warn('Failed to update trip activity:', error);
      this.updateLocalTripActivity(tripId, activity);
    }
  }

  /**
   * Update local trip activity
   * @param {string} tripId - The trip ID
   * @param {string} activity - The activity type
   */
  updateLocalTripActivity(tripId, activity) {
    try {
      const history = this.getLocalHistory();
      const tripIndex = history.findIndex(entry => entry.tripId === tripId);
      
      if (tripIndex !== -1) {
        history[tripIndex].lastActivity = new Date().toISOString();
        history[tripIndex].activityType = activity;
        localStorage.setItem(this.localStorageKey, JSON.stringify(history));
      }
    } catch (error) {
      console.warn('Failed to update local trip activity:', error);
    }
  }

  /**
   * Get formatted history for display
   * @param {boolean} isGuest - Whether to get guest history
   * @returns {Array} Formatted history entries
   */
  getFormattedHistory(isGuest = false) {
    const localHistory = this.getLocalHistory();
    
    return localHistory
      .filter(entry => isGuest ? entry.isGuest : !entry.isGuest)
      .map(entry => ({
        id: entry.tripId,
        type: entry.category,
        title: entry.tripName,
        createdAt: entry.createdAt,
        lastActivity: entry.lastActivity || entry.createdAt,
        memberCount: entry.memberCount,
        category: entry.category,
        isGuest: entry.isGuest,
        status: this.getActivityStatus(entry.lastActivity || entry.createdAt)
      }))
      .sort((a, b) => new Date(b.lastActivity) - new Date(a.lastActivity));
  }

  /**
   * Get activity status based on last activity
   * @param {string} lastActivity - Last activity timestamp
   * @returns {string} Status (active, recent, inactive, archived)
   */
  getActivityStatus(lastActivity) {
    const now = new Date();
    const activityDate = new Date(lastActivity);
    const daysDiff = Math.floor((now - activityDate) / (1000 * 60 * 60 * 24));

    if (daysDiff === 0) return 'active';
    if (daysDiff <= 7) return 'recent';
    if (daysDiff <= 30) return 'inactive';
    return 'archived';
  }

  /**
   * Clear all history (for testing or user request)
   */
  clearHistory() {
    localStorage.removeItem(this.localStorageKey);
  }

  /**
   * Get category display name
   * @param {string} category - The category key
   * @returns {string} Display name
   */
  getCategoryDisplayName(category) {
    const categoryNames = {
      trip: 'Trip',
      canteen: 'Canteen',
      outing: 'Outing',
      project: 'Project'
    };
    return categoryNames[category] || category;
  }

  /**
   * Get category icon
   * @param {string} category - The category key
   * @returns {string} Emoji icon
   */
  getCategoryIcon(category) {
    const categoryIcons = {
      trip: '🧳',
      canteen: '🍔',
      outing: '🎉',
      project: '📚'
    };
    return categoryIcons[category] || '📝';
  }
}

const tripHistoryService = new TripHistoryService();
export default tripHistoryService;
