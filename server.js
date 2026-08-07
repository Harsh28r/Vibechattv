import express from 'express';
import { createServer } from 'http';
import { Server } from 'socket.io';
import cors from 'cors';
import helmet from 'helmet';
import compression from 'compression';
import rateLimit from 'express-rate-limit';
import dotenv from 'dotenv';
import cookieParser from 'cookie-parser';
import session from 'express-session';
import geoip from 'geoip-lite';
import connectDB from './config/database.js';
import MatchingQueue from './utils/MatchingQueue.js';
import InviteRooms from './utils/InviteRooms.js';
import ChatSession from './models/ChatSession.js';
import User from './models/User.js';
import Report from './models/Report.js';
import passport from './config/passport.js';
import authRoutes from './routes/auth.js';
import facebookRoutes from './routes/facebook.js';
import googleRoutes from './routes/google.js';
import firebaseRoutes from './routes/firebase.js';
import moderationRoutes from './routes/moderation.js';
import { verifyToken } from './middleware/auth.js';



// Load environment variables
dotenv.config();

// Initialize Express app
const app = express();
const httpServer = createServer(app);

// Initialize Socket.IO with CORS
// Get CORS origin from environment, allow multiple origins or single origin
const socketCorsOrigin = process.env.CORS_ORIGIN 
  ? process.env.CORS_ORIGIN.split(',').map(origin => origin.trim())
  : (process.env.NODE_ENV === 'production' ? [] : ['http://localhost:5173', 'http://localhost:3000']);

const io = new Server(httpServer, {
  cors: {
    origin: socketCorsOrigin.length === 0 ? '*' : socketCorsOrigin,
    methods: ['GET', 'POST'],
    credentials: true
  },
  maxHttpBufferSize: 1e6, // 1MB
  pingTimeout: 60000,
  pingInterval: 25000,
  transports: ['polling', 'websocket'],
  allowEIO3: true
});

// Middleware
// Get CORS origin from environment, allow multiple origins or single origin
const expressCorsOrigin = process.env.CORS_ORIGIN 
  ? process.env.CORS_ORIGIN.split(',').map(origin => origin.trim())
  : (process.env.NODE_ENV === 'production' ? [] : ['http://localhost:5173', 'http://localhost:3000','https://camify.fun']);

app.use(cors({
  origin: expressCorsOrigin.length === 0 ? '*' : expressCorsOrigin,
  credentials: true, // Enable credentials for auth
  optionsSuccessStatus: 200 // For legacy browser support
}));
app.use(compression());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(cookieParser());

// Session middleware (required for passport)
app.use(session({
  secret: process.env.SESSION_SECRET || 'vibechat-secret-key-change-in-production',
  resave: false,
  saveUninitialized: false,
  cookie: {
    secure: process.env.NODE_ENV === 'production',
    httpOnly: true,
    maxAge: 7 * 24 * 60 * 60 * 1000 // 7 days
  }
}));

// Initialize Passport
app.use(passport.initialize());
app.use(passport.session());

// Rate limiting
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100 // limit each IP to 100 requests per windowMs
});
app.use('/api/', limiter);

// Connect to MongoDB
connectDB();

// API Routes
app.use('/api/auth', authRoutes);
app.use('/api/auth', facebookRoutes);
app.use('/api/auth', googleRoutes);
app.use('/api/auth', firebaseRoutes);
app.use('/api/moderation', moderationRoutes);

// Initialize matching queue
const matchingQueue = new MatchingQueue();
const inviteRooms = new InviteRooms();

function emitMatch(user1, user2, user1Data = {}, user2Data = {}) {
  const tempSessionId = `temp-${Date.now()}-${Math.random()}`;
  io.to(user1).emit('searching', { message: 'Found someone! Connecting...' });
  io.to(user2).emit('searching', { message: 'Found someone! Connecting...' });
  io.to(user1).emit('match-found', {
    partnerId: user2,
    sessionId: tempSessionId,
    partnerCountry: user2Data?.country || 'Unknown',
    room: false,
  });
  io.to(user2).emit('match-found', {
    partnerId: user1,
    sessionId: tempSessionId,
    partnerCountry: user1Data?.country || 'Unknown',
    room: false,
  });

  setImmediate(async () => {
    try {
      await User.updateMany(
        { socketId: { $in: [user1, user2] } },
        { inChat: true, partnerId: user1 }
      );
      await ChatSession.create({
        user1,
        user2,
        startTime: Date.now(),
      });
    } catch (error) {
      console.error('Error saving match to database:', error);
    }
  });
}

