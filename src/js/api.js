const API_KEY = import.meta.env.VITE_WEATHER_API_KEY;;
const BASE_URL = "https://api.openweathermap.org";


// !------- get coordinates ----

export async function getCoordinates(cityName) {
    if (!cityName) throw new Error("Місто не задано");

    const res = await fetch(`${BASE_URL}/geo/1.0/direct?q=${cityName}&limit=5&appid=${API_KEY}`);
    if (!res.ok) {
        throw new Error("Server connection error");
    }
    const cities = await res.json();
    return cities;
}

// !-------- get weather

export async function getCurrentWeather(lat, lon) {
    const res = await fetch(`${BASE_URL}/data/2.5/weather?lat=${lat}&lon=${lon}&units=metric&appid=${API_KEY}`);
    if (!res.ok) {
        throw new Error("Server connection error");
    }
    return await res.json();
}


// !!!!!! ---- Defaul weather --------

export async function getDefaultCity(cityName) {
    const res = await fetch(`${BASE_URL}/geo/1.0/direct?q=${cityName}&limit=5&appid=${API_KEY}`);
    if (!res.ok) {
        throw new Error("Server connection error");
    }
    const [city] = await res.json();
    return city;
}

// !------- get weather for 5 days


export async function getWeatherForFiveDays(lat, lon) {
    const res = await fetch(`${BASE_URL}/data/2.5/forecast?lat=${lat}&lon=${lon}&units=metric&appid=${API_KEY}`);
    if (!res.ok) {
        throw new Error("Server connection error");
    }
    const { list } = await res.json();
    return list;
}


//  !------------------- unsplash 

export async function getCityImage(cityName) {
    const accessKey = import.meta.env.VITE_UNSPLASH_ACCESS_KEY;

    try {
        const response = await fetch(
            `https://api.unsplash.com/search/photos?query=${encodeURIComponent(cityName)}&orientation=landscape&client_id=${accessKey}`
        );
        const data = await response.json();

        if (data.results && data.results.length > 0) {
            return data.results[0].urls.regular; // повноцінна картинка
        } else {
            console.warn('Зображення не знайдено для міста:', cityName);
            return null;
        }
    } catch (error) {
        console.error('Помилка при запиті до Unsplash:', error);
        return null;
    }
}
