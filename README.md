# ClimaHealth AI Backend

A comprehensive Node.js + MongoDB backend service for the ClimaHealth AI platform, designed to help asthma patients proactively manage their condition through intelligent monitoring, symptom tracking, and personalized AI coaching.

## 🌟 Features

### Core Functionality

- **Advanced Symptom Tracking**: Multi-dimensional symptom logging with severity assessment and auto-calculated risk levels
- **Environmental Monitoring**: Real-time air quality, weather, and pollen data integration with risk forecasting
- **AI-Powered Coaching**: Personalized health advice based on user data and environmental conditions
- **Comprehensive Analytics**: Correlation analysis between environmental factors and symptoms with actionable insights
- **Gamification System**: Reward-based engagement system with badges, points, and challenges

### Technical Features

- **Robust Authentication**: JWT-based auth with refresh tokens, account lockout, and security features
- **Input Validation**: Comprehensive Joi schema validation for all endpoints
- **Error Handling**: Structured error responses with detailed validation feedback
- **Database Optimization**: Indexed MongoDB schemas with virtual fields and aggregation pipelines
- **API Documentation**: Complete OpenAPI/Swagger documentation with examples
- **Testing Suite**: Unit, integration, and API tests with coverage reporting

## 🏗️ Architecture

```
┌─────────────────┐    ┌─────────────────┐    ┌─────────────────┐
│   Mobile App    │    │   Web Client    │    │  Admin Panel    │
└─────────┬───────┘    └─────────┬───────┘    └─────────┬───────┘
          │                      │                      │
          └──────────────────────┼──────────────────────┘
                                 │
                    ┌─────────────┴─────────────┐
                    │   ClimaHealth AI API      │
                    │   (Node.js + Express)     │
                    └─────────────┬─────────────┘
                                  │
          ┌───────────────────────┼───────────────────────┐
          │                       │                       │
┌─────────┴─────────┐   ┌─────────┴─────────┐   ┌─────────┴─────────┐
│   MongoDB Atlas   │   │  External APIs    │   │   Redis Cache     │
│   (Primary DB)    │   │  - OpenWeather    │   │   (Sessions)      │
│                   │   │  - AQI CN         │   │                   │
│                   │   │  - OpenAI         │   │                   │
└───────────────────┘   └───────────────────┘   └───────────────────┘
```

## 🚀 Quick Start

### Prerequisites

- **Node.js** 18+ and npm
- **MongoDB** 5.0+ (local or MongoDB Atlas)
- **External API Keys**:
  - OpenWeatherMap API key
  - AQICN token
  - OpenAI API key (optional)

### Installation

1. **Clone and Install**

   ```bash
   git clone <repository-url>
   cd climahealth-ai-backend
   npm install
   ```

2. **Environment Setup**

   ```bash
   cp config.env .env
   # Edit .env with your configuration
   ```

3. **Start Development Server**
   ```bash
   npm run dev
   ```

The server will be available at `http://localhost:4000`

### Health Check

```bash
curl http://localhost:4000/health
```

## API Endpoints

### Authentication

- `POST /auth/signup` - Register a new user
- `POST /auth/login` - Login user

### User Management

- `GET /user/profile` - Get user profile
- `PATCH /user/profile` - Update user profile

### Symptom Tracking

- `POST /symptom/log` - Create new symptom log
- `GET /symptom/history` - Get symptom history
- `GET /symptom/insights` - Get symptom insights

### Climate Data

- `GET /climate/current` - Get current climate data
- `GET /climate/latest` - Get latest climate readings

### Forecasting

- `GET /forecast/today` - Get today's asthma risk forecast

### AI Coach

- `POST /coach/message` - Send message to AI coach

### Gamification

- `POST /gamification/complete` - Complete a challenge
- `GET /gamification/rewards` - Get user rewards

## Data Models

### User

- Profile information
- Authentication details

### SymptomLog

- Wheezing level (0-10)
- Cough level (0-10)
- Asthma attack occurrence
- Notes
- Timestamp

### Conversation

- User messages
- AI coach responses
- Conversation history

### Reward

- User badges
- Points system
- Achievement tracking

## Environment Variables

| Variable    | Description                     |
| ----------- | ------------------------------- |
| PORT        | Server port number              |
| MONGODB_URI | MongoDB connection string       |
| JWT_SECRET  | Secret for JWT token generation |

## Development

```bash
# Run in development mode with hot reload
npm run dev

# Run linter
npm run lint
```

## Dependencies

- express - Web framework
- mongoose - MongoDB ODM
- jsonwebtoken - JWT authentication
- bcryptjs - Password hashing
- cors - Cross-origin resource sharing
- helmet - Security headers
- dotenv - Environment configuration
- joi - Data validation
- axios - HTTP client
- morgan - HTTP request logger

## License

MIT
# ClimaAI
