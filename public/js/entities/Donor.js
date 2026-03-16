import Entity from '../Entity.js';
import Trait from '../Trait.js';
import Killable from '../traits/Killable.js';
import PendulumMove from '../traits/PendulumMove.js';
import Physics from '../traits/Physics.js';
import Solid from '../traits/Solid.js';
import Stomper from '../traits/Stomper.js';
import Player from '../traits/Player.js';


const STATE_WALKING = Symbol('walking');
const STATE_RESPONDING = Symbol('responding');
const STATE_FLEEING = Symbol('fleeing');
const RESPOND_DURATION = 1.5;
const FLEE_SPEED = 120;
const DONATION_POINTS = 500;

class Behavior extends Trait {
    constructor() {
        super();
        this.state = STATE_WALKING;
        this.askLimit = Math.floor(Math.random() * 5) + 1;
        this.remainingAsks = this.askLimit;
        this.respondTimer = 0;
        this.walkSpeed = null;
        this.speechBubbleText = '';
        this.fleeDirection = 1;
    }

    collides(us, them) {
        if (us.traits.get(Killable).dead) {
            return;
        }

        if (them.traits.has(Stomper)) {
            if (them.vel.y > us.vel.y) {
                us.traits.get(Killable).kill();
                us.traits.get(PendulumMove).speed = 0;
            } else if (this.state === STATE_RESPONDING) {
                // Friendly donor - gently push player away
                them.vel.x = Math.sign(them.pos.x - us.pos.x) * 60;
            } else {
                them.traits.get(Killable).kill();
            }
        }
    }

    handleLetterHit(us, them) {
        if (us.traits.get(Killable).dead) {
            return;
        }

        if (this.state === STATE_FLEEING) {
            return;
        }

        this.remainingAsks--;

        if (this.remainingAsks < 0) {
            this.startFleeing(us, them);
            return;
        }

        if (this.state === STATE_RESPONDING) {
            // Already responding, just count (no re-award)
            return;
        }

        this.startResponding(us, them);
    }

    startResponding(us, them) {
        // Capture current walk speed (preserves direction from wall bounces)
        this.walkSpeed = us.traits.get(PendulumMove).speed;

        us.vel.x = 0;
        us.traits.get(PendulumMove).enabled = false;
        this.respondTimer = 0;
        this.state = STATE_RESPONDING;

        const responses = ['$25!', '$50!', '$100!', 'Sure!', 'OK!'];
        this.speechBubbleText = responses[Math.floor(Math.random() * responses.length)];

        if (them && them.owner && them.owner.traits.has(Player)) {
            them.owner.traits.get(Player).addCoins(2);
            them.owner.traits.get(Player).score += DONATION_POINTS;
        }
    }

    startFleeing(us, them) {

        this.state = STATE_FLEEING;
        this.speechBubbleText = 'No more!';
        this.respondTimer = 0;

        const fleeDir = them ? Math.sign(us.pos.x - them.pos.x) : 1;
        this.fleeDirection = fleeDir || 1;
        us.traits.get(PendulumMove).enabled = true;
        us.traits.get(PendulumMove).speed = FLEE_SPEED * this.fleeDirection;

        // Disable wall collision so fleeing donors run off-screen
        us.traits.get(Solid).obstructs = false;
    }

    update(us, gameContext) {
        const deltaTime = gameContext.deltaTime;

        if (this.state === STATE_RESPONDING) {
            this.respondTimer += deltaTime;
            if (this.respondTimer > RESPOND_DURATION) {
                this.state = STATE_WALKING;
                us.traits.get(PendulumMove).enabled = true;
                us.traits.get(PendulumMove).speed = this.walkSpeed;
                this.speechBubbleText = '';
            }
        }

        if (this.state === STATE_FLEEING) {
            this.respondTimer += deltaTime;
            if (this.respondTimer > 0.8) {
                this.speechBubbleText = '';
            }
            if (this.respondTimer > 6) {
                us.traits.get(Killable).kill();
            }
        }
    }
}


// --- Donor Variants ---

