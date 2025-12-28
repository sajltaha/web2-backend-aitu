import express from "express";
import { getWeatherData } from "../services/weather-service.js";
import { getNewsData } from "../services/news-service.js";

const router = express.Router();

router.get("/", async (req, res) => {
  try {
    const { city } = req.query;

    if (!city) {
      return res.status(400).json({
        error: "City parameter is required",
        example: "/api/weather?city=Almaty"
      });
    }

    const weatherData = await getWeatherData(city);
    const newsData = await getNewsData(weatherData.countryCode);

    res.json({
      success: true,
      weather: weatherData,
      news: newsData
    });
  } catch (error) {
    console.error("Weather route error:", error.message);

    res.status(error.message.includes("not found") ? 404 : 500).json({
      success: false,
      error: error.message
    });
  }
});

export default router;

