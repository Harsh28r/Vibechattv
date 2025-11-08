import express from 'express';
import User from '../models/User.js';
import { generateToken } from '../middleware/auth.js';

const router = express.Router();

// Note: Firebase Admin SDK is optional for backend token verification
// For now, we trust the frontend Firebase authentication
// To add backend verification, install firebase-admin and uncomment below:

/*
import admin from 'firebase-admin';
import { initializeApp, cert } from 'firebase-admin/app';

const serviceAccount = require('../firebase-service-account.json');
initializeApp({
  credential: cert(serviceAccount)
});
*/

// @route   POST /api/auth/firebase-sync
// @desc    Sync Firebase user with MongoDB
// @access  Public
const normalizeProvider = (rawProvider) => {
  if (!rawProvider) return 'firebase';
  const provider = rawProvider.toLowerCase();

  if (provider.includes('google')) return 'google';
  if (provider.includes('facebook')) return 'facebook';
  if (provider.includes('password') || provider === 'local') return 'local';
  if (provider.includes('firebase')) return 'firebase';

  return 'firebase';
};

router.post('/firebase-sync', async (req, res) => {
  try {
    const { uid, email, displayName, photoURL, provider } = req.body;

    if (!uid) {
      return res.status(400).json({ message: 'Firebase UID is required' });
    }

    const normalizedProvider = normalizeProvider(provider);

    // Check if user already exists
    let user = await User.findOne({ firebaseUid: uid });

    if (user) {
      // Update existing user
      user.email = email || user.email;
      user.displayName = displayName || user.displayName;
      user.avatar = photoURL || user.avatar;
      user.provider = normalizedProvider || user.provider;
      user.lastActive = Date.now();
      await user.save();
    } else {
      // Create new user
      user = await User.create({
        firebaseUid: uid,
        email: email,
        username: displayName || email?.split('@')[0] || 'User',
        displayName: displayName,
        avatar: photoURL,
        provider: normalizedProvider,
        isGuest: false
      });
    }

    // Generate JWT token for socket authentication
    const token = generateToken(user._id);

    res.json({
      success: true,
      token,
      user: {
        id: user._id,
        uid: user.firebaseUid,
        email: user.email,
        username: user.username,
        displayName: user.displayName,
        avatar: user.avatar
      }
    });
  } catch (error) {
    console.error('Firebase sync error:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

export default router;

