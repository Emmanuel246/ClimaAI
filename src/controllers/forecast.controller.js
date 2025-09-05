import { todayForecast } from '../services/forecast.service.js';

export async function getToday(req, res, next) {
  try {
    const lat = parseFloat(req.query.lat ?? process.env.DEFAULT_LAT);
    const lon = parseFloat(req.query.lon ?? process.env.DEFAULT_LON);
    const city = req.query.city ?? process.env.DEFAULT_CITY;
    const country = req.query.country ?? process.env.DEFAULT_COUNTRY;

    const data = await todayForecast({ lat, lon, city, country, compute: req.query.compute === 'true' });
    res.json(data);
  } catch (e) { next(e); }
}
