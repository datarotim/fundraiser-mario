import Trait from '../Trait.js';
import Killable from './Killable.js';

const MARK = Symbol('level timer earmark');

export default class LevelTimer extends Trait {
    static EVENT_TIMER_HURRY = Symbol('timer hurry');
    static EVENT_TIMER_OK = Symbol('timer ok');

    constructor() {
        super();
        this.totalTime = 113;
        this.currentTime = this.totalTime;
        this.hurryTime = 28;
        this.hurryEmitted = null;
        this.expired = false;
    }

    reset() {
        this.currentTime = this.totalTime;
        this.expired = false;
    }

    update(entity, {deltaTime}, level) {
        const killable = entity.traits.get(Killable);
        if (killable && killable.dead) {
            return;
        }

        this.currentTime -= deltaTime * 2.5;

        if (!level[MARK]) {
            this.hurryEmitted = null;
        }

        if (this.hurryEmitted !== true && this.currentTime < this.hurryTime) {
            level.events.emit(LevelTimer.EVENT_TIMER_HURRY);
            this.hurryEmitted = true;
        }
        if (this.hurryEmitted !== false && this.currentTime > this.hurryTime) {
            level.events.emit(LevelTimer.EVENT_TIMER_OK);
            this.hurryEmitted = false;
        }

        if (!this.expired && this.currentTime <= 0) {
            this.currentTime = 0;
            this.expired = true;
            if (killable) {
                killable.kill();
            }
        }

        level[MARK] = true;
    }
}
