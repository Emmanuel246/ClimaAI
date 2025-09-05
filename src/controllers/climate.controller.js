import { fetchCurrentConditions, getLatestConditions } from '../services/climate.service.js';

export async function getCurrent(req, res, next) {
  try {
    const { lat, lon, city, country } = getLoc(req);
    const data = await fetchCurrentConditions({ lat, lon, city, country });
    res.json(data);
  } catch (e) { next(e); }
}

export async function getLatest(req, res, next) {
  try {
    const { lat, lon } = getLoc(req);
    const data = await getLatestConditions({ lat, lon });
    res.json(data);
  } catch (e) { next(e); }
}

function getLoc(req) {
  const lat = parseFloat(req.query.lat ?? process.env.DEFAULT_LAT);
  const lon = parseFloat(req.query.lon ?? process.env.DEFAULT_LON);
  const city = req.query.city ?? process.env.DEFAULT_CITY;
  const country = req.query.country ?? process.env.DEFAULT_COUNTRY;
  return { lat, lon, city, country };
}
