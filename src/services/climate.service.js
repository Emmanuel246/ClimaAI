import axios from 'axios';
import ClimateData from '../models/ClimateData.js';
import { computeRisk } from '../utils/risk.js';

function estimatePollenFromWeather(temperature, humidity) {
  if (!temperature || !humidity) return 0;
  let risk = 0;
  if (temperature >= 15 && temperature <= 25) risk += 2;
  else if (temperature > 25 && temperature <= 30) risk += 1.5;
  else if (temperature > 30 || temperature < 10) risk += 0.5;
  if (humidity >= 30 && humidity <= 50) risk += 2;
  else if (humidity > 50 && humidity <= 70) risk += 1;
  else if (humidity > 70) risk += 0.5;
  return Math.min(5, risk);
}

export async function fetchCurrentConditions({ lat, lon, city, country }) {
  const owKey = process.env.OPENWEATHER_API_KEY;
  const owUrl = `https://api.openweathermap.org/data/2.5/weather?lat=${lat}&lon=${lon}&appid=${owKey}&units=metric`;
  const aqToken = process.env.AQICN_TOKEN;
  const aqiUrl = `https://api.waqi.info/feed/geo:${lat};${lon}/?token=${aqToken}`;

  let temperature = null, humidity = null, AQI = null, pollen = null;
  let raw = {};

  try {
    const [ow, aqi] = await Promise.all([
      axios.get(owUrl),
      axios.get(aqiUrl)
    ]);
    temperature = ow.data?.main?.temp ?? null;
    humidity = ow.data?.main?.humidity ?? null;
    AQI = aqi.data?.data?.aqi ?? null;
    raw.weather = ow.data;
    raw.aqi = aqi.data;

    const pollenKey = process.env.POLLEN_API_KEY;
    if (pollenKey) {
      try {
        const pollenUrl = `https://api.ambeedata.com/latest/pollen/by-lat-lng?lat=${lat}&lng=${lon}`;
        const pollenData = await axios.get(pollenUrl, { headers: { 'x-api-key': pollenKey } });
        const pollenCounts = pollenData.data?.data?.[0] ?? {};
        const totalRisk = (pollenCounts.grass_pollen ?? 0) + 
                       (pollenCounts.tree_pollen ?? 0) + 
                       (pollenCounts.weed_pollen ?? 0);
        pollen = totalRisk / 3;
        raw.pollen = pollenData.data;
      } catch (pollenError) {
        console.warn('Pollen API fetch failed:', pollenError.message);
        pollen = estimatePollenFromWeather(temperature, humidity);
        raw.pollen = { estimated: true, value: pollen };
      }
    } else {
      pollen = estimatePollenFromWeather(temperature, humidity);
      raw.pollen = { estimated: true, value: pollen };
    }
  } catch (e) {
    console.warn('API fetch failed', e.message);
  }

  const riskLevel = computeRisk({ AQI, pollen, temperature, humidity });

  const doc = await ClimateData.create({
    location: { lat, lon, city, country },
    AQI, temperature, humidity, pollen, riskLevel, raw
  });

  return doc;
}

export async function getLatestConditions({ lat, lon }) {
  return ClimateData.findOne({ 'location.lat': lat, 'location.lon': lon })
    .sort({ createdAt: -1 });
}
