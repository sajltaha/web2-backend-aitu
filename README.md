# Weather & News API Application

A full-stack web application that provides real-time weather information and related news for any city worldwide. Built with Node.js, Express, and vanilla JavaScript.

## 📋 Table of Contents

- [Features](#features)
- [Setup Instructions](#setup-instructions)
- [API Usage](#api-usage)
- [Design Decisions](#design-decisions)
- [Project Structure](#project-structure)
- [Environment Variables](#environment-variables)

## ✨ Features

- **Real-time Weather Data**: Get comprehensive weather information including:
  - Temperature and feels-like temperature
  - Weather description
  - Coordinates (latitude/longitude)
  - Wind speed
  - Humidity and pressure
  - Rain volume for the last 3 hours
  - Country code

- **Latest News**: Automatically fetch top news headlines from the country of the searched city

- **Responsive Design**: Modern, mobile-friendly UI that works seamlessly across all devices

- **Server-Side API Integration**: All third-party API calls are handled on the server for security and clean architecture

## 🚀 Setup Instructions

### Prerequisites

- Node.js (v14 or higher)
- npm (Node Package Manager)
- API keys for:
  - [OpenWeather API](https://openweathermap.org/api)
  - [News API](https://newsapi.org/)

### Installation Steps

1. **Clone or download the project**

2. **Install dependencies**
   ```bash
   npm install
   ```

3. **Create environment file**
   
   Create a `.env` file in the root directory:
   ```env
   WEATHER_API_KEY=your_openweather_api_key_here
   NEWS_API_KEY=your_newsapi_key_here
   PORT=3000
   ```

4. **Get API Keys**
   
   - **OpenWeather API**: 
     - Visit [https://openweathermap.org/api](https://openweathermap.org/api)
     - Sign up for a free account
     - Get your API key from the dashboard
   
   - **News API**:
     - Visit [https://newsapi.org/](https://newsapi.org/)
     - Sign up for a free account
     - Get your API key from the dashboard

5. **Start the server**
   ```bash
   npm start
   ```
   
   For development with auto-reload:
   ```bash
   npm run dev
   ```

6. **Open the application**
   
   Open your browser and navigate to:
   ```
   http://localhost:3000
   ```
   
   Or open the `client/index.html` file directly in your browser (note: API calls may be blocked by CORS in this case).

## 📡 API Usage

### Endpoints

#### GET `/api/weather?city=<cityName>`

Fetches weather data and related news for a specified city.

**Query Parameters:**
- `city` (required): Name of the city (e.g., "Almaty", "London", "New York")

**Example Request:**
```bash
GET http://localhost:3000/api/weather?city=Almaty
```

**Example Response:**
```json
{
  "success": true,
  "weather": {
    "temperature": 15,
    "description": "clear sky",
    "coordinates": {
      "lat": 43.222,
      "lon": 76.8512
    },
    "feelsLike": 14,
    "windSpeed": 2.5,
    "countryCode": "KZ",
    "rainVolume3h": 0,
    "cityName": "Almaty",
    "humidity": 65,
    "pressure": 1013
  },
  "news": [
    {
      "title": "News Article Title",
      "description": "Article description...",
      "url": "https://example.com/article",
      "source": "News Source",
      "publishedAt": "2024-01-15T10:00:00Z"
    }
  ]
}
```

**Error Response:**
```json
{
  "success": false,
  "error": "City not found"
}
```

#### GET `/api/health`

Health check endpoint to verify server status.

**Example Response:**
```json
{
  "status": "ok",
  "message": "Server is running"
}
```

## 🏗️ Design Decisions

### 1. Server-Side API Integration

**Decision**: All third-party API calls are made on the server side, not in the client.

**Rationale**:
- **Security**: API keys are kept secure on the server and never exposed to the client
- **Clean Architecture**: Separation of concerns - server handles data fetching, client handles presentation
- **Rate Limiting**: Easier to implement rate limiting and caching on the server
- **Error Handling**: Centralized error handling and data processing

### 2. Modular Service Architecture

**Decision**: Separate service files for weather and news APIs.

**Rationale**:
- **Maintainability**: Each service is responsible for one API, making code easier to maintain
- **Reusability**: Services can be easily reused in other parts of the application
- **Testability**: Individual services can be tested in isolation
- **Scalability**: Easy to add more APIs or services in the future

### 3. Error Handling Strategy

**Decision**: Graceful error handling with user-friendly messages.

**Rationale**:
- **User Experience**: Users see clear, actionable error messages
- **Resilience**: If news API fails, weather data is still displayed
- **Debugging**: Server logs detailed errors for developers while showing simple messages to users

### 4. Responsive Design

**Decision**: Mobile-first responsive design using CSS Grid and Flexbox.

**Rationale**:
- **Accessibility**: Application works on all device sizes
- **Modern Standards**: Uses current CSS best practices
- **User Experience**: Optimal viewing experience across devices

### 5. Vanilla JavaScript

**Decision**: No frontend frameworks, using vanilla JavaScript.

**Rationale**:
- **Simplicity**: No build process required, easier to understand
- **Performance**: Lightweight, fast loading
- **Learning**: Better understanding of core JavaScript concepts

## 📁 Project Structure

```
asiks/
├── client/
│   ├── index.html          # Main HTML file
│   ├── styles.css          # CSS styles
│   └── script.js           # Client-side JavaScript
├── server/
│   ├── index.js            # Express server setup
│   ├── routes/
│   │   └── weather.js      # Weather API routes
│   └── services/
│       ├── weather-service.js  # OpenWeather API integration
│       └── news-service.js     # NewsAPI integration
├── .env                    # Environment variables (create this)
├── package.json            # Dependencies and scripts
└── README.md              # This file
```

## 🔐 Environment Variables

Create a `.env` file in the root directory with the following variables:

```env
WEATHER_API_KEY=your_openweather_api_key
NEWS_API_KEY=your_newsapi_key
PORT=3000
```

**Important**: Never commit the `.env` file to version control. Add it to `.gitignore`.

## 🛠️ Technologies Used

- **Backend**:
  - Node.js
  - Express.js
  - Axios (HTTP client)
  - dotenv (environment variables)

- **Frontend**:
  - HTML5
  - CSS3 (with responsive design)
  - Vanilla JavaScript

- **APIs**:
  - OpenWeather API (Weather data)
  - News API (News headlines)

## 📝 Notes

- The application requires an active internet connection to fetch data from external APIs
- Free tier API keys may have rate limits
- Some cities may not have news available in the News API
- The application handles missing data gracefully (e.g., rain data may not always be available)

## 🐛 Troubleshooting

**Issue**: "WEATHER_API_KEY is not set"
- **Solution**: Make sure you've created a `.env` file with your API keys

**Issue**: "City not found"
- **Solution**: Check the city name spelling and try using the city's English name

**Issue**: CORS errors
- **Solution**: Make sure you're accessing the app through the server (http://localhost:3000) and not opening the HTML file directly

**Issue**: News not loading
- **Solution**: Check your News API key and ensure it's valid. The app will still show weather data even if news fails to load.

## 📄 License

This project is created for educational purposes.

