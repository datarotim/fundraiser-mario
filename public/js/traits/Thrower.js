import Trait from '../Trait.js';
import Go from './Go.js';

export default class Thrower extends Trait {
    constructor() {
        super();
        this.enabled = true;
        this.cooldown = 0;
        this.COOLDOWN_TIME = 0.3;
        this._throwing = false;
    }

    throw() {
        this._throwing = true;
    }

    update(entity, gameContext, level) {
        const {deltaTime} = gameContext;

        if (this.cooldown > 0) {
            this.cooldown -= deltaTime;
        }

        if (this._throwing) {
            this._throwing = false;

            if (!this.enabled || this.cooldown > 0) {
                return;
            }

            this.cooldown = this.COOLDOWN_TIME;

            const letter = gameContext.entityFactory.letter();
            const dir = entity.traits.get(Go).heading;

            letter.pos.set(entity.pos.x + (dir > 0 ? entity.size.x : -letter.size.x), entity.pos.y);
            letter.vel.set(200 * dir, -50);
            letter.owner = entity;

            level.entities.add(letter);
            entity.sounds.add('stomp');
        }
    }
}
