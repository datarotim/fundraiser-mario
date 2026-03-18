import { put, list, del } from '@vercel/blob';

/**
 * GET /api/test-storage — Tests that Vercel Blob storage is working.
 *
 * Writes a test entry, reads it back, then cleans up.
 * Returns a diagnostic report.
 */
export default async function handler(req, res) {
    res.setHeader('Access-Control-Allow-Origin', '*');

    const results = {
        tokenPresent: !!process.env.BLOB_READ_WRITE_TOKEN,
        writeTest: null,
        readTest: null,
        leaderboardEntries: null,
        error: null,
    };

    try {
        // 1. Check if token exists
        if (!results.tokenPresent) {
            results.error = 'BLOB_READ_WRITE_TOKEN env var is not set. Add it in Vercel project settings.';
            return res.status(200).json(results);
        }

        // 2. Test write
        const testKey = '_test-storage-probe.json';
        const testData = { test: true, time: Date.now() };
        await put(testKey, JSON.stringify(testData), {
            access: 'public',
            addRandomSuffix: false,
            contentType: 'application/json',
        });
        results.writeTest = 'OK';

        // 3. Test read
        const { blobs } = await list({ prefix: testKey });
        if (blobs.length > 0) {
            const resp = await fetch(blobs[0].url);
            const readBack = await resp.json();
            results.readTest = readBack.test === true ? 'OK' : 'DATA_MISMATCH';
            // Clean up test blob
            await del(blobs[0].url);
        } else {
            results.readTest = 'BLOB_NOT_FOUND_AFTER_WRITE';
        }

        // 4. Check actual leaderboard
        const { blobs: lbBlobs } = await list({ prefix: 'leaderboard.json' });
        if (lbBlobs.length > 0) {
            const resp = await fetch(lbBlobs[0].url);
            const data = await resp.json();
            results.leaderboardEntries = data.length;
        } else {
            results.leaderboardEntries = 0;
        }

    } catch (err) {
        results.error = err.message;
    }

    return res.status(200).json(results);
}
