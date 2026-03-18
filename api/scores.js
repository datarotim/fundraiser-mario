import { put, list } from '@vercel/blob';

const BLOB_KEY = 'leaderboard.json';

async function readLeaderboard() {
    try {
        const { blobs } = await list({ prefix: BLOB_KEY });
        if (blobs.length === 0) {
            console.log('[Scores API] No existing leaderboard blob found, starting fresh');
            return [];
        }
        const resp = await fetch(blobs[0].url, {
            headers: { Authorization: `Bearer ${process.env.BLOB_READ_WRITE_TOKEN}` },
        });
        return await resp.json();
    } catch (err) {
        console.error('[Scores API] Failed to read leaderboard:', err.message);
        return [];
    }
}

async function writeLeaderboard(data) {
    await put(BLOB_KEY, JSON.stringify(data), {
        access: 'private',
        addRandomSuffix: false,
        contentType: 'application/json',
    });
}

function getTodayScores(allData) {
    const today = new Date().toDateString();
    return allData.filter(e => {
        try { return new Date(e.time).toDateString() === today; } catch { return false; }
    });
}

export default async function handler(req, res) {
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

    if (req.method === 'OPTIONS') {
        return res.status(200).end();
    }

    if (req.method === 'GET') {
        const allData = await readLeaderboard();
        if (req.query.all === 'true') {
            return res.status(200).json({ leaderboard: allData });
        }
        const today = getTodayScores(allData);
        return res.status(200).json({ leaderboard: today });
    }

    if (req.method === 'POST') {
        const { name, score, donors, world, email, org, lettersSent, responseRate, wantsUpdates } = req.body || {};

        if (typeof score !== 'number' || !name) {
            return res.status(400).json({ error: 'name and score are required' });
        }

        const allData = await readLeaderboard();
        allData.push({
            name,
            score,
            donors: donors || 0,
            world: world || 1,
            email: email || '',
            org: org || '',
            lettersSent: lettersSent || 0,
            responseRate: responseRate || 0,
            wantsUpdates: wantsUpdates || false,
            time: Date.now(),
        });
        allData.sort((a, b) => b.score - a.score);
        const trimmed = allData.slice(0, 500);

        try {
            await writeLeaderboard(trimmed);
            console.log('[Scores API] Leaderboard saved with', trimmed.length, 'entries');
        } catch (err) {
            console.error('[Scores API] Failed to write leaderboard blob:', err.message);
            return res.status(500).json({ error: 'Failed to save score to storage' });
        }

        const today = getTodayScores(trimmed);
        return res.status(200).json({ leaderboard: today });
    }

    return res.status(405).json({ error: 'Method not allowed' });
}
