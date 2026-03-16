import {findPlayers} from "../player.js";
import Player from "../traits/Player.js";


function getPlayer(entities) {
    for (const entity of findPlayers(entities)) {
        return entity;
    }
}

const QUARTER_FACTS = {
    '1-1': 'Q1 - FRESH START',
    '1-2': 'Q2 - MIDYEAR REVIEW',
    '1-3': 'Q3 - BUDGET CRUNCH',
    '1-4': 'Q4 - EOY PUSH',
    '2-1': 'YEAR 2 - HIGHER TARGETS',
    '2-2': 'THE BOARD IS WATCHING',
    '2-3': 'RETENTION OR BUST',
    '2-4': 'FINAL COUNTDOWN',
};

export function createPlayerProgressLayer(font, level) {
    const size = font.size;

    const spriteBuffer = document.createElement('canvas');
    spriteBuffer.width = 32;
    spriteBuffer.height = 32;
    const spriteBufferContext = spriteBuffer.getContext('2d');

    return function drawPlayerProgress(context) {
        const entity = getPlayer(level.entities);
        if (!entity) return;
        const player = entity.traits.get(Player);

        const fact = QUARTER_FACTS[level.name] || 'QUARTER ' + level.name;
        const factX = Math.floor(context.canvas.width / 2) - Math.floor(fact.length * size / 2);
        font.print(fact, context, factX, size * 11);

        font.print('QUARTER ' + level.name, context, size * 11, size * 13);

        font.print('×' + player.lives.toString().padStart(3, ' '),
            context, size * 16, size * 16);

        spriteBufferContext.clearRect(0, 0,
            spriteBuffer.width, spriteBuffer.height);
        entity.draw(spriteBufferContext);
        context.drawImage(spriteBuffer, size * 13, size * 15);


    };
}
