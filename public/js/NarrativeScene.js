import Scene from './Scene.js';

// A scene that displays scrolling narrative text, then completes on click/key
export default class NarrativeScene extends Scene {
    constructor(font, lines, options = {}) {
        super();
        this.font = font;
        this.lines = lines;
        this.scrollOffset = 0;
        this.scrollSpeed = options.scrollSpeed || 18; // pixels per second
        this.holdTime = 0;
        this.phase = 'scrolling'; // scrolling -> waiting -> done
        this.skipReady = false;
        this.elapsed = 0;
        this.fadeIn = 0;
        this.title = options.title || null;
        this.subtitle = options.subtitle || null;
        this.showPrompt = options.showPrompt !== false;

        // Allow skip after a brief delay
        this._skipDelay = 1.0;
        this._dismissed = false;

        this._onKey = (e) => {
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
        this.fadeIn = Math.min(1, this.elapsed / 0.5);

        const size = this.font.size;
        const totalTextHeight = this.lines.length * size * 1.5;
        const canvasH = 240; // fixed canvas height

        if (this.phase === 'scrolling') {
            if (this.scrollSpeed <= 0) {
                this.phase = 'waiting';
            } else {
                this.scrollOffset += this.scrollSpeed * gameContext.deltaTime;
                const targetScroll = Math.max(0, (totalTextHeight - canvasH * 0.6) / 2);
                if (this.scrollOffset >= targetScroll + canvasH * 0.3) {
                    this.phase = 'waiting';
                }
            }
        }

        if (this.phase === 'waiting') {
            this.holdTime += gameContext.deltaTime;
            // Auto-advance after 8 seconds of waiting
            if (this.holdTime > 8 && !this._dismissed) {
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

        // Black background
        ctx.fillStyle = '#000';
        ctx.fillRect(0, 0, w, h);

        // Fade in
        ctx.globalAlpha = this.fadeIn;

        // Title at top if provided
        let yStart = 30;
        if (this.title) {
            const titleX = Math.floor(w / 2) - Math.floor(this.title.length * size / 2);
            this.font.print(this.title, ctx, titleX, 16);
            yStart = 36;
        }

        // Draw narrative lines
        const lineHeight = size * 1.5;
        let startY;
        if (this.scrollSpeed <= 0) {
            // Static centered text
            const totalTextH = this.lines.length * lineHeight;
            startY = Math.floor(h / 2 - totalTextH / 2) + (this.title ? size * 2 : 0);
        } else {
            startY = h * 0.3 + yStart - this.scrollOffset + h * 0.4;
        }

        for (let i = 0; i < this.lines.length; i++) {
            const line = this.lines[i];
            if (!line) continue;
            const y = startY + i * lineHeight;
            if (y < -size || y > h + size) continue;
            const x = Math.floor(w / 2) - Math.floor(line.length * size / 2);
            this.font.print(line, ctx, x, Math.floor(y));
        }

        // Skip prompt
        if (this.showPrompt && this.elapsed > this._skipDelay) {
            const promptAlpha = 0.4 + 0.6 * Math.sin(this.elapsed * 3);
            ctx.globalAlpha = promptAlpha;
            const prompt = 'PRESS ANY KEY';
            const px = Math.floor(w / 2) - Math.floor(prompt.length * size / 2);
            this.font.print(prompt, ctx, px, h - size * 3);
        }

        ctx.globalAlpha = 1;
    }
}
