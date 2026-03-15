export function createSpriteLayer(entities, width = 64, height = 64) {
    const spriteBuffer = document.createElement('canvas');
    spriteBuffer.width = width;
    spriteBuffer.height = height;
    const spriteBufferContext = spriteBuffer.getContext('2d');

    return function drawSpriteLayer(context, camera) {
        entities.forEach(entity => {
            if (!entity.draw) {
                return;
            }

            spriteBufferContext.clearRect(0, 0, width, height);

            entity.draw(spriteBufferContext);

            const offsetX = entity.drawOffset ? entity.drawOffset.x : 0;
            const offsetY = entity.drawOffset ? entity.drawOffset.y : 0;
            context.drawImage(
                spriteBuffer,
                Math.floor(entity.pos.x - camera.pos.x + offsetX),
                Math.floor(entity.pos.y - camera.pos.y + offsetY));
        });
    };
}
