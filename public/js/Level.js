import Camera from './Camera.js';
import MusicController from './MusicController.js';
import EntityCollider from './EntityCollider.js';
import Scene from './Scene.js';
import TileCollider from './TileCollider.js';
import Killable from './traits/Killable.js';
import { clamp } from './math.js';
import { findPlayers } from './player.js';

function focusPlayer(level) {
    if (level.freezeCamera) {
        return;
    }

    const allPlayers = [...findPlayers(level.entities)];
    const alivePlayers = allPlayers.filter(p => !p.traits.get(Killable).dead);

    if (alivePlayers.length === 0) return;

    let target;
    if (alivePlayers.length >= 2) {
        alivePlayers.sort((a, b) => a.pos.x - b.pos.x);
        target = alivePlayers[0];
    } else {
        target = alivePlayers[0];
    }

    level.camera.pos.x = clamp(
        target.pos.x - 100,
        level.camera.min.x,
        level.camera.max.x - level.camera.size.x);

    if (level.coopMode) {
        level.camera.min.x = Math.max(level.camera.min.x, level.camera.pos.x);
    }
}

function clampPlayersToCamera(level) {
    const rightEdge = level.camera.pos.x + level.camera.size.x - 16;
    const leftEdge = level.camera.pos.x;
    for (const player of findPlayers(level.entities)) {
        if (player.traits.get(Killable).dead) continue;
        if (player.pos.x > rightEdge) {
            player.pos.x = rightEdge;
            if (player.vel.x > 0) player.vel.x = 0;
        }
        if (player.pos.x < leftEdge) {
            player.pos.x = leftEdge;
            if (player.vel.x < 0) player.vel.x = 0;
        }
    }
}

class EntityCollection extends Set {
    get(id) {
        for (const entity of this) {
            if (entity.id === id) {
                return entity;
            }
        }
    }
}

export default class Level extends Scene {
    static EVENT_TRIGGER = Symbol('trigger');
    static EVENT_COMPLETE = Symbol('complete');

    constructor() {
        super();

        this.name = "";

        this.checkpoints = [];

        this.gravity = 1500;
        this.totalTime = 0;
        this.freezeCamera = false;
        this.coopMode = false;

        this.camera = new Camera();

        this.music = new MusicController();

        this.entities = new EntityCollection();

        this.entityCollider = new EntityCollider(this.entities);
        this.tileCollider = new TileCollider();
    }

    draw(gameContext) {
        this.comp.draw(gameContext.videoContext, this.camera);
    }

    update(gameContext) {
        this.entities.forEach(entity => {
            entity.update(gameContext, this);
        });

        this.entities.forEach(entity => {
            this.entityCollider.check(entity);
        });

        this.entities.forEach(entity => {
            entity.finalize();
        });

        focusPlayer(this);

        if (this.coopMode) {
            clampPlayersToCamera(this);
        }

        this.totalTime += gameContext.deltaTime;
    }

    pause() {
        this.music.pause();
    }
}
