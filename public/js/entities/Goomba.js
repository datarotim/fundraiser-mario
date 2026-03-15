import Entity from '../Entity.js';
import Trait from '../Trait.js';
import Killable from '../traits/Killable.js';
import PendulumMove from '../traits/PendulumMove.js';
import Physics from '../traits/Physics.js';
import Solid from '../traits/Solid.js';
import Stomper from '../traits/Stomper.js';
import Player from '../traits/Player.js';
import {loadSpriteSheet} from '../loaders/sprite.js';
import Retention from '../traits/Retention.js';
import {assignDonorType, drawDonorIndicator} from '../DonorType.js';
import {isDataroRevealed} from '../entities/DataroPowerup.js';

export function loadGoombaBrown() {
    return loadSpriteSheet('goomba-brown')
        .then(createGoombaFactory);
}

export function loadGoombaBlue() {
    return loadSpriteSheet('goomba-blue')
        .then(createGoombaFactory);
    }


class Behavior extends Trait {
    collides(us, them) {
        if (us.traits.get(Killable).dead) {
            return;
        }

        if (them.traits.has(Stomper)) {
            if (them.vel.y > us.vel.y) {
                us.traits.get(Killable).kill();
                us.traits.get(PendulumMove).speed = 0;
                // Award donor value to player
                if (them.traits.has(Player) && us.donorType) {
                    them.traits.get(Player).score += us.donorType.value;
                }
                // Successful engagement restores a bit of retention
                if (them.traits.has(Retention)) {
                    them.traits.get(Retention).restore(2);
                }
            } else {
                them.traits.get(Killable).kill();
                // Getting hit reduces retention
                if (them.traits.has(Retention)) {
                    them.traits.get(Retention).hit(5);
                }
            }
        }
    }
}


function createGoombaFactory(sprite) {
    const walkAnim = sprite.animations.get('walk');

    function routeAnim(goomba) {
        if (goomba.traits.get(Killable).dead) {
            return 'flat';
        }

        return walkAnim(goomba.lifetime);
    }

    function drawGoomba(context) {
        sprite.draw(routeAnim(this), context, 0, 0);
        // Draw donor type indicator
        if (this.donorType && !this.traits.get(Killable).dead) {
            drawDonorIndicator(context, this.donorType, 0, 0, 16, isDataroRevealed());
        }
    }

    return function createGoomba() {
        const goomba = new Entity();
        goomba.size.set(16, 16);
        goomba.donorType = assignDonorType();

        goomba.addTrait(new Physics());
        goomba.addTrait(new Solid());
        goomba.addTrait(new PendulumMove());
        goomba.addTrait(new Behavior());
        goomba.addTrait(new Killable());

        goomba.draw = drawGoomba;

        return goomba;
    };
}
