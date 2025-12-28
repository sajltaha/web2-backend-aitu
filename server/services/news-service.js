import axios from "axios";

export async function getNewsData(countryCode) {
  const apiKey = process.env.NEWS_API_KEY;
  
  if (!apiKey) {
    throw new Error("NEWS_API_KEY is not set in environment variables");
  }

  if (!countryCode) {
    throw new Error("Country code is required");
  }

  try {
    const url = "https://newsapi.org/v2/top-headlines";
    const response = await axios.get(url, {
      params: {
        country: countryCode.toLowerCase(),
        pageSize: 5,
        apiKey: apiKey
      },
    });

    const articles = response.data.articles || [];

    return articles
      .filter(article => article.title && article.url)
      .slice(0, 5)
      .map(article => ({
        title: article.title,
        description: article.description || "",
        url: article.url,
        source: article.source?.name || "Unknown",
        publishedAt: article.publishedAt
      }));
  } catch (error) {
    if (error.response?.status === 401) {
      throw new Error("Invalid News API key");
    } else if (error.response?.status === 429) {
      throw new Error("News API rate limit exceeded");
    } else if (error.code === "ECONNABORTED") {
      throw new Error("Request timeout - please try again");
    } else {
      console.error("News API error:", error.message);
      return [];
    }
  }
}

