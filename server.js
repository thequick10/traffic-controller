import express from 'express';
import puppeteer from "puppeteer";
import bodyParser from 'body-parser';
import cors from 'cors';
import { fileURLToPath } from 'url';
import path from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const PORT = 5000;

const app = express();
app.use(cors());
app.use(bodyParser.json());

app.post('/start-traffic', async (req, res) => {
    const {
        customerId,
        zoneName,
        zonePassword,
        endpoint,
        targetUrl,
        dailyTarget,
        sessionDuration,
        pagesPerSession,
        mobileRatio,
        enableJS
    } = req.body;

    const proxyAuth = `${customerId}-zone-${zoneName}:${zonePassword}@${endpoint}`;

    const simulateVisit = async (index) => {
        const isMobile = Math.random() < mobileRatio / 100;
        const userAgent = isMobile
            ? 'Mozilla/5.0 (iPhone; CPU iPhone OS 17_0 like Mac OS X)...'
            : 'Mozilla/5.0 (Windows NT 10.0; Win64; x64)...';

        const browser = await puppeteer.launch({
            headless: true,
            args: [`--proxy-server=http://${proxyAuth}`, '--no-sandbox']
        });

        const page = await browser.newPage();
        await page.setUserAgent(userAgent);
        if (!enableJS) await page.setJavaScriptEnabled(false);

        try {
            await page.goto(targetUrl, { waitUntil: 'load', timeout: 30000 });

            for (let i = 1; i < pagesPerSession; i++) {
                const links = await page.$$eval('a[href]', anchors =>
                    anchors.map(a => a.href).filter(link => link.includes(targetUrl))
                );

                if (links.length === 0) break;

                const next = links[Math.floor(Math.random() * links.length)];
                await page.goto(next, { waitUntil: 'load', timeout: 15000 });
            }

            await page.waitForTimeout(sessionDuration * 1000);
            console.log(`[${index}] ✅ Session finished.`);
        } catch (err) {
            console.error(`[${index}] ❌ Error:`, err.message);
        } finally {
            await browser.close();
        }
    };

    // Launch sessions with spacing (interval could be added)
    for (let i = 0; i < dailyTarget; i++) {
        setTimeout(() => simulateVisit(i), i * 2000); // 2s delay between starts
    }

    return res.json({ success: true, message: 'Traffic started' });
});

// IP endpoint
app.get('/ip', (req, res) => {
  const rawIp =
    req.headers['x-forwarded-for']?.split(',')[0] ||
    req.socket?.remoteAddress ||
    req.ip;

  // Remove IPv6 prefix if present
  const clientIp = rawIp?.replace(/^::ffff:/, '');

  console.log(`Client IP: ${clientIp}`);
  res.send({ ip : clientIp });
});

// Serve the main HTML file
app.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

app.listen(PORT, () => {
  console.log(`🚀 Traffic Generator running at http://localhost:${PORT}`);
});
