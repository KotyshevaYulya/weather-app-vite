import { getWeatherForFiveDays } from "./api.js";

// !--------- swiper---------------
let forecastSwiper = null;
let infoSwiper = null;

function initForecastSwiper() {
    const screenWidth = window.innerWidth;
    const prevBtn = document.querySelector('.my-button-prev');
    const nextBtn = document.querySelector('.my-button-next');

    if (screenWidth < 768) {
        if (forecastSwiper) return; // вже є — нічого не робимо

        forecastSwiper = new Swiper('.forecast-swiper', {
            slidesPerView: 3,
            spaceBetween: 17,
            freeMode: true,
            on: {
                init: updateNavButtons,
                slideChange: updateNavButtons,
                resize: updateNavButtons,
            },
        });

        prevBtn?.addEventListener('click', () => {
            forecastSwiper.slidePrev();
        });

        nextBtn?.addEventListener('click', () => {
            forecastSwiper.slideNext();
        });

    } else {
        // При ширині >=768px — видаляємо свайпер, якщо він був
        if (forecastSwiper) {
            forecastSwiper.destroy(true, true);
            forecastSwiper = null;
        }

        prevBtn?.removeAttribute('disabled');
        nextBtn?.removeAttribute('disabled');
    }

    function updateNavButtons() {
        if (!forecastSwiper) return;

        if (forecastSwiper.isBeginning) {
            prevBtn?.setAttribute('disabled', true);
        } else {
            prevBtn?.removeAttribute('disabled');
        }

        if (forecastSwiper.isEnd) {
            nextBtn?.setAttribute('disabled', true);
        } else {
            nextBtn?.removeAttribute('disabled');
        }
    }
}


if (document.querySelector('.forecast-swiper')) {
    window.addEventListener('load', initForecastSwiper);
    window.addEventListener('resize', initForecastSwiper);
}

// ! ------more info swiper----------------------


// !------------------Функціонал "more info" кнопок-----



const forecastList = document.querySelector(".forecast-card-list");
const infoWrap = document.querySelector(".forecast-info-wrap ");
const infoList = document.querySelector(".forecast-info-list");
let openedDay = null;

if (forecastList) {
    forecastList.addEventListener("click", async (e) => {
        if (!e.target.classList.contains("forecast-card-details-btn")) return;

        const clickedBtn = e.target;
        const allBtns = document.querySelectorAll(".forecast-card-details-btn");
        const card = e.target.closest("li");
        const date = card.dataset.date;
        let infoSwiper = null;



        if (openedDay === date && infoWrap.classList.contains("open")) {
            infoWrap.classList.remove("open");
            clickedBtn.classList.remove("active");
            clickedBtn.textContent = "More info"

            openedDay = null;
            return;
        };


        openedDay = date;

        const city = JSON.parse(localStorage.getItem("selectedCity"));
        const lat = city?.lat || 49.841952;
        const lon = city?.lon || 24.0315921;


        allBtns.forEach(btn => btn.classList.remove("active"));

        try {
            const forecastListAll = await getWeatherForFiveDays(lat, lon);

            const targetDate = new Date(Number(date) * 1000);
            const dayKey = targetDate.toISOString().split("T")[0];

            const grouped = groupForecastByDay(forecastListAll);
            const hourlyData = grouped[dayKey];

            infoList.innerHTML = renderHourlyForecast(hourlyData);


            allBtns.forEach(btn => {
                btn.classList.remove("active");
                btn.textContent = "More info";
            });

            infoWrap.classList.add("open");
            clickedBtn.classList.add("active");
            clickedBtn.textContent = "Less info";

            setTimeout(() => {
                infoWrap.scrollIntoView({ behavior: 'smooth', block: 'start' });
            }, 100);

            if (infoSwiper) {
                infoSwiper.destroy(true, true);
                infoSwiper = null;
            }

            infoSwiper = new Swiper(".forecast-info-swiper", {
                slidesPerView: 2,
                spaceBetween: 30,
                freeMode: true,
                pagination: {
                    el: ".swiper-pagination",
                    clickable: true,
                    hide: false,
                },
                breakpoints: {
                    768: {
                        slidesPerView: 5,
                    },
                    1280: {
                        slidesPerView: 8,
                    },
                },
            });

        } catch (error) {
            console.error("Помилка при завантаженні деталізації по годинах:", error);
        }

    })
}

function renderHourlyForecast(data) {
    if (!Array.isArray(data)) return '';

    return data.map(item => {
        const hour = new Date(item.dt * 1000).toLocaleTimeString([], {
            hour: '2-digit',
            minute: '2-digit'
        });
        return `
                 <li class="forecast-info-item swiper-slide">
                    <span class="time">${hour}</span>
                    <img src="https://openweathermap.org/img/wn/${item.weather[0].icon}@2x.png"  width="35" height="35" />
                    <span class="degrees">${Math.round(item.main.temp)}°</span>
                    <ul class="forecast-additional-info-list">
                        <li class="forecast-additional-info-item">
                            <svg class="" width="20" height="20">
                                <use href="/symbol-defs-2.svg#wind"></use>
                            </svg>
                            <span class="forecast-additional-info-value">${item.main.pressure} mm</span>
                        </li>
                        <li class="forecast-additional-info-item">
                            <svg class="" width="20" height="20">
                                <use href="/symbol-defs-2.svg#icon-humidity"></use>
                            </svg>
                            <span class="forecast-additional-info-value">${item.main.humidity}%</span>
                        </li>
                        <li class="forecast-additional-info-item">
                            <svg class="" width="20" height="20">
                                <use href="/symbol-defs-2.svg#icon-barometer"></use>
                            </svg>
                            <span class="forecast-additional-info-value">${item.wind.speed} m/s</span>
                        </li>
                    </ul>
                </li>`;
    }).join("")
};



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
};




