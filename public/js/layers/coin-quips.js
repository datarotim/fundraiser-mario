// Flash quips that appear when collecting coins/donors

const COIN_QUIPS = [
    'NEW DONOR.',
    'KA-CHING.',
    'THANK THEM.',
    'RETAINED.',
    'STEWARDSHIP.',
    'GIFT RECEIVED.',
    'SEND A RECEIPT.',
    'LOG IT IN THE CRM.',
    'MAJOR GIFT.',
    'MONTHLY GIVING.',
    'MATCHED.',
    'TAX DEDUCTIBLE.',
];

let currentQuip = null;
let quipStart = 0;
let lastCoinCount = 0;
const QUIP_DURATION_MS = 800;
const QUIP_CHANCE = 0.25; // Show a quip 25% of the time

export function checkCoinQuip(coinCount) {
    if (coinCount > lastCoinCount) {
        lastCoinCount = coinCount;
        if (Math.random() < QUIP_CHANCE) {
            currentQuip = COIN_QUIPS[Math.floor(Math.random() * COIN_QUIPS.length)];
            quipStart = performance.now();
        }
    }
}

export function createCoinQuipLayer(font, playerEntity) {
    return function drawCoinQuips(context) {
        if (!currentQuip) return;

        const elapsed = performance.now() - quipStart;
        if (elapsed > QUIP_DURATION_MS) {
            currentQuip = null;
            return;
        }

        const size = font.size;
        const w = context.canvas.width;
        // Float upward as time passes
        const floatY = Math.floor(size * 6 - (elapsed / QUIP_DURATION_MS) * size * 2);
        const x = Math.floor(w / 2) - Math.floor(currentQuip.length * size / 2);
        font.print(currentQuip, context, x, floatY);
    };
}
