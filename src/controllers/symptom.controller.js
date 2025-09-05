import SymptomLog from "../models/SymptomLog.js";
import ClimateData from "../models/ClimateData.js";
import User from "../models/User.js";
import { asyncHandler } from "../utils/errors.js";
import { NotFoundError, ValidationError } from "../utils/errors.js";

export const createLog = asyncHandler(async (req, res) => {
  const { symptoms, notes, date, medication, environment } = req.body;

  // Create symptom log with enhanced data
  const logData = {
    userId: req.user.id,
    symptoms,
    notes,
    medication,
    environment,
    ...(date && { date: new Date(date) }),
  };

  const doc = await SymptomLog.create(logData);

  // Populate user reference for response
  await doc.populate("userId", "name email");

  // Check if this is a severe case requiring follow-up
  if (doc.followUpRequired) {
    // Could trigger notifications here
    console.log(
      `Severe symptom log created for user ${req.user.id} - follow-up required`
    );
  }

  res.status(201).json({
    success: true,
    message: "Symptom log created successfully",
    data: doc,
  });
});

export const getHistory = asyncHandler(async (req, res) => {
  const {
    page = 1,
    limit = 50,
    severity,
    startDate,
    endDate,
    hasAttack,
    sortBy = "date",
    sortOrder = "desc",
  } = req.query;

  // Build query filters
  const query = { userId: req.user.id };

  if (severity) {
    query.severity = severity;
  }

  if (hasAttack !== undefined) {
    query["symptoms.attack"] = hasAttack === "true";
  }

  if (startDate || endDate) {
    query.date = {};
    if (startDate) query.date.$gte = new Date(startDate);
    if (endDate) query.date.$lte = new Date(endDate);
  }

  // Build sort object
  const sort = {};
  sort[sortBy] = sortOrder === "desc" ? -1 : 1;

  // Execute query with pagination
  const skip = (parseInt(page) - 1) * parseInt(limit);
  const [logs, total] = await Promise.all([
    SymptomLog.find(query)
      .sort(sort)
      .skip(skip)
      .limit(parseInt(limit))
      .populate("userId", "name"),
    SymptomLog.countDocuments(query),
  ]);

  // Calculate pagination info
  const totalPages = Math.ceil(total / parseInt(limit));
  const hasNextPage = parseInt(page) < totalPages;
  const hasPrevPage = parseInt(page) > 1;

  res.json({
    success: true,
    data: {
      logs,
      pagination: {
        currentPage: parseInt(page),
        totalPages,
        totalLogs: total,
        hasNextPage,
        hasPrevPage,
        limit: parseInt(limit),
      },
    },
  });
});

export const getLogById = asyncHandler(async (req, res) => {
  const { id } = req.params;

  const log = await SymptomLog.findOne({
    _id: id,
    userId: req.user.id,
  }).populate("userId", "name email");

  if (!log) {
    throw new NotFoundError("Symptom log not found");
  }

  res.json({
    success: true,
    data: log,
  });
});

export const updateLog = asyncHandler(async (req, res) => {
  const { id } = req.params;
  const updates = req.body;

  // Remove fields that shouldn't be updated
  delete updates.userId;
  delete updates.createdAt;
  delete updates.updatedAt;

  const log = await SymptomLog.findOneAndUpdate(
    { _id: id, userId: req.user.id },
    updates,
    { new: true, runValidators: true }
  ).populate("userId", "name email");

  if (!log) {
    throw new NotFoundError("Symptom log not found");
  }

  res.json({
    success: true,
    message: "Symptom log updated successfully",
    data: log,
  });
});

export const deleteLog = asyncHandler(async (req, res) => {
  const { id } = req.params;

  const log = await SymptomLog.findOneAndDelete({
    _id: id,
    userId: req.user.id,
  });

  if (!log) {
    throw new NotFoundError("Symptom log not found");
  }

  res.json({
    success: true,
    message: "Symptom log deleted successfully",
  });
});

