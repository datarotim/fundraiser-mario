import {loadImage} from '../loaders.js';
import SpriteSheet from '../SpriteSheet.js';

const CHARS = ' 0123456789ABCDEFGHIJKLMNOPQRSTUVWXYZ©!-×.';

class Font {
    constructor(sprites, size) {
        this.sprites = sprites;
        this.size = size;
    }

    print(text, context, x, y) {
        [...text.toUpperCase()].forEach((char, pos) => {
            if (this.sprites.tiles.has(char)) {
                this.sprites.draw(char, context, x + pos * this.size, y);
            }
        });
    }
}


function createDollarGlyph(size) {
    const buffer = document.createElement('canvas');
    buffer.width = size;
    buffer.height = size;
    const ctx = buffer.getContext('2d');
    ctx.fillStyle = '#fff';
    // $ sign pixel art (8x8)
    const pixels = [
        [3,0],[4,0],
        [2,1],[3,1],[4,1],[5,1],
        [2,2],[3,2],
        [3,3],[4,3],
        [4,4],[5,4],
        [2,5],[3,5],[4,5],[5,5],
        [3,6],[4,6],
    ];
    for (const [px, py] of pixels) {
        ctx.fillRect(px, py, 1, 1);
    }
    return buffer;
}

export function loadFont() {
    return loadImage('./img/font.png')
    .then(image => {
        const fontSprite = new SpriteSheet(image);

        const size = 8;
        const rowLen = image.width;
        for (let [index, char] of [...CHARS].entries()) {
            const x = index * size % rowLen;
            const y = Math.floor(index * size / rowLen) * size;
            fontSprite.define(char, x, y, size, size);
        }

        // Add custom $ glyph
        const dollarBuffer = createDollarGlyph(size);
        fontSprite.tiles.set('$', [dollarBuffer, dollarBuffer]);

        return new Font(fontSprite, size);
    });
}
