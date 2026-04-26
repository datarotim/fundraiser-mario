import {Sides} from '../Entity.js';
import Player from "../traits/Player.js";

let powerupSpawned = false;

function handleX({entity, match}) {
    if (entity.vel.x > 0) {
        if (entity.bounds.right > match.x1) {
            entity.obstruct(Sides.RIGHT, match);
        }
    } else if (entity.vel.x < 0) {
        if (entity.bounds.left < match.x2) {
            entity.obstruct(Sides.LEFT, match);
        }
    }
}

function handleY({entity, match, resolver, gameContext, level}) {
    if (entity.vel.y > 0) {
        if (entity.bounds.bottom > match.y1) {
            entity.obstruct(Sides.BOTTOM, match);
        }
    } else if (entity.vel.y < 0) {
        if (entity.traits.has(Player)) {
            const player = entity.traits.get(Player);
            player.addCoins(1);

            const grid = resolver.matrix;
            grid.delete(match.indexX, match.indexY);

            if (!powerupSpawned) {
                powerupSpawned = true;
                const powerup = gameContext.entityFactory['dataro-powerup']();
                powerup.pos.set(match.x1, match.y1 - 16);
                powerup.vel.y = -100;
                level.entities.add(powerup);
            }
        }

        if (entity.bounds.top < match.y2) {
            entity.obstruct(Sides.TOP, match);
        }
    }
}

export const datro = [handleX, handleY];
