import {createPlayerFactory} from './Mario.js';
import {loadAudioBoard} from '../loaders/audio.js';
import {loadSpriteSheet} from '../loaders/sprite.js';

function greenPalette(image) {
    const c = document.createElement('canvas');
    c.width = image.width;
    c.height = image.height;
    const ctx = c.getContext('2d');
    ctx.filter = 'hue-rotate(90deg) saturate(1.2)';
    ctx.drawImage(image, 0, 0);
    return c;
}

export function loadLuigi(audioContext) {
    return Promise.all([
        loadSpriteSheet('mario', greenPalette),
        loadAudioBoard('mario', audioContext),
    ])
    .then(([sprite, audio]) => {
        return createPlayerFactory(sprite, audio);
    });
}
