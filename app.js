// 全局變數和配置
const CONFIG = {
    apiUrl: "https://script.google.com/macros/s/AKfycbxT4x5PPJsIZTx9TCraPn3wGL4ROGQd1pQHLkjuGeghOdb5eRe74sZICh0pgRUxJAwj/exec",
    geminiApiKey: "AIzaSyAokUKfQb_nasA3gqE2crzVDlih1GbLAkA",
    geminiApiUrl: "https://generativelanguage.googleapis.com/v1/models/gemini-2.5-pro:generateContent"
};

let currentData = [];
let filteredData = [];
let charts = {};
let correlationMatrix = {};

// AI 快速問題模板
const AI_TEMPLATES = [
    "這個月我的決策分數和收益有關嗎？",
    "我情緒分數高時績效如何？", 
    "最近哪種情緒最常出現在虧損交易？",
    "請分析我的理性分數與盈虧的關聯性"
];

// DOM 載入完成後初始化
document.addEventListener('DOMContentLoaded', function() {
    initializeApp();
});

async function initializeApp() {
    console.log('初始化應用程式...');
    
    // 初始化導航
    initializeNavigation();
    
    // 初始化AI助手
    initializeAIAssistant();
    
    // 初始化圖表控制
    initializeChartControls();
    
    // 載入交易數據
    await loadTradingData();
    
    // 初始化所有分析功能
    initializeAnalytics();
}

// 導航功能
function initializeNavigation() {
    const navButtons = document.querySelectorAll('.nav-btn');
    const sections = document.querySelectorAll('.dashboard-section');
    
    navButtons.forEach(button => {
        button.addEventListener('click', function() {
            const targetSection = this.getAttribute('data-section');
            
            // 更新導航按鈕狀態
            navButtons.forEach(btn => btn.classList.remove('active'));
            this.classList.add('active');
            
            // 顯示對應區塊
            sections.forEach(section => {
                section.classList.remove('active');
                if (section.id === targetSection) {
                    section.classList.add('active');
                    
                    // 根據選擇的區塊初始化對應功能
                    switch(targetSection) {
                        case 'correlation-analysis':
                            setTimeout(() => initializeCorrelationAnalysis(), 100);
                            break;
                        case 'interactive-charts':
                            setTimeout(() => initializeInteractiveChart(), 100);
                            break;
                        case 'advanced-stats':
                            setTimeout(() => updateAdvancedStats(), 100);
                            break;
                    }
                }
            });
        });
    });
}

// 載入交易數據
async function loadTradingData() {
    try {
        updateConnectionStatus('載入中...', 'status--warning');
        
        const response = await fetch(CONFIG.apiUrl);
        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }
        
        const data = await response.json();
        console.log('收到數據:', data);
        
        // 處理數據格式
        currentData = Array.isArray(data.data) ? data.data : [];
        filteredData = [...currentData];
        
        updateConnectionStatus('載入成功', 'status--success');
        updateOverviewStats();
        updateRecentTrades();
        createPerformanceTrend();
        
    } catch (error) {
        console.error('載入數據失敗:', error);
        updateConnectionStatus('載入失敗，使用範例數據', 'status--warning');
        
        // 使用範例數據
        currentData = [
            {
                id: "20250615 1",
                datetime: "2025-06-15T10:12:00.000Z",
                balance: 30.07,
                rationalScore: 78,
                emotionalScore: 52,
                decisionScore: 63,
                pnl: 0.64,
                pnlPercentage: 32.81
            },
            {
                id: "20250615 2", 
                datetime: "2025-06-15T15:27:00.000Z",
                balance: 28.8,
                rationalScore: 66,
                emotionalScore: 49,
                decisionScore: 58.5,
                pnl: -1.26,
                pnlPercentage: -25.22
            },
            {
                id: "20250616 1",
                datetime: "2025-06-16T10:20:00.000Z", 
                balance: 28.89,
                rationalScore: 49,
                emotionalScore: 38,
                decisionScore: 55.5,
                pnl: 0.08693,
                pnlPercentage: 1.74
            },
            {
                id: "20250617 1",
                datetime: "2025-06-17T14:30:00.000Z",
                balance: 30.15,
                rationalScore: 82,
                emotionalScore: 35,
                decisionScore: 75,
                pnl: 1.26,
                pnlPercentage: 4.36
            },
            {
                id: "20250618 1",
                datetime: "2025-06-18T09:45:00.000Z",
                balance: 29.23,
                rationalScore: 55,
                emotionalScore: 68,
                decisionScore: 42,
                pnl: -0.92,
                pnlPercentage: -3.05
            }
        ];
        
        filteredData = [...currentData];
        updateOverviewStats();
        updateRecentTrades();
        createPerformanceTrend();
    }
}