const DONOR_STYLES = {
    business: {
        suitColor: '#2C3E50',
        shirtColor: '#ECF0F1',
        tieColor: '#E74C3C',
        skinColor: '#F5CBA7',
        hairColor: '#2C3E50',
        pantsColor: '#2C3E50',
        shoeColor: '#1A1A2E',
        briefcase: true,
    },
    casual: {
        suitColor: '#27AE60',
        shirtColor: '#F9E79F',
        tieColor: null,
        skinColor: '#FDEBD0',
        hairColor: '#A0522D',
        pantsColor: '#5D6D7E',
        shoeColor: '#6E2C00',
        briefcase: false,
    },
    formal: {
        suitColor: '#1B2631',
        shirtColor: '#FFFFFF',
        tieColor: '#6B3FA0',
        skinColor: '#D4A574',
        hairColor: '#1C1C1C',
        pantsColor: '#1B2631',
        shoeColor: '#0B0B0B',
        briefcase: true,
    },
};


function createDonorDrawFunction(style) {
    const colors = DONOR_STYLES[style] || DONOR_STYLES.business;

    return function drawDonor(context) {
        const behavior = this.traits.get(Behavior);
        const state = behavior.state;
        const lifetime = this.lifetime;

        // Offset all drawing down to leave room for speech bubble in buffer
        const DRAW_OFFSET = 20;
        context.save();
        context.translate(0, DRAW_OFFSET);

        // Walking animation - faster when fleeing
        const walkSpeed = state === STATE_FLEEING ? 16 : 8;
        const walkCycle = Math.sin(lifetime * walkSpeed);
        const isMoving = state === STATE_WALKING || state === STATE_FLEEING;
        const legAmplitude = state === STATE_FLEEING ? 2.5 : 1.5;
        const legOffset = isMoving ? walkCycle * legAmplitude : 0;
        const armSwing = isMoving ? walkCycle * 1 : 0;

        // Fleeing shake effect
        const shakeX = state === STATE_FLEEING ? Math.sin(lifetime * 30) * 0.5 : 0;

        const flip = this.vel.x < 0;
        context.save();
        if (flip) {
            context.scale(-1, 1);
            context.translate(-16, 0);
        }
        context.translate(shakeX, 0);

        // --- Draw bottom-up to prevent overlap issues ---

        // Shoes
        context.fillStyle = colors.shoeColor;
        context.fillRect(3 + legOffset, 14, 4, 2);
        context.fillRect(9 - legOffset, 14, 4, 2);

        // Pants / legs
        context.fillStyle = colors.pantsColor;
        context.fillRect(4 + legOffset, 11, 3, 4);
        context.fillRect(9 - legOffset, 11, 3, 4);

        // Body / suit jacket
        context.fillStyle = colors.suitColor;
        context.fillRect(3, 5, 10, 6);

        // Shirt visible under jacket
        context.fillStyle = colors.shirtColor;
        context.fillRect(6, 5, 4, 5);

        // Tie
        if (colors.tieColor) {
            context.fillStyle = colors.tieColor;
            context.fillRect(7, 5, 2, 4);
            context.beginPath();
            context.moveTo(7, 9);
            context.lineTo(9, 9);
            context.lineTo(8, 10);
            context.closePath();
            context.fill();
        }

        // Arms
        context.fillStyle = colors.suitColor;
        context.fillRect(1, 5 + armSwing, 2, 5);
        context.fillRect(13, 5 - armSwing, 2, 5);

        // Hands
        context.fillStyle = colors.skinColor;
        context.fillRect(1, 10 + armSwing, 2, 1);
        context.fillRect(13, 10 - armSwing, 2, 1);

        // Briefcase (if applicable, drawn near trailing hand)
        if (colors.briefcase && state !== STATE_FLEEING) {
            context.fillStyle = '#8B4513';
            context.fillRect(13, 9 - armSwing, 2, 3);
            context.fillStyle = '#DAA520';
            context.fillRect(13, 9 - armSwing, 1, 1);
        }

        // Head
        context.fillStyle = colors.skinColor;
        context.fillRect(4, 0, 8, 5);

        // Hair
        context.fillStyle = colors.hairColor;
        context.fillRect(4, 0, 8, 2);
        // Side hair
        context.fillRect(4, 0, 1, 3);

        // Eyes
        context.fillStyle = '#000';
        if (state === STATE_FLEEING) {
            // Wide scared eyes with white highlights
            context.fillRect(5, 2, 2, 2);
            context.fillRect(9, 2, 2, 2);
            context.fillStyle = '#FFF';
            context.fillRect(5, 2, 1, 1);
            context.fillRect(9, 2, 1, 1);
        } else if (state === STATE_RESPONDING) {
            // Happy closed eyes (^_^) - upward arc
            context.fillRect(5, 3, 1, 1);
            context.fillRect(6, 2, 1, 1);
            context.fillRect(9, 2, 1, 1);
            context.fillRect(10, 3, 1, 1);
        } else {
            // Normal dot eyes
            context.fillRect(6, 2, 1, 2);
            context.fillRect(10, 2, 1, 2);
        }

        // Mouth
        if (state === STATE_FLEEING) {
            // Open mouth "O" shape
            context.fillStyle = '#000';
            context.fillRect(7, 4, 2, 1);
        } else if (state === STATE_RESPONDING) {
            // Wide smile - corner dots
            context.fillStyle = '#000';
            context.fillRect(6, 4, 1, 1);
            context.fillRect(9, 4, 1, 1);
        }

        context.restore();

        // Speech bubble (drawn after flip restore, but still within DRAW_OFFSET translate)
        if (behavior.speechBubbleText) {
            drawSpeechBubble(context, behavior.speechBubbleText, state);
        }

        // Ask limit indicator (always visible)
        if (state !== STATE_FLEEING && !this.traits.get(Killable).dead && behavior.remainingAsks >= 0) {
            drawAskIndicator(context, behavior.remainingAsks);
        }

        context.restore(); // restore DRAW_OFFSET translate
    };
}


