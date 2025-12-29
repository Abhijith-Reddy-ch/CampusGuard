// Auth & Session Management
function getSession() {
    const userStr = localStorage.getItem('user');
    return userStr ? JSON.parse(userStr) : null;
}

function checkAuth() {
    const user = getSession();
    if (!user) {
        window.location.href = '/login.html';
        return;
    }
    // Update Nav
    renderNav(user);
}

function logout() {
    localStorage.removeItem('user');
    window.location.href = '/login.html';
}

function renderNav(user) {
    const navUrl = document.querySelector('nav ul');
    if (!navUrl) return;

    let links = '';

    // Common Links
    links += `<li><a href="/index.html">Home</a></li>`;

    // Role Specific Links
    if (user.role === 'admin') {
        links += `<li><a href="/pages/register.html">Register</a></li>`;
        links += `<li><a href="/pages/schedule.html">Schedule</a></li>`;
        links += `<li><a href="/pages/admin.html">Admin Dashboard</a></li>`;
    }
    else if (user.role === 'teacher') {
        links += `<li><a href="/pages/teacher.html">Teacher Dashboard</a></li>`;
        links += `<li><a href="/pages/schedule.html">View Schedule</a></li>`;
    }
    else if (user.role === 'guard') {
        links += `<li><a href="/pages/entry.html">Entry Log</a></li>`;
        links += `<li><a href="/pages/exit.html">Exit Log</a></li>`;
        links += `<li><a href="/pages/visitor.html">Visitors</a></li>`;
        links += `<li><a href="/pages/proctor.html">Security</a></li>`;
    }
    else if (user.role === 'student') {
        links += `<li><a href="/pages/student-dashboard.html">My Dashboard</a></li>`;
    }

    // SOS & Logout (Everyone)
    links += `<li><a href="#" onclick="toggleTheme()">🌓 Theme</a></li>`;
    links += `<li><a href="#" style="color:red; font-weight:bold;" onclick="globalSOS()">SOS</a></li>`;
    links += `<li><a href="#" onclick="logout()">Logout (${user.name})</a></li>`;

    navUrl.innerHTML = links;

    // Apply saved theme
    if (localStorage.getItem('theme') === 'dark') {
        document.body.classList.add('dark-mode');
    }
}

// V14 Toggle
function toggleTheme() {
    document.body.classList.toggle('dark-mode');
    const isDark = document.body.classList.contains('dark-mode');
    localStorage.setItem('theme', isDark ? 'dark' : 'light');
}

// Global SOS
function globalSOS() {
    if (!confirm("ARE YOU SURE? SEND EMERGENCY SOS?")) return;

    const user = getSession();
    const id = user ? user.id : 'Unknown';

    // Try Geo
    if (navigator.geolocation) {
        navigator.geolocation.getCurrentPosition(pos => {
            apiCall('/api/sos', 'POST', { studentId: id, location: { lat: pos.coords.latitude, lng: pos.coords.longitude } })
                .then(() => showNotification("SOS SENT!", "error"));
        }, () => {
            apiCall('/api/sos', 'POST', { studentId: id, location: { lat: 0, lng: 0 } })
                .then(() => showNotification("SOS SENT!", "error"));
        });
    } else {
        apiCall('/api/sos', 'POST', { studentId: id, location: { lat: 0, lng: 0 } })
            .then(() => showNotification("SOS SENT!", "error"));
    }
}

// Global API Helper
async function apiCall(endpoint, method = 'GET', body = null) {
    try {
        const options = {
            method,
            headers: { 'Content-Type': 'application/json' }
        };
        if (body) options.body = JSON.stringify(body);
        const response = await fetch(endpoint, options);
        return await response.json();
    } catch (error) {
        showNotification("Connection Error", "error");
        return null;
    }
}

function showNotification(message, type = 'info') {
    const container = document.getElementById('notification-area');
    if (!container) return;
    const notif = document.createElement('div');
    notif.className = `notification ${type}`;
    notif.innerText = message;
    container.appendChild(notif);
    setTimeout(() => { notif.remove(); }, 3000);
}
