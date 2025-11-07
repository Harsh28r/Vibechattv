import express from 'express';
import User from '../models/User.js';
import Report from '../models/Report.js';
import { protect } from '../middleware/auth.js';

const router = express.Router();

const REPORT_THRESHOLD = parseInt(process.env.REPORT_THRESHOLD || '3', 10);
const BAN_DURATION_HOURS = parseInt(process.env.BAN_DURATION_HOURS || '360', 10);
const BAN_DURATION_MS = BAN_DURATION_HOURS * 60 * 60 * 1000;
const HARSH_REPORT_THRESHOLD = parseInt(process.env.HARSH_REPORT_THRESHOLD || '20', 10);
const HARSH_BAN_DURATION_HOURS = parseInt(
  process.env.HARSH_BAN_DURATION_HOURS || `${BAN_DURATION_HOURS}`,
  10
);
const HARSH_BAN_DURATION_MS = HARSH_BAN_DURATION_HOURS * 60 * 60 * 1000;

// POST /api/moderation/report
router.post('/report', protect, async (req, res) => {
  try {
    const { reportedUserId, reportedSocketId, reason, details, evidenceUrl } = req.body;

    if ((!reportedUserId && !reportedSocketId) || !reason) {
      return res.status(400).json({
        success: false,
        message: 'reportedUserId or reportedSocketId and reason are required'
      });
    }

    if (reportedUserId && reportedUserId === String(req.user._id)) {
      return res.status(400).json({
        success: false,
        message: 'You cannot report yourself'
      });
    }

    let reportedUser = null;

    if (reportedUserId) {
      reportedUser = await User.findById(reportedUserId);
    } else if (reportedSocketId) {
      reportedUser = await User.findOne({ socketId: reportedSocketId });
    }

    if (!reportedUser) {
      return res.status(404).json({
        success: false,
        message: 'Reported user not found'
      });
    }

    if (reportedUser._id.equals(req.user._id)) {
      return res.status(400).json({
        success: false,
        message: 'You cannot report yourself'
      });
    }

    // Prevent duplicate spamming within a short window
    const existingReport = await Report.findOne({
      reporter: req.user._id,
      reportedUser: reportedUser._id,
      createdAt: { $gte: new Date(Date.now() - 60 * 60 * 1000) }
    });

    if (existingReport) {
      return res.status(429).json({
        success: false,
        message: 'You already reported this user recently. Thank you for your vigilance.'
      });
    }

    const report = await Report.create({
      reporter: req.user._id,
      reportedUser: reportedUser._id,
      reason,
      details,
      evidenceUrl
    });

    // Update reported user stats
    reportedUser.reportCount = (reportedUser.reportCount || 0) + 1;
    reportedUser.lastReportedAt = new Date();

    let autoBanned = false;
    const reasonKey = reason.toLowerCase();
    const hitHarshThreshold = reportedUser.reportCount >= HARSH_REPORT_THRESHOLD;
    const hitStandardThreshold = reportedUser.reportCount >= REPORT_THRESHOLD || reasonKey.includes('explicit');

    if (hitHarshThreshold || hitStandardThreshold) {
      const durationMs = hitHarshThreshold ? HARSH_BAN_DURATION_MS : BAN_DURATION_MS;
      reportedUser.bannedUntil = new Date(Date.now() + durationMs);
      reportedUser.banReason = hitHarshThreshold
        ? `Auto-ban: ${reportedUser.reportCount} community reports`
        : `Auto-ban triggered by user reports (${reportedUser.reportCount})`;
      reportedUser.banCount = (reportedUser.banCount || 0) + 1;
      autoBanned = true;
    }

    await reportedUser.save();

    if (autoBanned) {
      report.autoResolved = true;
      report.status = 'reviewed';
      await report.save();
    }

    res.json({
      success: true,
      data: {
        reportId: report._id,
        autoBanned,
        bannedUntil: autoBanned ? reportedUser.bannedUntil : null,
        harshBan: hitHarshThreshold
      },
      message: autoBanned
        ? hitHarshThreshold
          ? 'Report submitted. The account exceeded community report limits and has been temporarily suspended.'
          : 'Report submitted. The user has been temporarily banned pending review.'
        : 'Report submitted successfully. Our moderation team will review it shortly.'
    });
  } catch (error) {
    console.error('Error creating report:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to submit report',
      error: error.message
    });
  }
});

// GET /api/moderation/ban-status
router.get('/ban-status', protect, async (req, res) => {
  try {
    const user = await User.findById(req.user._id).select('bannedUntil banReason reportCount banCount');

    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found'
      });
    }

    const isBanned = Boolean(user.bannedUntil && user.bannedUntil.getTime() > Date.now());

    res.json({
      success: true,
      data: {
        isBanned,
        bannedUntil: user.bannedUntil,
        banReason: isBanned ? user.banReason : null,
        reportCount: user.reportCount || 0,
        banCount: user.banCount || 0
      }
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Failed to fetch ban status',
      error: error.message
    });
  }
});

export default router;

