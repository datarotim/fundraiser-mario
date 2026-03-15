import Entity from '../Entity.js';
import Trait from '../Trait.js';
import Killable from '../traits/Killable.js';
import PendulumMove from '../traits/PendulumMove.js';
import Physics from '../traits/Physics.js';
import Solid from '../traits/Solid.js';
import Stomper from '../traits/Stomper.js';
import Player from '../traits/Player.js';
import {findPlayers} from '../player.js';

const STATE_WALKING = Symbol('walking');
const STATE_RESPONDING = Symbol('responding');
const STATE_FLEEING = Symbol('fleeing');
const STATE_DISGRUNTLED = Symbol('disgruntled');

const APPEAL_THRESHOLD = 3;
const DISGRUNTLED_THRESHOLD = 5;
const RESPOND_DURATION = 1.5;
const FLEE_SPEED = 120;
const DONATION_POINTS = 500;
const CHASE_SPEED = 50;
const FIRE_INTERVAL = 2.5;
const BURST_SIZE = 3;
const BURST_DELAY = 0.2;
const FIREBALL_SPEED = 120;

class Behavior extends Trait {
    constructor() {
        super();
        this.state = STATE_WALKING;
        this.appealCount = 0;
        this.respondTimer = 0;
        this.walkSpeed = null;
        this.speechBubbleText = '';
        this.fleeDirection = 1;
        this.fireTimer = 0;
        this.burstCount = 0;
        this.burstTimer = 0;
        this.staggerTimer = 0;
    }

