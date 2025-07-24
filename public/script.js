function logMessage(message, type = 'info') {
    const logPanel = document.getElementById('logPanel');
    const entry = document.createElement('div');
    entry.className = `log-entry ${type}`;
    entry.textContent = `[${new Date().toLocaleTimeString()}] ${message}`;
    logPanel.appendChild(entry);
    logPanel.scrollTop = logPanel.scrollHeight;
}

function updateProgress(total, current) {
    const percent = Math.min((current / total) * 100, 100);
    document.getElementById('progressFill').style.width = `${percent}%`;
    document.getElementById('progressText').textContent = `${current} / ${total}`;
}

function startTrafficGeneration() {
    const payload = {
        customerId: document.getElementById('customerId').value.trim(),
        zoneName: document.getElementById('zoneName').value.trim(),
        zonePassword: document.getElementById('zonePassword').value.trim(),
        endpoint: document.getElementById('endpoint').value,
        targetUrl: document.getElementById('targetUrl').value,
        dailyTarget: parseInt(document.getElementById('dailyTarget').value),
        interval: parseInt(document.getElementById('interval').value),
        sessionDuration: parseInt(document.getElementById('sessionDuration').value),
        pagesPerSession: parseInt(document.getElementById('pagesPerSession').value),
        mobileRatio: parseInt(document.getElementById('mobileRatio').value),
        enableJS: document.getElementById('enableJS').value === 'true'
    };

    fetch('/start-traffic', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
    })
    .then(res => res.json())
    .then(data => {
        if (data.success) {
            logMessage(`Started traffic generation to ${payload.targetUrl}`, 'success');
        } else {
            logMessage(`Error: ${data.message}`, 'error');
        }
    })
    .catch(err => {
        logMessage(`Failed to start traffic: ${err.message}`, 'error');
    });
}

function clearLogs() {
    document.getElementById('logPanel').innerHTML = '';
}