function drawSpeechBubble(context, text, state) {
    const bubbleX = 12;
    const bubbleY = -16;
    const padding = 2;

    context.save();

    // Calculate bubble dimensions based on text
    const charWidth = 4;
    const textWidth = text.length * charWidth;
    const bubbleWidth = textWidth + padding * 2 + 2;
    const bubbleHeight = 10;

    // Bubble background color
    const isNegative = state === STATE_FLEEING;
    context.fillStyle = isNegative ? '#FFE0E0' : '#E8F8E8';

    // Bubble body
    context.fillRect(bubbleX, bubbleY, bubbleWidth, bubbleHeight);

    // Bubble border
    context.strokeStyle = isNegative ? '#E74C3C' : '#27AE60';
    context.lineWidth = 0.5;
    context.strokeRect(bubbleX, bubbleY, bubbleWidth, bubbleHeight);

    // Bubble tail (pointing down)
    const tailFill = isNegative ? '#FFE0E0' : '#E8F8E8';
    context.fillStyle = tailFill;
    context.beginPath();
    context.moveTo(bubbleX + 4, bubbleY + bubbleHeight);
    context.lineTo(bubbleX + 6, bubbleY + bubbleHeight + 3);
    context.lineTo(bubbleX + 8, bubbleY + bubbleHeight);
    context.closePath();
    context.fill();
    context.strokeStyle = isNegative ? '#E74C3C' : '#27AE60';
    context.beginPath();
    context.moveTo(bubbleX + 4, bubbleY + bubbleHeight);
    context.lineTo(bubbleX + 6, bubbleY + bubbleHeight + 3);
    context.lineTo(bubbleX + 8, bubbleY + bubbleHeight);
    context.stroke();

    // Draw text using pixel rectangles for crisp rendering
    context.fillStyle = isNegative ? '#C0392B' : '#1E8449';
    drawPixelText(context, text, bubbleX + padding + 1, bubbleY + 2);

    context.restore();
}


