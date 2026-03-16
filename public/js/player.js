import Player from './traits/Player.js';
import LevelTimer from './traits/LevelTimer.js';

export function makePlayer(entity, name) {
    const player = new Player();
    player.name = "FUNDRAISER";
    entity.addTrait(player);

    const timer = new LevelTimer();
    entity.addTrait(timer);
}

const WORLD_DISPLAY_NAMES = {
    '1-1': 'Q1',
    '1-2': 'Q2',
    '1-3': 'Q3',
    '1-4': 'Q4',
    '2-1': 'Q5',
    '2-2': 'Q6',
    '2-3': 'Q7',
    '2-4': 'Q8',
};

export function getWorldDisplayName(worldName) {
    return WORLD_DISPLAY_NAMES[worldName] || worldName;
}

export function resetPlayer(entity, worldName) {
    entity.traits.get(LevelTimer).reset();
    entity.traits.get(Player).world = getWorldDisplayName(worldName);

    // Reset power-up state
    if (entity.powered) {
        entity.powered = false;
        entity.size.set(14, 16);
    }
}

export function bootstrapPlayer(entity, level) {
    entity.traits.get(LevelTimer).hurryEmitted = null;
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
