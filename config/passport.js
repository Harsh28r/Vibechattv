import passport from 'passport';
import { Strategy as FacebookStrategy } from 'passport-facebook';
import { Strategy as GoogleStrategy } from 'passport-google-oauth20';
import User from '../models/User.js';

// Facebook Strategy
passport.use(new FacebookStrategy({
    clientID: process.env.FACEBOOK_APP_ID || 'your_facebook_app_id',
    clientSecret: process.env.FACEBOOK_APP_SECRET || 'your_facebook_app_secret',
    callbackURL: process.env.FACEBOOK_CALLBACK_URL || 'http://localhost:5000/api/auth/facebook/callback',
    profileFields: ['id', 'displayName', 'photos', 'email']
  },
  async (accessToken, refreshToken, profile, done) => {
    try {
      // Check if user exists
      let user = await User.findOne({ facebookId: profile.id });

      if (user) {
        // Update last active
        user.lastActive = Date.now();
        await user.save();
        return done(null, user);
      }

      // Check if user exists with same email
      if (profile.emails && profile.emails[0]) {
        user = await User.findOne({ email: profile.emails[0].value });
        
        if (user) {
          // Link Facebook account
          user.facebookId = profile.id;
          if (!user.avatar && profile.photos && profile.photos[0]) {
            user.avatar = profile.photos[0].value;
          }
          await user.save();
          return done(null, user);
        }
      }

      // Create new user
      user = await User.create({
        facebookId: profile.id,
        email: profile.emails && profile.emails[0] ? profile.emails[0].value : null,
        displayName: profile.displayName,
        avatar: profile.photos && profile.photos[0] ? profile.photos[0].value : null,
        isGuest: false
      });

      done(null, user);
    } catch (error) {
      done(error, null);
    }
  }
));

// Google Strategy
passport.use(new GoogleStrategy({
    clientID: process.env.GOOGLE_CLIENT_ID || 'your_google_client_id',
    clientSecret: process.env.GOOGLE_CLIENT_SECRET || 'your_google_client_secret',
    callbackURL: process.env.GOOGLE_CALLBACK_URL || 'http://localhost:5000/api/auth/google/callback'
  },
  async (accessToken, refreshToken, profile, done) => {
    try {
      // Check if user exists
      let user = await User.findOne({ googleId: profile.id });

      if (user) {
        // Update last active
        user.lastActive = Date.now();
        await user.save();
        return done(null, user);
      }

      // Check if user exists with same email
      if (profile.emails && profile.emails[0]) {
        user = await User.findOne({ email: profile.emails[0].value });
        
        if (user) {
          // Link Google account
          user.googleId = profile.id;
          if (!user.avatar && profile.photos && profile.photos[0]) {
            user.avatar = profile.photos[0].value;
          }
          await user.save();
          return done(null, user);
        }
      }

      // Create new user
      user = await User.create({
        googleId: profile.id,
        email: profile.emails && profile.emails[0] ? profile.emails[0].value : null,
        displayName: profile.displayName,
        avatar: profile.photos && profile.photos[0] ? profile.photos[0].value : null,
        isGuest: false
      });

      done(null, user);
    } catch (error) {
      done(error, null);
    }
  }
));

// Serialize user
passport.serializeUser((user, done) => {
  done(null, user.id);
});

// Deserialize user
passport.deserializeUser(async (id, done) => {
  try {
    const user = await User.findById(id);
    done(null, user);
  } catch (error) {
    done(error, null);
  }
});

export default passport;

