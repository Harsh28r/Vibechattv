import express from 'express';
import passport from '../config/passport.js';
import { generateToken } from '../middleware/auth.js';

const router = express.Router();

function successUrl(token, state) {
  const q = new URLSearchParams({ token });
  if (state === 'mobile') q.set('mobile', '1');
  return `https://api.coinsclarity.com/api/auth/success?${q.toString()}`;
}

function failUrl(state, reason = 'facebook_auth_failed') {
  const q = new URLSearchParams({ error: reason });
  if (state === 'mobile') q.set('mobile', '1');
  return `https://api.coinsclarity.com/api/auth/success?${q.toString()}`;
}

router.get('/facebook', (req, res, next) => {
  const state = req.query.platform === 'mobile' ? 'mobile' : 'web';
  passport.authenticate('facebook', {
    scope: ['email', 'public_profile'],
    state,
  })(req, res, next);
});

router.get('/facebook/callback', (req, res, next) => {
  const state = String(req.query.state || 'web');
  passport.authenticate('facebook', { session: false }, (err, user, info) => {
    if (err) {
      console.error('Facebook auth error:', err);
      return res.redirect(failUrl(state, 'auth_error'));
    }
    if (!user) {
      console.error('Facebook auth no user:', info);
      return res.redirect(failUrl(state, 'facebook_auth_failed'));
    }
    try {
      const token = generateToken(user._id);
      return res.redirect(successUrl(token, state));
    } catch (error) {
      console.error('Facebook callback token error:', error);
      return res.redirect(failUrl(state, 'auth_error'));
    }
  })(req, res, next);
});

export default router;
