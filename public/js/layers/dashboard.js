import Player from "../traits/Player.js";
import LevelTimer from "../traits/LevelTimer.js";
import Killable from "../traits/Killable.js";
import {getDataroCollectFlashState} from "../entities/DataroPowerup.js";

const DATARO_FLASH_DURATION_MS = 3000;

const GAME_OVER_MESSAGES = [
    'EVERY DONOR COUNTS',
    'RETAIN MORE DONORS',
    'DATA DRIVES GIVING',
    'PREDICT THE FUTURE',
    'AI POWERED FUNDRAISING',
    'SMARTER FUNDRAISING',
    'UNLOCK GIVING POTENTIAL',
];

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

        // Dataro AI flash when power-up is collected
        const flash = getDataroCollectFlashState();
        if (flash.triggered && (performance.now() - flash.start) < DATARO_FLASH_DURATION_MS) {
            const flashText = 'DATARO AI ACTIVATED';
            const x = Math.floor(context.canvas.width / 2) - Math.floor(flashText.length * font.size / 2);
            const y = Math.floor(context.canvas.height / 2) - font.size;
            font.print(flashText, context, x, y);
        }

        // Game over message only when all lives are gone
        const killable = entity.traits.get(Killable);
        const playerLives = entity.traits.get(Player).lives;
        if (killable && killable.dead && killable.deadTime > 3 && playerLives <= 0) {
            if (!gameOverShown) {
                gameOverShown = true;
                gameOverMessage = GAME_OVER_MESSAGES[Math.floor(Math.random() * GAME_OVER_MESSAGES.length)];
            }

            const w = context.canvas.width;
            const h = context.canvas.height;
            context.fillStyle = 'rgba(0, 0, 0, 0.8)';
            context.fillRect(0, 0, w, h);

            const centerX = (txt) => Math.floor(w / 2) - Math.floor(txt.length * font.size / 2);
            const midY = Math.floor(h / 2);

            font.print('GAME OVER', context, centerX('GAME OVER'), midY - font.size * 3);
            font.print(gameOverMessage, context, centerX(gameOverMessage), midY);
            font.print('DATARO.COM', context, centerX('DATARO.COM'), midY + font.size * 3);

            const retryText = 'CLICK TO RETRY';
            font.print(retryText, context, centerX(retryText), midY + font.size * 5);

            if (!gameOverClickHandler) {
                gameOverClickHandler = () => {
                    window.location.reload();
                };
                window.addEventListener('click', gameOverClickHandler);
            }
        }
    };
}
