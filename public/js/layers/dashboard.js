import Player from "../traits/Player.js";
import LevelTimer from "../traits/LevelTimer.js";

import {getDataroCollectFlashState} from "../entities/DataroPowerup.js";

const DATARO_FLASH_DURATION_MS = 3000;

export function createDashboardLayer(font, entity) {
    const LINE1 = font.size * 2;
    const LINE2 = font.size * 3;

    // HUD block spans x=16 to x=232 (name/$score, SENT/×NN, QUARTER/world,
    // TIME/NNN). Shift the whole block uniformly so it's horizontally
    // centered on any canvas width while preserving intra-column gaps.
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