// Auto-retry matching for waiting users every 1.5 seconds
setInterval(() => {
  const { results } = matchingQueue.retryWaitingUsers();
  for (const result of results) {
    const { user1, user2, user1Data, user2Data } = result;
    console.log(`⚡ Auto-matched: ${user1} <-> ${user2}`);
    emitMatch(user1, user2, user1Data, user2Data);
  }
}, 1500);

// Track active connections
let activeConnections = 0;
const MAX_CONNECTIONS = parseInt(process.env.MAX_CONNECTIONS) || 10000;

// API Routes
app.get('/api/health', (req, res) => {
  res.json({
    status: 'ok',
    timestamp: new Date().toISOString(),
    connections: activeConnections,
    stats: matchingQueue.getStats()
  });
});

app.get('/api/stats', (req, res) => {
  const stats = matchingQueue.getStats();
  res.json({
    ...stats,
    activeConnections,
    maxConnections: MAX_CONNECTIONS
  });
});

// ICE servers for WebRTC (STUN + optional TURN)
app.get('/api/ice', (req, res) => {
  const iceServers = [
    { urls: 'stun:stun.l.google.com:19302' },
    { urls: 'stun:stun1.l.google.com:19302' },
  ];

  const turnUrls = (process.env.TURN_URLS || '')
    .split(',')
    .map((u) => u.trim())
    .filter(Boolean);
  const turnUsername = process.env.TURN_USERNAME;
  const turnCredential = process.env.TURN_CREDENTIAL;

  if (turnUrls.length && turnUsername && turnCredential) {
    iceServers.push({
      urls: turnUrls,
      username: turnUsername,
      credential: turnCredential,
    });
  }

  res.json({ iceServers });
});

