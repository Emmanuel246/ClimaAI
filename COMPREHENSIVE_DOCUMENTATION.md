# ClimaHealth AI Backend - Comprehensive Documentation

## Table of Contents

1. [Overview](#overview)
2. [User Stories](#user-stories)
3. [System Architecture](#system-architecture)
4. [API Documentation](#api-documentation)
5. [Database Schema](#database-schema)
6. [Setup & Deployment](#setup--deployment)
7. [Security Features](#security-features)
8. [Testing Guide](#testing-guide)

## Overview

ClimaHealth AI is a comprehensive backend system designed to help asthma patients manage their condition through intelligent monitoring, symptom tracking, and personalized coaching. The system integrates real-time environmental data with user health metrics to provide actionable insights and risk assessments.

### Key Features

- **Comprehensive Symptom Tracking**: Multi-dimensional symptom logging with severity assessment
- **Environmental Monitoring**: Real-time air quality, weather, and pollen data integration
- **AI-Powered Coaching**: Personalized health advice based on user data and environmental conditions
- **Advanced Analytics**: Correlation analysis between environmental factors and symptoms
- **Gamification System**: Reward-based engagement to encourage consistent health monitoring
- **Secure Authentication**: JWT-based authentication with refresh tokens and account security

## User Stories

### Primary User Story: Asthma Patient

**As an asthma patient**, I want to:

1. **Track my symptoms comprehensively**

   - Log wheezing, cough, breathlessness, and chest tightness levels (0-10 scale)
   - Record asthma attacks with detailed context
   - Note triggers, medications used, and environmental conditions
   - Track peak flow measurements and activity levels

2. **Monitor environmental conditions**

   - View current air quality index (AQI) for my location
   - Check pollen levels and weather conditions
   - Receive risk assessments based on environmental data
   - Get alerts when conditions may trigger symptoms

3. **Receive personalized coaching**

   - Chat with an AI coach that understands my condition
   - Get advice based on current environmental conditions
   - Receive personalized recommendations for symptom management
   - Access emergency guidance during severe episodes

4. **Gain insights from my data**

   - View correlations between environmental factors and my symptoms
   - Identify patterns in symptom occurrence (time, triggers, severity)
   - Track progress over time with statistical summaries
   - Receive actionable recommendations based on data analysis

5. **Stay motivated through gamification**
   - Earn badges for consistent logging and healthy behaviors
   - Complete challenges related to asthma management
   - Track points and achievements
   - Maintain streaks for daily symptom logging

**So that** I can:

- Proactively manage my asthma condition
- Reduce the frequency and severity of attacks
- Make informed decisions about daily activities
- Improve my quality of life through data-driven insights
- Maintain better communication with healthcare providers

### Secondary User Stories

#### Healthcare Provider

**As a healthcare provider**, I want to:

- Access patient symptom trends and patterns
- Review environmental correlations affecting my patients
- Monitor medication usage and effectiveness
- Identify patients requiring immediate attention

#### Caregiver/Family Member

**As a caregiver**, I want to:

- Monitor my family member's asthma condition
- Receive alerts for severe symptoms or attacks
- Access emergency contact information
- Understand environmental risks affecting my loved one

## System Architecture

### High-Level Architecture

```
┌─────────────────┐    ┌─────────────────┐    ┌─────────────────┐
│   Mobile App    │    │   Web Client    │    │  Admin Panel    │
│   (React Native)│    │   (React.js)    │    │   (React.js)    │
└─────────┬───────┘    └─────────┬───────┘    └─────────┬───────┘
          │                      │                      │
          └──────────────────────┼──────────────────────┘
                                 │
                    ┌─────────────┴─────────────┐
                    │     Load Balancer         │
                    │     (Nginx/AWS ALB)       │
                    └─────────────┬─────────────┘
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

### Technology Stack

- **Runtime**: Node.js 18+
- **Framework**: Express.js
- **Database**: MongoDB with Mongoose ODM
- **Authentication**: JWT with refresh tokens
- **Validation**: Joi schema validation
- **Security**: Helmet, CORS, bcrypt
- **External APIs**: OpenWeatherMap, AQICN, OpenAI
- **Logging**: Morgan
- **Process Management**: PM2 (production)

### Core Components

#### 1. Authentication System

- JWT-based authentication with access and refresh tokens
- Account lockout after failed login attempts
- Password strength requirements
- Secure cookie handling for refresh tokens

#### 2. Data Models

- **User**: Enhanced profile with asthma-specific fields
- **SymptomLog**: Comprehensive symptom tracking with auto-calculated severity
- **ClimateData**: Environmental data with geospatial indexing
- **Conversation**: AI coach interaction history
- **Reward**: Gamification system for user engagement

#### 3. External Integrations

- **OpenWeatherMap**: Real-time weather data
- **AQICN**: Air quality index monitoring
- **OpenAI**: AI-powered coaching responses
- **Pollen APIs**: Seasonal allergen data (configurable)

#### 4. Analytics Engine

- Correlation analysis between environmental factors and symptoms
- Time-based pattern recognition
- Severity trend analysis
- Personalized risk assessment

## API Documentation

### Base URL

```
Production: https://api.climahealth.com
Development: http://localhost:4000
```

### Authentication

All protected endpoints require a Bearer token in the Authorization header:

```
Authorization: Bearer <jwt_token>
```

### Response Format

All API responses follow this structure:

```json
{
  "success": boolean,
  "message": "string",
  "data": object | array,
  "error": {
    "message": "string",
    "code": "string",
    "details": array
  }
}
```

### Core Endpoints

#### Authentication Endpoints

**POST /api/auth/signup**
Register a new user account.

Request Body:

```json
{
  "name": "John Doe",
  "email": "john@example.com",
  "password": "SecurePass123!",
  "location": {
    "city": "New York",
    "country": "US",
    "lat": 40.7128,
    "lon": -74.006
  }
}
```

Response:

```json
{
  "success": true,
  "message": "User registered successfully",
  "data": {
    "token": "jwt_access_token",
    "user": {
      "id": "user_id",
      "name": "John Doe",
      "email": "john@example.com",
      "role": "patient"
    }
  }
}
```

**POST /api/auth/login**
Authenticate user and receive tokens.

**POST /api/auth/refresh**
Refresh access token using refresh token cookie.

**POST /api/auth/logout**
Clear refresh token cookie.

#### Symptom Tracking Endpoints

**POST /api/symptoms/log**
Create a new symptom log entry.

Request Body:

```json
{
  "symptoms": {
    "wheezing": 3,
    "cough": 5,
    "breathlessness": 2,
    "chestTightness": 4,
    "attack": false,
    "triggers": ["pollen", "exercise"],
    "peakFlow": 350
  },
  "medication": {
    "relieverUsed": true,
    "relieverDoses": 2,
    "controllerTaken": true
  },
  "environment": {
    "location": {
      "lat": 40.7128,
      "lon": -74.006
    },
    "indoorOutdoor": "outdoor",
    "activity": "moderate_activity"
  },
  "notes": "Symptoms started after morning jog in the park"
}
```

**GET /api/symptoms/history**
Retrieve symptom history with filtering and pagination.

Query Parameters:

- `page`: Page number (default: 1)
- `limit`: Items per page (default: 50)
- `severity`: Filter by severity (mild, moderate, severe)
- `startDate`: Filter from date (ISO string)
- `endDate`: Filter to date (ISO string)
- `hasAttack`: Filter by attack occurrence (true/false)
- `sortBy`: Sort field (default: date)
- `sortOrder`: Sort direction (asc/desc, default: desc)

**GET /api/symptoms/insights**
Get advanced analytics and correlations.

Query Parameters:

- `days`: Analysis period in days (default: 30)

Response includes:

- Summary statistics
- Environmental correlations
- Trigger analysis
- Time-based patterns
- Personalized recommendations

**GET /api/symptoms/stats**
Get statistical summary for specified period.

Query Parameters:

- `period`: Time period (30d, 7d, 1y, etc.)

#### Climate Data Endpoints

**GET /api/climate/current**
Fetch current environmental conditions.

**GET /api/climate/latest**
Get latest cached environmental data.

#### AI Coach Endpoints

**POST /api/coach/message**
Send message to AI coach and receive personalized response.

Request Body:

```json
{
  "message": "I'm feeling wheezy today, what should I do?",
  "latitude": 40.7128,
  "longitude": -74.006
}
```

#### Gamification Endpoints

**POST /api/game/complete**
Complete a challenge and earn rewards.

**GET /api/game/rewards**
Get user's current badges and points.

### Error Handling

The API uses standard HTTP status codes and provides detailed error information:

- `400 Bad Request`: Validation errors, malformed requests
- `401 Unauthorized`: Authentication required or invalid token
- `403 Forbidden`: Insufficient permissions
- `404 Not Found`: Resource not found
- `409 Conflict`: Resource already exists
- `429 Too Many Requests`: Rate limit exceeded
- `500 Internal Server Error`: Server-side errors
- `503 Service Unavailable`: External service errors

Example error response:

```json
{
  "success": false,
  "error": {
    "message": "Validation failed",
    "code": "VALIDATION_ERROR",
    "details": [
      {
        "field": "symptoms.wheezing",
        "message": "Wheezing level must be between 0 and 10"
      }
    ]
  }
}
```

## Database Schema

### User Collection

```javascript
{
  _id: ObjectId,
  name: String, // 2-50 characters
  email: String, // Unique, lowercase
  passwordHash: String, // bcrypt hashed, select: false
  role: String, // patient, caregiver, healthcare_provider, admin
  location: {
    city: String,
    country: String,
    lat: Number, // -90 to 90
    lon: Number  // -180 to 180
  },
  preferences: {
    language: String, // en, es, fr, de
    notifications: Boolean,
    units: String, // metric, imperial
    riskAlerts: Boolean,
    dailyReminders: Boolean
  },
  profile: {
    dateOfBirth: Date,
    gender: String, // male, female, other, prefer_not_to_say
    asthmaType: String, // allergic, non_allergic, occupational, exercise_induced, other
    severityLevel: String, // mild_intermittent, mild_persistent, moderate_persistent, severe_persistent
    triggers: [String], // Array of trigger types
    medications: [{
      name: String,
      type: String, // controller, reliever, combination
      dosage: String,
      frequency: String
    }],
    emergencyContact: {
      name: String,
      phone: String,
      relationship: String
    }
  },
  isActive: Boolean,
  isEmailVerified: Boolean,
  lastLogin: Date,
  loginAttempts: Number,
  lockUntil: Date,
  createdAt: Date,
  updatedAt: Date
}
```

**Indexes:**

- `{ email: 1 }` - Unique index for authentication
- `{ "location.lat": 1, "location.lon": 1 }` - Geospatial queries
- `{ createdAt: -1 }` - User registration trends
- `{ lastLogin: -1 }` - Activity monitoring

### SymptomLog Collection

```javascript
{
  _id: ObjectId,
  userId: ObjectId, // Reference to User
  date: Date, // Cannot be in future
  symptoms: {
    wheezing: Number, // 0-10, required
    cough: Number, // 0-10, required
    breathlessness: Number, // 0-10, optional
    chestTightness: Number, // 0-10, optional
    attack: Boolean, // required
    triggers: [String], // Array of trigger types
    peakFlow: Number // 50-800
  },
  medication: {
    relieverUsed: Boolean,
    relieverDoses: Number, // 0-20
    controllerTaken: Boolean,
    otherMedications: [String]
  },
  environment: {
    location: {
      lat: Number,
      lon: Number
    },
    indoorOutdoor: String, // indoor, outdoor, mixed
    activity: String // resting, light_activity, moderate_activity, vigorous_activity, sleeping
  },
  notes: String, // Max 500 characters
  severity: String, // mild, moderate, severe (auto-calculated)
  followUpRequired: Boolean, // Auto-calculated
  createdAt: Date,
  updatedAt: Date
}
```

**Indexes:**

- `{ userId: 1, date: -1 }` - User symptom history
- `{ userId: 1, "symptoms.attack": 1 }` - Attack tracking
- `{ date: -1 }` - Temporal queries
- `{ severity: 1 }` - Severity analysis
- `{ followUpRequired: 1 }` - Medical follow-up

**Virtuals:**

- `overallScore`: Calculated symptom severity score
- `riskLevel`: Risk assessment (low, medium, high)
