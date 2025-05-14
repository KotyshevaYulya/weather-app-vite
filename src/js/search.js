import {
    getCoordinates,
    getCurrentWeather,
    getDefaultCity,
    getWeatherForFiveDays
} from "./api.js";

const searchInput = document.querySelector(".search-input");
const suggestionsList = document.querySelector(".city-suggestions");
const forecastForFiveDays = document.querySelector(".forecast-card-list");


searchInput.addEventListener("input", handlerInput);

async function handlerInput() {
    const query = searchInput.value.trim();

    if (query.length < 2) {
        suggestionsList.innerHTML = "";
        suggestionsList.style.display = 'none';
        return;
    };

    try {
        const cities = await getCoordinates(query);
        // console.log(cities);

        suggestionsList.innerHTML = '';

        if (cities.length === 0) {
            suggestionsList.style.display = 'none';
            return;
        };

        cities.forEach(city => {
            const li = document.createElement('li');
            li.textContent = `${city.name}, ${city.country}`;
            li.dataset.lat = city.lat;
            li.dataset.lon = city.lon;
            suggestionsList.appendChild(li);
        })

        suggestionsList.style.display = 'block';
    } catch (error) {
        console.error('Error requesting cities:', error);
    }
};



// !------------------

suggestionsList.addEventListener("click", handlerSuggestions);

async function handlerSuggestions(event) {
    if (event.target.tagName === "LI") {
        const selectedCity = event.target.textContent;
        const lat = event.target.dataset.lat;
        const lon = event.target.dataset.lon;

        suggestionsList.innerHTML = "";
        suggestionsList.style.display = 'none';
        searchInput.value = selectedCity;

        try {
            const currentWeather = await getCurrentWeather(lat, lon);

            if (window.location.pathname.includes("index.html")) {
                renderCurrentWeather(currentWeather);
            } else if (window.location.pathname.includes("five-days.html")) {
                const currentWeather = await getCurrentWeather(lat, lon);
                document.querySelector(".forecast-card-city").textContent = `${currentWeather.name}, ${currentWeather.sys.country}`


                const forecastList = await getWeatherForFiveDays(lat, lon);

                const grouped = groupForecastByDay(forecastList);
                const dailyForecasts = getDailySummary(grouped);
                console.log(dailyForecasts);

                const markup = renderWetherFiveDays(dailyForecasts);
                forecastForFiveDays.innerHTML = markup;

                const forecastSwiper = new Swiper('.forecast-swiper', {
                    slidesPerView: 3,
                    spaceBetween: 17,
                    freeMode: true,
                });

            }

        } catch (error) {
            console.error('Error requesting cities:', error);
        }
    }
}

// !------------------load default city---------------

window.addEventListener("load", () => {
    loadDefaultCity();
});

async function loadDefaultCity(cityName = "Lviv") {
    searchInput.value = cityName;

    try {
        const city = await getDefaultCity(cityName);

        if (city && city.lat && city.lon) {
            showWeatherByCoords(city.lat, city.lon)
        }


    } catch (error) {
        console.error('Error requesting cities:', error);
    }
}

async function showWeatherByCoords(lat, lon) {
    try {
        if (window.location.pathname.includes("index.html")) {
            const currentWeather = await getCurrentWeather(lat, lon);
            renderCurrentWeather(currentWeather);
        } else if (window.location.pathname.includes("five-days.html")) {
            const currentWeather = await getCurrentWeather(lat, lon);
            document.querySelector(".forecast-card-city").textContent = `${currentWeather.name}, ${currentWeather.sys.country}`


            const forecastList = await getWeatherForFiveDays(lat, lon);
            const grouped = groupForecastByDay(forecastList);
            const dailyForecasts = getDailySummary(grouped);
            console.log(dailyForecasts);
            const markup = renderWetherFiveDays(dailyForecasts);
            forecastForFiveDays.innerHTML = markup;

        }

    } catch (error) {
        console.error('Error requesting cities:', error);
    }
}
// !!!!----
function groupForecastByDay(list) {
    const days = {};

    list.forEach(entry => {
        const date = new Date(entry.dt * 1000);
        const dayKey = date.toISOString().split('T')[0]; // YYYY-MM-DD

        if (!days[dayKey]) {
            days[dayKey] = [];
        }

        days[dayKey].push(entry);
    });

    return days;
}

function getDailySummary(forecastGrouped) {
    const summary = [];

    for (let day in forecastGrouped) {
        const entries = forecastGrouped[day];

        const target = entries.reduce((closest, item) => {
            const hour = new Date(item.dt * 1000).getHours();
            return Math.abs(hour - 12) < Math.abs(new Date(closest.dt * 1000).getHours() - 12) ? item : closest;
        });

        summary.push(target);
    }

    return summary;
}

// !--------------------------------

function renderCurrentWeather(data) {
    document.querySelector(".weather-card__city").textContent = `${data.name}, ${data.sys.country}`;
    document.querySelector(".weather-card__temp").textContent = `${Math.round(data.main.temp)}`;
    document.querySelector(".weather-card__degrees_min").textContent = `${Math.round(data.main.temp_min)}`;
    document.querySelector(".weather-card__degrees_max").textContent = `${Math.round(data.main.temp_max)}`;

    const now = new Date();

    document.querySelector(".current-date").innerHTML = `${now.getDate()}<span class="suffix">th</span>`;
    document.querySelector(".current-day").textContent = `${now.toLocaleDateString('en-Us', { weekday: "short" })}`;
    document.querySelector(".current-month").textContent = `${now.toLocaleDateString('en-Us', { month: "long" })}`;
    document.querySelector(".current-time").textContent = `${now.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit", second: "2-digit" })}`;


    const sunrise = new Date(data.sys.sunrise * 1000);
    const sunset = new Date(data.sys.sunset * 1000);

    document.querySelector(".sunrise-time").textContent = `${sunrise.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}`;
    document.querySelector(".sunset-time").textContent = `${sunset.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}`;
}


function renderWetherFiveDays(data) {
    if (!Array.isArray(data)) {
        console.error("renderWetherFiveDays отримав НЕ масив:", data);
        return '';
    }

    return data.map((day) => {
        const currentDay = new Date(day.dt * 1000);
        return ` <li class="forecast-card-item swiper-slide">
                            <span class="day">${currentDay.toLocaleDateString('en-Us', { weekday: "long" })}</span>
                            <span class="date">${currentDay.getDate()} ${currentDay.toLocaleDateString("en-US", { weekday: "short" })}</span>
                            <img
                              class="forecast-card-icon"
                              src="https://openweathermap.org/img/wn/${day.weather[0].icon}@2x.png" 
                              alt="weather icon" 
                              width="70"
                              height="70"
                            />

                            <ul class="forecast-card-temp-list">
                                <li class="min-degrees">
                                    <span class="min">min</span>
                                    <span class="degrees">${Math.round(day.main.temp_min)}°</span>
                                </li>
                                <li class="max-degrees">
                                    <span class="max">max</span>
                                    <span class="degrees">${Math.round(day.main.temp_max)}°</span>
                                </li>
                            </ul>
                            <button class="forecast-card-details-btn">more info</button>
                        </li>`
    }).join("")

}