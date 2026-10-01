import 'dotenv/config';
import passport from 'passport';
import { Strategy as FacebookStrategy } from 'passport-facebook';
import { Strategy as GoogleStrategy } from 'passport-google-oauth20';
import User from '../models/User.js';

const googleClientID = process.env.GOOGLE_CLIENT_ID;
const googleClientSecret = process.env.GOOGLE_CLIENT_SECRET;
const googleCallbackURL =
  process.env.GOOGLE_CALLBACK_URL ||
  'https://api.coinsclarity.com/api/auth/google/callback';

const facebookAppId = process.env.FACEBOOK_APP_ID;
const facebookAppSecret = process.env.FACEBOOK_APP_SECRET;
const facebookCallbackURL =
  process.env.FACEBOOK_CALLBACK_URL ||
  'https://api.coinsclarity.com/api/auth/facebook/callback';

if (facebookAppId && facebookAppSecret && !String(facebookAppId).includes('your_facebook')) {
  passport.use(
    new FacebookStrategy(
      {
        clientID: facebookAppId,
        clientSecret: facebookAppSecret,
        callbackURL: facebookCallbackURL,
        profileFields: ['id', 'displayName', 'photos', 'email'],
      },
      async (accessToken, refreshToken, profile, done) => {
        try {
          let user = await User.findOne({ facebookId: profile.id });

          if (user) {
            user.lastActive = Date.now();
            await user.save();
            return done(null, user);
          }

          if (profile.emails && profile.emails[0]) {
            user = await User.findOne({ email: profile.emails[0].value });

            if (user) {
              user.facebookId = profile.id;
              if (!user.avatar && profile.photos && profile.photos[0]) {
                user.avatar = profile.photos[0].value;
              }
              await user.save();
              return done(null, user);
            }
          }

          user = await User.create({
            facebookId: profile.id,
            email:
              profile.emails && profile.emails[0]
                ? profile.emails[0].value
                : null,
            displayName: profile.displayName,
            avatar:
              profile.photos && profile.photos[0]
                ? profile.photos[0].value
                : null,
            isGuest: false,
            provider: 'facebook',
          });

          done(null, user);
        } catch (error) {
          done(error, null);
        }
      }
    )
  );
} else {
  console.warn('⚠️ Facebook OAuth not configured');
}

if (
  googleClientID &&
  googleClientSecret &&
  !String(googleClientID).includes('your_google')
) {
  passport.use(
    new GoogleStrategy(
      {
        clientID: googleClientID,
        clientSecret: googleClientSecret,
        callbackURL: googleCallbackURL,
        scope: ['openid', 'profile', 'email'],
      },
      async (accessToken, refreshToken, profile, done) => {
        try {
          let user = await User.findOne({ googleId: profile.id });

          if (user) {
            user.lastActive = Date.now();
            user.provider = user.provider || 'google';
            await user.save();
            return done(null, user);
          }

          const email =
            profile.emails && profile.emails[0]
              ? profile.emails[0].value
              : undefined;

          if (email) {
            user = await User.findOne({ email });
            if (user) {
              user.googleId = profile.id;
              user.provider = 'google';
              user.isGuest = false;
              if (!user.displayName && profile.displayName) {
                user.displayName = profile.displayName;
              }
              if (!user.avatar && profile.photos?.[0]) {
                user.avatar = profile.photos[0].value;
              }
              user.lastActive = Date.now();
              await user.save();
              return done(null, user);
            }
          }

          const payload = {
            googleId: profile.id,
            displayName: profile.displayName || 'Camify User',
            isGuest: false,
            provider: 'google',
            lastActive: Date.now(),
          };
          if (email) payload.email = email;
          if (profile.photos?.[0]?.value) payload.avatar = profile.photos[0].value;

          try {
            user = await User.create(payload);
          } catch (createErr) {
            if (createErr?.code === 11000 && createErr.keyPattern?.socketId) {
              const users = User.collection;
              const indexes = await users.indexes();
              for (const idx of indexes) {
                const keys = Object.keys(idx.key || {});
                if (idx.unique && keys.length === 1 && keys[0] === 'socketId') {
                  await users.dropIndex(idx.name);
                }
              }
              user = await User.create(payload);
              return done(null, user);
            }
            // race / duplicate — fetch existing
            if (createErr?.code === 11000) {
              user =
                (await User.findOne({ googleId: profile.id })) ||
                (email ? await User.findOne({ email }) : null);
              if (user) return done(null, user);
            }
            throw createErr;
          }

          return done(null, user);
        } catch (error) {
          console.error('Google strategy user error:', error);
          return done(error, null);
        }
      }
    )
  );
  console.log(
    '✅ Google OAuth client:',
    String(googleClientID).slice(0, 24) + '…'
  );
} else {
  console.error(
    '❌ Google OAuth NOT configured — GOOGLE_CLIENT_ID is missing/placeholder'
  );
}

passport.serializeUser((user, done) => {
  done(null, user.id);
});

passport.deserializeUser(async (id, done) => {
  try {
    const user = await User.findById(id);
    done(null, user);
  } catch (error) {
    done(error, null);
  }
});

export default passport;
