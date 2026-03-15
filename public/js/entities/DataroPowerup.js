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

export function getDataroCollectFlashState() {
    return {triggered: dataroCollectFlashTriggered, start: dataroCollectFlashStart};
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

            // Trigger flash
            dataroCollectFlashTriggered = true;
            dataroCollectFlashStart = performance.now();
        }
    }
}

export function loadDataroPowerup() {
    return Promise.resolve(createDataroPowerupFactory());
}

function createDataroPowerupFactory() {
    function drawDataroPowerup(context) {
        // Purple orb body
        context.fillStyle = '#6B3FA0';
        context.beginPath();
        context.arc(8, 8, 6, 0, Math.PI * 2);
        context.fill();

        // Highlight
        context.fillStyle = '#9B6FD0';
        context.beginPath();
        context.arc(6, 6, 3, 0, Math.PI * 2);
        context.fill();

        // Small bright spot
        context.fillStyle = '#C8A2E8';
        context.beginPath();
        context.arc(5, 5, 1, 0, Math.PI * 2);
        context.fill();
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
