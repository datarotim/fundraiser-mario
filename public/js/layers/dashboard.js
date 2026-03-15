import Player from "../traits/Player.js";
import LevelTimer from "../traits/LevelTimer.js";
import Killable from "../traits/Killable.js";
import Retention from "../traits/Retention.js";
import {GAME_OVER_MESSAGES as NARRATIVE_GAME_OVER, pickRandom} from "../narrative.js";

export function createDashboardLayer(font, entity) {
    const LINE1 = font.size * 2;
    const LINE2 = font.size * 3;

    let gameOverMessage = null;
    let gameOverShown = false;
    let gameOverClickHandler = null;

    return function drawDashboard(context) {
        const playerTrait = entity.traits.get(Player);
        const timerTrait = entity.traits.get(LevelTimer);

        font.print(playerTrait.name, context, 16, LINE1);
        font.print(playerTrait.score.toString().padStart(6, '0'), context, 16, LINE2);

        font.print('DONORS', context, 88, LINE1);
        font.print('×' + playerTrait.coins.toString().padStart(2, '0'), context, 96, LINE2);

        font.print('QUARTER', context, 136, LINE1);
        font.print(playerTrait.world, context, 152, LINE2);

        font.print('TIME', context, 200, LINE1);
        font.print(timerTrait.currentTime.toFixed().toString().padStart(3, '0'), context, 208, LINE2);

        // Retention health bar
        const retention = entity.traits.get(Retention);
        if (retention) {
            const LINE3 = font.size * 4 + 2;
            const barX = 16;
            const barW = 72;
            const barH = 4;
            const pct = retention.rate / 100;

            font.print('RETENTION', context, barX, LINE3);

            const barY = LINE3 + font.size + 1;

            // Bar background
            context.fillStyle = '#333';
            context.fillRect(barX, barY, barW, barH);

            // Bar fill - color changes based on level
            if (pct > 0.7) {
                context.fillStyle = '#2A9D8F';  // Healthy teal
            } else if (pct > 0.5) {
                context.fillStyle = '#E9C46A';  // Warning gold
            } else {
                context.fillStyle = '#C1272D';  // Critical crimson
            }
            context.fillRect(barX, barY, barW * pct, barH);

            // Percentage text
            const pctText = Math.floor(retention.rate) + '!';
            font.print(pctText, context, barX + barW + 4, LINE3 + font.size - 2);
        }

        // Game over message only when all lives are gone
        const killable = entity.traits.get(Killable);
        const playerLives = entity.traits.get(Player).lives;
        if (killable && killable.dead && killable.deadTime > 3 && playerLives <= 0) {
            if (!gameOverShown) {
                gameOverShown = true;
                gameOverMessage = pickRandom(NARRATIVE_GAME_OVER);
            }

            const w = context.canvas.width;
            const h = context.canvas.height;
            context.fillStyle = 'rgba(0, 0, 0, 0.85)';
            context.fillRect(0, 0, w, h);

            const centerX = (txt) => Math.floor(w / 2) - Math.floor(txt.length * font.size / 2);
            const midY = Math.floor(h / 2);

            font.print('GAME OVER', context, centerX('GAME OVER'), midY - font.size * 5);

            // Render multiline game over message
            const msgLines = gameOverMessage.split('\n');
            const msgStartY = midY - Math.floor(msgLines.length * font.size / 2);
            for (let i = 0; i < msgLines.length; i++) {
                font.print(msgLines[i], context, centerX(msgLines[i]), msgStartY + i * font.size * 1.5);
            }

            const ctaText = 'DATARO.COM';
            font.print(ctaText, context, centerX(ctaText), midY + font.size * 4);

            const retryText = 'CLICK TO RETRY';
            font.print(retryText, context, centerX(retryText), midY + font.size * 6);

            if (!gameOverClickHandler) {
                gameOverClickHandler = () => {
                    window.location.reload();
                };
                window.addEventListener('click', gameOverClickHandler);
            }
        }
    };
}
