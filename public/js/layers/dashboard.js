import Player from "../traits/Player.js";
import LevelTimer from "../traits/LevelTimer.js";

import {getDataroCollectFlashState} from "../entities/DataroPowerup.js";

const DATARO_FLASH_DURATION_MS = 3000;

export function createDashboardLayer(font, entity, entity2) {
    const LINE1 = font.size * 2;
    const LINE2 = font.size * 3;

    if (!entity2) {
        const BLOCK_ORIGIN = 16;
        const BLOCK_WIDTH = 216;

        return function drawDashboard(context) {
            const playerTrait = entity.traits.get(Player);
            const timerTrait = entity.traits.get(LevelTimer);

            const dx = Math.floor((context.canvas.width - BLOCK_WIDTH) / 2) - BLOCK_ORIGIN;

            font.print(playerTrait.name, context, 16 + dx, LINE1);
            font.print('$' + playerTrait.score.toString().padStart(6, '0'), context, 16 + dx, LINE2);

            font.print('SENT', context, 96 + dx, LINE1);
            font.print('×' + playerTrait.lettersSent.toString().padStart(2, '0'), context, 96 + dx, LINE2);

            font.print('QUARTER', context, 140 + dx, LINE1);
            font.print(playerTrait.world, context, 156 + dx, LINE2);

            font.print('TIME', context, 200 + dx, LINE1);
            font.print(timerTrait.currentTime.toFixed().toString().padStart(3, '0'), context, 208 + dx, LINE2);

            const flash = getDataroCollectFlashState();
            if (flash.triggered && (performance.now() - flash.start) < DATARO_FLASH_DURATION_MS) {
                const flashText = 'DATARO AI ACTIVATED';
                const x = Math.floor(context.canvas.width / 2) - Math.floor(flashText.length * font.size / 2);
                const y = Math.floor(context.canvas.height / 2) - font.size;
                font.print(flashText, context, x, y);
            }
        };
    }

    return function drawDashboard2P(context) {
        const w = context.canvas.width;
        const p1 = entity.traits.get(Player);
        const p2 = entity2.traits.get(Player);
        const timer = entity.traits.get(LevelTimer);

        // P1 stats (left)
        font.print(p1.name, context, 8, LINE1);
        font.print('$' + p1.score.toString().padStart(6, '0'), context, 8, LINE2);
        font.print('×' + p1.lettersSent.toString().padStart(2, '0'), context, 72, LINE2);

        // Shared center: quarter + time
        const cx = Math.floor(w / 2);
        const qLabel = 'QUARTER';
        font.print(qLabel, context, cx - Math.floor(qLabel.length * font.size / 2) - 20, LINE1);
        font.print(p1.world, context, cx - Math.floor(p1.world.length * font.size / 2) - 20, LINE2);

        const tLabel = 'TIME';
        font.print(tLabel, context, cx + 12, LINE1);
        const timeStr = timer.currentTime.toFixed().toString().padStart(3, '0');
        font.print(timeStr, context, cx + 12, LINE2);

        // P2 stats (right)
        const p2NameX = w - 8 - p2.name.length * font.size;
        font.print(p2.name, context, p2NameX, LINE1);
        const p2ScoreStr = '$' + p2.score.toString().padStart(6, '0');
        const p2SentStr = '×' + p2.lettersSent.toString().padStart(2, '0');
        font.print(p2SentStr, context, w - 8 - p2SentStr.length * font.size, LINE2);
        font.print(p2ScoreStr, context, w - 8 - p2SentStr.length * font.size - 4 - p2ScoreStr.length * font.size, LINE2);

        // Dataro flash
        const flash = getDataroCollectFlashState();
        if (flash.triggered && (performance.now() - flash.start) < DATARO_FLASH_DURATION_MS) {
            const flashText = 'DATARO AI ACTIVATED';
            const x = Math.floor(w / 2) - Math.floor(flashText.length * font.size / 2);
            const y = Math.floor(context.canvas.height / 2) - font.size;
            font.print(flashText, context, x, y);
        }
    };
}
