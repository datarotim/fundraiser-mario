import Scene from './Scene.js';
import { VICTORY_MESSAGES, pickRandom } from './narrative.js';

// Victory screen shown after completing a level / the game
export default class VictoryScene extends Scene {
    constructor(font, playerTrait, options = {}) {
        super();
        this.font = font;
        this.player = playerTrait;
        this.elapsed = 0;
        this.message = pickRandom(VICTORY_MESSAGES);
        this.isFinal = options.isFinal || false;
        this._dismissed = false;

        this._onKey = () => {
            if (this.elapsed > 2.0 && !this._dismissed) {
                this._dismissed = true;
                this.events.emit(Scene.EVENT_COMPLETE);
            }
        };
        this._onClick = () => {
            if (this.elapsed > 2.0 && !this._dismissed) {
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
        // Auto-advance after 12 seconds
        if (this.elapsed > 12 && !this._dismissed) {
            this._dismissed = true;
            this.events.emit(Scene.EVENT_COMPLETE);
        }
    }

    draw(gameContext) {
        const ctx = gameContext.videoContext;
        const size = this.font.size;
        const w = ctx.canvas.width;
        const h = ctx.canvas.height;

        // Dark purple overlay
        ctx.fillStyle = '#0a0014';
        ctx.fillRect(0, 0, w, h);

        const fadeIn = Math.min(1, this.elapsed / 1.0);
        ctx.globalAlpha = fadeIn;

        const centerX = (txt) => Math.floor(w / 2) - Math.floor(txt.length * size / 2);
        let y = size * 3;

        // Title
        const title = this.isFinal ? 'YOU SURVIVED' : 'QUARTER COMPLETE';
        this.font.print(title, ctx, centerX(title), y);
        y += size * 3;

        // Stats
        const scoreText = 'SCORE ' + this.player.score.toString().padStart(6, '0');
        this.font.print(scoreText, ctx, centerX(scoreText), y);
        y += size * 2;

        const donorText = 'DONORS ' + this.player.coins.toString();
        this.font.print(donorText, ctx, centerX(donorText), y);
        y += size * 2;

        const sentText = 'LETTERS SENT ' + this.player.lettersSent.toString();
        this.font.print(sentText, ctx, centerX(sentText), y);
        y += size * 2;

        const responseRate = this.player.lettersSent > 0
            ? Math.round((this.player.coins / this.player.lettersSent) * 100)
            : 0;
        const rateText = 'RESPONSE RATE ' + responseRate + '!';
        this.font.print(rateText, ctx, centerX(rateText), y);
        y += size * 2;

        const livesText = 'LIVES ' + this.player.lives.toString();
        this.font.print(livesText, ctx, centerX(livesText), y);
        y += size * 3;

        // Victory message (multiline)
        const msgLines = this.message.split('\n');
        for (let i = 0; i < msgLines.length; i++) {
            this.font.print(msgLines[i], ctx, centerX(msgLines[i]), y + i * size * 1.5);
        }
        y += msgLines.length * size * 1.5 + size * 2;

        // CTA
        const cta = 'POWERED BY DATARO AI';
        this.font.print(cta, ctx, centerX(cta), y);
        y += size * 2;

        const url = 'DATARO.COM';
        this.font.print(url, ctx, centerX(url), y);

        // Prompt
        if (this.elapsed > 2.0) {
            const promptAlpha = 0.4 + 0.6 * Math.sin(this.elapsed * 3);
            ctx.globalAlpha = promptAlpha;
            const prompt = this.isFinal ? 'CLICK TO PLAY AGAIN' : 'PRESS ANY KEY';
            this.font.print(prompt, ctx, centerX(prompt), h - size * 2);
        }

        ctx.globalAlpha = 1;
    }
}
