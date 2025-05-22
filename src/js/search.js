import {
    getCoordinates,
    getCurrentWeather,
    getDefaultCity,
    getWeatherForFiveDays
} from "./api.js";

import Swiper from 'swiper';
import 'swiper/css';
import 'swiper/css/navigation';
import { Navigation } from 'swiper/modules';
Swiper.use([Navigation]);

const searchInput = document.querySelector(".search-input");
const suggestionsList = document.querySelector(".city-suggestions");
const forecastForFiveDays = document.querySelector(".forecast-card-list");
const infoWrap = document.querySelector(".forecast-info-wrap ");
import { getCityImage } from './api.js';


// searchInput.addEventListener("focus", () => { searchInput.select() })


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
        const lat = event.target.dataset.lat;
        const lon = event.target.dataset.lon;
        const selectedCity = event.target.textContent;
        localStorage.setItem("selectedCity", JSON.stringify({ name: selectedCity, lat: lat, lon: lon }));

        suggestionsList.innerHTML = "";
        suggestionsList.style.display = 'none';
        searchInput.value = selectedCity;

        try {
            const currentWeather = await getCurrentWeather(lat, lon);
            console.log("currentWeather:", currentWeather);

            if (document.querySelector(".weather-card")) {
                renderCurrentWeather(currentWeather);

            } else if (document.querySelector(".forecast-card-list")) {
                infoWrap.classList.remove("open");

                document.querySelectorAll('.forecast-card-details-btn.active')
                    .forEach(btn => {
                        btn.classList.remove('active');
                        btn.textContent = "More info";
                    });

                const currentWeather = await getCurrentWeather(lat, lon);
                document.querySelector(".forecast-card-city").textContent = `${currentWeather.name}, ${currentWeather.sys.country}`


                const forecastList = await getWeatherForFiveDays(lat, lon);

                const grouped = groupForecastByDay(forecastList);
                const dailyForecasts = getDailySummary(grouped);

                const markup = renderWetherFiveDays(dailyForecasts);
                forecastForFiveDays.innerHTML = markup;
            }

            const imageUrl = await getCityImage(selectedCity);
            if (imageUrl) {
                document.body.style.backgroundImage = `
                linear-gradient(to bottom, rgba(0,0,0,0.6), rgba(0,0,0,0)), 
                url(${imageUrl})`;
                document.body.style.backgroundSize = 'cover';
                document.body.style.backgroundPosition = 'center';
                document.body.style.backgroundRepeat = 'no-repeat';
            }

        } catch (error) {
            console.error('Error requesting cities:', error);
        }
    }
}

// !------------------load default city---------------

window.addEventListener("load", async () => {
    const storedCity = JSON.parse(localStorage.getItem("selectedCity"));
    loadDefaultCity(storedCity?.name || "Lviv");

    const imageUrl = await getCityImage(storedCity?.name || "Lviv");
    if (imageUrl) {
        document.body.style.backgroundImage = `
                linear-gradient(to bottom, rgba(0,0,0,0.6), rgba(0,0,0,0)), 
                url(${imageUrl})`;
        document.body.style.backgroundSize = 'cover';
        document.body.style.backgroundPosition = 'center';
        document.body.style.backgroundRepeat = 'no-repeat';
    }

});

