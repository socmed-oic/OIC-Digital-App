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
                loginView.classList.remove('active');
                hubView.classList.add('active');
            } else {
                errorMsg.textContent = 'Incorrect PIN';
                pinDots.forEach(dot => dot.classList.add('error'));
                setTimeout(() => {
                    currentPin = '';
                    updatePinDisplay();
                }, 1000);
            }
        }
    });

    // Keyboard support for PIN
    document.addEventListener('keydown', (e) => {
        if (!loginView.classList.contains('active')) return;
        
        if (e.key >= '0' && e.key <= '9') {
            if (currentPin.length < 4) {
                currentPin += e.key;
                updatePinDisplay();
            }
        } else if (e.key === 'Backspace') {
            if (currentPin.length > 0) {
                currentPin = currentPin.slice(0, -1);
                updatePinDisplay();
            }
        } else if (e.key === 'Enter') {
            enterBtn.click();
        }
    });

    // =========================================================================
    // 2. STANDALONE NAVIGATION (Hub & Exit)
    // =========================================================================
    const hubCards = document.querySelectorAll('.hub-card');
    const moduleSections = document.querySelectorAll('.module-section');
    const currentModuleTitle = document.getElementById('current-module-title');
    const sidebarActiveModule = document.getElementById('sidebar-active-module');
    const backToHubBtn = document.getElementById('back-to-hub');

    hubCards.forEach(card => {
        card.addEventListener('click', () => {
            const targetId = card.dataset.module;
            const title = card.dataset.title;
            const iconClass = card.dataset.icon;
            
            // Show Dashboard View
            hubView.classList.remove('active');
            dashboardView.classList.add('active');
            
            // Hide all modules, show target
            moduleSections.forEach(section => section.classList.remove('active'));
            const targetModule = document.getElementById(targetId);
            if (targetModule) targetModule.classList.add('active');
            
            // Update Title
            currentModuleTitle.textContent = title;

            // Update static sidebar content
            sidebarActiveModule.innerHTML = `<i class="fa-solid ${iconClass}"></i><span>${title.split(' ')[0]}</span>`;
        });
    });

    // Exit to Hub
    backToHubBtn.addEventListener('click', () => {
        dashboardView.classList.remove('active');
        hubView.classList.add('active');
    });

    // Initialize Flatpickr Date Range
    flatpickr("#date-range-picker", {
        mode: "range",
        dateFormat: "d M Y",
        position: "auto right",
        defaultDate: [new Date(new Date().setDate(new Date().getDate() - 7)), new Date()]
    });

    // =========================================================================
    // 3. META ADS CHART.JS CONFIGURATION (Empty States)
    // =========================================================================
    const GLASS_COLORS = {
        white: '#ffffff',
        white70: 'rgba(255, 255, 255, 0.7)',
        white30: 'rgba(255, 255, 255, 0.3)',
        white10: 'rgba(255, 255, 255, 0.1)',
        accentRed: '#fca5a5',
        accentGreen: '#86efac',
        accentGold: '#fde047',
        accentPurple: '#a78bfa'
    };

    Chart.defaults.color = GLASS_COLORS.white70;
    Chart.defaults.font.family = "'Plus Jakarta Sans', sans-serif";
    Chart.defaults.font.size = 12;
    Chart.defaults.plugins.legend.labels.usePointStyle = true;
    Chart.defaults.plugins.legend.labels.boxWidth = 8;
    
    const glassScales = {
        x: { grid: { display: false }, border: { display: false } },
        y: { grid: { color: GLASS_COLORS.white10 }, border: { display: false }, beginAtZero: true }
    };

    function tryCreateChart(id, config) {
        const ctx = document.getElementById(id);
        if (ctx) return new Chart(ctx, config);
        return null;
    }

    // a) Demographics (Age & Gender)
    const demoChart = tryCreateChart('demoChart', {
        type: 'bar',
        data: {
            labels: ['18-24', '25-34', '35-44', '45-54', '55-64', '65+'],
            datasets: [
                {
                    label: 'Female',
                    data: [0, 0, 0, 0, 0, 0], // Empty state
                    backgroundColor: GLASS_COLORS.white,
                    borderRadius: 20,
                    barThickness: 12
                },
                {
                    label: 'Male',
                    data: [0, 0, 0, 0, 0, 0], // Empty state
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
            plugins: { legend: { position: 'top' } }
        }
    });

    // b) Platform Split (FB, Insta, AudNet)
    const platformChart = tryCreateChart('platformChart', {
        type: 'doughnut',
        data: {
            labels: ['Instagram', 'Facebook', 'Audience Network', 'Messenger'],
            datasets: [{
                data: [0, 0, 0, 0], // Empty State (Shows gray ring initially)
                backgroundColor: [GLASS_COLORS.white, GLASS_COLORS.white70, GLASS_COLORS.white30, GLASS_COLORS.white10],
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

    // c) Placement Performance (Horizontal Bar)
    const placementChart = tryCreateChart('placementChart', {
        type: 'bar',
        data: {
            labels: ['Instagram Stories', 'Facebook Feed', 'Instagram Reels', 'Instagram Feed', 'FB Video Feeds'],
            datasets: [{
                label: 'ROAS',
                data: [0, 0, 0, 0, 0], // Empty state
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
                x: { grid: { color: GLASS_COLORS.white10 }, border: { display: false }, beginAtZero: true },
                y: { grid: { display: false }, border: { display: false } }
            },
            plugins: { legend: { display: false } }
        }
    });

    // =========================================================================
    // 4. AI DATA PROCESSOR (Gemini API & Google Sheets Auto-Sync)
    // =========================================================================
    const apiKeyInput = document.getElementById('gemini-api-key');
    const saveKeyBtn = document.getElementById('save-api-key');
    const keyStatus = document.getElementById('api-key-status');
    
    const syncUrlInput = document.getElementById('gsheet-sync-url');
    const saveSyncUrlBtn = document.getElementById('save-sync-url');
    const syncUrlStatus = document.getElementById('sync-url-status');

    const uploadZone = document.getElementById('upload-zone');
    const fileInput = document.getElementById('file-input');
    const chatInterface = document.getElementById('ai-chat-interface');
    const chatLog = document.getElementById('chat-log');
    const chatInput = document.getElementById('chat-input');
    const sendChatBtn = document.getElementById('send-chat');
    const datasetStats = document.getElementById('dataset-stats');
    const triggerSyncBtn = document.getElementById('trigger-sync-btn');

    let geminiApiKey = localStorage.getItem('gemini_api_key') || '';
    let gsheetSyncUrl = localStorage.getItem('gsheet_sync_url') || 'https://script.google.com/macros/s/AKfycbzPTWHY2h8Dqk2cRCf0BF5ctN9RiuLHj4s9W0XeTVtmnzHMDS-ix_zQlFAagJNdscPJBw/exec';
    let currentParsedData = null; // Holds the full parsed array
    let currentDataProfile = null;
    let chatHistory = [];

    // Load saved configurations
    if (geminiApiKey) {
        apiKeyInput.value = geminiApiKey;
        keyStatus.className = 'sheets-status connected';
        keyStatus.textContent = 'Key Saved';
    }
    if (gsheetSyncUrl) {
        syncUrlInput.value = gsheetSyncUrl;
        syncUrlStatus.className = 'sheets-status connected';
        syncUrlStatus.textContent = 'Webhook Ready';
    }

    if (saveKeyBtn) {
        saveKeyBtn.addEventListener('click', () => {
            const val = apiKeyInput.value.trim();
            if (val) {
                geminiApiKey = val;
                localStorage.setItem('gemini_api_key', val);
                keyStatus.className = 'sheets-status connected';
                keyStatus.textContent = 'Key Saved';
            }
        });
    }

    if (saveSyncUrlBtn) {
        saveSyncUrlBtn.addEventListener('click', () => {
            const val = syncUrlInput.value.trim();
            if (val) {
                gsheetSyncUrl = val;
                localStorage.setItem('gsheet_sync_url', val);
                syncUrlStatus.className = 'sheets-status connected';
                syncUrlStatus.textContent = 'Webhook Ready';
            }
        });
    }

    // Upload Handlers
    if (uploadZone) {
        uploadZone.addEventListener('click', () => fileInput.click());
        uploadZone.addEventListener('dragover', (e) => { e.preventDefault(); uploadZone.style.borderColor = 'rgba(255,255,255,0.8)'; });
        uploadZone.addEventListener('dragleave', () => { uploadZone.style.borderColor = 'rgba(255,255,255,0.3)'; });
        uploadZone.addEventListener('drop', (e) => {
            e.preventDefault();
            uploadZone.style.borderColor = 'rgba(255,255,255,0.3)';
            if (e.dataTransfer.files.length) processFile(e.dataTransfer.files[0]);
        });
        
        fileInput.addEventListener('change', (e) => {
            if (e.target.files.length) processFile(e.target.files[0]);
        });
    }

    function handleParsedData(data, columns, filename) {
        currentParsedData = data;
        
        // Pre-analysis
        let blankCount = 0;
        data.forEach(row => {
            columns.forEach(col => { if (!row[col] && row[col] !== 0) blankCount++; });
        });

        currentDataProfile = {
            filename: filename,
            totalRows: data.length,
            columns: columns,
            blankCellsFound: blankCount,
            sampleData: data.slice(0, 5)
        };

        // Update UI
        datasetStats.textContent = `${data.length} Rows Loaded`;
        uploadZone.style.display = 'none';
        chatInterface.style.display = 'flex';

        // Initial AI Message
        chatHistory = [];
        addChatMessage('AI', `I've successfully loaded **${filename}**. It contains ${data.length} rows and ${columns.length} columns. I detected ${blankCount} blank cells. How would you like to process this Meta Ads data before syncing to the database?`);
        
        // Populate UI with mock data to simulate "previewing" the data
        simulateChartUpdates(data.length);
    }

    function processFile(file) {
        const ext = file.name.split('.').pop().toLowerCase();
        
        if (ext === 'csv') {
            Papa.parse(file, {
                header: true,
                skipEmptyLines: true,
                complete: function(results) {
                    handleParsedData(results.data, results.meta.fields, file.name);
                }
            });
        } else if (ext === 'xls' || ext === 'xlsx') {
            // Using SheetJS
            const reader = new FileReader();
            reader.onload = function(e) {
                const data = new Uint8Array(e.target.result);
                const workbook = XLSX.read(data, {type: 'array'});
                const firstSheetName = workbook.SheetNames[0];
                const worksheet = workbook.Sheets[firstSheetName];
                const json = XLSX.utils.sheet_to_json(worksheet, {defval: ""});
                
                if (json.length > 0) {
                    const columns = Object.keys(json[0]);
                    handleParsedData(json, columns, file.name);
                } else {
                    alert('The Excel file appears to be empty.');
                }
            };
            reader.readAsArrayBuffer(file);
        } else {
            alert('Please upload a CSV or Excel (.xls, .xlsx) file.');
        }
    }

    function simulateChartUpdates(rowCount) {
        // Just visual flair to show the dashboard reacting to the upload
        document.getElementById('kpi-spend').textContent = `Rp ${(rowCount * 0.5).toFixed(1)}M`;
        document.getElementById('kpi-impressions').textContent = `${(rowCount * 12.5).toFixed(0)}K`;
        document.getElementById('kpi-ctr').textContent = `2.4%`;
        document.getElementById('kpi-roas').textContent = `3.1x`;
        
        document.querySelectorAll('.trend').forEach(el => el.textContent = 'Previewing Local Data');
    }

    function addChatMessage(sender, text) {
        const bubble = document.createElement('div');
        bubble.className = `chat-bubble ${sender === 'AI' ? 'ai' : 'user'}`;
        const formattedText = text.replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>');
        bubble.innerHTML = formattedText;
        chatLog.appendChild(bubble);
        chatLog.scrollTop = chatLog.scrollHeight;
    }

    async function sendToGemini(userText) {
        if (!geminiApiKey) {
            addChatMessage('AI', 'Please save your Gemini API key in the configuration above first.');
            return;
        }

        addChatMessage('User', userText);
        chatInput.value = '';
        
        chatHistory.push({ role: 'user', parts: [{ text: userText }] });

        const systemInstruction = `You are a strict Data Quality Analyst specifically for Meta Ads data. 
        Dataset: ${currentDataProfile.filename}.
        Total Rows: ${currentDataProfile.totalRows}. 
        Blank cells: ${currentDataProfile.blankCellsFound}.
        Columns: ${currentDataProfile.columns.join(', ')}.
        Sample Data: ${JSON.stringify(currentDataProfile.sampleData)}.
        Keep answers concise. If the user says "Sync it", tell them to click the Sync button at the top.`;

        const requestBody = {
            system_instruction: { parts: { text: systemInstruction } },
            contents: chatHistory
        };

        try {
            const response = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${geminiApiKey}`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(requestBody)
            });

            if (!response.ok) throw new Error('API Error');

            const data = await response.json();
            const aiText = data.candidates[0].content.parts[0].text;
            
            chatHistory.push({ role: 'model', parts: [{ text: aiText }] });
            addChatMessage('AI', aiText);

        } catch (error) {
            console.error(error);
            addChatMessage('AI', 'Sorry, I encountered an error communicating with Gemini. Please check your API key.');
        }
    }

    if (sendChatBtn) {
        sendChatBtn.addEventListener('click', () => {
            const text = chatInput.value.trim();
            if (text) sendToGemini(text);
        });
        chatInput.addEventListener('keypress', (e) => {
            if (e.key === 'Enter') {
                const text = chatInput.value.trim();
                if (text) sendToGemini(text);
            }
        });
    }

    // Google Apps Script Auto-Sync
    if (triggerSyncBtn) {
        triggerSyncBtn.addEventListener('click', async () => {
            if (!gsheetSyncUrl) {
                addChatMessage('AI', 'You need to set your Google Apps Script Webhook URL in the configuration first before syncing.');
                return;
            }
            if (!currentParsedData) return;

            triggerSyncBtn.innerHTML = '<i class="fa-solid fa-spinner fa-spin"></i> Syncing...';
            addChatMessage('AI', 'Initiating sync to Google Sheets...');

            try {
                // Send the parsed JSON data to the Webhook
                const response = await fetch(gsheetSyncUrl, {
                    method: 'POST',
                    mode: 'no-cors', // Apps Script requires no-cors from frontend
                    headers: {
                        'Content-Type': 'application/json'
                    },
                    body: JSON.stringify(currentParsedData)
                });
                
                // Because of no-cors, response.ok is always false/opaque, but it succeeds if it didn't throw network error
                setTimeout(() => {
                    triggerSyncBtn.innerHTML = '<i class="fa-solid fa-check"></i> Synced';
                    triggerSyncBtn.style.background = 'rgba(167,243,208,0.9)';
                    addChatMessage('AI', 'Success! The data has been written to your Master Google Spreadsheet.');
                }, 1500);

            } catch (error) {
                console.error(error);
                triggerSyncBtn.innerHTML = '<i class="fa-solid fa-triangle-exclamation"></i> Sync Failed';
                triggerSyncBtn.style.background = 'rgba(254,202,202,0.9)';
                addChatMessage('AI', 'Sync failed. Please verify your Webhook URL is correct and deployed as a Web App.');
            }
        });
    }
});
