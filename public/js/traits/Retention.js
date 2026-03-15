import Trait from '../Trait.js';
import Killable from './Killable.js';

// Donor retention rate - the "health bar" of the game
// Starts at 100%, decreases with hits, game over at 45%
export default class Retention extends Trait {
    constructor() {
        super();
        this.rate = 100;        // percentage
        this.minRate = 45;      // game over threshold
        this.decayRate = 0.05;  // passive decay per second (retention always trends down)
        this.hitPenalty = 5;    // percentage lost per enemy hit
    }

    hit(amount) {
        this.rate = Math.max(0, this.rate - (amount || this.hitPenalty));
    }

    restore(amount) {
        this.rate = Math.min(100, this.rate + amount);
    }

    update(entity, {deltaTime}) {
        // Slow passive decay - retention always trends down
        this.rate = Math.max(0, this.rate - this.decayRate * deltaTime);

        // Kill player if retention drops below threshold
        if (this.rate <= this.minRate) {
            const killable = entity.traits.get(Killable);
            if (killable && !killable.dead) {
                killable.kill();
            }
        }
    }
}
