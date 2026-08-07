/**
 * Matching queue with tiered preference relaxation.
 * strict (0–15s) → soft (15–45s) → open (45s+)
 */
class MatchingQueue {
  constructor() {
    this.waitingUsers = new Map();
    this.activeChats = new Map();
    this.STRICT_MS = parseInt(process.env.MATCH_STRICT_MS || '15000', 10);
    this.SOFT_MS = parseInt(process.env.MATCH_SOFT_MS || '45000', 10);
  }

  addToQueue(socketId, userData = {}) {
    if (this.activeChats.has(socketId)) {
      return { success: false, message: 'Already in chat' };
    }

    // Refresh prefs if already waiting
    const existing = this.waitingUsers.get(socketId);
    this.waitingUsers.set(socketId, {
      socketId,
      joinedAt: existing?.joinedAt || Date.now(),
      lastMatchAttempt: Date.now(),
      ...userData,
    });

    console.log(`👤 User ${socketId} added to queue. Queue size: ${this.waitingUsers.size}`);
    return this.findMatch(socketId);
  }

  getRelaxLevel(waitTime) {
    if (waitTime < this.STRICT_MS) return 'strict';
    if (waitTime < this.SOFT_MS) return 'soft';
    return 'open';
  }

  findMatch(socketId) {
    const currentUser = this.waitingUsers.get(socketId);
    if (!currentUser) {
      return { success: false, message: 'User not in queue' };
    }

    const waitTime = Date.now() - currentUser.joinedAt;
    const level = this.getRelaxLevel(waitTime);

    let bestMatch = null;
    let bestScore = -1;

    for (const [otherSocketId, otherUser] of this.waitingUsers) {
      if (otherSocketId === socketId || this.activeChats.has(otherSocketId)) continue;

      const match = this.checkCompatibility(currentUser, otherUser, level);
      if (match.compatible && match.score > bestScore) {
        bestMatch = otherSocketId;
        bestScore = match.score;
      }
    }

    if (bestMatch) {
      const user1Data = this.waitingUsers.get(socketId);
      const user2Data = this.waitingUsers.get(bestMatch);
      this.waitingUsers.delete(socketId);
      this.waitingUsers.delete(bestMatch);
      this.activeChats.set(socketId, bestMatch);
      this.activeChats.set(bestMatch, socketId);

      console.log(
        `✅ Match: ${socketId} <-> ${bestMatch} (score: ${bestScore}, wait: ${waitTime}ms, level: ${level})`
      );

      return {
        success: true,
        matched: true,
        user1: socketId,
        user2: bestMatch,
        user1Data,
        user2Data,
        level,
      };
    }

    currentUser.lastMatchAttempt = Date.now();
    return { success: true, matched: false, message: 'Waiting for match', level, waitTime };
  }

  checkCompatibility(user1, user2, level = 'strict') {
    let score = 0;

    const genderOk = (a, b) =>
      a.preferences?.gender === 'any' || !a.preferences?.gender || b.gender === a.preferences.gender;

    const countryOk = (a, b) =>
      a.preferences?.country === 'ANY' ||
      !a.preferences?.country ||
      b.country === a.preferences.country;

    if (level === 'strict') {
      if (!genderOk(user1, user2) || !genderOk(user2, user1)) {
        return { compatible: false, score: 0 };
      }
      if (!countryOk(user1, user2) || !countryOk(user2, user1)) {
        return { compatible: false, score: 0 };
      }
      score += 50;
    } else if (level === 'soft') {
      // Keep gender filter; drop country requirement
      if (!genderOk(user1, user2) || !genderOk(user2, user1)) {
        return { compatible: false, score: 0 };
      }
      score += 25;
      if (countryOk(user1, user2) && countryOk(user2, user1)) score += 15;
    } else {
      // open — anyone, but still score preferred matches higher
      score += 8;
      if (genderOk(user1, user2) && genderOk(user2, user1)) score += 20;
      if (countryOk(user1, user2) && countryOk(user2, user1)) score += 10;
    }

    if (user1.interests?.length > 0 && user2.interests?.length > 0) {
      const common = user1.interests.filter((i) => user2.interests.includes(i));
      score += common.length * 12;
      if (level === 'strict' && common.length === 0 && user1.interests.length && user2.interests.length) {
        // Prefer overlap in strict, but don't block — volume matters
        score -= 5;
      }
    }

    const user2Wait = Date.now() - user2.joinedAt;
    score += Math.min(user2Wait / 1000, 25);
    score += 1;

    return { compatible: true, score };
  }

  removeFromQueue(socketId) {
    this.waitingUsers.delete(socketId);
  }

  endChat(socketId) {
    const partnerId = this.activeChats.get(socketId);
    if (partnerId) {
      this.activeChats.delete(socketId);
      this.activeChats.delete(partnerId);
      return partnerId;
    }
    return null;
  }

  getPartner(socketId) {
    return this.activeChats.get(socketId) || null;
  }

  isInChat(socketId) {
    return this.activeChats.has(socketId);
  }

  isInQueue(socketId) {
    return this.waitingUsers.has(socketId);
  }

  pairDirect(user1, user2) {
    this.removeFromQueue(user1);
    this.removeFromQueue(user2);
    this.activeChats.set(user1, user2);
    this.activeChats.set(user2, user1);
  }

  getStats() {
    return {
      waitingUsers: this.waitingUsers.size,
      activeChats: this.activeChats.size / 2,
      totalUsers: this.waitingUsers.size + this.activeChats.size,
    };
  }

  retryWaitingUsers() {
    let matched = 0;
    const now = Date.now();
    const results = [];

    for (const [socketId, user] of this.waitingUsers) {
      if (now - user.lastMatchAttempt < 1000) continue;
      const result = this.findMatch(socketId);
      if (result.matched) {
        matched++;
        results.push(result);
      }
    }

    return { matched, results };
  }

  cleanup(socketId) {
    this.removeFromQueue(socketId);
    return this.endChat(socketId);
  }
}

export default MatchingQueue;
