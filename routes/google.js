import express from 'express';
import passport from '../config/passport.js';
import { generateToken } from '../middleware/auth.js';

const router = express.Router();

function successUrl(token, state) {
  const q = new URLSearchParams({ token });
  if (state === 'mobile') q.set('mobile', '1');
  return `https://api.coinsclarity.com/api/auth/success?${q.toString()}`;
}

function failUrl(state, reason = 'google_auth_failed') {
  const q = new URLSearchParams({ error: reason });
  if (state === 'mobile') q.set('mobile', '1');
  return `https://api.coinsclarity.com/api/auth/success?${q.toString()}`;
}

router.get('/google', (req, res, next) => {
  const state = req.query.platform === 'mobile' ? 'mobile' : 'web';
  passport.authenticate('google', {
    scope: ['openid', 'profile', 'email'],
    state,
  })(req, res, next);
});

router.get('/google/callback', (req, res, next) => {
  const state = String(req.query.state || 'web');
  passport.authenticate('google', { session: false }, (err, user, info) => {
    if (err) {
      console.error('Google auth error:', err);
      const detail = encodeURIComponent(
        String(err.message || err.code || 'unknown').slice(0, 120)
      );
      return res.redirect(`${failUrl(state, 'auth_error')}&detail=${detail}`);
    }
    if (!user) {
      console.error('Google auth no user:', info);
      return res.redirect(failUrl(state, 'google_auth_failed'));
    }
    try {
      const token = generateToken(user._id);
      return res.redirect(successUrl(token, state));
    } catch (error) {
      console.error('Google callback token error:', error);
      const detail = encodeURIComponent(String(error.message || 'token').slice(0, 120));
      return res.redirect(`${failUrl(state, 'auth_error')}&detail=${detail}`);
    }
  })(req, res, next);
});

export default router;
