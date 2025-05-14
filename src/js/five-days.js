// !--------- swiper---------------
let forecastSwiper;

function initForecastSwiper() {
    if (typeof Swiper === 'undefined') return;

    const screenWidth = window.innerWidth;
    const prevBtn = document.querySelector('.my-button-prev');
    const nextBtn = document.querySelector('.my-button-next');

    if (screenWidth < 768 && !forecastSwiper) {
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

    } else if (screenWidth >= 768 && forecastSwiper) {
        forecastSwiper.destroy(true, true);
        forecastSwiper = null;

        prevBtn?.removeAttribute('disabled');
        nextBtn?.removeAttribute('disabled');
    }

    function updateNavButtons() {
        if (!forecastSwiper) return;

        const prevBtn = document.querySelector('.my-button-prev');
        const nextBtn = document.querySelector('.my-button-next');

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

if (typeof Swiper !== 'undefined' && document.querySelector('.forecast-info-swiper')) {
    new Swiper(".forecast-info-swiper", {
        slidesPerView: 2,
        spaceBetween: 30,
        freeMode: true,
        pagination: {
            el: ".swiper-pagination",
            clickable: true,
            hide: false,
        },
    });
}

// !------------------Функціонал "more info" кнопок-----
const detailButtons = document.querySelectorAll('.forecast-card-details-btn');

detailButtons.forEach(button => {
    button.addEventListener('click', function () {
        const card = this.closest('.forecast-card');
        const infoWrap = card.querySelector('.forecast-info-wrap');

        if (infoWrap.classList.contains('open')) {
            infoWrap.classList.remove('open');
            this.textContent = 'more info';
        } else {
            infoWrap.classList.add('open');
            this.textContent = 'less info';
        }
    });
});
