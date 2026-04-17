import Scene from './Scene.js';

// A scene that displays all narrative text at once with a stepped retro
// fade-in, then completes on click/key or after an auto-advance hold.
export default class NarrativeScene extends Scene {
    constructor(font, lines, options = {}) {
        super();
        this.font = font;
        this.lines = lines;
        this.elapsed = 0;
        this.fadeIn = 0;
        this.phase = 'fading'; // fading -> waiting -> done
        this.holdTime = 0;
        this.title = options.title || null;
        this.subtitle = options.subtitle || null;
        this.showPrompt = options.showPrompt !== false;

        // Allow skip after a brief delay so stray keypresses from the prior
        // screen don't dismiss the intro instantly.
        this._skipDelay = 1.0;
        this._dismissed = false;

        this._onKey = () => {
            if (this.elapsed > this._skipDelay && !this._dismissed) {
                this._dismissed = true;
                this.events.emit(Scene.EVENT_COMPLETE);
            }
        };
        this._onClick = () => {
            if (this.elapsed > this._skipDelay && !this._dismissed) {
                this._dismissed = true;
                this.events.emit(Scene.EVENT_COMPLETE);
            }
        };

        window.addEventListener('keydown', this._onKey);
        window.addEventListener('click', this._onClick);
    }

    pause() {
        window.removeEventListener('keydown', this._onKey);
        window.removeEventListener('click', this._onClick);
    }

    update(gameContext) {
        this.elapsed += gameContext.deltaTime;

        const FADE_DURATION = 2;
        const FADE_STEPS = 8;
        const raw = Math.min(1, this.elapsed / FADE_DURATION);
        this.fadeIn = Math.ceil(raw * FADE_STEPS) / FADE_STEPS;

        if (this.phase === 'fading' && this.fadeIn >= 1) {
            this.phase = 'waiting';
        }

        if (this.phase === 'waiting') {
            this.holdTime += gameContext.deltaTime;
            if (this.holdTime > 15 && !this._dismissed) {
                this._dismissed = true;
                this.events.emit(Scene.EVENT_COMPLETE);
            }
        }
    }

    draw(gameContext) {
        const ctx = gameContext.videoContext;
        const size = this.font.size;
        const w = ctx.canvas.width;
        const h = ctx.canvas.height;

        ctx.fillStyle = '#000';
        ctx.fillRect(0, 0, w, h);

        const pad = 8;
        const topReserve = this.title ? size * 3 : size;
        const bottomReserve = size * 3;

        // Draw title at native size (not scaled), faded with the rest.
        ctx.globalAlpha = this.fadeIn;
        if (this.title) {
            const titleX = Math.floor(w / 2) - Math.floor(this.title.length * size / 2);
            this.font.print(this.title, ctx, titleX, 16);
        }

        // Scale-to-fit the narrative block inside the remaining canvas area.
        const maxLineChars = Math.max(1, ...this.lines.map(l => l.length));
        const textRawW = maxLineChars * size;
        const textRawH = this.lines.length * size * 1.5;
        const availW = w - pad * 2;
        const availH = h - topReserve - bottomReserve;
        const scale = Math.min(availW / textRawW, availH / textRawH, 1);

        const blockW = textRawW * scale;
        const blockH = textRawH * scale;
        const originX = Math.floor((w - blockW) / 2);
        const originY = Math.floor(topReserve + (availH - blockH) / 2);

        ctx.save();
        ctx.imageSmoothingEnabled = false;
        ctx.translate(originX, originY);
        ctx.scale(scale, scale);
        for (let i = 0; i < this.lines.length; i++) {
            const line = this.lines[i];
            if (!line) continue;
            const lineX = Math.floor((textRawW - line.length * size) / 2);
            const lineY = Math.floor(i * size * 1.5);
            this.font.print(line, ctx, lineX, lineY);
        }
        ctx.restore();

        // Skip prompt pulses once fade is complete and skip delay has passed.
        if (this.showPrompt && this.elapsed > this._skipDelay && this.phase === 'waiting') {
            const promptAlpha = 0.4 + 0.6 * Math.sin(this.elapsed * 3);
            ctx.globalAlpha = promptAlpha;
            const prompt = 'PRESS ANY KEY';
            const px = Math.floor(w / 2) - Math.floor(prompt.length * size / 2);
            this.font.print(prompt, ctx, px, h - size * 3);
        }

        ctx.globalAlpha = 1;
    }
}