// Socket.IO Connection Handling
io.on('connection', async (socket) => {
  let authedUser = null;
  const tokenFromAuth = socket.handshake.auth?.token;
  const tokenFromHeader = socket.handshake.headers?.authorization?.startsWith('Bearer ')
    ? socket.handshake.headers.authorization.substring(7)
    : null;
  const token = tokenFromAuth || tokenFromHeader;

  if (token) {
    try {
      const decoded = verifyToken(token);
      if (decoded?.id) {
        authedUser = await User.findById(decoded.id);
        if (authedUser) {
          socket.data.userId = authedUser._id.toString();
          // If user is banned, disconnect immediately
          if (authedUser.bannedUntil && authedUser.bannedUntil.getTime() > Date.now()) {
            socket.emit('banned', {
              message: 'Your account is temporarily suspended due to policy violations.',
              bannedUntil: authedUser.bannedUntil,
              banReason: authedUser.banReason || 'Community guidelines violation'
            });
            setTimeout(() => socket.disconnect(true), 200);
            return;
          }
        }
      }
    } catch (error) {
      console.error('Error verifying socket token:', error.message);
    }
  }

  activeConnections++;
  console.log(`🔌 New connection: ${socket.id} | Total: ${activeConnections}`);

  // Detect country from IP
  const clientIP = socket.handshake.address || socket.conn.remoteAddress || '127.0.0.1';
  const geo = geoip.lookup(clientIP);
  const detectedCountry = geo?.country || 'Unknown';
  console.log(`🌍 IP: ${clientIP} | Country: ${detectedCountry}`);

  // Check max connections
  if (activeConnections > MAX_CONNECTIONS) {
    socket.emit('server-full', { message: 'Server is at capacity. Please try again later.' });
    socket.disconnect();
    activeConnections--;
    return;
  }

  // User joins and starts searching
  socket.on('start-search', async (userData) => {
    try {
      console.log(`🔍 ${socket.id} started searching`);
      console.log('Preferences:', userData);

      // Check ban status before proceeding
      if (socket.data?.userId) {
        const dbUser = await User.findById(socket.data.userId).select('bannedUntil banReason');
        if (dbUser?.bannedUntil && dbUser.bannedUntil.getTime() > Date.now()) {
          socket.emit('banned', {
            message: 'Your account is temporarily suspended due to policy violations.',
            bannedUntil: dbUser.bannedUntil,
            banReason: dbUser.banReason
          });
          return;
        } else if (dbUser && dbUser.bannedUntil && dbUser.bannedUntil.getTime() <= Date.now()) {
          // Ban expired – clear fields for next time
          dbUser.bannedUntil = null;
          dbUser.banReason = null;
          await dbUser.save();
        }
      }
      
      // Prepare user data for matching queue (use detected country from socket)
      const userDataForQueue = {
        ...userData,
        country: userData?.country || detectedCountry || 'Unknown',
        gender: userData?.gender || 'other',
        preferences: {
          gender: userData?.preferences?.gender || 'any',
          country: userData?.preferences?.country || 'ANY'
        }
      };

      // Add to matching queue FIRST (fast, in-memory)
      const result = matchingQueue.addToQueue(socket.id, {
        ...userDataForQueue,
        userId: socket.data?.userId || null
      });
      
      // Update database asynchronously (non-blocking)
      const userQuery = socket.data?.userId ? { _id: socket.data.userId } : { socketId: socket.id };

      User.findOneAndUpdate(
        userQuery,
        {
          socketId: socket.id,
          isOnline: true,
          inChat: false,
          lastActive: Date.now(),
          country: userDataForQueue.country,
          gender: userDataForQueue.gender,
          interests: userData?.interests || [],
          preferences: userDataForQueue.preferences
        },
        { upsert: true, new: true }
      ).catch(err => console.error('Database update error:', err));

      if (result.matched) {
        const { user1, user2, user1Data, user2Data } = result;
        const stats = matchingQueue.getStats();
        console.log(`⚡ Instant match: ${user1} <-> ${user2}`);
        console.log(`📊 Queue Stats - Waiting: ${stats.waitingUsers}, Active Chats: ${stats.activeChats}`);
        emitMatch(user1, user2, user1Data, user2Data);
      } else {
        const stats = matchingQueue.getStats();
        const level = result.level || 'strict';
        console.log(`⏰ ${socket.id} waiting (${level}). Total waiting: ${stats.waitingUsers}`);
        socket.emit('searching', {
          message:
            level === 'strict'
              ? 'Searching preferred matches...'
              : level === 'soft'
                ? 'Widening filters...'
                : 'Searching anyone nearby...',
          level,
          waitTime: result.waitTime,
        });
      }
    } catch (error) {
      console.error('❌ Error in start-search:', error);
      console.error('❌ Error details:', error.stack);
      socket.emit('error', { message: 'Failed to start search: ' + error.message });
    }
  });

  // WebRTC Signaling: Offer
  socket.on('webrtc-offer', ({ offer, to }) => {
    console.log(`📞 Sending offer from ${socket.id} to ${to}`);
    io.to(to).emit('webrtc-offer', { offer, from: socket.id });
  });

  // Private invite room
  socket.on('create-room', () => {
    try {
      matchingQueue.removeFromQueue(socket.id);
      const room = inviteRooms.create(socket.id);
      socket.emit('room-created', {
        code: room.code,
        linkPath: `/chat?room=${room.code}`,
      });
      socket.emit('searching', { message: 'Invite created — waiting for friend...' });
    } catch (error) {
      console.error('create-room error:', error);
      socket.emit('error', { message: 'Failed to create room' });
    }
  });

  socket.on('join-room', ({ code }) => {
    try {
      matchingQueue.removeFromQueue(socket.id);
      const result = inviteRooms.join(code, socket.id);
      if (!result.ok) {
        socket.emit('room-error', { message: result.message });
        return;
      }

      const { room } = result;
      matchingQueue.pairDirect(room.hostId, room.guestId);

      const tempSessionId = `room-${room.code}-${Date.now()}`;
      io.to(room.hostId).emit('match-found', {
        partnerId: room.guestId,
        sessionId: tempSessionId,
        partnerCountry: 'Invite',
        room: true,
        roomCode: room.code,
      });
      io.to(room.guestId).emit('match-found', {
        partnerId: room.hostId,
        sessionId: tempSessionId,
        partnerCountry: 'Invite',
        room: true,
        roomCode: room.code,
      });

      socket.emit('room-joined', { code: room.code });
    } catch (error) {
      console.error('join-room error:', error);
      socket.emit('room-error', { message: 'Failed to join room' });
    }
  });

  socket.on('leave-room', () => {
    const left = inviteRooms.leave(socket.id);
    if (left?.otherId) {
      io.to(left.otherId).emit('partner-disconnected', {
        reason: left.closed ? 'Host closed the room' : 'Friend left the room',
      });
      matchingQueue.cleanup(left.otherId);
    }
    matchingQueue.cleanup(socket.id);
    socket.emit('room-left');
  });

  // WebRTC Signaling: Answer
  socket.on('webrtc-answer', ({ answer, to }) => {
    console.log(`📞 Sending answer from ${socket.id} to ${to}`);
    io.to(to).emit('webrtc-answer', { answer, from: socket.id });
  });

  // WebRTC Signaling: ICE Candidate
  socket.on('ice-candidate', ({ candidate, to }) => {
    io.to(to).emit('ice-candidate', { candidate, from: socket.id });
  });

  // Text chat message
  socket.on('chat-message', async ({ message, to }) => {
    try {
      const partnerId = matchingQueue.getPartner(socket.id);
      
      if (partnerId && partnerId === to) {
        io.to(to).emit('chat-message', {
          message,
          from: socket.id,
          timestamp: Date.now()
        });

        // Update message count
        await ChatSession.findOneAndUpdate(
          {
            $or: [
              { user1: socket.id, user2: to },
              { user1: to, user2: socket.id }
            ],
            endTime: null
          },
          { $inc: { messagesCount: 1 } }
        );
      }
    } catch (error) {
      console.error('Error sending message:', error);
    }
  });

  // Guest report (no auth) — works with socket-upserted users
  socket.on('report-partner', async ({ reason, details }) => {
    try {
      const partnerSocketId = matchingQueue.getPartner(socket.id);
      const cleanReason = String(reason || '').trim().slice(0, 120);
      if (!partnerSocketId || !cleanReason) {
        socket.emit('report-result', {
          success: false,
          message: 'No active partner to report'
        });
        return;
      }

      let reporter = await User.findOne({ socketId: socket.id });
      if (!reporter) {
        reporter = await User.create({
          socketId: socket.id,
          displayName: 'Anonymous',
          isOnline: true
        });
      }

      let reportedUser = await User.findOne({ socketId: partnerSocketId });
      if (!reportedUser) {
        reportedUser = await User.create({
          socketId: partnerSocketId,
          displayName: 'Anonymous',
          isOnline: true
        });
      }

      if (reporter._id.equals(reportedUser._id)) {
        socket.emit('report-result', {
          success: false,
          message: 'Invalid report target'
        });
        return;
      }

      const existingReport = await Report.findOne({
        reporter: reporter._id,
        reportedUser: reportedUser._id,
        createdAt: { $gte: new Date(Date.now() - 60 * 60 * 1000) }
      });

      if (existingReport) {
        socket.emit('report-result', {
          success: false,
          message: 'You already reported this user recently'
        });
        // Still disconnect them
      } else {
        const report = await Report.create({
          reporter: reporter._id,
          reportedUser: reportedUser._id,
          reason: cleanReason,
          details: details ? String(details).slice(0, 1000) : undefined
        });

        reportedUser.reportCount = (reportedUser.reportCount || 0) + 1;
        reportedUser.lastReportedAt = new Date();

        const REPORT_THRESHOLD = parseInt(process.env.REPORT_THRESHOLD || '3', 10);
        const BAN_DURATION_HOURS = parseInt(process.env.BAN_DURATION_HOURS || '360', 10);
        const BAN_DURATION_MS = BAN_DURATION_HOURS * 60 * 60 * 1000;
        const HARSH_REPORT_THRESHOLD = parseInt(process.env.HARSH_REPORT_THRESHOLD || '20', 10);
        const HARSH_BAN_DURATION_HOURS = parseInt(
          process.env.HARSH_BAN_DURATION_HOURS || `${BAN_DURATION_HOURS}`,
          10
        );
        const HARSH_BAN_DURATION_MS = HARSH_BAN_DURATION_HOURS * 60 * 60 * 1000;

        const reasonKey = cleanReason.toLowerCase();
        const hitHarshThreshold = reportedUser.reportCount >= HARSH_REPORT_THRESHOLD;
        const hitStandardThreshold =
          reportedUser.reportCount >= REPORT_THRESHOLD || reasonKey.includes('explicit');

        let autoBanned = false;
        if (hitHarshThreshold || hitStandardThreshold) {
          const durationMs = hitHarshThreshold ? HARSH_BAN_DURATION_MS : BAN_DURATION_MS;
          reportedUser.bannedUntil = new Date(Date.now() + durationMs);
          reportedUser.banReason = hitHarshThreshold
            ? `Auto-ban: ${reportedUser.reportCount} community reports`
            : `Auto-ban triggered by user reports (${reportedUser.reportCount})`;
          reportedUser.banCount = (reportedUser.banCount || 0) + 1;
          autoBanned = true;
          report.autoResolved = true;
          report.status = 'reviewed';
          await report.save();
        }

        await reportedUser.save();

        socket.emit('report-result', {
          success: true,
          autoBanned,
          message: autoBanned
            ? 'Report submitted. User was temporarily suspended.'
            : 'Report submitted. Thanks for keeping Camify safer.'
        });
      }

      // End session + kick reported partner (same as skip)
      const partnerId = matchingQueue.cleanup(socket.id);
      if (partnerId) {
        io.to(partnerId).emit('partner-disconnected', {
          reason: 'Partner left'
        });
        await User.updateMany(
          { socketId: { $in: [socket.id, partnerId] } },
          { inChat: false, partnerId: null }
        );
        await endChatSession(socket.id, partnerId);
        matchingQueue.cleanup(partnerId);
      }

      socket.emit('partner-disconnected', { reason: 'Reported — finding next' });
    } catch (error) {
      console.error('Error reporting partner:', error);
      socket.emit('report-result', {
        success: false,
        message: 'Failed to submit report'
      });
    }
  });

  // Skip / Next partner
  socket.on('skip-partner', async () => {
    try {
      const partnerId = matchingQueue.cleanup(socket.id);
      
      if (partnerId) {
        // Notify partner they were skipped
        io.to(partnerId).emit('partner-disconnected', {
          reason: 'Partner skipped'
        });

        // Update database
        await User.updateMany(
          { socketId: { $in: [socket.id, partnerId] } },
          { inChat: false, partnerId: null }
        );

        // End chat session
        await endChatSession(socket.id, partnerId);

        // Remove partner from queue too
        matchingQueue.cleanup(partnerId);
      }

      // Start new search for current user
      socket.emit('partner-disconnected', { reason: 'You skipped' });
      
      // Auto-restart search with delay
      setTimeout(() => {
        const result = matchingQueue.addToQueue(socket.id);
        if (result.matched) {
          const { user1, user2 } = result;
          
          // Same delay for skip reconnection
          io.to(user1).emit('searching', { message: 'Found someone! Connecting...' });
          io.to(user2).emit('searching', { message: 'Found someone! Connecting...' });
          
          setTimeout(async () => {
            await handleNewMatch(user1, user2);
          }, 2000);
        } else {
          socket.emit('searching', { message: 'Searching for someone...' });
        }
      }, 500);

    } catch (error) {
      console.error('Error skipping partner:', error);
    }
  });

  // Stop searching
  socket.on('stop-search', async () => {
    try {
      const partnerId = matchingQueue.cleanup(socket.id);
      
      if (partnerId) {
        io.to(partnerId).emit('partner-disconnected', {
          reason: 'Partner left'
        });
        await endChatSession(socket.id, partnerId);
      }

      await User.findOneAndUpdate(
        { socketId: socket.id },
        { inChat: false, partnerId: null }
      );

      socket.emit('search-stopped');
    } catch (error) {
      console.error('Error stopping search:', error);
    }
  });

  // Typing indicator
  socket.on('typing', ({ to, isTyping }) => {
    const partnerId = matchingQueue.getPartner(socket.id);
    if (partnerId && partnerId === to) {
      io.to(to).emit('partner-typing', { isTyping });
    }
  });

  // Disconnect
  socket.on('disconnect', async () => {
    try {
      activeConnections--;
      console.log(`🔌 Disconnected: ${socket.id} | Total: ${activeConnections}`);

      const roomLeft = inviteRooms.cleanup(socket.id);
      const partnerId = matchingQueue.cleanup(socket.id);
      const notifyId = partnerId || roomLeft?.otherId;

      if (notifyId) {
        io.to(notifyId).emit('partner-disconnected', {
          reason: 'Partner disconnected'
        });
        
        await User.findOneAndUpdate(
          { socketId: notifyId },
          { inChat: false, partnerId: null }
        );

        await endChatSession(socket.id, notifyId);
        if (roomLeft?.otherId && roomLeft.otherId !== partnerId) {
          matchingQueue.cleanup(roomLeft.otherId);
        }
      }

      // Remove from database
      await User.findOneAndDelete({ socketId: socket.id });

    } catch (error) {
      console.error('Error handling disconnect:', error);
    }
  });
});

