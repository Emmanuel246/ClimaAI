import ClimateData from '../models/ClimateData.js';
import { computeRisk } from '../utils/risk.js';

export async function todayForecast({ lat, lon, city, country, compute }) {
  // Use latest cached, or compute
  let latest = await ClimateData.findOne({ 'location.lat': lat, 'location.lon': lon })
    .sort({ createdAt: -1 });

  if (!latest || compute) {
    // delegate to climate.service to fetch live
    const { fetchCurrentConditions } = await import('./climate.service.js');
    latest = await fetchCurrentConditions({ lat, lon, city, country });
  }
  return latest;
}
