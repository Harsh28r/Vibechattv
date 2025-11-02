/**
 * Efficient matching queue for pairing users
 * Uses in-memory queue for fast matching
 */
class MatchingQueue {
  constructor() {
    this.waitingUsers = new Map(); // socketId -> user data
    this.activeChats = new Map(); // socketId -> partnerId
  }

  // Add user to waiting queue
  addToQueue(socketId, userData = {}) {
    if (this.activeChats.has(socketId)) {
      return { success: false, message: 'Already in chat' };
    }

    this.waitingUsers.set(socketId, {
      socketId,
      joinedAt: Date.now(),
      lastMatchAttempt: Date.now(),
      ...userData
    });

    console.log(`👤 User ${socketId} added to queue. Queue size: ${this.waitingUsers.size}`);
    
    // Try to match immediately with aggressive matching
    return this.findMatch(socketId, true);
  }

  // Find a match for the user with preference filtering
  findMatch(socketId, aggressive = false) {
    const currentUser = this.waitingUsers.get(socketId);
    
    if (!currentUser) {
      return { success: false, message: 'User not in queue' };
    }

    // Calculate wait time
    const waitTime = Date.now() - currentUser.joinedAt;
    const relaxFilters = aggressive || waitTime > 3000; // Relax after 3 seconds

    let bestMatch = null;
    let bestScore = -1;

    // Find best matching user based on preferences
    for (const [otherSocketId, otherUser] of this.waitingUsers) {
      if (otherSocketId !== socketId && !this.activeChats.has(otherSocketId)) {
        // Check if users match each other's preferences
        const match = this.checkCompatibility(currentUser, otherUser, relaxFilters);
        
        if (match.compatible && match.score > bestScore) {
          bestMatch = otherSocketId;
          bestScore = match.score;
        }
      }
    }

    // If match found
    if (bestMatch) {
      this.waitingUsers.delete(socketId);
      this.waitingUsers.delete(bestMatch);
      
      // Add to active chats
      this.activeChats.set(socketId, bestMatch);
      this.activeChats.set(bestMatch, socketId);

      console.log(`✅ Match found: ${socketId} <-> ${bestMatch} (score: ${bestScore}, wait: ${waitTime}ms)`);
      
      return {
        success: true,
        matched: true,
        user1: socketId,
        user2: bestMatch
      };
    }

    // Update last match attempt time
    currentUser.lastMatchAttempt = Date.now();

    return { success: true, matched: false, message: 'Waiting for match' };
  }

  // Check if two users are compatible based on preferences
  checkCompatibility(user1, user2, relaxFilters = false) {
    let score = 0;
    
    if (!relaxFilters) {
      // Strict matching - respect all filters
      
      // Gender filter check
      const genderMatch1 = user1.preferences?.gender === 'any' || user2.gender === user1.preferences?.gender;
      const genderMatch2 = user2.preferences?.gender === 'any' || user1.gender === user2.preferences?.gender;
      
      if (!genderMatch1 || !genderMatch2) {
        return { compatible: false, score: 0 };
      }
      
      // Country filter check
      const countryMatch1 = user1.preferences?.country === 'ANY' || user2.country === user1.preferences?.country;
      const countryMatch2 = user2.preferences?.country === 'ANY' || user1.country === user2.preferences?.country;
      
      if (!countryMatch1 || !countryMatch2) {
        return { compatible: false, score: 0 };
      }
      
      score += 50; // Bonus for perfect match
    } else {
      // Relaxed matching - match anyone after waiting
      score += 10; // Lower base score for relaxed matches
    }
    
    // Calculate interest overlap score (always consider)
    if (user1.interests?.length > 0 && user2.interests?.length > 0) {
      const commonInterests = user1.interests.filter(interest => 
        user2.interests.includes(interest)
      );
      score += commonInterests.length * 10; // 10 points per common interest
    }
    
    // Prioritize users who waited longer
    const user2WaitTime = Date.now() - user2.joinedAt;
    score += Math.min(user2WaitTime / 1000, 20); // Up to 20 bonus points for wait time
    
    // Base score for compatible users
    score += 1;
    
    return { compatible: true, score };
  }

  // Remove user from queue
  removeFromQueue(socketId) {
    this.waitingUsers.delete(socketId);
    console.log(`❌ User ${socketId} removed from queue`);
  }

  // End chat session
  endChat(socketId) {
    const partnerId = this.activeChats.get(socketId);
    
    if (partnerId) {
      this.activeChats.delete(socketId);
      this.activeChats.delete(partnerId);
      console.log(`💔 Chat ended: ${socketId} <-> ${partnerId}`);
      return partnerId;
    }
    
    return null;
  }

  // Get partner ID
  getPartner(socketId) {
    return this.activeChats.get(socketId) || null;
  }

  // Check if user is in chat
  isInChat(socketId) {
    return this.activeChats.has(socketId);
  }

  // Check if user is in queue
  isInQueue(socketId) {
    return this.waitingUsers.has(socketId);
  }

  // Get stats
  getStats() {
    return {
      waitingUsers: this.waitingUsers.size,
      activeChats: this.activeChats.size / 2, // Divide by 2 as each chat has 2 entries
      totalUsers: this.waitingUsers.size + this.activeChats.size
    };
  }

  // Periodic retry for waiting users (call this every 2 seconds)
  retryWaitingUsers() {
    let matched = 0;
    const now = Date.now();
    
    // Try to match users who have been waiting
    for (const [socketId, user] of this.waitingUsers) {
      // Skip if recently tried (less than 1 second ago)
      if (now - user.lastMatchAttempt < 1000) continue;
      
      const result = this.findMatch(socketId, true);
      if (result.matched) {
        matched++;
      }
    }
    
    if (matched > 0) {
      console.log(`🔄 Retry matched ${matched} pairs from waiting queue`);
    }
    
    return matched;
  }

  // Clean up disconnected user
  cleanup(socketId) {
    this.removeFromQueue(socketId);
    const partnerId = this.endChat(socketId);
    return partnerId;
  }
}

export default MatchingQueue;

