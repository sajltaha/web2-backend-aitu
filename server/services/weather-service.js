import axios from "axios";

export async function getWeatherData(city) {
  const apiKey = process.env.WEATHER_API_KEY;
  
  if (!apiKey) {
    throw new Error("WEATHER_API_KEY is not set in environment variables");
  }

  if (!city || city.trim() === "") {
    throw new Error("City name is required");
  }

  try {
    const url = "https://api.openweathermap.org/data/2.5/weather";
    const response = await axios.get(url, {
      params: {
        q: city.trim(),
        appid: apiKey,
        units: "metric"
      },
    });

    const data = response.data;

    return {
      temperature: Math.round(data.main.temp),
      description: data.weather[0].description,
      coordinates: {
        lat: data.coord.lat,
        lon: data.coord.lon
      },
      feelsLike: Math.round(data.main.feels_like),
      windSpeed: data.wind?.speed || 0,
      countryCode: data.sys.country,
      rainVolume3h: data.rain?.["3h"] || 0,
      cityName: data.name,
      humidity: data.main.humidity,
      pressure: data.main.pressure
    };
  } catch (error) {
    if (error.response?.status === 404) {
      throw new Error(`City "${city}" not found`);
    } else if (error.response?.status === 401) {
      throw new Error("Invalid API key");
    } else if (error.code === "ECONNABORTED") {
      throw new Error("Request timeout - please try again");
    } else {
      throw new Error(`Failed to fetch weather data: ${error.message}`);
    }
  }
}

