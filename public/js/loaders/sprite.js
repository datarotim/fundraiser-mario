import {loadJSON, loadImage} from '../loaders.js';
import SpriteSheet from '../SpriteSheet.js';
import {createAnim} from '../anim.js';

// Procedural Datro "d" block — drawn to a 16x16 canvas so no tile asset
// is needed. Shares the gold palette of the chance block so it reads as
// "the special question block" while clearly showing a Datro mark.
const DATRO_OVERLAY = [
    [0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0],
    [0,0,0,0,0,0,0,0,0,0,0,1,1,1,0,0],
    [0,0,0,0,0,0,0,0,0,0,0,1,1,1,0,0],
    [0,0,0,0,0,0,0,0,0,0,0,1,1,1,0,0],
    [0,0,0,0,0,0,0,0,0,0,0,1,1,1,0,0],
    [0,0,0,1,1,1,1,1,1,1,1,1,1,1,0,0],
    [0,0,1,2,2,2,2,2,2,2,1,1,1,1,0,0],
    [0,1,2,2,1,1,1,1,2,2,1,1,1,1,0,0],
    [0,1,2,2,1,1,1,1,2,2,1,1,1,1,0,0],
    [0,1,2,2,1,1,1,1,2,2,1,1,1,1,0,0],
    [0,1,2,2,1,1,1,1,2,2,1,1,1,1,0,0],
    [0,1,1,2,2,2,2,2,2,2,1,1,1,1,0,0],
    [0,0,1,1,1,1,1,1,1,1,1,1,1,1,0,0],
    [0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0],
    [0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0],
    [0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0],
];

function buildDatroTile() {
    const buffer = document.createElement('canvas');
    buffer.width = 16;
    buffer.height = 16;
    const ctx = buffer.getContext('2d');

    ctx.fillStyle = '#f8c83b';
    ctx.fillRect(0, 0, 16, 16);
    ctx.fillStyle = '#ffe082';
    ctx.fillRect(0, 0, 16, 1);
    ctx.fillRect(0, 0, 1, 16);
    ctx.fillStyle = '#9b6500';
    ctx.fillRect(0, 15, 16, 1);
    ctx.fillRect(15, 0, 1, 16);

    for (let y = 0; y < 16; y++) {
        for (let x = 0; x < 16; x++) {
            const c = DATRO_OVERLAY[y][x];
            if (c === 0) continue;
            ctx.fillStyle = c === 1 ? '#0a0617' : '#ffffff';
            ctx.fillRect(x, y, 1, 1);
        }
    }
    return buffer;
}

export function loadSpriteSheet(name, imageTransform) {
    return loadJSON(`/sprites/${name}.json`)
    .then(sheetSpec => Promise.all([
        sheetSpec,
        loadImage(sheetSpec.imageURL),
    ]))
    .then(([sheetSpec, image]) => {
        if (imageTransform) {
            image = imageTransform(image);
        }
        const sprites = new SpriteSheet(
            image,
            sheetSpec.tileW,
            sheetSpec.tileH);

        if (sheetSpec.tiles) {
            sheetSpec.tiles.forEach(tileSpec => {
                sprites.defineTile(
                    tileSpec.name,
                    tileSpec.index[0],
                    tileSpec.index[1]);
            });
        }

        if (sheetSpec.frames) {
            sheetSpec.frames.forEach(frameSpec => {
                sprites.define(frameSpec.name, ...frameSpec.rect);
            });
        }

        if (sheetSpec.animations) {
            sheetSpec.animations.forEach(animSpec => {
                const animation = createAnim(animSpec.frames, animSpec.frameLen);
                sprites.defineAnim(animSpec.name, animation);
            });
        }

        const datroBuffer = buildDatroTile();
        sprites.tiles.set('datro', [datroBuffer, datroBuffer]);

        return sprites;
    });
}
