# API Documentation

## Auth Routes

### POST /auth/signup

- **Description**: Registers a new user.
- **Request Body**:
  ```json
  {
    "name": "string",
    "email": "string",
    "password": "string",
    "location": "string"
  }
  ```
- **Response**:
  ```json
  {
    "token": "string",
    "user": {
      "id": "string",
      "name": "string",
      "email": "string",
      "location": "string"
    }
  }
  ```

### POST /auth/login

- **Description**: Logs in an existing user.
- **Request Body**:
  ```json
  {
    "email": "string",
    "password": "string"
  }
  ```
- **Response**:
  ```json
  {
    "token": "string",
    "user": { "id": "string", "name": "string", "email": "string" }
  }
  ```

## User Routes

### GET /user/profile

- **Description**: Fetches the user's profile.
- **Response**:
  ```json
  {
    "id": "string",
    "name": "string",
    "email": "string",
    "location": "string"
  }
  ```

### PATCH /user/profile

- **Description**: Updates the user's profile.
- **Request Body**:
  ```json
  {
    "name": "string",
    "location": "string"
  }
  ```
- **Response**:
  ```json
  {
    "id": "string",
    "name": "string",
    "email": "string",
    "location": "string"
  }
  ```

## Climate Routes

### GET /climate/current

- **Description**: Fetches current climate data.
- **Query Parameters**:
  - `lat` (optional): Latitude.
  - `lon` (optional): Longitude.
  - `city` (optional): City name.
  - `country` (optional): Country name.
- **Response**: Climate data object.

### GET /climate/latest

- **Description**: Fetches the latest climate data.
- **Query Parameters**:
  - `lat` (optional): Latitude.
  - `lon` (optional): Longitude.
- **Response**: Climate data object.

## Forecast Routes

### GET /forecast/today

- **Description**: Fetches today's forecast.
- **Query Parameters**:
  - `lat`, `lon`, `city`, `country` (optional): Location details.
  - `compute` (optional): Whether to compute additional data.
- **Response**: Forecast data object.

## Symptom Routes

### POST /symptoms/log

- **Description**: Logs a symptom entry.
- **Request Body**:
  ```json
  {
    "symptoms": "array",
    "notes": "string",
    "date": "string"
  }
  ```
- **Response**: Created symptom log.

### GET /symptoms/history

- **Description**: Fetches symptom history.
- **Response**: Array of symptom logs.

### GET /symptoms/insights

- **Description**: Provides insights based on symptom logs.
- **Response**:
  ```json
  {
    "message": "string",
    "stats": { "highAqiAttacks": "number", "totalAttacks": "number" }
  }
  ```

## Coach Routes

### POST /coach/message

- **Description**: Sends a message to a coach.
- **Request Body**:
  ```json
  {
    "message": "string",
    "latitude": "number",
    "longitude": "number"
  }
  ```
- **Response**: Coach's reply.

## Gamification Routes

### POST /game/complete

- **Description**: Completes a challenge.
- **Request Body**:
  ```json
  {
    "badge": "string",
    "points": "number"
  }
  ```
- **Response**: Updated rewards.

### GET /game/rewards

- **Description**: Fetches rewards.
- **Response**:
  ```json
  {
    "badges": "array",
    "points": "number"
  }
  ```
