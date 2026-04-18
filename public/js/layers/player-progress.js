import {findPlayers, getWorldDisplayName} from "../player.js";
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
    '2-1': 'Q5 - HIGHER TARGETS',
    '2-2': 'Q6 - THE BOARD IS WATCHING',
    '2-3': 'Q7 - RETENTION OR BUST',
    '2-4': 'Q8 - FINAL COUNTDOWN',
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

        const w = context.canvas.width;

        const fact = QUARTER_FACTS[level.name] || 'QUARTER ' + getWorldDisplayName(level.name);
        const factX = Math.floor(w / 2) - Math.floor(fact.length * size / 2);
        font.print(fact, context, factX, size * 11);

        const quarterText = 'QUARTER ' + getWorldDisplayName(level.name);
        const quarterX = Math.floor(w / 2) - Math.floor(quarterText.length * size / 2);
        font.print(quarterText, context, quarterX, size * 13);

        // Sprite + "× NNN" lives block. Block spans 56 px (sprite 32 + 24 px gap to text).
        // Sprite sits at block origin; text at +24 px. Center the block on the canvas.
        const LIVES_BLOCK_W = 56;
        const SPRITE_OFFSET = 0;
        const TEXT_OFFSET = 24;
        const blockX = Math.floor((w - LIVES_BLOCK_W) / 2);

        spriteBufferContext.clearRect(0, 0,
            spriteBuffer.width, spriteBuffer.height);
        entity.draw(spriteBufferContext);
        context.drawImage(spriteBuffer, blockX + SPRITE_OFFSET, size * 15);

        font.print('×' + player.lives.toString().padStart(3, ' '),
            context, blockX + TEXT_OFFSET, size * 16);


    };
}
