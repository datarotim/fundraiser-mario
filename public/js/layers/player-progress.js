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
    '2-1': 'GALA SEASON APPROACHES',
    '2-2': 'WHO BROKE THE MAIL MERGE',
    '2-3': 'THE INTERN DELETED THE LIST',
    '2-4': 'MAJOR GIFTS OR MAJOR PROBLEMS',
    '3-1': 'Q3 SLUMP IS REAL',
    '3-2': 'NOBODY READS THE NEWSLETTER',
    '3-3': 'THE CRM ATE YOUR DATA',
    '3-4': 'BUDGET REVIEW INCOMING',
    '4-1': 'END OF YEAR PANIC MODE',
    '4-2': 'DECEMBER IS COMING',
    '4-3': 'LAST CHANCE TO HIT GOAL',
    '4-4': 'DID YOU THANK YOUR DONORS',
};

const QUARTER_TITLES = {
    '1': 'Q1 - THE ANNUAL APPEAL',
    '2': 'Q2 - GALA SEASON',
    '3': 'Q3 - THE SUMMER SLUMP',
    '4': 'Q4 - END OF YEAR PANIC',
};

const DEATH_QUIPS = [
    'THE DONOR LAPSED',
    'SHOULD HAVE USED DATARO',
    'EXCEL CRASHED AGAIN',
    'THE BOARD SENDS REGARDS',
    'BUDGET DENIED',
    'UNSUBSCRIBE RATE 100.',
    'YOUR ASK WAS TOO SMALL',
    'WRONG SALUTATION AGAIN',
    'REPLY ALL DISASTER',
    'LOST TO ATTRITION',
];

export function createPlayerProgressLayer(font, level) {
    const size = font.size;

    const spriteBuffer = document.createElement('canvas');
    spriteBuffer.width = 32;
    spriteBuffer.height = 32;
    const spriteBufferContext = spriteBuffer.getContext('2d');

    let deathQuip = null;

    return function drawPlayerProgress(context) {
        const entity = getPlayer(level.entities);
        const player = entity.traits.get(Player);
        const w = context.canvas.width;

        // Show quarter title if available
        const quarter = level.name.split('-')[0];
        const title = QUARTER_TITLES[quarter];
        if (title) {
            const titleX = Math.floor(w / 2) - Math.floor(title.length * size / 2);
            font.print(title, context, titleX, size * 9);
        }

        font.print('QUARTER ' + level.name, context, size * 11, size * 12);

        font.print('×' + player.lives.toString().padStart(3, ' '),
            context, size * 16, size * 16);

        spriteBufferContext.clearRect(0, 0,
            spriteBuffer.width, spriteBuffer.height);
        entity.draw(spriteBufferContext);
        context.drawImage(spriteBuffer, size * 13, size * 15);

        const fact = QUARTER_FACTS[level.name];
        if (fact) {
            const factX = Math.floor(w / 2) - Math.floor(fact.length * size / 2);
            font.print(fact, context, factX, size * 19);
        }

        // Show death quip if player has lost a life
        if (player.lives < 3) {
            if (!deathQuip) {
                deathQuip = DEATH_QUIPS[Math.floor(Math.random() * DEATH_QUIPS.length)];
            }
            const quipX = Math.floor(w / 2) - Math.floor(deathQuip.length * size / 2);
            font.print(deathQuip, context, quipX, size * 22);
        }
    };
}