// Helper function to end chat session
async function endChatSession(user1, user2) {
  try {
    const session = await ChatSession.findOne({
      $or: [
        { user1, user2 },
        { user1: user2, user2: user1 }
      ],
      endTime: null
    });

    if (session) {
      const duration = Math.floor((Date.now() - session.startTime) / 1000);
      session.endTime = Date.now();
      session.duration = duration;
      await session.save();

      // Update user stats
      await User.updateMany(
        { socketId: { $in: [user1, user2] } },
        { $inc: { totalChats: 1 } }
      );
    }
  } catch (error) {
    console.error('Error ending chat session:', error);
  }
}

// Helper function to handle new match
async function handleNewMatch(user1, user2) {
  try {
    await User.updateMany(
      { socketId: { $in: [user1, user2] } },
      { inChat: true }
    );

    await User.findOneAndUpdate(
      { socketId: user1 },
      { partnerId: user2 }
    );

    await User.findOneAndUpdate(
      { socketId: user2 },
      { partnerId: user1 }
    );

    const session = await ChatSession.create({
      user1,
      user2,
      startTime: Date.now()
    });

    // Get partner countries
    const user1Data = await User.findOne({ socketId: user1 });
    const user2Data = await User.findOne({ socketId: user2 });

    io.to(user1).emit('match-found', { 
      partnerId: user2, 
      sessionId: session._id,
      partnerCountry: user2Data?.country || 'Unknown'
    });
    io.to(user2).emit('match-found', { 
      partnerId: user1, 
      sessionId: session._id,
      partnerCountry: user1Data?.country || 'Unknown'
    });
  } catch (error) {
    console.error('Error handling new match:', error);
  }
}

// Start server
const PORT = process.env.PORT || 5001;
httpServer.listen(PORT, () => {
  console.log(`
╔════════════════════════════════════════╗
║   ✨ VibeChat Server Running ✨      ║
║   Port: ${PORT}                        ║
║   Environment: ${process.env.NODE_ENV || 'development'}            ║
║   Max Connections: ${MAX_CONNECTIONS}             ║
║   Status: Ready to vibe! 🎉          ║
╚════════════════════════════════════════╝
  `);
});

// Graceful shutdown
process.on('SIGTERM', () => {
  console.log('SIGTERM signal received: closing HTTP server');
  httpServer.close(() => {
    console.log('HTTP server closed');
    process.exit(0);
  });
});

