// Global variables
let trafficInterval;
let isRunning = false;
let totalVisits = 0;
let todayVisits = 0;
let successfulVisits = 0;
let failedVisits = 0;
let activeConnections = 0;

// Country codes and names
const countries = [
    { code: 'us', name: 'United States', flag: '🇺🇸' },
    { code: 'ca', name: 'Canada', flag: '🇨🇦' },
    { code: 'gb', name: 'United Kingdom', flag: '🇬🇧' },
    { code: 'de', name: 'Germany', flag: '🇩🇪' },
    { code: 'fr', name: 'France', flag: '🇫🇷' },
    { code: 'it', name: 'Italy', flag: '🇮🇹' },
    { code: 'es', name: 'Spain', flag: '🇪🇸' },
    { code: 'au', name: 'Australia', flag: '🇦🇺' },
    { code: 'jp', name: 'Japan', flag: '🇯🇵' },
    { code: 'kr', name: 'South Korea', flag: '🇰🇷' },
    { code: 'in', name: 'India', flag: '🇮🇳' },
    { code: 'br', name: 'Brazil', flag: '🇧🇷' },
    { code: 'mx', name: 'Mexico', flag: '🇲🇽' },
    { code: 'ar', name: 'Argentina', flag: '🇦🇷' },
    { code: 'sg', name: 'Singapore', flag: '🇸🇬' },
    { code: 'nl', name: 'Netherlands', flag: '🇳🇱' }
];

// User agents for rotation
const userAgents = {
    desktop: [
        'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
        'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
        'Mozilla/5.0 (Windows NT 10.0; Win64; x64; rv:121.0) Gecko/20100101 Firefox/121.0',
        'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/17.2 Safari/605.1.15'
    ],
    mobile: [
        'Mozilla/5.0 (iPhone; CPU iPhone OS 17_2 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/17.2 Mobile/15E148 Safari/604.1',
        'Mozilla/5.0 (Linux; Android 13; SM-G991B) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.6099.43 Mobile Safari/537.36',
        'Mozilla/5.0 (iPhone; CPU iPhone OS 17_1 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) CriOS/120.0.6099.69 Mobile/15E148 Safari/604.1',
        'Mozilla/5.0 (Linux; Android 13; Pixel 7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.6099.43 Mobile Safari/537.36'
    ]
};

// Viewport sizes
const viewports = {
    desktop: [
        { width: 1920, height: 1080 },
        { width: 1366, height: 768 },
        { width: 1536, height: 864 },
        { width: 1440, height: 900 }
    ],
    mobile: [
        { width: 375, height: 812 }, // iPhone X/11/12/13
        { width: 414, height: 896 }, // iPhone XR/11
        { width: 360, height: 640 }, // Android
        { width: 412, height: 915 }  // Pixel
    ]
};

// Initialize the application
function init() {
    setupCountrySelection();
    setupEventListeners();
    setDefaultDates();
    loadSettings();
}

function setupCountrySelection() {
    const countrySelect = document.getElementById('countrySelect');
    countries.forEach(country => {
        const div = document.createElement('div');
        div.className = 'country-option';
        div.innerHTML = `
            <input type="checkbox" id="country_${country.code}" value="${country.code}">
            <span>${country.flag}</span>
            <label for="country_${country.code}">${country.name}</label>
        `;
        countrySelect.appendChild(div);
    });

    // Select US by default
    document.getElementById('country_us').checked = true;
}

function setupEventListeners() {
    document.getElementById('mobileRatio').addEventListener('input', function() {
        document.getElementById('mobileRatioValue').textContent = `${this.value}% Mobile`;
    });

    // Save settings on change
    const inputs = document.querySelectorAll('input, select');
    inputs.forEach(input => {
        input.addEventListener('change', saveSettings);
    });
}

function setDefaultDates() {
    const today = new Date();
    const nextWeek = new Date(today);
    nextWeek.setDate(today.getDate() + 7);

    document.getElementById('startDate').value = formatDate(today);
    document.getElementById('endDate').value = formatDate(nextWeek);
}

function formatDate(date) {
    return date.toISOString().split('T')[0];
}

