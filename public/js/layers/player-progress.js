import {findPlayers} from "../player.js";
import Player from "../traits/Player.js";

function getPlayer(entities) {
    for (const entity of findPlayers(entities)) {
        return entity;
    }
}

const QUARTER_FACTS = {
    '1-1': 'FIND YOUR DONORS',
    '1-2': 'DATA BEATS GUESSWORK',
    '1-3': 'RETENTION IS SURVIVAL',
    '1-4': 'THE BOARD WANTS ANSWERS',
};

export function createPlayerProgressLayer(font, level) {
    const size = font.size;

    const spriteBuffer = document.createElement('canvas');
    spriteBuffer.width = 32;
    spriteBuffer.height = 32;
    const spriteBufferContext = spriteBuffer.getContext('2d');

    return function drawPlayerProgress(context) {
        const entity = getPlayer(level.entities);
        const player = entity.traits.get(Player);
        font.print('QUARTER ' + level.name, context, size * 11, size * 12);

        font.print('×' + player.lives.toString().padStart(3, ' '),
            context, size * 16, size * 16);

        spriteBufferContext.clearRect(0, 0,
            spriteBuffer.width, spriteBuffer.height);
        entity.draw(spriteBufferContext);
        context.drawImage(spriteBuffer, size * 13, size * 15);

        const fact = QUARTER_FACTS[level.name];
        if (fact) {
            const factX = Math.floor(context.canvas.width / 2) - Math.floor(fact.length * size / 2);
            font.print(fact, context, factX, size * 19);
        }
    };
}
