const API_BASE_URL = "http://localhost:3000/api";

async function searchWeather() {
    const cityInput = document.getElementById("cityInput");
    const city = cityInput.value.trim();

    if (!city) {
        showError("Please enter a city name");
        return;
    }

    // Hide previous results and errors
    hideAllSections();
    showLoading();

    try {
        const response = await fetch(`${API_BASE_URL}/weather?city=${encodeURIComponent(city)}`);
        const data = await response.json();
        if (data.success) displayResults(data);

    } catch (error) {
        showError(error.message || "Failed to fetch weather data. Please try again.");
    } finally {
        hideLoading();
    }
}

function displayResults(data) {
    const { weather, news } = data;

    // Display weather data
    document.getElementById("temperature").textContent = weather.temperature;
    document.getElementById("description").textContent = weather.description;
    document.getElementById("location").textContent = `${weather.cityName}, ${weather.countryCode}`;
    document.getElementById("feelsLike").textContent = `${weather.feelsLike}°C`;
    document.getElementById("windSpeed").textContent = `${weather.windSpeed} m/s`;
    document.getElementById("humidity").textContent = `${weather.humidity}%`;
    document.getElementById("pressure").textContent = `${weather.pressure} hPa`;
    document.getElementById("rainVolume").textContent = weather.rainVolume3h > 0 
        ? `${weather.rainVolume3h} mm` 
        : "No rain";
    document.getElementById("coordinates").textContent = 
        `${weather.coordinates.lat.toFixed(2)}, ${weather.coordinates.lon.toFixed(2)}`;
    document.getElementById("countryCode").textContent = weather.countryCode;

    // Display news data
    displayNews(news);

    // Show results section
    document.getElementById("results").classList.remove("hidden");
}

function displayNews(news) {
    const newsList = document.getElementById("newsList");

    if (!news.length) {
        newsList.innerHTML = '<div class="no-news">No news available for this country at the moment.</div>';
        return;
    }

    newsList.innerHTML = news.map(article => `
        <div class="news-item">
            <h3>${escapeHtml(article.title)}</h3>
            ${article.description ? `<p>${escapeHtml(article.description)}</p>` : ''}
            <a href="${article.url}" target="_blank" rel="noopener noreferrer">
                Read more →
            </a>
            <div class="news-meta">
                ${article.source ? `Source: ${escapeHtml(article.source)}` : ''}
                ${article.publishedAt ? ` • ${formatDate(article.publishedAt)}` : ''}
            </div>
        </div>
    `).join("");
}

function showLoading() {
    document.getElementById("loading").classList.remove("hidden");
}

function hideLoading() {
    document.getElementById("loading").classList.add("hidden");
}

function showError(message) {
    const errorDiv = document.getElementById("error");
    errorDiv.textContent = `❌ ${message}`;
    errorDiv.classList.remove("hidden");
}

function hideAllSections() {
    document.getElementById("loading").classList.add("hidden");
    document.getElementById("error").classList.add("hidden");
    document.getElementById("results").classList.add("hidden");
}

function escapeHtml(text) {
    const div = document.createElement("div");
    div.textContent = text;
    return div.innerHTML;
}

function formatDate(dateString) {
    if (!dateString) return "";
    const date = new Date(dateString);
    return date.toLocaleDateString("en-US", {
        year: "numeric",
        month: "short",
        day: "numeric"
    });
}

document.addEventListener("DOMContentLoaded", () => {
    const cityInput = document.getElementById("cityInput");
    const searchBtn = document.getElementById("searchBtn");

    searchBtn.addEventListener("click", searchWeather);

    cityInput.addEventListener("keypress", async (e) => {
        if (e.key === "Enter") {
            await searchWeather();
        }
    });
});

