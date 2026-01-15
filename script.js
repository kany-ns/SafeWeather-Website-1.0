const API_KEY = '1d3157dfde962f1362a3d100078a8e10'; 

// 1. LOGIN & ROLE CHECK
window.onload = function() {
    const user = JSON.parse(localStorage.getItem('currentUser'));
    if (!user) window.location.href = 'login.html';

    document.getElementById('userInfo').innerText = `User: ${user.username} (${user.role})`;
    
    // Tunjuk section ikut Role
    if (user.role === 'admin') document.getElementById('adminSection').style.display = 'block';
    if (user.role === 'user') document.getElementById('userSection').style.display = 'block';
    if (user.isPro) document.getElementById('upgradeBtn').style.display = 'none';

    fetchWeather('Kuala Lumpur');
    loadReports();
};

// 2. WEATHER API & DYNAMIC BG
async function fetchWeather(city) {
    try {
        const res = await fetch(`https://api.openweathermap.org/data/2.5/weather?q=${city}&appid=${API_KEY}&units=metric`);
        const data = await res.json();
        
        document.getElementById('temp').innerText = Math.round(data.main.temp) + "°C";
        document.getElementById('desc').innerText = data.weather[0].description;
        
        // Tukar Background
        const weather = data.weather[0].main;
        let img = "https://images.unsplash.com/photo-1506744038136-46273834b3fb"; // Default Clear
        if(weather === 'Rain') img = "https://images.unsplash.com/photo-1519692938311-59b7a7c7afad";
        if(weather === 'Clouds') img = "https://images.unsplash.com/photo-1534088568595-a066f410bcda";
        
        document.body.style.backgroundImage = `linear-gradient(rgba(0,0,0,0.5), rgba(0,0,0,0.5)), url('${img}')`;
    } catch (e) { console.log("Weather error"); }
}

// 3. UPGRADE & PAYMENT SIMULATION
function handleUpgrade() {
    if(confirm("Pay RM10 to unlock Pro features?")) {
        let users = JSON.parse(localStorage.getItem('allUsers'));
        let current = JSON.parse(localStorage.getItem('currentUser'));
        
        users = users.map(u => {
            if(u.username === current.username) { u.isPro = true; current.isPro = true; }
            return u;
        });
        
        localStorage.setItem('allUsers', JSON.stringify(users));
        localStorage.setItem('currentUser', JSON.stringify(current));
        alert("Upgrade Successful!");
        location.reload();
    }
}

// 4. PRINT REPORT
function printReport() {
    window.print();
}

// 5. THEME TOGGLE
function toggleTheme() {
    document.body.classList.toggle('light-mode');
}

// 6. CHATBOT LOGIC
function toggleChat() { document.getElementById('chat-container').classList.toggle('chat-closed'); }
function sendMessage() {
    const msg = document.getElementById('chatInput').value.toLowerCase();
    const area = document.getElementById('chat-messages');
    let reply = "I don't understand, try asking about 'upgrade' or 'weather'.";
    
    if(msg.includes("upgrade")) reply = "Pro users can search for any city's weather!";
    if(msg.includes("weather")) reply = "We use real-time data from OpenWeather.";
    
    area.innerHTML += `<p><b>You:</b> ${msg}</p><p><b>Bot:</b> ${reply}</p>`;
    document.getElementById('chatInput').value = "";
}