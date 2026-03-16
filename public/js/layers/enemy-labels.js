const LABEL_DURATION = 1.0;
const FADE_DURATION = 0.5;

const introduced = new Map();

export function resetEnemyLabels() {
    introduced.clear();
}

export function createEnemyLabelLayer(entities, font) {
    return function drawEnemyLabels(context, camera) {
        entities.forEach(entity => {
            if (!entity.enemyType || !entity.labelText) {
                return;
            }

            const screenX = entity.pos.x - camera.pos.x;
            const screenY = entity.pos.y - camera.pos.y;

            // Check if entity is visible on screen
            if (screenX < -16 || screenX > camera.size.x + 16) {
                return;
            }

            if (!introduced.has(entity.enemyType)) {
                introduced.set(entity.enemyType, {
                    time: 0,
                    entity,
                });
            }

            const intro = introduced.get(entity.enemyType);
            if (intro.entity !== entity) {
                return;
            }

            intro.time += 1 / 60;

            if (intro.time > LABEL_DURATION + FADE_DURATION) {
                return;
            }

            // Calculate alpha with fade out
            let alpha = 1;
            if (intro.time > LABEL_DURATION) {
                alpha = 1 - (intro.time - LABEL_DURATION) / FADE_DURATION;
            }

            const text = entity.labelText;
            const textWidth = text.length * font.size;
            const textX = Math.floor(screenX + entity.size.x / 2 - textWidth / 2);
            const textY = Math.floor(screenY - font.size - 2);

            context.globalAlpha = alpha;
            font.print(text, context, textX, textY);
            context.globalAlpha = 1;
        });
    };
}
