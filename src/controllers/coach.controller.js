import { chatWithCoach } from '../services/ai.service.js';
import ClimateData from '../models/ClimateData.js';

export async function messageCoach(req, res, next) {
  try {
    const userId = req.user.id;
    const userMessage = req.body.message || '';
    const { latitude, longitude } = req.body;
    
    const latest = await ClimateData.findOne({
      ...(latitude && longitude ? {
        location: {
          $near: {
            $geometry: {
              type: "Point",
              coordinates: [longitude, latitude]
            }
          }
        }
      } : {})
    }).sort({ createdAt: -1 });

    const context = latest ? {
      AQI: latest.AQI,
      temperature: latest.temperature,
      humidity: latest.humidity,
      pollen: latest.pollen,
      riskLevel: latest.riskLevel,
      location: {
        latitude: latitude || latest.location?.coordinates[1],
        longitude: longitude || latest.location?.coordinates[0]
      }
    } : {};

    const reply = await chatWithCoach({ userId, userMessage, context });
    res.json({ reply });
  } catch (e) { next(e); }
}
