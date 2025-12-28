# Weather & News API Application

A full-stack web application that provides real-time weather information and related news for any city worldwide. Built with Node.js, Express, and vanilla JavaScript.

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
   ```

4. **Start the server**
   ```bash
   npm start
   ```

5. **Open the application**
   
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

## 🔐 Environment Variables

Create a `.env` file in the root directory with the following variables:

```env
WEATHER_API_KEY=your_openweather_api_key
NEWS_API_KEY=your_newsapi_key
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

