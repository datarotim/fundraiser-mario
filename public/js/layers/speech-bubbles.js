import Killable from '../traits/Killable.js';
import PendulumMove from '../traits/PendulumMove.js';

// Speech bubbles that float above enemies — fundraiser in-jokes
const GOOMBA_PHRASES = [
    'UNSUBSCRIBE',
    'I GAVE LAST YEAR',
    'REMOVE ME',
    'NOT NOW',
    'PER MY LAST EMAIL',
    'NEW PHONE WHO DIS',
    'WRONG NUMBER',
    'STOP CALLING',
    'TOO BUSY',
    'MAYBE NEXT YEAR',
];

const KOOPA_PHRASES = [
    'NEED MORE DATA',
    'WHERE IS THE ROI',
    'CUT THE BUDGET',
    'SHOW ME METRICS',
    'NOT IN THE PLAN',
    'WHO APPROVED THIS',
    'LETS TABLE THIS',
    'PER THE BYLAWS',
];

export function createSpeechBubbleLayer(font, entities) {
    // Assign each enemy a random phrase and bubble timing
    const enemyBubbles = new WeakMap();

    function getOrCreateBubble(entity) {
        if (enemyBubbles.has(entity)) {
            return enemyBubbles.get(entity);
        }

        // Determine enemy type by checking traits/size
        let phrases = GOOMBA_PHRASES;
        let label = 'LAPSED DONOR';

        // Koopas have offset.y = 8 (taller sprite), goombas don't
        if (entity.offset.y === 8) {
            phrases = KOOPA_PHRASES;
            label = 'BOARD MEMBER';
        }

        const bubble = {
            phrase: phrases[Math.floor(Math.random() * phrases.length)],
            label: label,
            showPhrase: Math.random() < 0.4, // 40% chance to show speech bubble
            pulseOffset: Math.random() * Math.PI * 2,
        };
        enemyBubbles.set(entity, bubble);
        return bubble;
    }

    return function drawSpeechBubbles(context, camera) {
        const size = font.size;

        entities.forEach(entity => {
            // Only draw for living enemies with PendulumMove (not player, not projectiles)
            if (!entity.traits.has(PendulumMove)) return;
            if (!entity.traits.has(Killable)) return;
            const killable = entity.traits.get(Killable);
            if (killable.dead) return;
            // Skip powerups (they auto-remove quickly, removeAfter < 1)
            if (killable.removeAfter < 1) return;
            if (!entity.draw) return;
            if (entity.size.x < 16) return;

            const bubble = getOrCreateBubble(entity);

            const screenX = Math.floor(entity.pos.x - camera.pos.x);
            const screenY = Math.floor(entity.pos.y - camera.pos.y);

            // Skip if off screen
            if (screenX < -50 || screenX > 300 || screenY < -30 || screenY > 250) return;

            // Draw enemy label above the enemy
            const labelX = screenX + 8 - Math.floor(bubble.label.length * size / 2);
            font.print(bubble.label, context, labelX, screenY - 12);

            // Draw speech bubble phrase (bobbing) for selected enemies
            if (bubble.showPhrase) {
                const bob = Math.sin(entity.lifetime * 2 + bubble.pulseOffset) * 2;
                const phraseY = screenY - 22 + bob;
                const phraseX = screenX + 8 - Math.floor(bubble.phrase.length * size / 2);
                font.print(bubble.phrase, context, phraseX, phraseY);
            }
        });
    };
}
