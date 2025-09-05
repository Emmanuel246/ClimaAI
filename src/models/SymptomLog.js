import mongoose from "mongoose";

const symptomLogSchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: [true, "User ID is required"],
      index: true,
    },
    date: {
      type: Date,
      default: Date.now,
      validate: {
        validator: function (value) {
          return value <= new Date();
        },
        message: "Date cannot be in the future",
      },
    },
    symptoms: {
      wheezing: {
        type: Number,
        required: [true, "Wheezing level is required"],
        min: [0, "Wheezing level must be between 0 and 10"],
        max: [10, "Wheezing level must be between 0 and 10"],
        validate: {
          validator: Number.isInteger,
          message: "Wheezing level must be an integer",
        },
      },
      cough: {
        type: Number,
        required: [true, "Cough level is required"],
        min: [0, "Cough level must be between 0 and 10"],
        max: [10, "Cough level must be between 0 and 10"],
        validate: {
          validator: Number.isInteger,
          message: "Cough level must be an integer",
        },
      },
      breathlessness: {
        type: Number,
        min: [0, "Breathlessness level must be between 0 and 10"],
        max: [10, "Breathlessness level must be between 0 and 10"],
        validate: {
          validator: function (value) {
            return value === undefined || Number.isInteger(value);
          },
          message: "Breathlessness level must be an integer",
        },
      },
      chestTightness: {
        type: Number,
        min: [0, "Chest tightness level must be between 0 and 10"],
        max: [10, "Chest tightness level must be between 0 and 10"],
        validate: {
          validator: function (value) {
            return value === undefined || Number.isInteger(value);
          },
          message: "Chest tightness level must be an integer",
        },
      },
      attack: {
        type: Boolean,
        required: [true, "Attack status is required"],
        default: false,
      },
      triggers: [
        {
          type: String,
          enum: {
            values: [
              "pollen",
              "dust",
              "smoke",
              "exercise",
              "stress",
              "weather",
              "food",
              "medication",
              "pollution",
              "pet_dander",
              "mold",
              "other",
            ],
            message: "Invalid trigger type",
          },
        },
      ],
      peakFlow: {
        type: Number,
        min: [50, "Peak flow must be at least 50"],
        max: [800, "Peak flow cannot exceed 800"],
      },
    },
    medication: {
      relieverUsed: { type: Boolean, default: false },
      relieverDoses: {
        type: Number,
        min: [0, "Reliever doses cannot be negative"],
        max: [20, "Reliever doses seems too high, please verify"],
      },
      controllerTaken: { type: Boolean, default: false },
      otherMedications: [String],
    },
    environment: {
      location: {
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
      indoorOutdoor: {
        type: String,
        enum: ["indoor", "outdoor", "mixed"],
      },
      activity: {
        type: String,
        enum: [
          "resting",
          "light_activity",
          "moderate_activity",
          "vigorous_activity",
          "sleeping",
        ],
      },
    },
    notes: {
      type: String,
      maxlength: [500, "Notes cannot exceed 500 characters"],
      trim: true,
    },
    severity: {
      type: String,
      enum: ["mild", "moderate", "severe"],
      default: function () {
        // Auto-calculate severity based on symptoms
        const avgSymptom =
          (this.symptoms.wheezing +
            this.symptoms.cough +
            (this.symptoms.breathlessness || 0) +
            (this.symptoms.chestTightness || 0)) /
          4;
        if (this.symptoms.attack || avgSymptom >= 7) return "severe";
        if (avgSymptom >= 4) return "moderate";
        return "mild";
      },
    },
    followUpRequired: {
      type: Boolean,
      default: function () {
        return this.symptoms.attack || this.severity === "severe";
      },
    },
  },
  {
    timestamps: true,
    toJSON: { virtuals: true },
    toObject: { virtuals: true },
  }
);

// Indexes for better query performance
symptomLogSchema.index({ userId: 1, date: -1 });
symptomLogSchema.index({ userId: 1, "symptoms.attack": 1 });
symptomLogSchema.index({ date: -1 });
symptomLogSchema.index({ severity: 1 });
symptomLogSchema.index({ followUpRequired: 1 });

// Virtual for overall symptom score
symptomLogSchema.virtual("overallScore").get(function () {
  const symptoms = this.symptoms;
  let score = symptoms.wheezing + symptoms.cough;
  if (symptoms.breathlessness) score += symptoms.breathlessness;
  if (symptoms.chestTightness) score += symptoms.chestTightness;
  if (symptoms.attack) score += 5; // Attack adds significant weight
  return Math.min(score, 10); // Cap at 10
});

// Virtual for risk level
symptomLogSchema.virtual("riskLevel").get(function () {
  if (this.symptoms.attack || this.overallScore >= 8) return "high";
  if (this.overallScore >= 5) return "medium";
  return "low";
});

// Pre-save middleware to auto-calculate fields
symptomLogSchema.pre("save", function (next) {
  // Auto-calculate severity if not set
  if (!this.severity) {
    const avgSymptom =
      (this.symptoms.wheezing +
        this.symptoms.cough +
        (this.symptoms.breathlessness || 0) +
        (this.symptoms.chestTightness || 0)) /
      4;
    if (this.symptoms.attack || avgSymptom >= 7) {
      this.severity = "severe";
    } else if (avgSymptom >= 4) {
      this.severity = "moderate";
    } else {
      this.severity = "mild";
    }
  }

  // Auto-set follow-up requirement
  this.followUpRequired = this.symptoms.attack || this.severity === "severe";

  next();
});

export default mongoose.model("SymptomLog", symptomLogSchema);