    collides(us, them) {
        if (us.traits.get(Killable).dead) {
            return;
        }

        if (them.traits.has(Stomper)) {
            if (this.state === STATE_DISGRUNTLED) {
                // Invincible - always kill the player
                them.traits.get(Killable).kill();
                return;
            }

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

        if (this.state === STATE_DISGRUNTLED) {
            return;
        }

        if (this.state === STATE_FLEEING) {
            this.appealCount++;
            if (this.appealCount >= DISGRUNTLED_THRESHOLD) {
                this.startDisgruntled(us);
            } else {
                // Stagger: briefly stop so player can land more hits
                us.vel.x = 0;
                us.traits.get(PendulumMove).speed = 0;
                this.staggerTimer = 0.6;
            }
            return;
        }

        // If already responding, don't re-award points, just count
        if (this.state === STATE_RESPONDING) {
            this.appealCount++;
            if (this.appealCount >= APPEAL_THRESHOLD) {
                this.startFleeing(us, them);
            }
            return;
        }

        this.appealCount++;

        if (this.appealCount >= APPEAL_THRESHOLD) {
            this.startFleeing(us, them);
        } else {
            this.startResponding(us, them);
        }
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

    startDisgruntled(us) {
        this.state = STATE_DISGRUNTLED;
        this.speechBubbleText = 'disgruntled donor';
        this.respondTimer = 0;
        this.fireTimer = 0;
        this.burstCount = 0;
        this.burstTimer = 0;

        // Grow to 2x size - adjust position so they grow upward
        us.pos.y -= 16;
        us.size.set(32, 32);
        us.drawOffset = {x: 0, y: -20};

        // Stop pendulum, we handle movement manually
        us.traits.get(PendulumMove).enabled = false;
        us.traits.get(Solid).obstructs = false;
    }

    emitFireball(us, gameContext, level) {
        if (!gameContext.entityFactory.fireball) {
            return;
        }

        const fireball = gameContext.entityFactory.fireball();
        fireball.pos.set(
            us.pos.x + us.size.x / 2 - 4,
            us.pos.y + us.size.y / 2 - 4
        );

        // Aim at player
        for (const player of findPlayers(level.entities)) {
            const dx = player.pos.x - fireball.pos.x;
            const dy = player.pos.y - fireball.pos.y;
            const dist = Math.sqrt(dx * dx + dy * dy) || 1;
            fireball.vel.set(
                (dx / dist) * FIREBALL_SPEED,
                (dy / dist) * FIREBALL_SPEED
            );
        }

        level.entities.add(fireball);
    }

    update(us, gameContext, level) {
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
            // Recover from stagger
            if (this.staggerTimer > 0) {
                this.staggerTimer -= deltaTime;
                if (this.staggerTimer <= 0) {
                    us.traits.get(PendulumMove).speed = FLEE_SPEED * this.fleeDirection;
                }
            }
        }

        if (this.state === STATE_DISGRUNTLED) {
            this.respondTimer += deltaTime;

            // Flash speech bubble for ~2.5 seconds
            if (this.respondTimer > 2.5) {
                this.speechBubbleText = '';
            }

            // Chase player
            for (const player of findPlayers(level.entities)) {
                const dir = Math.sign(player.pos.x - us.pos.x);
                us.vel.x = dir * CHASE_SPEED;
            }

            // Fireball burst logic
            this.fireTimer += deltaTime;
            if (this.burstCount > 0) {
                this.burstTimer += deltaTime;
                if (this.burstTimer >= BURST_DELAY) {
                    this.burstTimer = 0;
                    this.burstCount--;
                    this.emitFireball(us, gameContext, level);
                }
            } else if (this.fireTimer >= FIRE_INTERVAL) {
                this.fireTimer = 0;
                this.burstCount = BURST_SIZE;
                this.burstTimer = BURST_DELAY; // Fire first one immediately
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


function drawDonorCharacter(context, colors, state, lifetime) {
    // Walking animation - faster when fleeing or disgruntled
    const isFleeing = state === STATE_FLEEING;
    const isDisgruntled = state === STATE_DISGRUNTLED;
    const walkSpeed = isFleeing ? 16 : isDisgruntled ? 12 : 8;
    const walkCycle = Math.sin(lifetime * walkSpeed);
    const isMoving = state === STATE_WALKING || isFleeing || isDisgruntled;
    const legAmplitude = isFleeing ? 2.5 : isDisgruntled ? 2 : 1.5;
    const legOffset = isMoving ? walkCycle * legAmplitude : 0;
    const armSwing = isMoving ? walkCycle * 1 : 0;

    // Shake effect for fleeing/disgruntled
    const shakeX = isFleeing ? Math.sin(lifetime * 30) * 0.5
        : isDisgruntled ? Math.sin(lifetime * 20) * 0.3 : 0;

    context.translate(shakeX, 0);

    // --- Draw bottom-up to prevent overlap issues ---

    // Shoes
    context.fillStyle = isDisgruntled ? '#330000' : colors.shoeColor;
    context.fillRect(3 + legOffset, 14, 4, 2);
    context.fillRect(9 - legOffset, 14, 4, 2);

    // Pants / legs
    context.fillStyle = isDisgruntled ? '#4A0000' : colors.pantsColor;
    context.fillRect(4 + legOffset, 11, 3, 4);
    context.fillRect(9 - legOffset, 11, 3, 4);

    // Body / suit jacket
    context.fillStyle = isDisgruntled ? '#8B0000' : colors.suitColor;
    context.fillRect(3, 5, 10, 6);

    // Shirt visible under jacket
    context.fillStyle = isDisgruntled ? '#FF6347' : colors.shirtColor;
    context.fillRect(6, 5, 4, 5);

    // Tie
    if (colors.tieColor && !isDisgruntled) {
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
    context.fillStyle = isDisgruntled ? '#8B0000' : colors.suitColor;
    context.fillRect(1, 5 + armSwing, 2, 5);
    context.fillRect(13, 5 - armSwing, 2, 5);

    // Hands
    context.fillStyle = isDisgruntled ? '#FF8C69' : colors.skinColor;
    context.fillRect(1, 10 + armSwing, 2, 1);
    context.fillRect(13, 10 - armSwing, 2, 1);

    // Briefcase (not when fleeing or disgruntled)
    if (colors.briefcase && !isFleeing && !isDisgruntled) {
        context.fillStyle = '#8B4513';
        context.fillRect(13, 9 - armSwing, 2, 3);
        context.fillStyle = '#DAA520';
        context.fillRect(13, 9 - armSwing, 1, 1);
    }

    // Head
    context.fillStyle = isDisgruntled ? '#FF8C69' : colors.skinColor;
    context.fillRect(4, 0, 8, 5);

    // Hair
    context.fillStyle = isDisgruntled ? '#1A0000' : colors.hairColor;
    context.fillRect(4, 0, 8, 2);
    context.fillRect(4, 0, 1, 3);

    // Eyes
    context.fillStyle = '#000';
    if (isDisgruntled) {
        // Angry eyes - red with angry eyebrows
        context.fillStyle = '#FF0000';
        context.fillRect(5, 2, 2, 2);
        context.fillRect(9, 2, 2, 2);
        context.fillStyle = '#000';
        context.fillRect(6, 2, 1, 1);
        context.fillRect(10, 2, 1, 1);
        // Angry eyebrows (V shape)
        context.fillRect(5, 1, 1, 1);
        context.fillRect(6, 2, 1, 1);
        context.fillRect(11, 1, 1, 1);
        context.fillRect(10, 2, 1, 1);
    } else if (isFleeing) {
        // Wide scared eyes with white highlights
        context.fillRect(5, 2, 2, 2);
        context.fillRect(9, 2, 2, 2);
        context.fillStyle = '#FFF';
        context.fillRect(5, 2, 1, 1);
        context.fillRect(9, 2, 1, 1);
    } else if (state === STATE_RESPONDING) {
        // Happy closed eyes (^_^)
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
    if (isDisgruntled) {
        // Angry gritted teeth
        context.fillStyle = '#000';
        context.fillRect(6, 4, 4, 1);
        context.fillStyle = '#FFF';
        context.fillRect(7, 4, 1, 1);
        context.fillRect(9, 4, 1, 1);
    } else if (isFleeing) {
        context.fillStyle = '#000';
        context.fillRect(7, 4, 2, 1);
    } else if (state === STATE_RESPONDING) {
        context.fillStyle = '#000';
        context.fillRect(6, 4, 1, 1);
        context.fillRect(9, 4, 1, 1);
    }
}


function createDonorDrawFunction(style) {
    const colors = DONOR_STYLES[style] || DONOR_STYLES.business;

    return function drawDonor(context) {
        const behavior = this.traits.get(Behavior);
        const state = behavior.state;
        const lifetime = this.lifetime;
        const isDisgruntled = state === STATE_DISGRUNTLED;

        const DRAW_OFFSET = 20;
        context.save();
        context.translate(0, DRAW_OFFSET);

        // Character drawing with flip
        const flip = this.vel.x < 0;
        context.save();
        if (isDisgruntled) {
            // Scale 2x from top-left
            context.scale(2, 2);
        }
        if (flip) {
            context.scale(-1, 1);
            context.translate(-16, 0);
        }

        drawDonorCharacter(context, colors, state, lifetime);

        context.restore(); // restore flip + scale

        // Speech bubble (drawn at normal scale, above the character)
        if (behavior.speechBubbleText) {
            drawSpeechBubble(context, behavior.speechBubbleText, state);
        }

        context.restore(); // restore DRAW_OFFSET translate
    };
}


function drawSpeechBubble(context, text, state) {
    const bubbleX = -2;
    const bubbleY = -16;
    const padding = 2;

    context.save();

    // Calculate bubble dimensions based on text
    const charWidth = 4;
    const textWidth = text.length * charWidth;
    const bubbleWidth = textWidth + padding * 2 + 2;
    const bubbleHeight = 10;

    // Bubble background color
    const isNegative = state === STATE_FLEEING || state === STATE_DISGRUNTLED;
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
    // Additional characters for "disgruntled donor"
    'd': [[2,0],[2,1],[1,2],[2,2],[0,3],[2,3],[1,4],[2,4]],
    'i': [[1,0],[1,2],[1,3],[1,4]],
    's': [[1,1],[2,1],[0,2],[1,3],[0,4],[1,4]],
    'g': [[1,1],[2,1],[0,2],[2,2],[1,3],[2,3],[2,4],[0,5],[1,5]],
    'n': [[0,1],[1,1],[2,1],[0,2],[2,2],[0,3],[2,3],[0,4],[2,4]],
    't': [[1,0],[0,1],[1,1],[2,1],[1,2],[1,3],[1,4],[2,4]],
    'l': [[1,0],[1,1],[1,2],[1,3],[1,4]],
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
