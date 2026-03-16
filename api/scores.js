import { put, list, getStore } from '@vercel/blob';

const BLOB_KEY = 'leaderboard.json';

async function readLeaderboard() {
    try {
        const { blobs } = await list({ prefix: BLOB_KEY });
        if (blobs.length === 0) return [];
        const resp = await fetch(blobs[0].url);
        return await resp.json();
    } catch {
        return [];
    }
}

async function writeLeaderboard(data) {
    await put(BLOB_KEY, JSON.stringify(data), {
        access: 'public',
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
        const today = getTodayScores(allData);
        return res.status(200).json({ leaderboard: today });
    }

    if (req.method === 'POST') {
        const { name, score, donors, world, email, org, lettersSent, responseRate } = req.body || {};

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
            time: Date.now(),
        });
        allData.sort((a, b) => b.score - a.score);
        const trimmed = allData.slice(0, 500);

        await writeLeaderboard(trimmed);

        const today = getTodayScores(trimmed);
        return res.status(200).json({ leaderboard: today });
    }

    return res.status(405).json({ error: 'Method not allowed' });
}
