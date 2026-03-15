import {getDataroCollectFlashState} from "../entities/DataroPowerup.js";

// The Dataro Reveal Effect — the marquee moment
// Phase 1: Purple pulse ring (0-0.3s)
// Phase 2: Purple scan lines sweep left-to-right (0.3-1.0s)
// Phase 3: "DATARO AI ACTIVATED" text (1.0-1.7s)
// Phase 4: "POWERED BY DATARO AI" settle (1.7-2.5s)
// Subsequent activations: abbreviated 1s version

const FULL_DURATION = 2500;
const SHORT_DURATION = 1000;
const PURPLE = '#6B3FA0';
const VIOLET = '#9B6FD0';
const DEEP_PURPLE = '#3D1F6D';

let activationCount = 0;
let lastTriggered = false;

export function createDataroRevealLayer(font) {
    return function drawDataroReveal(context, camera) {
        const flash = getDataroCollectFlashState();
        if (!flash.triggered) return;

        const elapsed = performance.now() - flash.start;

        // Track new activations
        if (flash.triggered && !lastTriggered) {
            activationCount++;
        }
        lastTriggered = flash.triggered;

        const duration = activationCount <= 1 ? FULL_DURATION : SHORT_DURATION;
        if (elapsed > duration) return;

        const t = elapsed / duration;
        const w = context.canvas.width;
        const h = context.canvas.height;

        if (activationCount <= 1) {
            drawFullReveal(context, font, t, w, h);
        } else {
            drawShortReveal(context, font, t, w, h);
        }
    };
}

function drawFullReveal(context, font, t, w, h) {
    const centerX = w / 2;
    const centerY = h / 2;

    // Phase 1: Purple pulse ring (0-0.12)
    if (t < 0.12) {
        const pt = t / 0.12;
        const radius = pt * Math.max(w, h) * 0.8;
        const alpha = 1 - pt * 0.5;

        context.strokeStyle = PURPLE;
        context.globalAlpha = alpha;
        context.lineWidth = 4 - pt * 2;
        context.beginPath();
        context.arc(centerX, centerY, radius, 0, Math.PI * 2);
        context.stroke();

        // Brief freeze frame flash
        context.fillStyle = VIOLET;
        context.globalAlpha = (1 - pt) * 0.3;
        context.fillRect(0, 0, w, h);
    }

    // Phase 2: Scan lines sweep left-to-right (0.12-0.4)
    if (t >= 0.12 && t < 0.4) {
        const pt = (t - 0.12) / 0.28;
        const scanX = pt * w;

        // Scan line
        context.globalAlpha = 0.6;
        context.fillStyle = PURPLE;
        const lineWidth = 8;
        context.fillRect(scanX - lineWidth / 2, 0, lineWidth, h);

        // Trailing purple glow
        const gradient = context.createLinearGradient(scanX - 60, 0, scanX, 0);
        gradient.addColorStop(0, 'rgba(107, 63, 160, 0)');
        gradient.addColorStop(1, 'rgba(107, 63, 160, 0.3)');
        context.fillStyle = gradient;
        context.fillRect(scanX - 60, 0, 60, h);
    }

    // Phase 3: Camera shake + text reveal (0.4-0.68)
    if (t >= 0.4 && t < 0.68) {
        const pt = (t - 0.4) / 0.28;

        // Camera shake effect (just visual noise)
        if (pt < 0.3) {
            const shakeX = (Math.random() - 0.5) * 3;
            const shakeY = (Math.random() - 0.5) * 3;
            context.translate(shakeX, shakeY);
        }

        // Purple vignette
        context.globalAlpha = 0.15 * (1 - pt * 0.5);
        context.fillStyle = DEEP_PURPLE;
        context.fillRect(0, 0, w, h);

        // Main text
        context.globalAlpha = Math.min(1, pt * 3);
        const text = 'DATARO AI ACTIVATED';
        const tx = Math.floor(centerX) - Math.floor(text.length * font.size / 2);
        const ty = Math.floor(centerY) - font.size;
        font.print(text, context, tx, ty);

        context.setTransform(1, 0, 0, 1, 0, 0);
    }

    // Phase 4: Settle + "POWERED BY" (0.68-1.0)
    if (t >= 0.68) {
        const pt = (t - 0.68) / 0.32;

        // Fading purple vignette at edges
        context.globalAlpha = 0.1 * (1 - pt);
        context.fillStyle = DEEP_PURPLE;
        context.fillRect(0, 0, w, h);

        // "DATARO AI ACTIVATED" fading out
        context.globalAlpha = 1 - pt;
        const text = 'DATARO AI ACTIVATED';
        const tx = Math.floor(centerX) - Math.floor(text.length * font.size / 2);
        const ty = Math.floor(centerY) - font.size;
        font.print(text, context, tx, ty);

        // "POWERED BY DATARO AI" fading in then out
        context.globalAlpha = pt < 0.5 ? pt * 2 : 2 - pt * 2;
        const subText = 'POWERED BY DATARO AI';
        const sx = Math.floor(centerX) - Math.floor(subText.length * font.size / 2);
        font.print(subText, context, sx, ty + font.size * 2);
    }

    context.globalAlpha = 1;
}

function drawShortReveal(context, font, t, w, h) {
    const centerX = w / 2;
    const centerY = h / 2;

    // Quick pulse
    if (t < 0.2) {
        context.fillStyle = VIOLET;
        context.globalAlpha = (1 - t / 0.2) * 0.25;
        context.fillRect(0, 0, w, h);
    }

    // Text flash
    if (t < 0.8) {
        context.globalAlpha = t < 0.3 ? t / 0.3 : (0.8 - t) / 0.5;
        const text = 'DATARO AI ACTIVATED';
        const tx = Math.floor(centerX) - Math.floor(text.length * font.size / 2);
        font.print(text, context, tx, Math.floor(centerY) - font.size);
    }

    context.globalAlpha = 1;
}
