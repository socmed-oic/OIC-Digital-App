// DOM Elements
const loginView = document.getElementById('login-view');
const hubView = document.getElementById('hub-view');
const dashboardView = document.getElementById('dashboard-view');
const backToHubBtn = document.getElementById('back-to-hub');

// PIN Logic
const CORRECT_PIN = '1234';
let currentPin = '';
const pinDots = document.querySelectorAll('.pin-dot');
const keys = document.querySelectorAll('.pin-keypad .key:not(.action-key)');
const clearBtn = document.getElementById('pin-clear');
const enterBtn = document.getElementById('pin-enter');
const errorMsg = document.getElementById('pin-error');

function updatePinDisplay() {
    pinDots.forEach((dot, index) => {
        if (index < currentPin.length) {
            dot.classList.add('filled');
            dot.classList.remove('error');
        } else {
            dot.classList.remove('filled', 'error');
        }
    });
}

function showError() {
    errorMsg.textContent = 'Incorrect PIN. Please try again.';
    pinDots.forEach(dot => dot.classList.add('error'));
    currentPin = '';
    setTimeout(() => {
        updatePinDisplay();
        errorMsg.textContent = '';
    }, 1500);
}

keys.forEach(key => {
    key.addEventListener('click', () => {
        if (currentPin.length < 4) {
            currentPin += key.textContent;
            updatePinDisplay();
        }
    });
});

clearBtn.addEventListener('click', () => {
    currentPin = currentPin.slice(0, -1);
    updatePinDisplay();
});

enterBtn.addEventListener('click', () => {
    if (currentPin === CORRECT_PIN) {
        // Success
        loginView.classList.remove('active');
        hubView.classList.add('active');
    } else {
        showError();
    }
});

// Navigation Logic
const hubCards = document.querySelectorAll('.hub-card');
const navLinks = document.querySelectorAll('.nav-links li');
const modules = document.querySelectorAll('.module-section');
const titleSpan = document.getElementById('current-module-title');

function showModule(targetId, titleText) {
    // Hide all modules and deactivate nav links
    modules.forEach(mod => mod.classList.remove('active'));
    navLinks.forEach(nav => nav.classList.remove('active'));
    
    // Show target module and activate nav link
    document.getElementById(targetId).classList.add('active');
    const targetLink = document.querySelector(`.nav-links li[data-target="${targetId}"]`);
    if (targetLink) targetLink.classList.add('active');
    
    // Update Title
    titleSpan.textContent = titleText;
}

hubCards.forEach(card => {
    card.addEventListener('click', () => {
        const targetId = card.getAttribute('data-module');
        const titleText = card.querySelector('h3').textContent;
        
        hubView.classList.remove('active');
        dashboardView.classList.add('active');
        
        showModule(targetId, titleText);
    });
});

navLinks.forEach(link => {
    link.addEventListener('click', () => {
        const targetId = link.getAttribute('data-target');
        const titleText = link.querySelector('span').textContent;
        showModule(targetId, titleText);
    });
});

backToHubBtn.addEventListener('click', () => {
    dashboardView.classList.remove('active');
    hubView.classList.add('active');
});

// Chart Colors based on brand
const primaryColor = '#2e1900';
const accentColor = '#cfa872';
const lightAccent = '#e8cd9c';
const bgColors = [primaryColor, accentColor, lightAccent, '#8c6d46', '#d6baa2'];

// Common Chart Options for cleaner look
const commonOptions = {
    responsive: true,
    maintainAspectRatio: false,
    scales: {
        x: { grid: { display: false } },
        y: { grid: { display: false }, beginAtZero: true }
    },
    plugins: {
        legend: { position: 'top', labels: { usePointStyle: true, boxWidth: 8 } }
    }
};

// 1. Ads Chart
const ctxAds = document.getElementById('adsChart').getContext('2d');
new Chart(ctxAds, {
    type: 'bar',
    data: {
        labels: ['Google Ads', 'Meta Ads', 'TikTok Ads'],
        datasets: [{
            label: 'Impressions (M)',
            data: [2.5, 3.2, 4.1],
            backgroundColor: primaryColor,
            borderRadius: 8
        }, {
            label: 'Clicks (K)',
            data: [150, 210, 320],
            backgroundColor: accentColor,
            borderRadius: 8
        }]
    },
    options: commonOptions
});

// 2. PR ROI Chart
const ctxPr = document.getElementById('prRoiChart').getContext('2d');
new Chart(ctxPr, {
    type: 'line',
    data: {
        labels: ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun'],
        datasets: [{
            label: 'PR Cost',
            data: [10, 15, 12, 20, 18, 25],
            borderColor: primaryColor,
            backgroundColor: primaryColor,
            tension: 0.4
        }, {
            label: 'Earned Media Value',
            data: [25, 35, 30, 50, 45, 65],
            borderColor: accentColor,
            backgroundColor: accentColor,
            tension: 0.4
        }]
    },
    options: commonOptions
});

// 3. Sentiment Chart
const ctxSent = document.getElementById('sentimentChart').getContext('2d');
new Chart(ctxSent, {
    type: 'doughnut',
    data: {
        labels: ['Positive', 'Neutral', 'Negative'],
        datasets: [{
            data: [75, 20, 5],
            backgroundColor: ['#10b981', '#f59e0b', '#ef4444'],
            borderWidth: 0
        }]
    },
    options: {
        responsive: true,
        maintainAspectRatio: false,
        cutout: '75%',
        plugins: {
            legend: { position: 'bottom', labels: { usePointStyle: true } }
        }
    }
});

// 4. Trend Radar Chart
const ctxTrend = document.getElementById('trendChart').getContext('2d');
new Chart(ctxTrend, {
    type: 'radar',
    data: {
        labels: ['Wellness', 'Beauty', 'Fitness', 'Mental Health', 'Nutrition'],
        datasets: [{
            label: 'Current Trend Volume',
            data: [85, 65, 90, 75, 60],
            backgroundColor: 'rgba(207, 168, 114, 0.2)',
            borderColor: accentColor,
            pointBackgroundColor: primaryColor
        }]
    },
    options: {
        responsive: true, maintainAspectRatio: false,
        scales: { r: { ticks: { display: false } } }
    }
});

// 5. Regional Outlet Performance
const ctxOutlet = document.getElementById('outletChart').getContext('2d');
new Chart(ctxOutlet, {
    type: 'bar',
    data: {
        labels: ['Jabodetabek', 'Jawa Barat', 'Jawa Tengah', 'Jawa Timur', 'Bali'],
        datasets: [{
            label: 'Revenue (M)',
            data: [1200, 850, 600, 750, 950],
            backgroundColor: bgColors,
            borderRadius: 8
        }]
    },
    options: { 
        ...commonOptions,
        plugins: { legend: { display: false } }
    }
});
