import app from './app.js';
import { connectDB } from './config/db.js';

const port = process.env.PORT || 4000;

connectDB().then(() => {
  app.listen(port, () => {
    console.log(`ClimaHealth AI API running on http://localhost:${port}`);
  });
}).catch((err) => {
  console.error("DB connection failed", err);
  process.exit(1);
});
