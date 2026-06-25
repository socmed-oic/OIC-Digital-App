document.addEventListener('DOMContentLoaded', () => {
    
    // Determine which page we are on based on the elements present
    const loginView = document.getElementById('login-view');
    const hubView = document.getElementById('hub-view');
    const dashboardView = document.getElementById('dashboard-view');

    // =========================================================================
    // 1. PIN LOGIN SYSTEM (Only runs on index.html)
    // =========================================================================
    if (loginView) {
        const CORRECT_PIN = '1234';
        let currentPin = '';
        const pinDots = document.querySelectorAll('.pin-dot');
        const numberKeys = document.querySelectorAll('.pin-keypad .key:not(.action-key)');
        const clearBtn = document.getElementById('pin-clear');
        const enterBtn = document.getElementById('pin-enter');
        const errorMsg = document.getElementById('pin-error');
        
        function updatePinDisplay() {
            pinDots.forEach((dot, index) => {
                if (index < currentPin.length) {
                    dot.classList.add('filled');
                } else {
                    dot.classList.remove('filled');
                }
                dot.classList.remove('error');
            });
            if(errorMsg) errorMsg.textContent = '';
        }

        numberKeys.forEach(key => {
            key.addEventListener('click', () => {
                if (currentPin.length < 4) {
                    currentPin += key.textContent;
                    updatePinDisplay();
                }
            });
        });

        if(clearBtn) {
            clearBtn.addEventListener('click', () => {
                if (currentPin.length > 0) {
                    currentPin = currentPin.slice(0, -1);
                    updatePinDisplay();
                }
            });
        }

        if(enterBtn) {
            enterBtn.addEventListener('click', () => {
                if (currentPin.length === 4) {
                    if (currentPin === CORRECT_PIN) {
                        window.location.href = 'hub.html';
                    } else {
                        if(errorMsg) errorMsg.textContent = 'Incorrect PIN';
                        pinDots.forEach(dot => dot.classList.add('error'));
                        setTimeout(() => {
                            currentPin = '';
                            updatePinDisplay();
                        }, 1000);
                    }
                }
            });
        }

        // Keyboard support for PIN
        document.addEventListener('keydown', (e) => {
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
                if(enterBtn) enterBtn.click();
            }
        });
    }

    // =========================================================================
    // 2. ADS MODULE SPECIFIC LOGIC (Only runs on ads.html)
    // =========================================================================
    if (dashboardView) {

        // --- AUTO-SYNC GET LOGIC ---
        const masterSyncBtn = document.getElementById('pull-master-data-btn');

        async function pullMasterData() {
            if (!gsheetSyncUrl) return;
            if (masterSyncBtn) {
                masterSyncBtn.innerHTML = '<i class="fa-solid fa-spinner fa-spin"></i> Syncing...';
                masterSyncBtn.style.background = 'rgba(255,255,255,0.2)';
            }
            
            try {
                // Simple GET request follows 302 redirect and reads JSON
                const res = await fetch(gsheetSyncUrl);
                const data = await res.json();
                
                if (data && data.length > 0) {
                    // Re-use our parsed data function to update charts/KPIs
                    handleParsedData(data, Object.keys(data[0]), 'Master_Spreadsheet');
                }
                
                if (masterSyncBtn) {
                    masterSyncBtn.innerHTML = '<i class="fa-solid fa-check"></i> Synced with Master';
                    masterSyncBtn.style.background = 'rgba(167,243,208,0.3)';
                    masterSyncBtn.style.borderColor = 'rgba(167,243,208,0.5)';
                    setTimeout(() => {
                        masterSyncBtn.innerHTML = '<i class="fa-solid fa-rotate"></i> Sync with Master Data';
                        masterSyncBtn.style.background = '';
                        masterSyncBtn.style.borderColor = '';
                    }, 3000);
                }
            } catch (err) {
                console.error("Master Sync Error:", err);
                
                let errorMsg = err.message || "Unknown error";
                if (errorMsg.includes("Failed to fetch") || errorMsg.includes("NetworkError")) {
                    errorMsg = "CORS or Network Error.\n\nFix: You MUST deploy your Google Apps Script Web App with 'Who has access' set exactly to 'Anyone' (not 'Anyone with Google account'). If you recently updated the code, ensure you deployed it as a 'New Version'.";
                }
                
                alert("Master Data Sync Failed:\n\n" + errorMsg);

                if (masterSyncBtn) {
                    masterSyncBtn.innerHTML = '<i class="fa-solid fa-triangle-exclamation"></i> Sync Failed';
                    masterSyncBtn.style.background = 'rgba(254,202,202,0.3)';
                    setTimeout(() => {
                        masterSyncBtn.innerHTML = '<i class="fa-solid fa-rotate"></i> Sync with Master Data';
                        masterSyncBtn.style.background = '';
                    }, 5000);
                }
            }
        }

        // Fire on load
        pullMasterData();

        // Fire on button click
        if (masterSyncBtn) {
            masterSyncBtn.addEventListener('click', pullMasterData);
        }

        // --- DATE PICKER & SHORTCUTS ---
        const datePickerEl = document.getElementById('date-range-picker');
        const shortcutsEl = document.getElementById('date-shortcuts');
        let fpInstance = null;

        if (datePickerEl) {
            fpInstance = flatpickr("#date-range-picker", {
                mode: "range",
                dateFormat: "d M Y",
                position: "auto right",
                maxDate: "today", // Cannot select dates beyond today
                defaultDate: [new Date(new Date().setDate(new Date().getDate() - 7)), new Date()],
                onChange: function(selectedDates, dateStr, instance) {
                    // If user manually picks dates, reset shortcut to custom
                    if (shortcutsEl && selectedDates.length === 2) {
                        shortcutsEl.value = 'custom';
                    }
                }
            });
        }

        if (shortcutsEl && fpInstance) {
            shortcutsEl.addEventListener('change', (e) => {
                const val = e.target.value;
                const today = new Date();
                let start = new Date();
                
                if (val === '7') {
                    start.setDate(today.getDate() - 7);
                    fpInstance.setDate([start, today]);
                } else if (val === '30') {
                    start.setDate(today.getDate() - 30);
                    fpInstance.setDate([start, today]);
                } else if (val === 'thisMonth') {
                    start = new Date(today.getFullYear(), today.getMonth(), 1);
                    fpInstance.setDate([start, today]);
                } else if (val === 'lastMonth') {
                    start = new Date(today.getFullYear(), today.getMonth() - 1, 1);
                    const end = new Date(today.getFullYear(), today.getMonth(), 0);
                    fpInstance.setDate([start, end]);
                } else if (val === 'allTime') {
                    start = new Date('2024-01-01'); // Arbitrary start date for project
                    fpInstance.setDate([start, today]);
                } else if (val === 'custom') {
                    fpInstance.open();
                }
            });
        }

        // --- CHART CONFIGURATIONS ---
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

        tryCreateChart('demoChart', {
            type: 'bar',
            data: {
                labels: ['18-24', '25-34', '35-44', '45-54', '55-64', '65+'],
                datasets: [
                    { label: 'Female', data: [0, 0, 0, 0, 0, 0], backgroundColor: GLASS_COLORS.white, borderRadius: 20, barThickness: 12 },
                    { label: 'Male', data: [0, 0, 0, 0, 0, 0], backgroundColor: GLASS_COLORS.white30, borderRadius: 20, barThickness: 12 }
                ]
            },
            options: { responsive: true, maintainAspectRatio: false, scales: glassScales, plugins: { legend: { position: 'top' } } }
        });

        tryCreateChart('platformChart', {
            type: 'doughnut',
            data: {
                labels: ['Instagram', 'Facebook', 'Audience Network', 'Messenger'],
                datasets: [{
                    data: [0, 0, 0, 0],
                    backgroundColor: [GLASS_COLORS.white, GLASS_COLORS.white70, GLASS_COLORS.white30, GLASS_COLORS.white10],
                    borderWidth: 0, cutout: '80%'
                }]
            },
            options: { responsive: true, maintainAspectRatio: false, plugins: { legend: { display: false } } }
        });

        tryCreateChart('placementChart', {
            type: 'bar',
            data: {
                labels: ['Instagram Stories', 'Facebook Feed', 'Instagram Reels', 'Instagram Feed', 'FB Video Feeds'],
                datasets: [{ label: 'ROAS', data: [0, 0, 0, 0, 0], backgroundColor: GLASS_COLORS.white70, borderRadius: 20, barThickness: 16 }]
            },
            options: {
                indexAxis: 'y', responsive: true, maintainAspectRatio: false,
                scales: {
                    x: { grid: { color: GLASS_COLORS.white10 }, border: { display: false }, beginAtZero: true },
                    y: { grid: { display: false }, border: { display: false } }
                },
                plugins: { legend: { display: false } }
            }
        });

        // --- AI DATA PROCESSOR ---
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
        let currentParsedData = null;
        let currentDataProfile = null;
        let chatHistory = [];

        if (geminiApiKey && apiKeyInput) {
            apiKeyInput.value = geminiApiKey;
            keyStatus.className = 'sheets-status connected';
            keyStatus.textContent = 'Key Saved';
        }
        if (gsheetSyncUrl && syncUrlInput) {
            syncUrlInput.value = gsheetSyncUrl;
            syncUrlStatus.className = 'sheets-status connected';
            syncUrlStatus.textContent = 'Webhook Ready';
        }

        if (saveKeyBtn) {
            saveKeyBtn.addEventListener('click', () => {
                const val = apiKeyInput.value.trim();
                if (val) {
                    keyStatus.className = 'sheets-status disconnected';
                    keyStatus.textContent = 'Testing Key...';
                    
                    const originalText = saveKeyBtn.innerHTML;
                    saveKeyBtn.innerHTML = '<i class="fa-solid fa-spinner fa-spin"></i>';
                    
                    // Ping Gemini 1.5 Flash to validate key
                    fetch(`https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${val}`, {
                        method: 'POST',
                        headers: { 'Content-Type': 'application/json' },
                        body: JSON.stringify({ contents: [{ parts: [{ text: "ping" }] }] })
                    }).then(res => {
                        if(!res.ok) throw new Error();
                        geminiApiKey = val;
                        localStorage.setItem('gemini_api_key', val);
                        keyStatus.className = 'sheets-status connected';
                        keyStatus.textContent = 'Key Saved & Valid';
                        
                        saveKeyBtn.innerHTML = '<i class="fa-solid fa-check"></i> Saved';
                        saveKeyBtn.style.background = 'rgba(167,243,208,0.3)';
                        setTimeout(() => {
                            saveKeyBtn.innerHTML = originalText;
                            saveKeyBtn.style.background = '';
                        }, 2000);
                    }).catch(() => {
                        keyStatus.className = 'sheets-status disconnected';
                        keyStatus.textContent = 'Invalid API Key';
                        
                        saveKeyBtn.innerHTML = '<i class="fa-solid fa-xmark"></i> Failed';
                        saveKeyBtn.style.background = 'rgba(254,202,202,0.3)';
                        setTimeout(() => {
                            saveKeyBtn.innerHTML = originalText;
                            saveKeyBtn.style.background = '';
                        }, 2000);
                    });
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
                    
                    const originalText = saveSyncUrlBtn.innerHTML;
                    saveSyncUrlBtn.innerHTML = '<i class="fa-solid fa-check"></i> Saved';
                    saveSyncUrlBtn.style.background = 'rgba(167,243,208,0.3)';
                    setTimeout(() => {
                        saveSyncUrlBtn.innerHTML = originalText;
                        saveSyncUrlBtn.style.background = '';
                    }, 2000);
                }
            });
        }

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

        function formatNumber(num) {
            if (num >= 1000000) return (num / 1000000).toFixed(1) + 'M';
            if (num >= 1000) return (num / 1000).toFixed(1) + 'K';
            return num.toFixed(1);
        }

        let globalChartInstance = null;
        function renderDayToDayChart(filteredData) {
            const ctx = document.getElementById('day-to-day-chart');
            if (!ctx) return;
            
            // Group data by date
            const dateMap = {};
            filteredData.forEach(row => {
                let rawDate = row['Ends'] || row['Reporting Ends'] || '';
                if (!rawDate || rawDate === '-') return;
                
                // Convert Excel serial date
                let dateStr = rawDate;
                if (!isNaN(rawDate)) {
                    const dateObj = new Date(Math.round((rawDate - 25569) * 86400 * 1000));
                    dateStr = dateObj.toLocaleDateString();
                }

                if (!dateMap[dateStr]) dateMap[dateStr] = { reach: 0, clicks: 0, impressions: 0 };
                dateMap[dateStr].reach += parseFloat(row['Reach']) || 0;
                dateMap[dateStr].impressions += parseFloat(row['Impressions']) || 0;
                dateMap[dateStr].clicks += parseFloat(row['Clicks All'] || row['Click Link']) || 0;
            });

            const labels = Object.keys(dateMap).sort(); // Sort chronologically (rough)
            const reachData = labels.map(l => dateMap[l].reach);
            const clicksData = labels.map(l => dateMap[l].clicks);
            const impData = labels.map(l => dateMap[l].impressions);

            if (globalChartInstance) {
                globalChartInstance.destroy();
            }

            globalChartInstance = new Chart(ctx, {
                type: 'line',
                data: {
                    labels: labels,
                    datasets: [
                        { label: 'Reach', data: reachData, borderColor: '#a78bfa', tension: 0.4 },
                        { label: 'Clicks', data: clicksData, borderColor: '#34d399', tension: 0.4 },
                        { label: 'Impressions', data: impData, borderColor: '#fbbf24', tension: 0.4 }
                    ]
                },
                options: {
                    responsive: true,
                    maintainAspectRatio: false,
                    plugins: { legend: { labels: { color: 'white' } } },
                    scales: {
                        x: { ticks: { color: 'rgba(255,255,255,0.7)' }, grid: { color: 'rgba(255,255,255,0.1)' } },
                        y: { ticks: { color: 'rgba(255,255,255,0.7)' }, grid: { color: 'rgba(255,255,255,0.1)' } }
                    }
                }
            });
        }

        function filterDataAndRender() {
            if (!currentParsedData) return;
            const campaignFilter = document.getElementById('filter-campaign')?.value || 'all';
            
            let filtered = currentParsedData;
            if (campaignFilter !== 'all') {
                filtered = filtered.filter(row => row['Nama Campaign'] === campaignFilter || row['Campaign name'] === campaignFilter);
            }

            let totalSpend = 0;
            let totalImpressions = 0;
            let totalClicks = 0;

            filtered.forEach(row => {
                if (row['Amount Spent']) totalSpend += parseFloat(row['Amount Spent']) || 0;
                if (row['Impressions']) totalImpressions += parseFloat(row['Impressions']) || 0;
                if (row['Clicks All']) totalClicks += parseFloat(row['Clicks All']) || 0;
                else if (row['Click Link']) totalClicks += parseFloat(row['Click Link']) || 0;
            });

            const avgCtr = totalImpressions > 0 ? ((totalClicks / totalImpressions) * 100).toFixed(2) : 0;
            const avgCpc = totalClicks > 0 ? (totalSpend / totalClicks) : 0;

            const spendEl = document.getElementById('kpi-spend');
            const impEl = document.getElementById('kpi-impressions');
            const ctrEl = document.getElementById('kpi-ctr');
            const cpcEl = document.getElementById('kpi-cpc');
            
            if(spendEl) spendEl.textContent = `Rp ${formatNumber(totalSpend)}`;
            if(impEl) impEl.textContent = `${formatNumber(totalImpressions)}`;
            if(ctrEl) ctrEl.textContent = `${avgCtr}%`;
            if(cpcEl) cpcEl.textContent = `Rp ${formatNumber(avgCpc)}`;
            
            document.querySelectorAll('.trend').forEach(el => el.textContent = 'Previewing Local Data');

            renderDayToDayChart(filtered);

            // Populate Report Module
            const reportSpend = document.getElementById('report-spend');
            const reportImp = document.getElementById('report-imp');
            const reportClicks = document.getElementById('report-clicks');
            const reportCpc = document.getElementById('report-cpc');
            
            if(reportSpend) reportSpend.textContent = `Rp ${formatNumber(totalSpend)}`;
            if(reportImp) reportImp.textContent = `${formatNumber(totalImpressions)}`;
            if(reportClicks) reportClicks.textContent = `${formatNumber(totalClicks)}`;
            if(reportCpc) reportCpc.textContent = `Rp ${formatNumber(avgCpc)}`;

            const reportTableBody = document.getElementById('report-table-body');
            if (reportTableBody) {
                reportTableBody.innerHTML = '';
                filtered.forEach(row => {
                    const tr = document.createElement('tr');
                    tr.style.borderBottom = '1px solid rgba(255,255,255,0.1)';
                    
                    const cName = row['Nama Campaign'] || row['Campaign name'] || 'Unknown';
                    const sSpent = parseFloat(row['Amount Spent']) || 0;
                    const sImp = parseFloat(row['Impressions']) || 0;
                    const sClicks = parseFloat(row['Clicks All'] || row['Click Link']) || 0;
                    const sCpc = sClicks > 0 ? (sSpent / sClicks).toFixed(1) : 0;

                    tr.innerHTML = `
                        <td style="padding: 12px 8px;">${cName}</td>
                        <td style="padding: 12px 8px;">Rp ${formatNumber(sSpent)}</td>
                        <td style="padding: 12px 8px;">${formatNumber(sImp)}</td>
                        <td style="padding: 12px 8px;">${formatNumber(sClicks)}</td>
                        <td style="padding: 12px 8px;">Rp ${formatNumber(parseFloat(sCpc))}</td>
                    `;
                    reportTableBody.appendChild(tr);
                });
            }
        }

        function handleParsedData(data, columns, filename) {
            // Filter out 'TOTAL' rows immediately
            currentParsedData = data.filter(row => {
                const name = row['Nama Campaign'] || row['Campaign name'] || '';
                return !name.toUpperCase().includes('TOTAL');
            });

            let blankCount = 0;
            currentParsedData.forEach(row => {
                columns.forEach(col => { if (!row[col] && row[col] !== 0) blankCount++; });
            });

            // Populate Dropdowns
            const campaignSelect = document.getElementById('filter-campaign');
            if (campaignSelect) {
                const uniqueCampaigns = [...new Set(currentParsedData.map(r => r['Nama Campaign'] || r['Campaign name']).filter(Boolean))];
                campaignSelect.innerHTML = '<option value="all">All Campaigns</option>';
                uniqueCampaigns.forEach(c => {
                    const opt = document.createElement('option');
                    opt.value = c;
                    opt.textContent = c;
                    campaignSelect.appendChild(opt);
                });
                campaignSelect.addEventListener('change', filterDataAndRender);
            }

            currentDataProfile = {
                filename: filename, totalRows: currentParsedData.length, columns: columns, blankCellsFound: blankCount, sampleData: currentParsedData.slice(0, 5)
            };

            const datasetStats = document.getElementById('dataset-stats');
            if(datasetStats) datasetStats.textContent = `${currentParsedData.length} Rows Loaded`;
            
            if(uploadZone) uploadZone.style.display = 'none';
            if(chatInterface) chatInterface.style.display = 'flex';

            chatHistory = [];
            addChatMessage('AI', `I've successfully loaded **${filename}**. I removed the "TOTAL" row to prevent skewing charts. It contains ${currentParsedData.length} clean rows. How would you like to process this Meta Ads data?`);
            
            filterDataAndRender();
        }

        function processFile(file) {
            // Because Meta often exports XLSX files disguised with a .csv extension, 
            // we will ALWAYS use the robust SheetJS library which can handle both true CSV and true XLSX binary data.
            const reader = new FileReader();
            reader.onload = function(e) {
                try {
                    const data = new Uint8Array(e.target.result);
                    const workbook = XLSX.read(data, {type: 'array'});
                    const firstSheetName = workbook.SheetNames[0];
                    const worksheet = workbook.Sheets[firstSheetName];
                    
                    // Parse as a 2D array first to find the real header row
                    const rawRows = XLSX.utils.sheet_to_json(worksheet, {header: 1, defval: ""});
                    
                    if (rawRows.length === 0) {
                        alert('The file appears to be empty.');
                        return;
                    }
                    
                    // Find the first row that actually looks like a header row (has multiple columns and keywords)
                    let headerRowIndex = 0;
                    for (let i = 0; i < rawRows.length; i++) {
                        const row = rawRows[i];
                        if (row.length > 3 && (row.includes('Amount Spent') || row.includes('Impressions') || row.includes('Campaign name') || row.includes('Nama Campaign'))) {
                            headerRowIndex = i;
                            break;
                        }
                    }
                    
                    // Reparse using the correct header row
                    const json = XLSX.utils.sheet_to_json(worksheet, {range: headerRowIndex, defval: ""});
                    
                    if (json.length > 0) { 
                        handleParsedData(json, Object.keys(json[0]), file.name); 
                    } else { 
                        alert('No valid data found below the headers.'); 
                    }
                } catch(err) {
                    console.error("Parse Error:", err);
                    alert("Failed to parse this file. Make sure it's a valid Meta Ads export.");
                }
            };
            reader.readAsArrayBuffer(file);
        }

        function addChatMessage(sender, text) {
            const bubble = document.createElement('div');
            bubble.className = `chat-bubble ${sender === 'AI' ? 'ai' : 'user'}`;
            bubble.innerHTML = text.replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>');
            chatLog.appendChild(bubble);
            chatLog.scrollTop = chatLog.scrollHeight;
        }

        async function sendToGemini(userText) {
            if (!geminiApiKey) { addChatMessage('AI', 'Please save your Gemini API key in the configuration above first.'); return; }
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
                system_instruction: { parts: [{ text: systemInstruction }] },
                contents: chatHistory
            };

            try {
                const response = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${geminiApiKey}`, {
                    method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(requestBody)
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
            sendChatBtn.addEventListener('click', () => { const text = chatInput.value.trim(); if (text) sendToGemini(text); });
            chatInput.addEventListener('keypress', (e) => { if (e.key === 'Enter') { const text = chatInput.value.trim(); if (text) sendToGemini(text); }});
        }

        if (triggerSyncBtn) {
            triggerSyncBtn.addEventListener('click', async () => {
                if (!gsheetSyncUrl) { addChatMessage('AI', 'You need to set your Google Apps Script Webhook URL in the configuration first before syncing.'); return; }
                if (!currentParsedData) return;

                triggerSyncBtn.innerHTML = '<i class="fa-solid fa-spinner fa-spin"></i> Syncing...';
                addChatMessage('AI', 'Initiating sync to Google Sheets...');

                try {
                    await fetch(gsheetSyncUrl, {
                        method: 'POST', mode: 'no-cors',
                        headers: { 'Content-Type': 'application/json' },
                        body: JSON.stringify(currentParsedData)
                    });
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
        }
        
        // ==========================================
        // REPORTING MODULE LOGIC
        // ==========================================
        const adsTab = document.getElementById('sidebar-ads-tab');
        const repTab = document.getElementById('sidebar-reports-tab');
        const adsModule = document.getElementById('ads-module');
        const repModule = document.getElementById('report-module');

        if (adsTab && repTab) {
            adsTab.addEventListener('click', () => {
                adsTab.classList.add('active');
                repTab.classList.remove('active');
                adsModule.style.display = 'block';
                repModule.style.display = 'none';
            });
            repTab.addEventListener('click', () => {
                repTab.classList.add('active');
                adsTab.classList.remove('active');
                adsModule.style.display = 'none';
                repModule.style.display = 'block';
            });
        }

        const btnExportPdf = document.getElementById('btn-export-pdf');
        if (btnExportPdf) {
            btnExportPdf.addEventListener('click', () => {
                const element = document.getElementById('printable-report');
                const opt = {
                    margin:       0.5,
                    filename:     'Campaign_Report.pdf',
                    image:        { type: 'jpeg', quality: 0.98 },
                    html2canvas:  { scale: 2, backgroundColor: '#1a1a2e' },
                    jsPDF:        { unit: 'in', format: 'letter', orientation: 'landscape' }
                };
                btnExportPdf.innerHTML = '<i class="fa-solid fa-spinner fa-spin"></i> Exporting...';
                html2pdf().set(opt).from(element).save().then(() => {
                    btnExportPdf.innerHTML = '<i class="fa-solid fa-download"></i> Export PDF';
                });
            });
        }

        const btnAiSummary = document.getElementById('btn-generate-ai-summary');
        if (btnAiSummary) {
            btnAiSummary.addEventListener('click', async () => {
                if (!geminiApiKey) {
                    alert('Please save your Gemini API Key in the Ads Configuration module first!');
                    return;
                }
                
                btnAiSummary.innerHTML = '<i class="fa-solid fa-spinner fa-spin"></i> Generating...';
                
                const tableText = Array.from(document.querySelectorAll('#report-table-body tr')).map(tr => 
                    Array.from(tr.querySelectorAll('td')).map(td => td.textContent).join(' | ')
                ).join('\n');

                const prompt = `You are an expert Meta Ads Analyst. Here is a report of our campaign performance:
                Total Spend: ${document.getElementById('report-spend').textContent}
                Total Impressions: ${document.getElementById('report-imp').textContent}
                Total Clicks: ${document.getElementById('report-clicks').textContent}
                Avg CPC: ${document.getElementById('report-cpc').textContent}
                
                Campaign Breakdown:
                ${tableText}
                
                Write a 3-paragraph executive summary outlining the best performing campaigns, areas of concern, and actionable recommendations. Format the output in clean Markdown.`;

                try {
                    const response = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${geminiApiKey}`, {
                        method: 'POST',
                        headers: { 'Content-Type': 'application/json' },
                        body: JSON.stringify({ contents: [{ parts: [{ text: prompt }] }] })
                    });
                    
                    if (!response.ok) throw new Error('Failed to reach Gemini');
                    const data = await response.json();
                    
                    let aiText = data.candidates[0].content.parts[0].text;
                    aiText = aiText.replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>').replace(/\n/g, '<br>');
                    
                    document.getElementById('report-ai-summary').style.display = 'block';
                    document.getElementById('report-ai-text').innerHTML = aiText;
                    btnAiSummary.innerHTML = '<i class="fa-solid fa-check"></i> Summary Generated';
                } catch(e) {
                    alert('Error generating summary. Check API Key.');
                    btnAiSummary.innerHTML = '<i class="fa-solid fa-wand-magic-sparkles"></i> AI Generate Summary';
                }
            });
        }
    }
});
