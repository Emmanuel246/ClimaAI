export function computeRisk({ AQI = 0, pollen = 0, temperature = 25, humidity = 60 }) {
  let score = 0;
  if (AQI >= 150) score += 2;
  else if (AQI >= 100) score += 1;

  if (pollen >= 3) score += 2;
  else if (pollen >= 2) score += 1;

  if (temperature >= 35 || temperature <= 15) score += 1;
  if (humidity <= 30 || humidity >= 80) score += 1;

  if (score >= 4) return 'High';
  if (score >= 2) return 'Moderate';
  return 'Low';
}