async function loadDefaultCity(cityName) {
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
        const selectedCity = JSON.parse(localStorage.getItem("selectedCity"));

        if (selectedCity?.name) {
            const imageUrl = await getCityImage(selectedCity.name);
            if (imageUrl) {
                document.body.style.backgroundImage = `
                    linear-gradient(to bottom, rgba(0,0,0,0.6), rgba(0,0,0,0)), 
                    url(${imageUrl})`;
                document.body.style.backgroundSize = 'cover';
                document.body.style.backgroundPosition = 'center';
                document.body.style.backgroundRepeat = 'no-repeat';
            }
        }

        if (document.querySelector(".weather-card")) {
            const currentWeather = await getCurrentWeather(lat, lon);
            renderCurrentWeather(currentWeather);

        } else if (document.querySelector(".forecast-card-list")) {
            infoWrap.classList.remove("open");

            document.querySelectorAll('.forecast-card-details-btn.active')
                .forEach(btn => {
                    btn.classList.remove('active');
                    btn.textContent = "More info";
                });


            const currentWeather = await getCurrentWeather(lat, lon);
            document.querySelector(".forecast-card-city").textContent = `${currentWeather.name}, ${currentWeather.sys.country}`


            const forecastList = await getWeatherForFiveDays(lat, lon);
            const grouped = groupForecastByDay(forecastList);
            const dailyForecasts = getDailySummary(grouped);
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

        const tempsMin = entries.map(entry => entry.main.temp_min);
        const tempsMax = entries.map(entry => entry.main.temp_max);

        const averageEntry = entries.reduce((closest, item) => {
            const hour = new Date(item.dt * 1000).getHours();
            return Math.abs(hour - 12) < Math.abs(new Date(closest.dt * 1000).getHours() - 12) ? item : closest;
        });


        averageEntry.main.temp_min = Math.min(...tempsMin);
        averageEntry.main.temp_max = Math.max(...tempsMax);

        summary.push(averageEntry);
    }

    return summary;
}

// !--------------------------------

async function renderCurrentWeather(data) {
    const lat = data.coord.lat;
    const lon = data.coord.lon;

    document.querySelector(".weather-card__city").textContent = `${data.name}, ${data.sys.country}`;
    document.querySelector(".weather-card__temp").textContent = `${Math.round(data.main.temp)}°`;

    const forecast = await getWeatherForFiveDays(lat, lon)
    const today = new Date().toISOString().split("T")[0];
    const todayForecast = forecast.filter(item => {
        const itemDate = new Date(item.dt * 1000).toISOString().split("T")[0];
        return itemDate === today;
    });

    const tempsMin = todayForecast.map(entry => entry.main.temp_min);
    const tempsMax = todayForecast.map(entry => entry.main.temp_max);

    const minTemp = Math.round(Math.min(...tempsMin));
    const maxTemp = Math.round(Math.max(...tempsMax));


    document.querySelector(".weather-card__degrees_min").textContent = `${minTemp}°`;
    document.querySelector(".weather-card__degrees_max").textContent = `${maxTemp}°`;


    function updateLiveClock() {
        const now = new Date();
        const localOffsetSec = now.getTimezoneOffset() * 60;
        const targetOffsetSec = data.timezone;

        const diffInMs = (targetOffsetSec + localOffsetSec) * 1000;
        const currentCityTime = new Date(now.getTime() + diffInMs);

        document.querySelector(".current-date").innerHTML = `${currentCityTime.getDate()}<span class="suffix">th</span>`;
        document.querySelector(".current-day").textContent = currentCityTime.toLocaleDateString('en-Us', { weekday: "short" });
        document.querySelector(".current-month").textContent = currentCityTime.toLocaleDateString('en-Us', { month: "long" });
        document.querySelector(".current-time").textContent = currentCityTime.toLocaleTimeString([], {
            hour: "2-digit",
            minute: "2-digit",
            second: "2-digit"
        });
    }

    updateLiveClock();

    clearInterval(window.cityClockInterval); // 
    window.cityClockInterval = setInterval(updateLiveClock, 1000);


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
        return ` <li class="forecast-card-item swiper-slide" data-date="${day.dt}">
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
                            <button class="forecast-card-details-btn">More info</button>
                        </li>`
    }).join("")

};

// !-------------input focus----------------------


if (searchInput) {
    searchInput.addEventListener('focus', (e) => {
        setTimeout(() => {
            e.target.select();
        }, 10);
    });
}


// !------------- input keydown ------------


let activeIndex = -1;

