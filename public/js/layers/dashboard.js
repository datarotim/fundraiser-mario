import Player from "../traits/Player.js";
import LevelTimer from "../traits/LevelTimer.js";
import Retention from "../traits/Retention.js";
import {getDataroCollectFlashState} from "../entities/DataroPowerup.js";

const DATARO_FLASH_DURATION_MS = 3000;

export function createDashboardLayer(font, entity) {
    const LINE1 = font.size * 2;
    const LINE2 = font.size * 3;

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

        // Dataro AI flash when power-up is collected
        const flash = getDataroCollectFlashState();
        if (flash.triggered && (performance.now() - flash.start) < DATARO_FLASH_DURATION_MS) {
            const flashText = 'DATARO AI ACTIVATED';
            const x = Math.floor(context.canvas.width / 2) - Math.floor(flashText.length * font.size / 2);
            const y = Math.floor(context.canvas.height / 2) - font.size;
            font.print(flashText, context, x, y);
        }
    };
}