// Pixel font for crisp speech bubble text at small scale
const PIXEL_CHARS = {
    '$': [[1,0],[0,1],[1,1],[2,1],[1,2],[2,2],[1,3],[0,3],[1,4],[0,4],[1,5]],
    '0': [[0,0],[1,0],[2,0],[0,1],[2,1],[0,2],[2,2],[0,3],[2,3],[0,4],[1,4],[2,4]],
    '1': [[1,0],[0,1],[1,1],[1,2],[1,3],[0,4],[1,4],[2,4]],
    '2': [[0,0],[1,0],[2,0],[2,1],[0,2],[1,2],[2,2],[0,3],[0,4],[1,4],[2,4]],
    '5': [[0,0],[1,0],[2,0],[0,1],[0,2],[1,2],[2,2],[2,3],[0,4],[1,4],[2,4]],
    '!': [[1,0],[1,1],[1,2],[1,4]],
    'S': [[1,0],[2,0],[0,1],[0,2],[1,2],[2,3],[0,4],[1,4]],
    'u': [[0,1],[2,1],[0,2],[2,2],[0,3],[2,3],[1,4],[2,4]],
    'r': [[0,1],[1,2],[0,2],[0,3],[0,4]],
    'e': [[1,1],[0,2],[1,2],[2,2],[0,3],[1,4],[2,4]],
    'O': [[1,0],[0,1],[2,1],[0,2],[2,2],[0,3],[2,3],[1,4]],
    'K': [[0,0],[2,0],[0,1],[1,1],[0,2],[0,3],[1,3],[0,4],[2,4]],
    'N': [[0,0],[2,0],[0,1],[1,1],[2,1],[0,2],[2,2],[0,3],[2,3],[0,4],[2,4]],
    'o': [[1,1],[0,2],[2,2],[0,3],[2,3],[1,4]],
    ' ': [],
    'm': [[0,1],[1,1],[2,1],[0,2],[1,2],[2,2],[0,3],[2,3],[0,4],[2,4]],
    'x': [[0,1],[2,1],[1,2],[0,3],[2,3]],
    '3': [[0,0],[1,0],[2,0],[2,1],[0,2],[1,2],[2,2],[2,3],[0,4],[1,4],[2,4]],
    '4': [[0,0],[2,0],[0,1],[2,1],[0,2],[1,2],[2,2],[2,3],[2,4]],
};

function drawPixelText(context, text, startX, startY) {
    let x = startX;
    for (const ch of text) {
        const pixels = PIXEL_CHARS[ch];
        if (pixels) {
            for (const [px, py] of pixels) {
                context.fillRect(x + px, startY + py, 1, 1);
            }
        }
        x += 4;
    }
}


function drawAskIndicator(context, remainingAsks) {
    // Position centered above the donor's head (in DRAW_OFFSET translated space)
    const indicatorY = -10;
    const startX = 0;
    const text = 'x' + remainingAsks;
    const textWidth = text.length * 4;
    const totalWidth = 7 + 2 + textWidth; // envelope + gap + text

    context.save();

    // Solid colored background pill for clear visibility
    const bgColor = remainingAsks <= 1 ? '#C0392B' : '#2C3E50';
    context.fillStyle = bgColor;
    context.fillRect(startX - 1, indicatorY - 1, totalWidth + 3, 9);

    // Bright border
    context.strokeStyle = remainingAsks <= 1 ? '#E74C3C' : '#5D6D7E';
    context.lineWidth = 1;
    context.strokeRect(startX - 1, indicatorY - 1, totalWidth + 3, 9);

    // Draw mini envelope icon (7x5)
    context.fillStyle = '#fff';
    context.fillRect(startX + 1, indicatorY + 1, 7, 5);
    context.strokeStyle = '#ccc';
    context.lineWidth = 0.5;
    context.strokeRect(startX + 1, indicatorY + 1, 7, 5);
    // Envelope flap
    context.beginPath();
    context.moveTo(startX + 1, indicatorY + 1);
    context.lineTo(startX + 4.5, indicatorY + 3.5);
    context.lineTo(startX + 8, indicatorY + 1);
    context.stroke();

    // Draw "xN" text next to envelope
    context.fillStyle = '#FFD700';
    drawPixelText(context, text, startX + 9, indicatorY + 1);

    context.restore();
}


function createDonorFactory(style) {
    const drawFn = createDonorDrawFunction(style);

    return function createDonor() {
        const donor = new Entity();
        donor.size.set(16, 16);

        donor.addTrait(new Physics());
        donor.addTrait(new Solid());
        donor.addTrait(new PendulumMove());
        donor.addTrait(new Behavior());
        donor.addTrait(new Killable());

        donor.traits.get(PendulumMove).speed = -20;
        donor.donorType = style;
        donor.drawOffset = {x: 0, y: -20};

        donor.draw = drawFn;

        return donor;
    };
}

export function loadDonorBusiness() {
    return Promise.resolve(createDonorFactory('business'));
}

export function loadDonorCasual() {
    return Promise.resolve(createDonorFactory('casual'));
}

export function loadDonorFormal() {
    return Promise.resolve(createDonorFactory('formal'));
}
