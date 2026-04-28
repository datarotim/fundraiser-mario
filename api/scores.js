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
        allowOverwrite: true,
        contentType: 'application/json',
    });
}

// Anchor "today" to Los Angeles time so client & server agree regardless
// of where the Vercel function runs (UTC by default).
const PST_DATE_FMT = new Intl.DateTimeFormat('en-US', {
    timeZone: 'America/Los_Angeles',
    year: 'numeric', month: '2-digit', day: '2-digit',
});
function dateKeyInPST(d) { return PST_DATE_FMT.format(d); }

function getTodayScores(allData) {
    const today = dateKeyInPST(new Date());
    return allData.filter(e => {
        try { return dateKeyInPST(new Date(e.time)) === today; } catch { return false; }
    });
}

export default async function handler(req, res) {
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'GET, POST, DELETE, OPTIONS');
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
        const { name, lastName, score, donors, world, org, email, lettersSent, responseRate } = req.body || {};

        if (typeof score !== 'number' || !name) {
            return res.status(400).json({ error: 'name and score are required' });
        }

        const allData = await readLeaderboard();
        allData.push({
            name,
            lastName: lastName || '',
            score,
            donors: donors || 0,
            world: world || 1,
            org: org || '',
            email: email || '',
            lettersSent: lettersSent || 0,
            responseRate: responseRate || 0,
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

    if (req.method === 'DELETE') {
        try {
            await writeLeaderboard([]);
            console.log('[Scores API] Leaderboard cleared via DELETE');
            return res.status(200).json({ leaderboard: [] });
        } catch (err) {
            console.error('[Scores API] Failed to clear leaderboard:', err.message);
            return res.status(500).json({ error: 'Failed to clear leaderboard' });
        }
    }

    return res.status(405).json({ error: 'Method not allowed' });
}