searchInput.addEventListener("keydown", async (e) => {
    const items = suggestionsList.querySelectorAll("li");

    if (e.key === "ArrowDown") {
        activeIndex++;
        if (activeIndex >= items.length) activeIndex = 0;
        updateActiveItem(items, activeIndex);
    }

    if (e.key === "ArrowUp") {
        activeIndex--;
        if (activeIndex < 0) activeIndex = items.length - 1;
        updateActiveItem(items, activeIndex);
    }

    if (e.key === 'Enter') {
        if (activeIndex >= 0 && items[activeIndex]) {
            const selectedCity = items[activeIndex].textContent;
            searchInput.value = selectedCity;
            // console.log(items[activeIndex]);
            const fakeEvent = { target: items[activeIndex] };
            handlerSuggestions(fakeEvent);

            const imageUrl = await getCityImage(selectedCity);
            if (imageUrl) {
                document.body.style.backgroundImage = `
                linear-gradient(to bottom, rgba(0,0,0,0.6), rgba(0,0,0,0)), 
                url(${imageUrl})`;
                document.body.style.backgroundSize = 'cover';
                document.body.style.backgroundPosition = 'center';
                document.body.style.backgroundRepeat = 'no-repeat';
            }
        };
    }
})

function updateActiveItem(items, index) {
    items.forEach((item, i) => {
        if (i === index) {
            item.classList.add("selected");
        } else {
            item.classList.remove("selected");
        }
    });
}


// !----------- add to favorites --------

const favoritesBtn = document.querySelector(".icon-star");
const favoriteList = document.querySelector(".tags-list");
let favoriteCities = JSON.parse(localStorage.getItem("favorites")) || [];

favoritesBtn.addEventListener("click", handlerFavorite);

async function handlerFavorite() {
    const query = searchInput.value.trim();
    const isAlreadyAdded = favoriteCities.some(city => city.name === query);
    if (!query || isAlreadyAdded) return;

    const cities = await getCoordinates(query);
    const city = cities[0];

    const favorite = {
        name: query,
        lat: city.lat,
        lon: city.lon,
    }

    favoriteCities.push(favorite);
    localStorage.setItem("favorites", JSON.stringify(favoriteCities));

    renderFavoriteTags();
}


favoriteList.addEventListener("click", (e) => {
    if (!e.target.closest("li")) return;
    const currentTag = e.target.closest("li");
    const city = currentTag.querySelector("span").textContent.trim();

    if (e.target.closest(".icon-close")) {
        favoriteCities = favoriteCities.filter(e =>
            e.name !== city
        );
        localStorage.setItem("favorites", JSON.stringify(favoriteCities));

        renderFavoriteTags();
    } else if (currentTag) {
        const lat = currentTag.dataset.lat;
        const lon = currentTag.dataset.lon;

        searchInput.value = city;

        localStorage.setItem("selectedCity", JSON.stringify(
            {
                name: city,
                lat,
                lon,
            }
        ))

        showWeatherByCoords(lat, lon);

    }
})

function renderFavoriteTags() {
    const favoriteTags = JSON.parse(localStorage.getItem("favorites")) || [];
    const tagsWrap = document.querySelector(".tags")
    const tagList = document.querySelector(".tags-list");
    const scrollBtn = document.querySelector(".scroll-right");

    tagList.innerHTML = "";

    if (favoriteTags.length === 0) {
        tagsWrap.style.display = "none";
        scrollBtn.style.display = "none";
        return;
    }

    tagsWrap.style.display = "flex";

    favoriteTags.forEach(city => {
        favoriteList.insertAdjacentHTML("beforeend",
            `
            <li class="tags-list-item" data-lat="${city.lat}" data-lon="${city.lon}">
                <span> ${city.name}</span >
                <svg class="icon-close" width="10" height="10">
                    <use href="/symbol-defs-2.svg#icon-Vector-1"></use>
                </svg>
            </li>
            `)
    });

    setTimeout(checkTagScrollability, 100);
};

function checkTagScrollability() {
    const tagList = document.querySelector(".tags-list");
    const scrollBtn = document.querySelector(".scroll-right");

    if (!tagList || !scrollBtn) return;

    const scrollable = tagList.scrollWidth - tagList.clientWidth > 5;
    scrollBtn.style.display = scrollable ? "block" : "none";
}

window.addEventListener("resize", checkTagScrollability);


document.addEventListener("DOMContentLoaded", () => {
    favoriteCities = JSON.parse(localStorage.getItem("favorites")) || [];

    renderFavoriteTags();
});

const tagList = document.querySelector(".tags-list");

document.querySelector(".scroll-right").addEventListener("click", () => {
    tagList.scrollBy({ left: 150, behavior: "smooth" });
});


    //  !-----------------


