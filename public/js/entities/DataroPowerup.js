import Entity from '../Entity.js';
import Trait from '../Trait.js';
import Killable from '../traits/Killable.js';
import PendulumMove from '../traits/PendulumMove.js';
import Physics from '../traits/Physics.js';
import Solid from '../traits/Solid.js';
import Thrower from '../traits/Thrower.js';

// Flash state — shared so dashboard.js can read it
let dataroCollectFlashStart = 0;
let dataroCollectFlashTriggered = false;
let dataroActive = false;

export function getDataroCollectFlashState() {
    return {triggered: dataroCollectFlashTriggered, start: dataroCollectFlashStart};
}

export function isDataroRevealed() {
    return dataroActive;
}

class Behavior extends Trait {
    collides(us, them) {
        if (us.traits.get(Killable).dead) {
            return;
        }

        if (them.traits.has(Thrower) && !them.traits.get(Thrower).enabled) {
            them.traits.get(Thrower).enabled = true;
            us.traits.get(Killable).kill();
            them.sounds.add('coin');

            // Trigger flash and reveal
            dataroCollectFlashTriggered = true;
            dataroCollectFlashStart = performance.now();
            dataroActive = true;
        }
    }
}

export function loadDataroPowerup() {
    return Promise.resolve(createDataroPowerupFactory());
}

function createDataroPowerupFactory() {
    // Pixel art "d" logo — 16x16 grid
    // 0=transparent, 1=dark outline, 2=body, 3=highlight inner line
    const palette = [null, '#3D1F6D', '#6B3FA0', '#9B6FD0'];
    const pixelData = [
        [0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0],
        [0,0,0,0,0,0,0,0,1,2,3,1,0,0,0,0],
        [0,0,0,0,0,0,0,0,1,2,3,1,0,0,0,0],
        [0,0,0,0,0,0,0,0,1,2,3,1,0,0,0,0],
        [0,0,0,1,1,1,1,1,1,2,3,1,0,0,0,0],
        [0,0,1,2,3,3,3,3,2,2,3,1,0,0,0,0],
        [0,1,2,3,1,1,1,1,1,2,3,1,0,0,0,0],
        [1,2,3,1,0,0,0,0,1,2,3,1,0,0,0,0],
        [1,2,3,1,0,0,0,0,1,2,3,1,0,0,0,0],
        [1,2,3,1,0,0,0,0,1,2,3,1,0,0,0,0],
        [0,1,2,3,1,1,1,1,1,2,3,1,0,0,0,0],
        [0,0,1,2,3,3,3,3,2,2,3,1,0,0,0,0],
        [0,0,0,1,1,1,1,1,1,2,3,1,0,0,0,0],
        [0,0,0,0,0,0,0,0,1,2,3,1,0,0,0,0],
        [0,0,0,0,0,0,0,0,1,2,3,1,0,0,0,0],
        [0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0],
    ];

    function drawDataroPowerup(context) {
        for (let y = 0; y < 16; y++) {
            for (let x = 0; x < 16; x++) {
                const c = pixelData[y][x];
                if (c === 0) continue;
                context.fillStyle = palette[c];
                context.fillRect(x, y, 1, 1);
            }
        }
    }

    return function createDataroPowerup() {
        const powerup = new Entity();
        powerup.size.set(16, 16);

        powerup.addTrait(new Physics());
        powerup.addTrait(new Solid());
        powerup.addTrait(new PendulumMove());
        powerup.addTrait(new Behavior());
        powerup.addTrait(new Killable());

        // Slide to the right
        powerup.traits.get(PendulumMove).speed = 30;
        powerup.traits.get(Killable).removeAfter = 0.1;

        powerup.draw = drawDataroPowerup;

        return powerup;
    };
}
