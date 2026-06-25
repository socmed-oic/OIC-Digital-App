// Navigation Logic
const navLinks = document.querySelectorAll('.nav-links li');
const modules = document.querySelectorAll('.module-section');
const titleSpan = document.getElementById('current-module-title');

navLinks.forEach(link => {
    link.addEventListener('click', () => {
        // Remove active class
        navLinks.forEach(nav => nav.classList.remove('active'));
        modules.forEach(mod => mod.classList.remove('active'));
        
        // Add active class
        link.classList.add('active');
        const targetId = link.getAttribute('data-target');
        document.getElementById(targetId).classList.add('active');
        
        // Update Title
        titleSpan.textContent = link.textContent.trim();
    });
});

// Chart Colors based on brand
const primaryColor = '#2e1900';
const accentColor = '#cfa872';
const lightAccent = '#e8cd9c';
const bgColors = [primaryColor, accentColor, lightAccent, '#8c6d46', '#d6baa2'];

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
            borderRadius: 6
        }, {
            label: 'Clicks (K)',
            data: [150, 210, 320],
            backgroundColor: accentColor,
            borderRadius: 6
        }]
    },
    options: { responsive: true, maintainAspectRatio: false }
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
            tension: 0.4
        }, {
            label: 'Earned Media Value',
            data: [25, 35, 30, 50, 45, 65],
            borderColor: accentColor,
            tension: 0.4
        }]
    },
    options: { responsive: true, maintainAspectRatio: false }
});

// 3. Sentiment Chart
const ctxSent = document.getElementById('sentimentChart').getContext('2d');
new Chart(ctxSent, {
    type: 'doughnut',
    data: {
        labels: ['Positive', 'Neutral', 'Negative'],
        datasets: [{
            data: [75, 20, 5],
            backgroundColor: ['#28a745', '#ffc107', '#dc3545'],
            borderWidth: 0
        }]
    },
    options: { responsive: true, maintainAspectRatio: false, cutout: '70%' }
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
    options: { responsive: true, maintainAspectRatio: false }
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
            borderRadius: 6
        }]
    },
    options: { 
        responsive: true, 
        maintainAspectRatio: false,
        plugins: { legend: { display: false } }
    }
});