// Enhanced insights with multiple correlations
export const getInsights = asyncHandler(async (req, res) => {
  const { days = 30 } = req.query;
  const startDate = new Date();
  startDate.setDate(startDate.getDate() - parseInt(days));

  // Get user's symptom logs
  const logs = await SymptomLog.find({
    userId: req.user.id,
    date: { $gte: startDate },
  }).sort({ date: -1 });

  // Get climate data for the same period
  const climates = await ClimateData.find({
    createdAt: { $gte: startDate },
  }).sort({ createdAt: -1 });

  // Calculate various insights
  const insights = {
    summary: {
      totalLogs: logs.length,
      attackCount: logs.filter((l) => l.symptoms.attack).length,
      averageWheezing:
        logs.reduce((sum, l) => sum + l.symptoms.wheezing, 0) / logs.length ||
        0,
      averageCough:
        logs.reduce((sum, l) => sum + l.symptoms.cough, 0) / logs.length || 0,
      severityDistribution: {
        mild: logs.filter((l) => l.severity === "mild").length,
        moderate: logs.filter((l) => l.severity === "moderate").length,
        severe: logs.filter((l) => l.severity === "severe").length,
      },
    },
    correlations: {},
    trends: {},
    recommendations: [],
  };

  // AQI correlation
  let highAqiAttacks = 0,
    totalAttacks = 0;
  let aqiCorrelationData = [];

  logs.forEach((log) => {
    if (log.symptoms.attack) {
      totalAttacks++;
      // Find nearest climate record (within 4 hours)
      const nearest = climates.find(
        (c) =>
          Math.abs(new Date(c.createdAt) - new Date(log.date)) < 4 * 3600 * 1000
      );
      if (nearest) {
        aqiCorrelationData.push({ aqi: nearest.AQI, attack: true });
        if (nearest.AQI >= 100) highAqiAttacks++;
      }
    }
  });

  insights.correlations.aqi = {
    highAqiAttackPercentage: totalAttacks
      ? Math.round((100 * highAqiAttacks) / totalAttacks)
      : 0,
    message: totalAttacks
      ? `${Math.round(
          (100 * highAqiAttacks) / totalAttacks
        )}% of your attacks occurred when AQI was ≥ 100`
      : "No attacks recorded in this period",
  };

  // Trigger analysis
  const triggerCounts = {};
  logs.forEach((log) => {
    if (log.symptoms.triggers && log.symptoms.triggers.length > 0) {
      log.symptoms.triggers.forEach((trigger) => {
        triggerCounts[trigger] = (triggerCounts[trigger] || 0) + 1;
      });
    }
  });

  insights.correlations.triggers = {
    mostCommon: Object.entries(triggerCounts)
      .sort(([, a], [, b]) => b - a)
      .slice(0, 5)
      .map(([trigger, count]) => ({
        trigger,
        count,
        percentage: Math.round((100 * count) / logs.length),
      })),
  };

  // Time-based patterns
  const hourlyPattern = new Array(24).fill(0);
  const dailyPattern = new Array(7).fill(0);

  logs.forEach((log) => {
    const date = new Date(log.date);
    hourlyPattern[date.getHours()]++;
    dailyPattern[date.getDay()]++;
  });

  insights.trends.timePatterns = {
    peakHours: hourlyPattern
      .map((count, hour) => ({ hour, count }))
      .sort((a, b) => b.count - a.count)
      .slice(0, 3),
    peakDays: [
      "Sunday",
      "Monday",
      "Tuesday",
      "Wednesday",
      "Thursday",
      "Friday",
      "Saturday",
    ]
      .map((day, index) => ({ day, count: dailyPattern[index] }))
      .sort((a, b) => b.count - a.count)
      .slice(0, 3),
  };

  // Generate recommendations
  if (insights.correlations.aqi.highAqiAttackPercentage > 50) {
    insights.recommendations.push({
      type: "environmental",
      priority: "high",
      message:
        "Consider checking air quality before going outside and wearing a mask on high AQI days",
    });
  }

  if (insights.correlations.triggers.mostCommon.length > 0) {
    const topTrigger = insights.correlations.triggers.mostCommon[0];
    insights.recommendations.push({
      type: "trigger_management",
      priority: "medium",
      message: `Your most common trigger is ${topTrigger.trigger}. Consider discussing avoidance strategies with your healthcare provider`,
    });
  }

  if (insights.summary.attackCount > 2) {
    insights.recommendations.push({
      type: "medical",
      priority: "high",
      message:
        "You've had multiple attacks recently. Please consult with your healthcare provider about your asthma management plan",
    });
  }

  res.json({
    success: true,
    data: insights,
    period: {
      days: parseInt(days),
      startDate,
      endDate: new Date(),
    },
  });
});

// Get symptom statistics
export const getStats = asyncHandler(async (req, res) => {
  const { period = "30d" } = req.query;

  // Parse period (30d, 7d, 1y, etc.)
  const periodMatch = period.match(/^(\d+)([dmy])$/);
  if (!periodMatch) {
    throw new ValidationError(
      'Invalid period format. Use format like "30d", "7d", "1y"'
    );
  }

  const [, amount, unit] = periodMatch;
  const startDate = new Date();

  switch (unit) {
    case "d":
      startDate.setDate(startDate.getDate() - parseInt(amount));
      break;
    case "m":
      startDate.setMonth(startDate.getMonth() - parseInt(amount));
      break;
    case "y":
      startDate.setFullYear(startDate.getFullYear() - parseInt(amount));
      break;
  }

  // Aggregate statistics
  const stats = await SymptomLog.aggregate([
    {
      $match: {
        userId: req.user.id,
        date: { $gte: startDate },
      },
    },
    {
      $group: {
        _id: null,
        totalLogs: { $sum: 1 },
        totalAttacks: { $sum: { $cond: ["$symptoms.attack", 1, 0] } },
        avgWheezing: { $avg: "$symptoms.wheezing" },
        avgCough: { $avg: "$symptoms.cough" },
        avgBreathlessness: { $avg: "$symptoms.breathlessness" },
        avgChestTightness: { $avg: "$symptoms.chestTightness" },
        severeCases: {
          $sum: { $cond: [{ $eq: ["$severity", "severe"] }, 1, 0] },
        },
        moderateCases: {
          $sum: { $cond: [{ $eq: ["$severity", "moderate"] }, 1, 0] },
        },
        mildCases: { $sum: { $cond: [{ $eq: ["$severity", "mild"] }, 1, 0] } },
      },
    },
  ]);

  const result = stats[0] || {
    totalLogs: 0,
    totalAttacks: 0,
    avgWheezing: 0,
    avgCough: 0,
    avgBreathlessness: 0,
    avgChestTightness: 0,
    severeCases: 0,
    moderateCases: 0,
    mildCases: 0,
  };

  res.json({
    success: true,
    data: {
      ...result,
      period: {
        amount: parseInt(amount),
        unit,
        startDate,
        endDate: new Date(),
      },
    },
  });
});
