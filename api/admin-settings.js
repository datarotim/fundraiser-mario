import { put, list } from '@vercel/blob';

const BLOB_KEY = 'admin-config.json';

const DEFAULTS = {
    mode: 'event',
    fields: { firstName: true, lastName: false, org: false, email: false },
    aspectRatio: '16-9',
    twoPlayerEnabled: true,
    fiestaEnabled: true,
};

async function readConfig() {
    try {
        const { blobs } = await list({ prefix: BLOB_KEY });
        if (blobs.length === 0) return { ...DEFAULTS, fields: { ...DEFAULTS.fields } };
        const resp = await fetch(blobs[0].url, {
            headers: { Authorization: `Bearer ${process.env.BLOB_READ_WRITE_TOKEN}` },
        });
        const data = await resp.json();
        return {
            mode: data.mode === 'digital' ? 'digital' : 'event',
            fields: { ...DEFAULTS.fields, ...(data.fields || {}) },
            aspectRatio: data.aspectRatio === '4-3' ? '4-3' : '16-9',
            twoPlayerEnabled: data.twoPlayerEnabled !== false,
            fiestaEnabled: data.fiestaEnabled !== false,
        };
    } catch (err) {
        console.error('[Admin] Failed to read config:', err.message);
        return { ...DEFAULTS, fields: { ...DEFAULTS.fields } };
    }
}

async function writeConfig(cfg) {
    await put(BLOB_KEY, JSON.stringify(cfg), {
        access: 'private',
        addRandomSuffix: false,
        allowOverwrite: true,
        contentType: 'application/json',
    });
}

function sanitize(body) {
    const incoming = body || {};
    const fields = incoming.fields || {};
    return {
        mode: incoming.mode === 'digital' ? 'digital' : 'event',
        fields: {
            firstName: Boolean(fields.firstName),
            lastName: Boolean(fields.lastName),
            org: Boolean(fields.org),
            email: Boolean(fields.email),
        },
        aspectRatio: incoming.aspectRatio === '4-3' ? '4-3' : '16-9',
        twoPlayerEnabled: incoming.twoPlayerEnabled !== false,
        fiestaEnabled: incoming.fiestaEnabled !== false,
    };
}

export default async function handler(req, res) {
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

    if (req.method === 'OPTIONS') return res.status(200).end();

    if (req.method === 'GET') {
        const cfg = await readConfig();
        return res.status(200).json(cfg);
    }

    if (req.method === 'POST') {
        const cfg = sanitize(req.body);
        try {
            await writeConfig(cfg);
            return res.status(200).json(cfg);
        } catch (err) {
            console.error('[Admin] Failed to write config:', err.message);
            return res.status(500).json({ error: 'Failed to save config' });
        }
    }

    return res.status(405).json({ error: 'Method not allowed' });
}
