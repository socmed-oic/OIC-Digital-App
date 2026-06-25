document.addEventListener('DOMContentLoaded', () => {
    // =========================================================================
    // 1. PIN LOGIN SYSTEM
    // =========================================================================
    const CORRECT_PIN = '1234';
    let currentPin = '';
    const pinDots = document.querySelectorAll('.pin-dot');
    const numberKeys = document.querySelectorAll('.pin-keypad .key:not(.action-key)');
    const clearBtn = document.getElementById('pin-clear');
    const enterBtn = document.getElementById('pin-enter');
    const errorMsg = document.getElementById('pin-error');
    
    const loginView = document.getElementById('login-view');
    const hubView = document.getElementById('hub-view');
    const dashboardView = document.getElementById('dashboard-view');

    function updatePinDisplay() {
        pinDots.forEach((dot, index) => {
            if (index < currentPin.length) {
                dot.classList.add('filled');
            } else {
                dot.classList.remove('filled');
            }
            dot.classList.remove('error');
        });
        errorMsg.textContent = '';
    }

    numberKeys.forEach(key => {
        key.addEventListener('click', () => {
            if (currentPin.length < 4) {
                currentPin += key.textContent;
                updatePinDisplay();
            }
        });
    });

    clearBtn.addEventListener('click', () => {
        if (currentPin.length > 0) {
            currentPin = currentPin.slice(0, -1);
            updatePinDisplay();
        }
    });

    enterBtn.addEventListener('click', () => {
        if (currentPin.length === 4) {
            if (currentPin === CORRECT_PIN) {
                // Success
                loginView.classList.remove('active');
                hubView.classList.add('active');
            } else {
                // Error
                errorMsg.textContent = 'Incorrect PIN';
                pinDots.forEach(dot => dot.classList.add('error'));
                setTimeout(() => {
                    currentPin = '';
                    updatePinDisplay();
                }, 1000);
            }
        }
    });

    // =========================================================================
    // 2. NAVIGATION (HUB & SIDEBAR)
    // =========================================================================
    const hubCards = document.querySelectorAll('.hub-card');
    const navLinks = document.querySelectorAll('.nav-links li');
    const moduleSections = document.querySelectorAll('.module-section');
    const currentModuleTitle = document.getElementById('current-module-title');
    const backToHubBtn = document.getElementById('back-to-hub');

    function showModule(targetId, title) {
        // Hide all modules
        moduleSections.forEach(section => section.classList.remove('active'));
        
        // Show target module
        const targetModule = document.getElementById(targetId);
        if (targetModule) targetModule.classList.add('active');
        
        // Update Title
        if (title) currentModuleTitle.textContent = title;

        // Update sidebar active state
        navLinks.forEach(link => {
            if (link.dataset.target === targetId) {
                link.classList.add('active');
            } else {
                link.classList.remove('active');
            }
        });
    }

    // Hub Click
    hubCards.forEach(card => {
        card.addEventListener('click', () => {
            const targetId = card.dataset.module;
            const title = card.querySelector('h3').textContent;
            hubView.classList.remove('active');
            dashboardView.classList.add('active');
            showModule(targetId, title);
        });
    });

    // Sidebar Click
    navLinks.forEach(link => {
        link.addEventListener('click', () => {
            const targetId = link.dataset.target;
            const title = link.getAttribute('title') || link.querySelector('span').textContent;
            showModule(targetId, title);
        });
    });

    // Back to Hub
    backToHubBtn.addEventListener('click', () => {
        dashboardView.classList.remove('active');
        hubView.classList.add('active');
    });

    // =========================================================================
    // 3. REAL-TIME CLOCK
    // =========================================================================
    const datePill = document.getElementById('topbar-date');
    function updateClock() {
        if (!datePill) return;
        const now = new Date();
        const options = { weekday: 'short', day: 'numeric', month: 'short', year: 'numeric' };
        datePill.textContent = now.toLocaleDateString('en-GB', options);
    }
    setInterval(updateClock, 60000);
    updateClock();

    // =========================================================================
    // 4. GOOGLE SHEETS INTEGRATION (Ads Module)
    // =========================================================================
    const connectBtn = document.getElementById('connect-sheets');
    const urlInput = document.getElementById('sheet-url-input');
    const sheetsStatus = document.getElementById('sheets-status');

    class SheetsManager {
        static extractSheetId(url) {
            const match = url.match(/\/d\/([a-zA-Z0-9-_]+)/);
            return match ? match[1] : null;
        }

        static async connect(url) {
            const sheetId = this.extractSheetId(url);
            if (!sheetId) throw new Error('Invalid Google Sheets URL');

            const queryUrl = `https://docs.google.com/spreadsheets/d/${sheetId}/gviz/tq?tqx=out:json`;
            
            const response = await fetch(queryUrl);
            const text = await response.text();
            
            // Remove the google visualization wrapper
            const jsonStr = text.substring(text.indexOf('{'), text.lastIndexOf('}') + 1);
            const data = JSON.parse(jsonStr);
            
            return data.table;
        }
    }

    if (connectBtn) {
        connectBtn.addEventListener('click', async () => {
            const url = urlInput.value.trim();
            if (!url) return;

            sheetsStatus.className = 'sheets-status';
            sheetsStatus.textContent = 'Connecting...';
            sheetsStatus.style.color = '#fbbf24';

            try {
                const table = await SheetsManager.connect(url);
                sheetsStatus.className = 'sheets-status connected';
                sheetsStatus.textContent = `Connected — ${table.rows.length} rows loaded`;
                sheetsStatus.style.color = ''; // Use CSS class color
                console.log('Sheets Data Loaded:', table);
            } catch (err) {
                sheetsStatus.className = 'sheets-status disconnected';
                sheetsStatus.textContent = 'Connection failed';
                sheetsStatus.style.color = '';
                console.error(err);
            }
        });
    }

    // =========================================================================
    // 5. CHART.JS CONFIGURATION (Spatial Aesthetic)
    // =========================================================================
    // To match the brown gradient glassmorphism, we use whites and translucent whites
    const GLASS_COLORS = {
        white: '#ffffff',
        white70: 'rgba(255, 255, 255, 0.7)',
        white30: 'rgba(255, 255, 255, 0.3)',
        white10: 'rgba(255, 255, 255, 0.1)',
        white05: 'rgba(255, 255, 255, 0.05)',
        accentRed: '#fca5a5',
        accentGreen: '#86efac',
        accentGold: '#fde047'
    };

    Chart.defaults.color = GLASS_COLORS.white70;
    Chart.defaults.font.family = "'Plus Jakarta Sans', sans-serif";
    Chart.defaults.font.size = 12;
    Chart.defaults.plugins.legend.labels.usePointStyle = true;
    Chart.defaults.plugins.legend.labels.boxWidth = 8;
    
    // Global scales for glassmorphism
    const glassScales = {
        x: {
            grid: { display: false },
            border: { display: false }
        },
        y: {
            grid: { color: GLASS_COLORS.white10 },
            border: { display: false },
            beginAtZero: true
        }
    };

    function tryCreateChart(id, config) {
        const ctx = document.getElementById(id);
        if (ctx) return new Chart(ctx, config);
        return null;
    }

    // a) Ads Performance (Bar)
    tryCreateChart('adsChart', {
        type: 'bar',
        data: {
            labels: ['Google', 'Meta', 'TikTok', 'LinkedIn'],
            datasets: [
                {
                    label: 'Clicks (K)',
                    data: [150, 210, 320, 85],
                    backgroundColor: GLASS_COLORS.white,
                    borderRadius: 20,
                    barThickness: 12
                },
                {
                    label: 'Spend (M)',
                    data: [25, 32, 41, 18],
                    backgroundColor: GLASS_COLORS.white30,
                    borderRadius: 20,
                    barThickness: 12
                }
            ]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            scales: glassScales,
            plugins: { legend: { display: false } } // Handled via custom HTML tabs
        }
    });

    // b) Ads Budget (Doughnut)
    tryCreateChart('adsPieChart', {
        type: 'doughnut',
        data: {
            labels: ['Google', 'Meta', 'TikTok'],
            datasets: [{
                data: [35, 40, 25],
                backgroundColor: [GLASS_COLORS.white, GLASS_COLORS.white70, GLASS_COLORS.white30],
                borderWidth: 0,
                cutout: '80%'
            }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            plugins: { legend: { display: false } }
        }
    });

    // c) PR ROI (Line)
    tryCreateChart('prRoiChart', {
        type: 'line',
        data: {
            labels: ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun'],
            datasets: [
                {
                    label: 'EMV',
                    data: [25, 35, 30, 50, 45, 65],
                    borderColor: GLASS_COLORS.white,
                    backgroundColor: GLASS_COLORS.white10,
                    borderWidth: 2,
                    fill: true,
                    tension: 0.4,
                    pointBackgroundColor: GLASS_COLORS.white,
                    pointRadius: 0, // Minimalist, points show on hover
                    pointHoverRadius: 6
                },
                {
                    label: 'PR Cost',
                    data: [10, 15, 12, 20, 18, 25],
                    borderColor: GLASS_COLORS.white30,
                    borderWidth: 2,
                    fill: false,
                    tension: 0.4,
                    pointRadius: 0
                }
            ]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            scales: glassScales
        }
    });

    // d) Sentiment (Doughnut)
    tryCreateChart('sentimentChart', {
        type: 'doughnut',
        data: {
            labels: ['Positive', 'Neutral', 'Negative'],
            datasets: [{
                data: [85, 10, 5],
                backgroundColor: [GLASS_COLORS.white, GLASS_COLORS.white30, GLASS_COLORS.accentRed],
                borderWidth: 0,
                cutout: '85%' // Very thin ring like reference 3
            }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            plugins: { legend: { display: false } }
        }
    });

    // e) Trend Radar
    tryCreateChart('trendChart', {
        type: 'radar',
        data: {
            labels: ['Wellness', 'Beauty', 'Fitness', 'Mental Health', 'Nutrition'],
            datasets: [{
                label: 'Trend Score',
                data: [85, 65, 90, 75, 60],
                backgroundColor: GLASS_COLORS.white10,
                borderColor: GLASS_COLORS.white,
                pointBackgroundColor: GLASS_COLORS.white,
                pointBorderColor: GLASS_COLORS.white,
                borderWidth: 1,
                pointRadius: 4
            }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            scales: {
                r: {
                    grid: { color: GLASS_COLORS.white10 },
                    angleLines: { color: GLASS_COLORS.white10 },
                    ticks: { display: false },
                    pointLabels: { color: GLASS_COLORS.white70 }
                }
            },
            plugins: { legend: { display: false } }
        }
    });

    // f) Outlet Ranking (Horizontal Bar)
    tryCreateChart('outletChart', {
        type: 'bar',
        data: {
            labels: ['Jabodetabek', 'Jawa Barat', 'Jawa Timur', 'Bali', 'Jawa Tengah'],
            datasets: [{
                label: 'Revenue',
                data: [1200, 850, 750, 950, 600],
                backgroundColor: GLASS_COLORS.white70,
                borderRadius: 20,
                barThickness: 16
            }]
        },
        options: {
            indexAxis: 'y',
            responsive: true,
            maintainAspectRatio: false,
            scales: {
                x: {
                    grid: { color: GLASS_COLORS.white10 },
                    border: { display: false },
                    beginAtZero: true
                },
                y: {
                    grid: { display: false },
                    border: { display: false }
                }
            },
            plugins: { legend: { display: false } }
        }
    });
});