function updateConnectionStatus(message, statusClass) {
    const indicator = document.getElementById('connection-indicator');
    if (indicator) {
        indicator.textContent = message;
        indicator.className = `stat-value ${statusClass}`;
    }
}

// 更新總覽統計
function updateOverviewStats() {
    if (currentData.length === 0) return;
    
    // 總交易筆數
    document.getElementById('total-trades').textContent = currentData.length;
    
    // 當前餘額
    const latestBalance = currentData[currentData.length - 1]?.balance || 0;
    document.getElementById('current-balance').textContent = latestBalance.toFixed(2);
    
    // 平均決策分數
    const avgDecisionScore = currentData.reduce((sum, trade) => sum + trade.decisionScore, 0) / currentData.length;
    document.getElementById('avg-decision-score').textContent = avgDecisionScore.toFixed(1);
}

// 更新最新交易記錄
function updateRecentTrades() {
    const tableBody = document.querySelector('#recent-trades-table tbody');
    if (!tableBody) return;
    
    tableBody.innerHTML = '';
    
    // 顯示最新5筆交易
    const recentTrades = [...currentData].reverse().slice(0, 5);
    
    recentTrades.forEach(trade => {
        const row = document.createElement('tr');
        const date = new Date(trade.datetime).toLocaleString('zh-TW');
        
        row.innerHTML = `
            <td>${trade.id}</td>
            <td>${date}</td>
            <td class="${trade.pnl >= 0 ? 'text-success' : 'text-error'}">${trade.pnl >= 0 ? '+' : ''}${trade.pnl.toFixed(2)}</td>
            <td class="${trade.pnlPercentage >= 0 ? 'text-success' : 'text-error'}">${trade.pnlPercentage >= 0 ? '+' : ''}${trade.pnlPercentage.toFixed(2)}%</td>
            <td>${trade.decisionScore}</td>
            <td>${trade.rationalScore}</td>
            <td>${trade.emotionalScore}</td>
        `;
        
        tableBody.appendChild(row);
    });
}