function saveSettings() {
    const settings = {
        customerId: document.getElementById('customerId').value,
        zoneName: document.getElementById('zoneName').value,
        dailyTarget: document.getElementById('dailyTarget').value,
        interval: document.getElementById('interval').value,
        sessionDuration: document.getElementById('sessionDuration').value,
        pagesPerSession: document.getElementById('pagesPerSession').value,
        mobileRatio: document.getElementById('mobileRatio').value,
        enableJS: document.getElementById('enableJS').value
    };
    
    // Note: In a real environment, you'd save to localStorage
    // localStorage.setItem('trafficGeneratorSettings', JSON.stringify(settings));
}

function loadSettings() {
    // Note: In a real environment, you'd load from localStorage
    // const saved = localStorage.getItem('trafficGeneratorSettings');
    // if (saved) {
    //     const settings = JSON.parse(saved);
    //     Object.keys(settings).forEach(key => {
    //         const element = document.getElementById(key);
    //         if (element) element.value = settings[key];
    //     });
    // }
}

function getSelectedCountries() {
    const selected = [];
    countries.forEach(country => {
        if (document.getElementById(`country_${country.code}`).checked) {
            selected.push(country.code);
        }
    });
    return selected;
}

function buildBrightDataWSS(country) {
    const customerId = document.getElementById('customerId').value;
    const zoneName = document.getElementById('zoneName').value;
    const zonePassword = document.getElementById('zonePassword').value;
    const endpoint = document.getElementById('endpoint').value;

    if (!customerId || !zoneName || !zonePassword) {
        throw new Error('BrightData credentials are required');
    }

    return `wss://${customerId}-zone-${zoneName}-country-${country}:${zonePassword}@${endpoint}`;
}

function getRandomUserAgent() {
    const mobileRatio = parseInt(document.getElementById('mobileRatio').value);
    const isMobile = Math.random() * 100 < mobileRatio;
    const agents = isMobile ? userAgents.mobile : userAgents.desktop;
    return {
        userAgent: agents[Math.floor(Math.random() * agents.length)],
        isMobile: isMobile
    };
}

function getRandomViewport(isMobile) {
    const viewportArray = isMobile ? viewports.mobile : viewports.desktop;
    return viewportArray[Math.floor(Math.random() * viewportArray.length)];
}

function logMessage(message, type = 'info') {
    const logPanel = document.getElementById('logPanel');
    const timestamp = new Date().toLocaleTimeString();
    const logEntry = document.createElement('div');
    logEntry.className = `log-entry ${type}`;
    logEntry.textContent = `[${timestamp}] ${message}`;
    
    logPanel.appendChild(logEntry);
    logPanel.scrollTop = logPanel.scrollHeight;

    // Keep only last 100 log entries
    while (logPanel.children.length > 100) {
        logPanel.removeChild(logPanel.firstChild);
    }
}

function updateStats() {
    document.getElementById('totalVisits').textContent = totalVisits;
    document.getElementById('todayVisits').textContent = todayVisits;
    document.getElementById('activeConnections').textContent = activeConnections;
    
    const successRate = totalVisits > 0 ? Math.round((successfulVisits / totalVisits) * 100) : 0;
    document.getElementById('successRate').textContent = `${successRate}%`;

    const dailyTarget = parseInt(document.getElementById('dailyTarget').value);
    const progress = Math.min((todayVisits / dailyTarget) * 100, 100);
    document.getElementById('progressFill').style.width = `${progress}%`;
    document.getElementById('progressText').textContent = `${todayVisits} / ${dailyTarget}`;
}

async function testConnection() {
    try {
        const countries = getSelectedCountries();
        if (countries.length === 0) {
            throw new Error('Please select at least one country');
        }

        logMessage('Testing BrightData connection...', 'info');
        const testCountry = countries[0];
        const wssUrl = buildBrightDataWSS(testCountry);
        
        logMessage(`Testing connection to ${testCountry.toUpperCase()}...`, 'info');
        
        // Simulate connection test (in real implementation, you'd test the WebSocket)
        setTimeout(() => {
            logMessage('Connection test successful!', 'success');
        }, 1000);

    } catch (error) {
        logMessage(`Connection test failed: ${error.message}`, 'error');
    }
}

