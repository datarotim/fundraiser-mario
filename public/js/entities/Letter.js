import Entity from '../Entity.js';
import Trait from '../Trait.js';
import Killable from '../traits/Killable.js';
import Gravity from '../traits/Gravity.js';
import Velocity from '../traits/Velocity.js';
import Stomper from '../traits/Stomper.js';
import Player from '../traits/Player.js';

function getDonorBehavior(entity) {
    for (const [, trait] of entity.traits) {
        if (trait.handleLetterHit) {
            return trait;
        }
    }
    return null;
}

class Behavior extends Trait {
    constructor() {
        super();
        this.gravity = new Gravity();
    }

    collides(us, them) {
        if (us.traits.get(Killable).dead) {
            return;
        }

        // Don't hit the player (entities with Stomper)
        if (them.traits.has(Stomper)) {
            return;
        }

        // Check if target is a donor - trigger appeal response instead of kill
        const donorBehavior = getDonorBehavior(them);
        if (donorBehavior) {
            donorBehavior.handleLetterHit(them, us);
            us.traits.get(Killable).kill();
            return;
        }

        if (them.traits.has(Killable) && !them.traits.get(Killable).dead) {
            them.traits.get(Killable).kill();

            if (us.owner && us.owner.traits.has(Player)) {
                us.owner.traits.get(Player).addCoins(1);
                us.owner.traits.get(Player).score += 200;
            }

            us.traits.get(Killable).kill();
        }
    }

    update(entity, gameContext, level) {
        // Apply gravity after a short delay for arc effect
        if (entity.lifetime > 0.1) {
            this.gravity.update(entity, gameContext, level);
        }

        // Remove if alive too long
        if (entity.lifetime > 3) {
            entity.traits.get(Killable).kill();
        }
    }
}

export function loadLetter() {
    return Promise.resolve(createLetterFactory());
}

function createLetterFactory() {
    function drawLetter(context) {
        // White envelope body
        context.fillStyle = '#fff';
        context.fillRect(1, 1, 10, 6);

        // Envelope outline
        context.strokeStyle = '#aaa';
        context.lineWidth = 0.5;
        context.strokeRect(1, 1, 10, 6);

        // Envelope flap
        context.beginPath();
        context.moveTo(1, 1);
        context.lineTo(6, 4);
        context.lineTo(11, 1);
        context.stroke();
    }

    return function createLetter() {
        const letter = new Entity();
        letter.size.set(12, 8);

        letter.addTrait(new Velocity());
        letter.addTrait(new Behavior());
        letter.addTrait(new Killable());

        letter.traits.get(Killable).removeAfter = 0.2;

        letter.draw = drawLetter;

        return letter;
    };
}
