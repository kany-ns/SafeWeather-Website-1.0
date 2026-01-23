/**
 * language-toggle.js
 * Manages website language switching.
 */

const translations = {
    en: {
        nav_home: "Home",
        nav_reports: "Reports",
        nav_hazard: "Hazard Map",
        nav_alerts: "Alerts",
        nav_gallery: "Gallery",
        nav_upgrade: "Upgrade",
        nav_login: "Login",
        nav_register: "Register",
        hero_title: "Real-Time Weather Alerts for School Transport Safety",
        hero_desc: "Protect students with timely weather warnings and hazard zone information designed specifically for school bus and van drivers.",
        btn_start: "Get Started Free",
        btn_learn: "Learn More",
        feature_weather_title: "Real-Time Weather Data",
        feature_map_title: "Interactive Hazard Map",
        feature_alerts_title: "Color-Coded Alerts",
        // Add more keys as needed
    },
    ms: {
        nav_home: "Utama",
        nav_reports: "Laporan",
        nav_hazard: "Peta Bahaya",
        nav_alerts: "Amaran",
        nav_gallery: "Galeri",
        nav_upgrade: "Naik Taraf",
        nav_login: "Log Masuk",
        nav_register: "Daftar",
        hero_title: "Amaran Cuaca Masa Nyata untuk Keselamatan Pengangkutan Sekolah",
        hero_desc: "Lindungi pelajar dengan amaran cuaca tepat pada masanya dan maklumat zon bahaya yang direka khusus untuk pemandu bas dan van sekolah.",
        btn_start: "Mula Percuma",
        btn_learn: "Ketahui Lanjut",
        feature_weather_title: "Data Cuaca Masa Nyata",
        feature_map_title: "Peta Bahaya Interaktif",
        feature_alerts_title: "Amaran Berwarna",
    }
};

function changeLanguage(lang) {
    localStorage.setItem('language', lang);
    document.documentElement.setAttribute('lang', lang);

    const currentLangSpan = document.getElementById('current-lang');
    if (currentLangSpan) currentLangSpan.textContent = lang.toUpperCase();

    // Update the dropdown active state
    document.querySelectorAll('.language-dropdown button').forEach(btn => {
        btn.classList.toggle('active', btn.dataset.lang === lang);
    });

    // Replace text for all elements with data-lang attribute
    const elements = document.querySelectorAll('[data-lang]');
    elements.forEach(element => {
        const key = element.getAttribute('data-lang');
        if (translations[lang] && translations[lang][key]) {
            // Check if element is a button/link with an icon
            const icon = element.querySelector('i');
            if (icon) {
                element.innerHTML = ''; // Clear text
                element.appendChild(icon); // Keep the icon
                element.appendChild(document.createTextNode(' ' + translations[lang][key]));
            } else {
                element.textContent = translations[lang][key];
            }
        }
    });
}

// Initialization
document.addEventListener('DOMContentLoaded', () => {
    const savedLang = localStorage.getItem('language') || 'en';
    changeLanguage(savedLang);

    const langToggle = document.getElementById('lang-toggle');
    const langDropdown = document.querySelector('.language-dropdown');

    if (langToggle && langDropdown) {
        langToggle.addEventListener('click', (e) => {
            e.stopPropagation();
            langDropdown.classList.toggle('show'); // Use a CSS class for visibility
        });

        document.querySelectorAll('.language-dropdown button').forEach(btn => {
            btn.addEventListener('click', (e) => {
                changeLanguage(e.target.dataset.lang);
                langDropdown.classList.remove('show');
            });
        });
    }
});