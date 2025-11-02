import express from 'express';
import passport from '../config/passport.js';
import { generateToken } from '../middleware/auth.js';

const router = express.Router();

// @route   GET /api/auth/google
// @desc    Redirect to Google for authentication
// @access  Public
router.get('/google',
  passport.authenticate('google', {
    scope: ['profile', 'email']
  })
);

// @route   GET /api/auth/google/callback
// @desc    Google callback
// @access  Public
router.get('/google/callback',
  passport.authenticate('google', { 
    session: false,
    failureRedirect: '/login?error=google_auth_failed'
  }),
  (req, res) => {
    try {
      // Generate JWT token
      const token = generateToken(req.user._id);
      
      // Redirect to frontend with token
      const frontendURL = process.env.FRONTEND_URL || 'http://localhost:5173';
      res.redirect(`${frontendURL}/auth/success?token=${token}`);
    } catch (error) {
      console.error('Google callback error:', error);
      const frontendURL = process.env.FRONTEND_URL || 'http://localhost:5173';
      res.redirect(`${frontendURL}/login?error=auth_error`);
    }
  }
);

export default router;



