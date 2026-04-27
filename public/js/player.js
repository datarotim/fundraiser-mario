import Player from './traits/Player.js';
import LevelTimer from './traits/LevelTimer.js';

const QUARTER_NAMES = {
    '1-1': 'Q1',
    '1-2': 'Q2',
    '1-3': 'Q3',
    '1-4': 'Q4',
    '2-1': 'Q5',
    '2-2': 'Q6',
    '2-3': 'Q7',
    '2-4': 'Q8',
    '3-1': 'Q9',
};

export function getWorldDisplayName(worldName) {
    return QUARTER_NAMES[worldName] || worldName;
}

export function makePlayer(entity, name, options = {}) {
    const player = new Player();
    player.name = name || "FUNDRAISER";
    entity.addTrait(player);

    if (options.hasTimer !== false) {
        const timer = new LevelTimer();
        entity.addTrait(timer);
    }
}

export function resetPlayer(entity, worldName) {
    if (entity.traits.has(LevelTimer)) {
        entity.traits.get(LevelTimer).reset();
    }
    entity.traits.get(Player).world = QUARTER_NAMES[worldName] || worldName;

    if (entity.powered) {
        entity.powered = false;
        entity.size.set(14, 16);
    }
}

export function bootstrapPlayer(entity, level) {
    if (entity.traits.has(LevelTimer)) {
        entity.traits.get(LevelTimer).hurryEmitted = null;
    }
    entity.pos.copy(level.checkpoints[0]);
    level.entities.add(entity);
}

export function* findPlayers(entities) {
    for (const entity of entities) {
        if (entity.traits.has(Player)) {
            yield entity;
        }
    }
}
