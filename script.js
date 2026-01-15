// 1. Theme Toggle
const themeBtn = document.getElementById('theme-toggle');
themeBtn.addEventListener('click', () => {
    document.body.classList.toggle('dark-theme');
    const theme = document.body.classList.contains('dark-theme') ? 'dark' : 'light';
    localStorage.setItem('selected-theme', theme);
});

// 2. OpenWeather API Integration (Gantikan YOUR_API_KEY)
const apiKey = '366289029a482870e390151d7218e6ab';
const city = 'Kuala Lumpur';

async function fetchWeather() {
    try {
        const response = await fetch(`https://api.openweathermap.org/data/2.5/weather?q=${city}&appid=${apiKey}&units=metric`);
        const data = await response.json();
        
        document.getElementById('city-name').innerText = `Lokasi: ${data.name}`;
        document.getElementById('temp').innerText = `${Math.round(data.main.temp)}°C`;
        document.getElementById('desc').innerText = data.weather[0].description;
        
        // Logik Tukar Warna Amaran
        const alertBox = document.getElementById('alert-box');
        if (data.weather[0].main === 'Rain') {
            alertBox.className = 'alert-yellow';
            alertBox.innerText = 'Amaran: Hujan, Pandu Berhati-hati';
        } else if (data.weather[0].main === 'Thunderstorm') {
            alertBox.className = 'alert-red';
            alertBox.innerText = 'Bahaya: Ribut Petir, Elakkan Memandu';
        }
    } catch (error) {
        console.log("Gagal mengambil data cuaca");
    }
}

fetchWeather();
