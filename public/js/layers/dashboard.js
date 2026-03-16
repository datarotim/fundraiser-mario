import Player from "../traits/Player.js";
import LevelTimer from "../traits/LevelTimer.js";

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

        font.print('SENT', context, 96, LINE1);
        font.print('×' + playerTrait.lettersSent.toString().padStart(2, '0'), context, 96, LINE2);

        font.print('QUARTER', context, 140, LINE1);
        font.print(playerTrait.world, context, 156, LINE2);

        font.print('TIME', context, 200, LINE1);
        font.print(timerTrait.currentTime.toFixed().toString().padStart(3, '0'), context, 208, LINE2);


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
