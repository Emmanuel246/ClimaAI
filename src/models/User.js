import mongoose from "mongoose";

const userSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: [true, "Name is required"],
      trim: true,
      minlength: [2, "Name must be at least 2 characters long"],
      maxlength: [50, "Name cannot exceed 50 characters"],
    },
    email: {
      type: String,
      required: [true, "Email is required"],
      unique: true,
      lowercase: true,
      trim: true,
      match: [
        /^\w+([.-]?\w+)*@\w+([.-]?\w+)*(\.\w{2,3})+$/,
        "Please provide a valid email",
      ],
    },
    passwordHash: {
      type: String,
      required: true,
      select: false, // Don't include in queries by default
    },
    role: {
      type: String,
      enum: {
        values: ["patient", "caregiver", "healthcare_provider", "admin"],
        message:
          "Role must be one of: patient, caregiver, healthcare_provider, admin",
      },
      default: "patient",
    },
    location: {
      city: { type: String, maxlength: 100 },
      country: { type: String, maxlength: 100 },
      lat: {
        type: Number,
        min: [-90, "Latitude must be between -90 and 90"],
        max: [90, "Latitude must be between -90 and 90"],
      },
      lon: {
        type: Number,
        min: [-180, "Longitude must be between -180 and 180"],
        max: [180, "Longitude must be between -180 and 180"],
      },
    },
    preferences: {
      language: {
        type: String,
        enum: ["en", "es", "fr", "de"],
        default: "en",
      },
      notifications: { type: Boolean, default: true },
      units: {
        type: String,
        enum: ["metric", "imperial"],
        default: "metric",
      },
      riskAlerts: { type: Boolean, default: true },
      dailyReminders: { type: Boolean, default: true },
    },
    profile: {
      dateOfBirth: Date,
      gender: {
        type: String,
        enum: ["male", "female", "other", "prefer_not_to_say"],
      },
      asthmaType: {
        type: String,
        enum: [
          "allergic",
          "non_allergic",
          "occupational",
          "exercise_induced",
          "other",
        ],
      },
      severityLevel: {
        type: String,
        enum: [
          "mild_intermittent",
          "mild_persistent",
          "moderate_persistent",
          "severe_persistent",
        ],
      },
      triggers: [
        {
          type: String,
          enum: [
            "pollen",
            "dust_mites",
            "pet_dander",
            "mold",
            "smoke",
            "pollution",
            "exercise",
            "stress",
            "weather",
            "food",
            "medication",
            "other",
          ],
        },
      ],
      medications: [
        {
          name: String,
          type: {
            type: String,
            enum: ["controller", "reliever", "combination"],
          },
          dosage: String,
          frequency: String,
        },
      ],
      emergencyContact: {
        name: String,
        phone: String,
        relationship: String,
      },
    },
    isActive: { type: Boolean, default: true },
    isEmailVerified: { type: Boolean, default: false },
    lastLogin: Date,
    loginAttempts: { type: Number, default: 0 },
    lockUntil: Date,
  },
  {
    timestamps: true,
    toJSON: { virtuals: true },
    toObject: { virtuals: true },
  }
);

// Indexes for better query performance
userSchema.index({ email: 1 });
userSchema.index({ "location.lat": 1, "location.lon": 1 });
userSchema.index({ createdAt: -1 });
userSchema.index({ lastLogin: -1 });

// Virtual for account lock status
userSchema.virtual("isLocked").get(function () {
  return !!(this.lockUntil && this.lockUntil > Date.now());
});

// Pre-save middleware to handle login attempts
userSchema.pre("save", function (next) {
  // Only increment login attempts if it was modified
  if (!this.isModified("loginAttempts") && !this.isNew) return next();

  // If we have a previous lock that has expired, restart at 1
  if (this.lockUntil && this.lockUntil < Date.now()) {
    return this.updateOne(
      {
        $unset: { lockUntil: 1 },
        $set: { loginAttempts: 1 },
      },
      next
    );
  }

  next();
});

// Method to increment login attempts
userSchema.methods.incLoginAttempts = function () {
  // If we have a previous lock that has expired, restart at 1
  if (this.lockUntil && this.lockUntil < Date.now()) {
    return this.updateOne({
      $unset: { lockUntil: 1 },
      $set: { loginAttempts: 1 },
    });
  }

  const updates = { $inc: { loginAttempts: 1 } };

  // Lock account after 5 failed attempts for 2 hours
  if (this.loginAttempts + 1 >= 5 && !this.isLocked) {
    updates.$set = { lockUntil: Date.now() + 2 * 60 * 60 * 1000 }; // 2 hours
  }

  return this.updateOne(updates);
};

// Method to reset login attempts
userSchema.methods.resetLoginAttempts = function () {
  return this.updateOne({
    $unset: { loginAttempts: 1, lockUntil: 1 },
  });
};

export default mongoose.model("User", userSchema);
