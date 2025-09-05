import mongoose from 'mongoose';

const climateDataSchema = new mongoose.Schema({
  location: {
    city: String, country: String, lat: Number, lon: Number
  },
  date: { type: Date, default: Date.now },
  AQI: Number,
  temperature: Number,
  humidity: Number,
  pollen: Number,
  riskLevel: { type: String, enum: ['Low','Moderate','High'], default: 'Low' },
  raw: Object
}, { timestamps: true });

export default mongoose.model('ClimateData', climateDataSchema);