async function generateTraffic() {
    try {
        const targetUrl = document.getElementById('targetUrl').value;
        const countries = getSelectedCountries();
        const sessionDuration = parseInt(document.getElementById('sessionDuration').value) * 1000;
        const pagesPerSession = parseInt(document.getElementById('pagesPerSession').value);
        const enableJS = document.getElementById('enableJS').value === 'true';

        if (!targetUrl) {
            throw new Error('Target URL is required');
        }

        if (countries.length === 0) {
            throw new Error('Please select at least one country');
        }

        // Select random country
        const country = countries[Math.floor(Math.random() * countries.length)];
        const wssUrl = buildBrightDataWSS(country);
        
        // Get random user agent and viewport
        const { userAgent, isMobile } = getRandomUserAgent();
        const viewport = getRandomViewport(isMobile);

        activeConnections++;
        updateStats();

        logMessage(`Starting session: ${country.toUpperCase()} | ${isMobile ? 'Mobile' : 'Desktop'} | ${viewport.width}x${viewport.height}`, 'info');

        // Simulate browser session
        await simulateBrowserSession(wssUrl, targetUrl, userAgent, viewport, sessionDuration, pagesPerSession, enableJS);

        successfulVisits++;
        totalVisits++;
        todayVisits++;
        
        logMessage(`Session completed successfully for ${targetUrl}`, 'success');

    } catch (error) {
        failedVisits++;
        totalVisits++;
        logMessage(`Session failed: ${error.message}`, 'error');
    } finally {
        activeConnections = Math.max(0, activeConnections - 1);
        updateStats();
    }
}

async function simulateBrowserSession(wssUrl, targetUrl, userAgent, viewport, duration, pages, enableJS) {
    // In a real implementation, this would:
    // 1. Connect to BrightData WebSocket
    // 2. Launch browser with specified parameters
    // 3. Navigate to target URL
    // 4. Simulate realistic user behavior
    // 5. Visit additional pages if specified
    // 6. Close browser after session duration

    return new Promise((resolve, reject) => {
        // Simulate session processing time
        const sessionTime = Math.random() * duration + 1000;
        
        setTimeout(() => {
            if (Math.random() > 0.1) { // 90% success rate
                resolve();
            } else {
                reject(new Error('Random session failure for testing'));
            }
        }, sessionTime);
    });
}

function startTrafficGeneration() {
    if (isRunning) {
        logMessage('Traffic generation is already running', 'info');
        return;
    }

    try {
        const interval = parseInt(document.getElementById('interval').value) * 1000;
        const startDate = new Date(document.getElementById('startDate').value);
        const endDate = new Date(document.getElementById('endDate').value);
        const now = new Date();

        // Validate dates
        if (startDate > endDate) {
            throw new Error('Start date must be before end date');
        }

        if (endDate < now) {
            throw new Error('End date must be in the future');
        }

        // Check if we should start now or schedule for later
        if (startDate > now) {
            const timeUntilStart = startDate.getTime() - now.getTime();
            logMessage(`Traffic generation scheduled to start at ${startDate.toLocaleString()}`, 'info');
            
            setTimeout(() => {
                startImmediateTrafficGeneration(interval, endDate);
            }, timeUntilStart);
        } else {
            startImmediateTrafficGeneration(interval, endDate);
        }

    } catch (error) {
        logMessage(`Failed to start traffic generation: ${error.message}`, 'error');
    }
}

function startImmediateTrafficGeneration(interval, endDate) {
    isRunning = true;
    logMessage('Traffic generation started!', 'success');

    trafficInterval = setInterval(() => {
        if (new Date() > endDate) {
            stopTrafficGeneration();
            logMessage('Traffic generation completed - end date reached', 'info');
            return;
        }

        generateTraffic();
    }, interval);

    // Generate first request immediately
    generateTraffic();
}

function stopTrafficGeneration() {
    if (!isRunning) {
        logMessage('Traffic generation is not running', 'info');
        return;
    }

    isRunning = false;
    if (trafficInterval) {
        clearInterval(trafficInterval);
        trafficInterval = null;
    }

    logMessage('Traffic generation stopped', 'info');
}

function clearLogs() {
    const logPanel = document.getElementById('logPanel');
    logPanel.innerHTML = '<div class="log-entry info">Logs cleared</div>';
}

// Initialize the application when the page loads
document.addEventListener('DOMContentLoaded', init);

// Reset daily