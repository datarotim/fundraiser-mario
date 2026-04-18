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

export function deactivateDataro() {
    dataroActive = false;
}

class Behavior extends Trait {
    collides(us, them) {
        if (us.traits.get(Killable).dead) {
            return;
        }

        if (them.traits.has(Thrower) && !them.powered) {
            us.traits.get(Killable).kill();
            them.sounds.add('coin');

            // Power up Mario (grow big)
            if (them.powerUp) {
                them.powerUp();
            }

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
    // Pixel art Dataro "d" mark — 16x16 grid
    // Bold black glyph with a white counter and a small black dot inside
    // the bowl, matching the brand mark's geometry.
    // 0=transparent, 1=black outline/fill, 2=white counter
    const palette = [null, '#0a0617', '#ffffff'];
    const pixelData = [
        [0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0],
        [0,0,0,0,0,0,0,0,0,0,0,1,1,1,0,0],
        [0,0,0,0,0,0,0,0,0,0,0,1,1,1,0,0],
        [0,0,0,0,0,0,0,0,0,0,0,1,1,1,0,0],
        [0,0,0,0,0,0,0,0,0,0,0,1,1,1,0,0],
        [0,0,0,1,1,1,1,1,1,1,1,1,1,1,0,0],
        [0,0,1,2,2,2,2,2,2,2,1,1,1,1,0,0],
        [0,1,2,2,1,1,1,1,2,2,1,1,1,1,0,0],
        [0,1,2,2,1,1,1,1,2,2,1,1,1,1,0,0],
        [0,1,2,2,1,1,1,1,2,2,1,1,1,1,0,0],
        [0,1,2,2,1,1,1,1,2,2,1,1,1,1,0,0],
        [0,1,1,2,2,2,2,2,2,2,1,1,1,1,0,0],
        [0,0,1,1,1,1,1,1,1,1,1,1,1,1,0,0],
        [0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0],
        [0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0],
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
