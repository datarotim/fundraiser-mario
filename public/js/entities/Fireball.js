import Entity from '../Entity.js';
import Trait from '../Trait.js';
import Killable from '../traits/Killable.js';
import Velocity from '../traits/Velocity.js';
import Stomper from '../traits/Stomper.js';

class Behavior extends Trait {
    constructor() {
        super();
    }

    collides(us, them) {
        if (us.traits.get(Killable).dead) {
            return;
        }

        if (them.traits.has(Stomper)) {
            them.traits.get(Killable).kill();
            us.traits.get(Killable).kill();
        }
    }

    update(entity, gameContext) {
        if (entity.lifetime > 4) {
            entity.traits.get(Killable).kill();
        }
    }
}

export function loadFireball() {
    return Promise.resolve(createFireballFactory());
}

function createFireballFactory() {
    function drawFireball(context) {
        const t = this.lifetime * 12;
        const flicker = Math.sin(t);

        // Outer flame (red/dark orange)
        context.fillStyle = '#FF4500';
        context.fillRect(1, 0, 6, 8);
        context.fillRect(0, 1, 8, 6);

        // Inner flame (orange)
        context.fillStyle = flicker > 0 ? '#FF8C00' : '#FFA500';
        context.fillRect(2, 1, 4, 6);
        context.fillRect(1, 2, 6, 4);

        // Core (yellow)
        context.fillStyle = '#FFD700';
        context.fillRect(2, 2, 4, 4);

        // Hot center (white/yellow)
        context.fillStyle = '#FFF8DC';
        context.fillRect(3, 3, 2, 2);
    }

    return function createFireball() {
        const fireball = new Entity();
        fireball.size.set(8, 8);

        fireball.addTrait(new Velocity());
        fireball.addTrait(new Behavior());
        fireball.addTrait(new Killable());

        fireball.traits.get(Killable).removeAfter = 0.2;

        fireball.draw = drawFireball;

        return fireball;
    };
}