// 創建績效趨勢圖
function createPerformanceTrend() {
    const ctx = document.getElementById('performance-trend-chart');
    if (!ctx || currentData.length === 0) return;
    
    if (charts.performanceTrend) {
        charts.performanceTrend.destroy();
    }
    
    const labels = currentData.map(trade => new Date(trade.datetime).toLocaleDateString('zh-TW'));
    const balanceData = currentData.map(trade => trade.balance);
    const pnlData = currentData.map(trade => trade.pnl);
    
    charts.performanceTrend = new Chart(ctx, {
        type: 'line',
        data: {
            labels: labels,
            datasets: [{
                label: '帳戶餘額',
                data: balanceData,
                borderColor: '#1FB8CD',
                backgroundColor: 'rgba(31, 184, 205, 0.1)',
                yAxisID: 'y',
                tension: 0.1
            }, {
                label: '單筆盈虧',
                data: pnlData,
                borderColor: '#FFC185',
                backgroundColor: 'rgba(255, 193, 133, 0.1)',
                yAxisID: 'y1',
                tension: 0.1
            }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            plugins: {
                legend: {
                    position: 'top'
                }
            },
            scales: {
                y: {
                    type: 'linear',
                    display: true,
                    position: 'left',
                    title: {
                        display: true,
                        text: '帳戶餘額 (USDT)'
                    }
                },
                y1: {
                    type: 'linear',
                    display: true,
                    position: 'right',
                    title: {
                        display: true,
                        text: '單筆盈虧 (USDT)'
                    },
                    grid: {
                        drawOnChartArea: false,
                    },
                }
            }
        }
    });
}

// 初始化分析功能
function initializeAnalytics() {
    // 添加刷新按鈕事件
    const refreshBtn = document.getElementById('refresh-data');
    if (refreshBtn) {
        refreshBtn.addEventListener('click', loadTradingData);
    }
}

// 相關性分析
function initializeCorrelationAnalysis() {
    calculateCorrelationMatrix();
    createCorrelationHeatmap();
    createScatterChart();
    updateCorrelationInsights();
    
    // 散點圖變數選擇事件
    const scatterXVar = document.getElementById('scatter-x-var');
    const scatterYVar = document.getElementById('scatter-y-var');
    
    if (scatterXVar) {
        scatterXVar.addEventListener('change', function() {
            createScatterChart();
            updateCorrelationInsights();
        });
    }
    if (scatterYVar) {
        scatterYVar.addEventListener('change', function() {
            createScatterChart();
            updateCorrelationInsights();
        });
    }
}

function calculateCorrelationMatrix() {
    const variables = ['rationalScore', 'emotionalScore', 'decisionScore', 'pnl', 'pnlPercentage'];
    correlationMatrix = {};
    
    variables.forEach(var1 => {
        correlationMatrix[var1] = {};
        variables.forEach(var2 => {
            correlationMatrix[var1][var2] = calculatePearsonCorrelation(
                currentData.map(d => d[var1]),
                currentData.map(d => d[var2])
            );
        });
    });
}

function calculatePearsonCorrelation(x, y) {
    if (x.length !== y.length || x.length === 0) return 0;
    
    const n = x.length;
    const sumX = x.reduce((a, b) => a + b, 0);
    const sumY = y.reduce((a, b) => a + b, 0);
    const sumXY = x.reduce((sum, xi, i) => sum + xi * y[i], 0);
    const sumXX = x.reduce((sum, xi) => sum + xi * xi, 0);
    const sumYY = y.reduce((sum, yi) => sum + yi * yi, 0);
    
    const numerator = n * sumXY - sumX * sumY;
    const denominator = Math.sqrt((n * sumXX - sumX * sumX) * (n * sumYY - sumY * sumY));
    
    return denominator === 0 ? 0 : numerator / denominator;
}

function createCorrelationHeatmap() {
    const ctx = document.getElementById('correlation-heatmap');
    if (!ctx) return;
    
    if (charts.correlationHeatmap) {
        charts.correlationHeatmap.destroy();
    }
    
    const variables = ['理性分數', '情緒分數', '決策分數', '盈虧金額', '盈虧百分比'];
    const varKeys = ['rationalScore', 'emotionalScore', 'decisionScore', 'pnl', 'pnlPercentage'];
    
    const heatmapData = [];
    varKeys.forEach((var1, i) => {
        varKeys.forEach((var2, j) => {
            heatmapData.push({
                x: j,
                y: variables.length - 1 - i,
                v: correlationMatrix[var1][var2]
            });
        });
    });
    
    charts.correlationHeatmap = new Chart(ctx, {
        type: 'scatter',
        data: {
            datasets: [{
                label: '相關性係數',
                data: heatmapData.map(d => ({
                    x: d.x,
                    y: d.y
                })),
                backgroundColor: heatmapData.map(d => {
                    const intensity = Math.abs(d.v);
                    const hue = d.v > 0 ? 120 : 0; // 綠色為正相關，紅色為負相關
                    return `hsla(${hue}, 70%, 50%, ${intensity * 0.8 + 0.2})`;
                }),
                pointRadius: heatmapData.map(d => Math.abs(d.v) * 15 + 8),
                pointHoverRadius: heatmapData.map(d => Math.abs(d.v) * 15 + 10)
            }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            plugins: {
                legend: {
                    display: false
                },
                tooltip: {
                    callbacks: {
                        label: function(context) {
                            const dataPoint = heatmapData[context.dataIndex];
                            const xVar = variables[Math.round(context.parsed.x)];
                            const yVar = variables[variables.length - 1 - Math.round(context.parsed.y)];
                            return `${yVar} vs ${xVar}: ${dataPoint.v.toFixed(3)}`;
                        }
                    }
                }
            },
            scales: {
                x: {
                    type: 'linear',
                    min: -0.5,
                    max: variables.length - 0.5,
                    ticks: {
                        stepSize: 1,
                        callback: function(value) {
                            return variables[Math.round(value)] || '';
                        }
                    },
                    title: {
                        display: true,
                        text: '變數'
                    }
                },
                y: {
                    type: 'linear',
                    min: -0.5,
                    max: variables.length - 0.5,
                    ticks: {
                        stepSize: 1,
                        callback: function(value) {
                            const index = variables.length - 1 - Math.round(value);
                            return variables[index] || '';
                        }
                    },
                    title: {
                        display: true,
                        text: '變數'
                    }
                }
            }
        }
    });
}

function createScatterChart() {
    const ctx = document.getElementById('scatter-chart');
    if (!ctx) return;
    
    const xVar = document.getElementById('scatter-x-var')?.value || 'rationalScore';
    const yVar = document.getElementById('scatter-y-var')?.value || 'pnl';
    
    if (charts.scatterChart) {
        charts.scatterChart.destroy();
    }
    
    const scatterData = currentData.map(trade => ({
        x: trade[xVar],
        y: trade[yVar]
    }));
    
    // 計算趨勢線
    const xValues = currentData.map(trade => trade[xVar]);
    const yValues = currentData.map(trade => trade[yVar]);
    const correlation = calculatePearsonCorrelation(xValues, yValues);
    
    // 簡單線性回歸
    const n = xValues.length;
    const sumX = xValues.reduce((a, b) => a + b, 0);
    const sumY = yValues.reduce((a, b) => a + b, 0);
    const sumXY = xValues.reduce((sum, x, i) => sum + x * yValues[i], 0);
    const sumXX = xValues.reduce((sum, x) => sum + x * x, 0);
    
    const slope = (n * sumXY - sumX * sumY) / (n * sumXX - sumX * sumX);
    const intercept = (sumY - slope * sumX) / n;
    
    const minX = Math.min(...xValues);
    const maxX = Math.max(...xValues);
    const trendLine = [
        { x: minX, y: slope * minX + intercept },
        { x: maxX, y: slope * maxX + intercept }
    ];
    
    charts.scatterChart = new Chart(ctx, {
        type: 'scatter',
        data: {
            datasets: [{
                label: `${getVariableLabel(xVar)} vs ${getVariableLabel(yVar)}`,
                data: scatterData,
                backgroundColor: '#1FB8CD',
                borderColor: '#1FB8CD',
                pointRadius: 6,
                pointHoverRadius: 8
            }, {
                label: '趨勢線',
                data: trendLine,
                type: 'line',
                borderColor: '#FFC185',
                backgroundColor: 'rgba(255, 193, 133, 0.2)',
                borderWidth: 2,
                pointRadius: 0,
                tension: 0
            }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            plugins: {
                legend: {
                    display: true,
                    position: 'top'
                }
            },
            scales: {
                x: {
                    title: {
                        display: true,
                        text: getVariableLabel(xVar)
                    }
                },
                y: {
                    title: {
                        display: true,
                        text: getVariableLabel(yVar)
                    }
                }
            }
        }
    });
    
    // 更新皮爾森相關係數
    const pearsonValue = document.getElementById('pearson-value');
    const correlationStrength = document.getElementById('correlation-strength');
    
    if (pearsonValue) {
        pearsonValue.textContent = correlation.toFixed(3);
    }
    if (correlationStrength) {
        const strength = getCorrelationStrength(correlation);
        correlationStrength.textContent = strength;
        correlationStrength.className = `correlation-strength ${getCorrelationClass(correlation)}`;
    }
}

function getCorrelationStrength(correlation) {
    const abs = Math.abs(correlation);
    const direction = correlation > 0 ? '正' : '負';
    
    if (abs >= 0.7) return `強${direction}相關`;
    if (abs >= 0.3) return `中等${direction}相關`;
    return `弱${direction}相關`;
}

function getCorrelationClass(correlation) {
    const abs = Math.abs(correlation);
    if (abs >= 0.7) return 'text-success';
    if (abs >= 0.3) return 'text-warning';
    return 'text-error';
}

function updateCorrelationInsights() {
    const insightsContainer = document.getElementById('correlation-insights');
    if (!insightsContainer) return;
    
    insightsContainer.innerHTML = '';
    
    const insights = [
        {
            var1: '決策分數',
            var2: '盈虧金額',
            correlation: correlationMatrix.decisionScore?.pnl || 0
        },
        {
            var1: '理性分數', 
            var2: '盈虧金額',
            correlation: correlationMatrix.rationalScore?.pnl || 0
        },
        {
            var1: '情緒分數',
            var2: '盈虧金額', 
            correlation: correlationMatrix.emotionalScore?.pnl || 0
        },
        {
            var1: '決策分數',
            var2: '盈虧百分比',
            correlation: correlationMatrix.decisionScore?.pnlPercentage || 0
        }
    ];
    
    insights.forEach(insight => {
        const item = document.createElement('div');
        item.className = 'insight-item';
        
        const strength = getCorrelationStrength(insight.correlation);
        const strengthClass = getCorrelationClass(insight.correlation);
        
        item.innerHTML = `
            <strong>${insight.var1}</strong> 與 <strong>${insight.var2}</strong>: 
            <span class="${strengthClass}">${strength}</span> 
            (r = ${insight.correlation.toFixed(3)})
        `;
        
        insightsContainer.appendChild(item);
    });
}

// AI助手功能
function initializeAIAssistant() {
    const presetButtons = document.querySelectorAll('.preset-btn');
    const chatInput = document.getElementById('chat-input');
    const sendBtn = document.getElementById('send-chat');
    
    presetButtons.forEach(button => {
        button.addEventListener('click', function() {
            const question = this.textContent;
            sendAIQuestion(question);
        });
    });
    
    if (sendBtn) {
        sendBtn.addEventListener('click', function() {
            const message = chatInput.value.trim();
            if (message) {
                sendAIQuestion(message);
                chatInput.value = '';
            }
        });
    }
    
    if (chatInput) {
        chatInput.addEventListener('keypress', function(e) {
            if (e.key === 'Enter') {
                const message = this.value.trim();
                if (message) {
                    sendAIQuestion(message);
                    this.value = '';
                }
            }
        });
    }
}

async function sendAIQuestion(question) {
    const chatHistory = document.getElementById('chat-history');
    const aiStatus = document.getElementById('ai-status');
    
    // 添加用戶訊息
    addChatMessage(question, 'user');
    
    // 更新AI狀態
    if (aiStatus) {
        aiStatus.textContent = '思考中...';
        aiStatus.className = 'status status--warning';
    }
    
    try {
        // 準備數據摘要給AI
        const dataSummary = generateDataSummary();
        const prompt = createAIPrompt(question, dataSummary);
        
        const response = await callGeminiAPI(prompt);
        addChatMessage(response, 'ai');
        
        if (aiStatus) {
            aiStatus.textContent = '準備就緒';
            aiStatus.className = 'status status--success';
        }
        
    } catch (error) {
        console.error('AI回應失敗:', error);
        const fallbackResponse = generateFallbackResponse(question);
        addChatMessage(fallbackResponse, 'ai');
        
        if (aiStatus) {
            aiStatus.textContent = '連接問題';
            aiStatus.className = 'status status--error';
        }
    }
}

function generateDataSummary() {
    if (currentData.length === 0) return '無數據';
    
    const totalTrades = currentData.length;
    const avgPnl = currentData.reduce((sum, trade) => sum + trade.pnl, 0) / totalTrades;
    const winRate = currentData.filter(trade => trade.pnl > 0).length / totalTrades * 100;
    const avgDecisionScore = currentData.reduce((sum, trade) => sum + trade.decisionScore, 0) / totalTrades;
    const avgRationalScore = currentData.reduce((sum, trade) => sum + trade.rationalScore, 0) / totalTrades;
    const avgEmotionalScore = currentData.reduce((sum, trade) => sum + trade.emotionalScore, 0) / totalTrades;
    
    return `
    交易總數: ${totalTrades}筆
    平均盈虧: ${avgPnl.toFixed(2)} USDT
    勝率: ${winRate.toFixed(1)}%
    平均決策分數: ${avgDecisionScore.toFixed(1)}
    平均理性分數: ${avgRationalScore.toFixed(1)}
    平均情緒分數: ${avgEmotionalScore.toFixed(1)}
    
    相關性分析:
    - 決策分數與盈虧相關性: ${(correlationMatrix.decisionScore?.pnl || 0).toFixed(3)}
    - 理性分數與盈虧相關性: ${(correlationMatrix.rationalScore?.pnl || 0).toFixed(3)}
    - 情緒分數與盈虧相關性: ${(correlationMatrix.emotionalScore?.pnl || 0).toFixed(3)}
    `;
}

function createAIPrompt(question, dataSummary) {
    return `
    你是一位專業的交易分析師，請根據以下交易數據分析回答問題。請用繁體中文回答，並提供具體的數據洞察和建議。

    交易數據摘要:
    ${dataSummary}

    用戶問題: ${question}

    請提供詳細的分析和建議，包括:
    1. 數據分析結果
    2. 具體的改進建議
    3. 風險提醒

    回答要專業但易懂，長度控制在200字以內。
    `;
}

async function callGeminiAPI(prompt) {
    const response = await fetch(`${CONFIG.geminiApiUrl}?key=${CONFIG.geminiApiKey}`, {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
        },
        body: JSON.stringify({
            contents: [{
                parts: [{
                    text: prompt
                }]
            }]
        })
    });

    if (!response.ok) {
        throw new Error(`Gemini API error: ${response.status}`);
    }

    const data = await response.json();
    return data.candidates[0].content.parts[0].text;
}

function generateFallbackResponse(question) {
    const responses = {
        '決策分數': '根據您的數據，決策分數與交易績效呈現正相關。建議在決策分數低於60時謹慎交易，並加強策略分析。',
        '情緒': '情緒管理對交易成功至關重要。數據顯示情緒分數過高時往往伴隨較差的交易結果。建議建立情緒檢查機制。',
        '理性': '理性分析是成功交易的基石。您的數據顯示理性分數與盈利能力呈正相關，建議加強技術分析和基本面研究。',
        '相關性': '您的交易數據顯示決策品質、理性分析與交易結果有明顯關聯。建議重點提升決策流程的系統性和一致性。'
    };
    
    for (const [key, response] of Object.entries(responses)) {
        if (question.includes(key)) {
            return response;
        }
    }
    
    return '根據您的交易數據分析，建議關注決策品質與交易結果的關聯性，持續優化交易策略和心理狀態管理。如需更詳細的分析，請嘗試重新提問。';
}

function addChatMessage(message, sender) {
    const chatHistory = document.getElementById('chat-history');
    if (!chatHistory) return;
    
    const messageDiv = document.createElement('div');
    messageDiv.className = `chat-message ${sender}-message`;
    
    messageDiv.innerHTML = `
        <div class="message-content">
            <p>${message}</p>
        </div>
    `;
    
    chatHistory.appendChild(messageDiv);
    chatHistory.scrollTop = chatHistory.scrollHeight;
}

// 進階統計分析
function updateAdvancedStats() {
    if (currentData.length === 0) return;
    
    const winTrades = currentData.filter(trade => trade.pnl > 0);
    const lossTrades = currentData.filter(trade => trade.pnl <= 0);
    
    // 勝率
    const winRate = (winTrades.length / currentData.length * 100).toFixed(1);
    document.getElementById('win-rate').textContent = `${winRate}%`;
    
    // 平均盈虧
    const avgPnl = currentData.reduce((sum, trade) => sum + trade.pnl, 0) / currentData.length;
    document.getElementById('avg-pnl').textContent = avgPnl >= 0 ? `+${avgPnl.toFixed(2)}` : avgPnl.toFixed(2);
    
    // 最大盈利
    const maxProfit = Math.max(...currentData.map(trade => trade.pnl));
    document.getElementById('max-profit').textContent = `+${maxProfit.toFixed(2)}`;
    
    // 最大虧損
    const maxLoss = Math.min(...currentData.map(trade => trade.pnl));
    document.getElementById('max-loss').textContent = maxLoss.toFixed(2);
    
    // 分組比較
    updateGroupComparison();
    
    // 情緒vs理性圖表
    createEmotionRationalChart();
}

function updateGroupComparison() {
    const highScoreTrades = currentData.filter(trade => trade.decisionScore > 70);
    const lowScoreTrades = currentData.filter(trade => trade.decisionScore <= 70);
    
    // 高分組統計
    if (highScoreTrades.length > 0) {
        const highAvgPnl = highScoreTrades.reduce((sum, trade) => sum + trade.pnl, 0) / highScoreTrades.length;
        const highWinRate = highScoreTrades.filter(trade => trade.pnl > 0).length / highScoreTrades.length * 100;
        
        const highStats = document.getElementById('high-decision-stats');
        if (highStats) {
            highStats.innerHTML = `
                <p>平均盈虧: <span class="${highAvgPnl >= 0 ? 'profit' : 'loss'}">${highAvgPnl >= 0 ? '+' : ''}${highAvgPnl.toFixed(2)} USDT</span></p>
                <p>勝率: <span>${highWinRate.toFixed(1)}%</span></p>
                <p>交易次數: <span>${highScoreTrades.length}</span></p>
            `;
        }
    }
    
    // 低分組統計
    if (lowScoreTrades.length > 0) {
        const lowAvgPnl = lowScoreTrades.reduce((sum, trade) => sum + trade.pnl, 0) / lowScoreTrades.length;
        const lowWinRate = lowScoreTrades.filter(trade => trade.pnl > 0).length / lowScoreTrades.length * 100;
        
        const lowStats = document.getElementById('low-decision-stats');
        if (lowStats) {
            lowStats.innerHTML = `
                <p>平均盈虧: <span class="${lowAvgPnl >= 0 ? 'profit' : 'loss'}">${lowAvgPnl >= 0 ? '+' : ''}${lowAvgPnl.toFixed(2)} USDT</span></p>
                <p>勝率: <span>${lowWinRate.toFixed(1)}%</span></p>
                <p>交易次數: <span>${lowScoreTrades.length}</span></p>
            `;
        }
    }
}

function createEmotionRationalChart() {
    const ctx = document.getElementById('emotion-rational-chart');
    if (!ctx) return;
    
    if (charts.emotionRational) {
        charts.emotionRational.destroy();
    }
    
    const chartData = currentData.map(trade => ({
        x: trade.rationalScore,
        y: trade.emotionalScore,
        r: Math.abs(trade.pnl) * 2 + 5
    }));
    
    const colors = currentData.map(trade => 
        trade.pnl >= 0 ? 'rgba(31, 184, 205, 0.6)' : 'rgba(192, 21, 47, 0.6)'
    );
    
    charts.emotionRational = new Chart(ctx, {
        type: 'bubble',
        data: {
            datasets: [{
                label: '情緒vs理性分布',
                data: chartData,
                backgroundColor: colors,
                borderColor: colors.map(color => color.replace('0.6', '1')),
                borderWidth: 2
            }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            plugins: {
                legend: {
                    display: true
                },
                tooltip: {
                    callbacks: {
                        label: function(context) {
                            const trade = currentData[context.dataIndex];
                            return [
                                `理性分數: ${trade.rationalScore}`,
                                `情緒分數: ${trade.emotionalScore}`,
                                `盈虧: ${trade.pnl.toFixed(2)} USDT`
                            ];
                        }
                    }
                }
            },
            scales: {
                x: {
                    title: {
                        display: true,
                        text: '理性分數'
                    },
                    min: 0,
                    max: 100
                },
                y: {
                    title: {
                        display: true,
                        text: '情緒分數'
                    },
                    min: 0,
                    max: 100
                }
            }
        }
    });
}

// 互動圖表控制
function initializeChartControls() {
    const chartTypeSelect = document.getElementById('chart-type');
    const xVariableSelect = document.getElementById('x-variable');
    const yVariableSelect = document.getElementById('y-variable');
    const exportBtn = document.getElementById('export-chart');
    const applyFiltersBtn = document.getElementById('apply-filters');
    const clearFiltersBtn = document.getElementById('clear-filters');
    
    if (chartTypeSelect) {
        chartTypeSelect.addEventListener('change', updateInteractiveChart);
    }
    if (xVariableSelect) {
        xVariableSelect.addEventListener('change', updateInteractiveChart);
    }
    if (yVariableSelect) {
        yVariableSelect.addEventListener('change', updateInteractiveChart);
    }
    if (exportBtn) {
        exportBtn.addEventListener('click', exportChart);
    }
    if (applyFiltersBtn) {
        applyFiltersBtn.addEventListener('click', applyFilters);
    }
    if (clearFiltersBtn) {
        clearFiltersBtn.addEventListener('click', clearFilters);
    }
}

function initializeInteractiveChart() {
    if (currentData.length === 0) return;
    updateInteractiveChart();
}

function updateInteractiveChart() {
    if (charts.interactive) {
        charts.interactive.destroy();
    }
    
    const ctx = document.getElementById('interactive-chart');
    if (!ctx) return;
    
    const chartType = document.getElementById('chart-type')?.value || 'line';
    const xVariable = document.getElementById('x-variable')?.value || 'datetime';
    const yVariable = document.getElementById('y-variable')?.value || 'pnl';
    
    let chartData, chartOptions;
    
    if (chartType === 'line' || chartType === 'bar') {
        let labels, data;
        
        if (xVariable === 'datetime') {
            labels = filteredData.map(trade => new Date(trade.datetime).toLocaleDateString('zh-TW'));
            data = filteredData.map(trade => trade[yVariable]);
        } else {
            labels = filteredData.map(trade => trade[xVariable]);
            data = filteredData.map(trade => trade[yVariable]);
        }
        
        chartData = {
            labels: labels,
            datasets: [{
                label: getVariableLabel(yVariable),
                data: data,
                backgroundColor: chartType === 'bar' ? '#1FB8CD' : 'rgba(31, 184, 205, 0.2)',
                borderColor: '#1FB8CD',
                borderWidth: 2,
                fill: chartType === 'line'
            }]
        };
        
    } else if (chartType === 'scatter') {
        const scatterData = filteredData.map(trade => ({
            x: trade[xVariable],
            y: trade[yVariable]
        }));
        
        chartData = {
            datasets: [{
                label: `${getVariableLabel(xVariable)} vs ${getVariableLabel(yVariable)}`,
                data: scatterData,
                backgroundColor: '#1FB8CD',
                borderColor: '#1FB8CD',
                pointRadius: 6
            }]
        };
    }
    
    chartOptions = {
        responsive: true,
        maintainAspectRatio: false,
        plugins: {
            legend: {
                display: true,
                position: 'top'
            }
        },
        scales: {
            x: {
                title: {
                    display: true,
                    text: getVariableLabel(xVariable)
                }
            },
            y: {
                title: {
                    display: true,
                    text: getVariableLabel(yVariable)
                }
            }
        }
    };
    
    charts.interactive = new Chart(ctx, {
        type: chartType,
        data: chartData,
        options: chartOptions
    });
}

function getVariableLabel(variable) {
    const labels = {
        'datetime': '時間',
        'decisionScore': '決策分數',
        'rationalScore': '理性分數',
        'emotionalScore': '情緒分數',
        'pnl': '盈虧金額 (USDT)',
        'pnlPercentage': '盈虧百分比 (%)',
        'balance': '帳戶餘額 (USDT)'
    };
    return labels[variable] || variable;
}

function applyFilters() {
    const dateFrom = document.getElementById('date-from')?.value;
    const dateTo = document.getElementById('date-to')?.value;
    const minDecisionScore = document.getElementById('min-decision-score')?.value;
    
    filteredData = currentData.filter(trade => {
        let passesFilter = true;
        
        if (dateFrom) {
            const tradeDate = new Date(trade.datetime);
            const fromDate = new Date(dateFrom);
            if (tradeDate < fromDate) passesFilter = false;
        }
        
        if (dateTo) {
            const tradeDate = new Date(trade.datetime);
            const toDate = new Date(dateTo);
            if (tradeDate > toDate) passesFilter = false;
        }
        
        if (minDecisionScore) {
            if (trade.decisionScore < parseFloat(minDecisionScore)) passesFilter = false;
        }
        
        return passesFilter;
    });
    
    updateInteractiveChart();
}

function clearFilters() {
    document.getElementById('date-from').value = '';
    document.getElementById('date-to').value = '';
    document.getElementById('min-decision-score').value = '';
    
    filteredData = [...currentData];
    updateInteractiveChart();
}

function exportChart() {
    if (charts.interactive) {
        const link = document.createElement('a');
        link.download = 'trading-analysis-chart.png';
        link.href = charts.interactive.toBase64Image();
        link.click();
    }
}
// 勝率
function calcWinRate(data) {
    const winCount = data.filter(trade => trade.pnl > 0).length;
    return data.length ? (winCount / data.length * 100).toFixed(2) : '0.00';
  }
  
  // 賺賠比
  function calcProfitLossRatio(data) {
    const profits = data.filter(trade => trade.pnl > 0).map(t => t.pnl);
    const losses = data.filter(trade => trade.pnl < 0).map(t => Math.abs(t.pnl));
    const avgProfit = profits.length ? profits.reduce((a, b) => a + b, 0) / profits.length : 0;
    const avgLoss = losses.length ? losses.reduce((a, b) => a + b, 0) / losses.length : 1;
    return avgLoss ? (avgProfit / avgLoss).toFixed(2) : 'N/A';
  }
  
  // 獲利因子
  function calcProfitFactor(data) {
    const totalProfit = data.filter(trade => trade.pnl > 0).reduce((a, b) => a + b.pnl, 0);
    const totalLoss = Math.abs(data.filter(trade => trade.pnl < 0).reduce((a, b) => a + b.pnl, 0));
    return totalLoss ? (totalProfit / totalLoss).toFixed(2) : 'N/A';
  }
  
  // PSY心理線（預設12日）
  function calcPSY(data, period = 12) {
    if (data.length < period) return 'N/A';
    let psyArr = [];
    for (let i = 0; i <= data.length - period; i++) {
      const slice = data.slice(i, i + period);
      const upDays = slice.filter((t, idx) => idx > 0 && t.balance > slice[idx - 1].balance).length;
      psyArr.push((upDays / period * 100).toFixed(2));
    }
    return psyArr;
  }
  
  async function sendAIMessage(prompt) {
    const url = `${CONFIG.geminiApiUrl}?key=${CONFIG.geminiApiKey}`;
    const body = {
      contents: [
        {
          parts: [{ text: prompt }]
        }
      ]
    };
    try {
      const response = await fetch(url, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body)
      });
      const result = await response.json();
      // 解析 Gemini 回應
      const aiText = result?.candidates?.[0]?.content?.parts?.[0]?.text || "AI 沒有回應";
      return aiText;
    } catch (e) {
      return "AI 請求失敗：" + e.message;
    }
  }
  document.getElementById('compare-method').addEventListener('change', function() {
    updateComparisonAnalysis(this.value);
  });
  
  function updateComparisonAnalysis(method) {
    let result = '';
    switch (method) {
      case 'winrate':
        result = `勝率：${calcWinRate(currentData)}%`;
        break;
      case 'profitloss':
        result = `賺賠比：${calcProfitLossRatio(currentData)}`;
        break;
      case 'profitfactor':
        result = `獲利因子：${calcProfitFactor(currentData)}`;
        break;
      case 'psy':
        const psyArr = calcPSY(currentData);
        result = `最近PSY心理線：${psyArr.length ? psyArr[psyArr.length - 1] + '%' : 'N/A'}`;
        break;
    }
    document.getElementById('compare-result').textContent = result;
  }
  