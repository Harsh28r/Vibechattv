import express from 'express';
import passport from '../config/passport.js';
import { generateToken } from '../middleware/auth.js';

const router = express.Router();

// @route   GET /api/auth/facebook
// @desc    Redirect to Facebook for authentication
// @access  Public
router.get('/facebook',
  passport.authenticate('facebook', {
    scope: ['email', 'public_profile']
  })
);

// @route   GET /api/auth/facebook/callback
// @desc    Facebook callback
// @access  Public
router.get('/facebook/callback',
  passport.authenticate('facebook', { 
    session: false,
    failureRedirect: '/login?error=facebook_auth_failed'
  }),
  (req, res) => {
    try {
      // Generate JWT token
      const token = generateToken(req.user._id);
      
      // Redirect to frontend with token
      const frontendURL = process.env.FRONTEND_URL || 'http://localhost:5173';
      res.redirect(`${frontendURL}/auth/success?token=${token}`);
    } catch (error) {
      console.error('Facebook callback error:', error);
      res.redirect(`${frontendURL}/login?error=auth_error`);
    }
  }
);

export default router;

