import Level from './Level.js';
import Timer from './Timer.js';
import Pipe from './traits/Pipe.js';
import Killable from './traits/Killable.js';
import Player from './traits/Player.js';
import Physics from './traits/Physics.js';
import Solid from './traits/Solid.js';
import {createLevelLoader} from './loaders/level.js';
import {loadFont} from './loaders/font.js';
import {loadEntities} from './entities.js';
import {makePlayer, bootstrapPlayer, resetPlayer, findPlayers} from './player.js';
import {setupKeyboard} from './input.js';
import {createColorLayer} from './layers/color.js';
import {createTextLayer} from './layers/text.js';
import {createDashboardLayer} from './layers/dashboard.js';
import { createPlayerProgressLayer } from './layers/player-progress.js';
import { createDataroRevealLayer } from './layers/dataro-reveal.js';
import { createEnemyLabelLayer, resetEnemyLabels } from './layers/enemy-labels.js';
import SceneRunner from './SceneRunner.js';
import Scene from './Scene.js';
import TimedScene from './TimedScene.js';
import NarrativeScene from './NarrativeScene.js';
import VictoryScene from './VictoryScene.js';
import { connectEntity } from './traits/Pipe.js';
import { OPENING_NARRATIVES, pickRandom, pickNextCard } from './narrative.js';

/* ============================================
   PLAYER DATA & LEAD CAPTURE
   ============================================ */

const playerData = {
    name: '',
    email: '',
    org: '',
};

/* ============================================
   LEADERBOARD (server + localStorage fallback)
   ============================================ */

// In-memory cache of today's leaderboard (populated from server)
let _leaderboardCache = [];

function getLeaderboard() {
    return _leaderboardCache;
}

function getLeaderboardFromLocalStorage() {
    try {
        const data = JSON.parse(localStorage.getItem('dataro_leaderboard') || '[]');
        const today = new Date().toDateString();
        return data.filter(e => {
            try { return new Date(e.time).toDateString() === today; } catch { return false; }
        });
    } catch {
        return [];
    }
}

function saveToLocalStorage(name, score, donors, world) {
    let allData;
    try {
        allData = JSON.parse(localStorage.getItem('dataro_leaderboard') || '[]');
    } catch {
        allData = [];
    }
    allData.push({ name, score, donors, world, time: Date.now() });
    allData.sort((a, b) => b.score - a.score);
    const trimmed = allData.slice(0, 200);
    try {
        localStorage.setItem('dataro_leaderboard', JSON.stringify(trimmed));
    } catch { /* storage full */ }
}

async function addToLeaderboard(name, score, donors, world) {
    // Always save locally as fallback
    saveToLocalStorage(name, score, donors, world);

    // Post to server
    try {
        const resp = await fetch('/api/scores', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                name,
                score,
                donors,
                world,
                email: playerData.email || '',
                org: playerData.org || '',
            }),
        });
        if (resp.ok) {
            const data = await resp.json();
            _leaderboardCache = data.leaderboard || [];
            return _leaderboardCache;
        }
    } catch { /* network error, fall back to local */ }

    _leaderboardCache = getLeaderboardFromLocalStorage();
    return _leaderboardCache;
}

async function fetchLeaderboard() {
    try {
        const resp = await fetch('/api/scores');
        if (resp.ok) {
            const data = await resp.json();
            _leaderboardCache = data.leaderboard || [];
            return _leaderboardCache;
        }
    } catch { /* network error */ }
    _leaderboardCache = getLeaderboardFromLocalStorage();
    return _leaderboardCache;
}

function getPlayerRank(score) {
    const board = getLeaderboard();
    let rank = board.length + 1;
    for (let i = 0; i < board.length; i++) {
        if (board[i].score <= score) {
            rank = i + 1;
            break;
        }
    }
    return rank;
}

function renderLeaderboard(currentPlayerName, currentScore) {
    const list = document.getElementById('leaderboard-list');
    if (!list) return;

    const board = getLeaderboard();
    const top5 = board.slice(0, 5);

    list.innerHTML = '';
    top5.forEach((entry, i) => {
        const isMe = entry.name === currentPlayerName && entry.score === currentScore;
        const div = document.createElement('div');
        div.className = `lb-entry${isMe ? ' highlight' : ''}`;
        div.innerHTML = `
            <span class="lb-rank">#${i + 1}</span>
            <span class="lb-name">${escapeHtml(truncate(entry.name, 20))}</span>
            <span class="lb-score">$${entry.score.toLocaleString()}</span>
        `;
        list.appendChild(div);
    });

    if (top5.length === 0) {
        list.innerHTML = '<div class="lb-entry"><span class="lb-name" style="text-align:center;width:100%;color:var(--gray)">Be the first on the board!</span></div>';
    }
}

function escapeHtml(str) {
    const div = document.createElement('div');
    div.textContent = str;
    return div.innerHTML;
}

function truncate(str, max) {
    return str.length > max ? str.slice(0, max) + '...' : str;
}

/* ============================================
   PARTICLE SYSTEM
   ============================================ */

function initParticles() {
    const container = document.getElementById('particles');
    if (!container) return;
    for (let i = 0; i < 35; i++) {
        const p = document.createElement('div');
        p.className = 'particle';
        p.style.left = Math.random() * 100 + '%';
        p.style.animationDelay = Math.random() * 6 + 's';
        p.style.animationDuration = (4 + Math.random() * 5) + 's';
        const size = 2 + Math.random() * 5;
        p.style.width = size + 'px';
        p.style.height = size + 'px';
        // Mix of purple and gold particles
        p.style.background = Math.random() > 0.6 ? '#FFD700' : '#9B6FD0';
        container.appendChild(p);
    }
}

/* ============================================
   ROTATING TAGLINES (Attract Mode)
   ============================================ */

const TAGLINES = [
    "Can you survive the nonprofit world?",
    "How many donors can you save?",
    "Powered by AI. Fueled by purpose.",
    "The ultimate fundraiser challenge!",
    "Jump, dodge, and save the donors!",
];

function startTaglineRotation() {
    const el = document.getElementById('rotating-tagline');
    if (!el) return;
    let idx = 0;
    setInterval(() => {
        idx = (idx + 1) % TAGLINES.length;
        el.style.opacity = '0';
        setTimeout(() => {
            el.textContent = TAGLINES[idx];
            el.style.opacity = '1';
        }, 400);
    }, 4000);
}

/* ============================================
   TOUCH CONTROLS
   ============================================ */

function isTouchDevice() {
    return 'ontouchstart' in window || navigator.maxTouchPoints > 0;
}

function setupTouchControls() {
    if (!isTouchDevice()) return;

    const controls = document.getElementById('touch-controls');
    if (controls) controls.classList.remove('hidden');

    const activeKeys = {};
    function dispatch(code, down) {
        if (activeKeys[code] === down) return;
        activeKeys[code] = down;
        window.dispatchEvent(new KeyboardEvent(down ? 'keydown' : 'keyup', {
            code, bubbles: true,
        }));
    }

    function bind(id, code) {
        const el = document.getElementById(id);
        if (!el) return;

        const start = (e) => { e.preventDefault(); dispatch(code, true); };
        const end = (e) => { e.preventDefault(); dispatch(code, false); };

        el.addEventListener('touchstart', start, { passive: false });
        el.addEventListener('touchend', end, { passive: false });
        el.addEventListener('touchcancel', end);
        // Also support mouse for testing
        el.addEventListener('mousedown', start);
        el.addEventListener('mouseup', end);
        el.addEventListener('mouseleave', end);
    }

    bind('touch-btn-left', 'ArrowLeft');
    bind('touch-btn-right', 'ArrowRight');
    bind('touch-btn-jump', 'Space');
}

/* ============================================
   SCREEN FLOW
   ============================================ */

function showScreen(id) {
    document.querySelectorAll('.overlay-screen').forEach(s => s.classList.remove('active'));
    const screen = document.getElementById(id);
    if (screen) screen.classList.add('active');
}

function hideAllOverlays() {
    document.querySelectorAll('.overlay-screen').forEach(s => s.classList.remove('active'));
}

/* ============================================
   FORM VALIDATION
   ============================================ */

function validateEmail(email) {
    return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
}

function showFieldError(inputId, errorId) {
    const group = document.getElementById(inputId)?.closest('.form-group');
    if (group) group.classList.add('has-error');
}

function clearFieldError(inputId) {
    const group = document.getElementById(inputId)?.closest('.form-group');
    if (group) group.classList.remove('has-error');
}

/* ============================================
   DATARO CTA MESSAGES
   ============================================ */

const DATARO_MESSAGES = [
    "Every donor counts. With Dataro AI, you never miss one.",
    "What if AI could predict which donors will give? That's Dataro.",
    "Stop guessing. Start knowing. Dataro uses AI to find your best donors.",
    "Your donors want to give. Dataro helps you ask the right ones.",
    "Imagine doubling your response rate. Dataro nonprofits do.",
    "AI-powered fundraising isn't the future. It's now — with Dataro.",
    "The donors are out there. Dataro's AI finds them for you.",
    "Dataro helps nonprofits raise more by asking less. Smarter, not harder.",
];

/* ============================================
   MAIN GAME
   ============================================ */

async function main(canvas) {
    const videoContext = canvas.getContext('2d');

    // Handle AudioContext with user gesture (required by browsers)
    const audioContext = new AudioContext();
    if (audioContext.state === 'suspended') {
        audioContext.resume();
    }

    const [entityFactory, font] = await Promise.all([
        loadEntities(audioContext),
        loadFont(),
    ]);

    resetEnemyLabels();
    const loadLevel = await createLevelLoader(entityFactory);
    const sceneRunner = new SceneRunner();

    const mario = entityFactory.mario();
    makePlayer(mario, "MARIO");

    // Set display name from signup
    const playerTrait = mario.traits.get(Player);
    const firstName = playerData.name.split(' ')[0] || 'PLAYER';
    playerTrait.name = firstName.toUpperCase().slice(0, 10);

    window.mario = mario;

    const inputRouter = setupKeyboard(window);
    inputRouter.addReceiver(mario);

    function createLoadingScreen(name) {
        const scene = new Scene();
        scene.comp.layers.push(createColorLayer('#000'));
        scene.comp.layers.push(createTextLayer(font, `Loading ${name}...`));
        return scene;
    }

    async function setupLevel(name) {
        const loadingScreen = createLoadingScreen(name);
        sceneRunner.addScene(loadingScreen);
        sceneRunner.runNext();

        const level = await loadLevel(name);
        bootstrapPlayer(mario, level);

        level.events.listen(Level.EVENT_TRIGGER, (spec, trigger, touches) => {
            if (spec.type === "goto") {
                for (const _ of findPlayers(touches)) {
                    // Show victory/stats screen between levels
                    const playerTrait = mario.traits.get(Player);
                    const victoryScene = new VictoryScene(font, playerTrait, {
                        isFinal: false,
                    });
                    sceneRunner.addSceneManual(victoryScene);
                    sceneRunner.runNext();
                    victoryScene.events.listen(Scene.EVENT_COMPLETE, () => {
                        startWorld(spec.name);
                    });
                    return;
                }
            } else if (spec.type === "final") {
                for (const _ of findPlayers(touches)) {
                    // Final level completed - show final victory then game over
                    const playerTrait = mario.traits.get(Player);
                    const victoryScene = new VictoryScene(font, playerTrait, {
                        isFinal: true,
                    });
                    sceneRunner.addSceneManual(victoryScene);
                    sceneRunner.runNext();
                    victoryScene.events.listen(Scene.EVENT_COMPLETE, () => {
                        showGameOver();
                    });
                    return;
                }
            }
        });

        level.events.listen(Pipe.EVENT_PIPE_COMPLETE, async pipe => {
            if (pipe.props.goesTo) {
                const nextLevel = await setupLevel(pipe.props.goesTo.name);
                sceneRunner.addScene(nextLevel);
                sceneRunner.runNext();
                if (pipe.props.backTo) {
                    nextLevel.events.listen(Level.EVENT_COMPLETE, async () => {
                        const level = await setupLevel(name);
                        const exitPipe = level.entities.get(pipe.props.backTo);
                        connectEntity(exitPipe, mario);
                        sceneRunner.addScene(level);
                        sceneRunner.runNext();
                    });
                }
            } else {
                level.events.emit(Level.EVENT_COMPLETE);
            }
        });

        const dashboardLayer = createDashboardLayer(font, mario);
        level.comp.layers.push(dashboardLayer);

        const enemyLabelLayer = createEnemyLabelLayer(level.entities, font);
        level.comp.layers.push(enemyLabelLayer);

        const revealLayer = createDataroRevealLayer(font);
        level.comp.layers.push(revealLayer);

        return level;
    }

    let currentWorldName = null;
    let deathHandled = false;
    let worldsVisited = 0;
    let isDeathRestart = false;

    async function showGameOver() {
        const pt = mario.traits.get(Player);
        const score = pt.score;
        const donors = pt.coins;
        const world = pt.world;
        const lettersSent = pt.lettersSent;
        const responseRate = lettersSent > 0
            ? Math.round((donors / lettersSent) * 100)
            : 0;

        // Animate score counter
        const scoreEl = document.getElementById('final-score');
        animateCounter(scoreEl, score);

        document.getElementById('final-donors').textContent = donors;
        document.getElementById('final-letters').textContent = lettersSent;
        document.getElementById('final-response-rate').textContent = responseRate + '%';
        document.getElementById('final-world').textContent = world;
        document.getElementById('gameover-msg').textContent =
            DATARO_MESSAGES[Math.floor(Math.random() * DATARO_MESSAGES.length)];

        // Leaderboard (server + localStorage fallback)
        const name = playerData.name || 'Anonymous';
        await addToLeaderboard(name, score, donors, world);
        renderLeaderboard(name, score);

        // Rank
        const rank = getPlayerRank(score);
        const rankEl = document.getElementById('player-rank');
        if (rankEl) rankEl.textContent = `#${rank}`;

        showScreen('gameover-screen');

        // Hide touch controls
        const touchCtrl = document.getElementById('touch-controls');
        if (touchCtrl) touchCtrl.classList.add('hidden');

        // Store lead with score locally as backup
        try {
            const leads = JSON.parse(localStorage.getItem('dataro_leads') || '[]');
            const existingIdx = leads.findIndex(l => l.email === playerData.email);
            if (existingIdx >= 0) {
                leads[existingIdx].lastScore = score;
                leads[existingIdx].lastPlayed = new Date().toISOString();
                leads[existingIdx].plays = (leads[existingIdx].plays || 1) + 1;
            }
            localStorage.setItem('dataro_leads', JSON.stringify(leads));
        } catch { /* ok */ }
    }

    function animateCounter(el, target) {
        const duration = 800;
        const start = performance.now();
        const tick = (now) => {
            const progress = Math.min((now - start) / duration, 1);
            const eased = 1 - Math.pow(1 - progress, 3); // ease-out cubic
            el.textContent = '$' + Math.floor(target * eased).toLocaleString();
            if (progress < 1) requestAnimationFrame(tick);
        };
        requestAnimationFrame(tick);
    }

    function watchForDeath(level) {
        deathHandled = false;
        let pitDeathHandled = false;

        const originalUpdate = level.update.bind(level);
        level.update = function(gameContext) {
            originalUpdate(gameContext);

            const killable = mario.traits.get(Killable);

            // Pit death: if Mario falls below the camera view, kill him
            if (!killable.dead && !pitDeathHandled) {
                const bottomOfScreen = level.camera.pos.y + level.camera.size.y;
                if (mario.pos.y > bottomOfScreen) {
                    pitDeathHandled = true;
                    killable.kill();
                    // Force the queued kill immediately
                    mario.finalize();
                }
            }

            if (killable.dead && !deathHandled) {
                deathHandled = true;

                const playerTrait = mario.traits.get(Player);
                playerTrait.lives -= 1;

                // Freeze camera so screen doesn't scroll
                level.freezeCamera = true;

                // Stop music
                level.music.pause();

                // Disable solid collision so Mario falls through
                mario.traits.get(Solid).obstructs = false;

                // Override physics to only apply gravity to Mario (freeze X movement)
                const physics = mario.traits.get(Physics);
                const origPhysicsUpdate = physics.update.bind(physics);
                physics.update = function(entity, gameContext, level) {
                    const {deltaTime} = gameContext;
                    entity.pos.y += entity.vel.y * deltaTime;
                    entity.vel.y += level.gravity * deltaTime;
                };

                if (pitDeathHandled) {
                    // Pit death: Mario is already falling, just let him continue
                    // No bounce - he's already below screen
                    mario.vel.set(0, mario.vel.y);
                } else {
                    // Enemy kill: pause briefly, then bounce up and fall
                    mario.vel.set(0, 0);

                    // Freeze all other entities
                    level.entities.forEach(entity => {
                        if (entity !== mario) {
                            entity.vel.set(0, 0);
                            const entityUpdate = entity.update;
                            entity.update = function() {};
                        }
                    });

                    // Brief pause then bounce up (like classic Mario)
                    setTimeout(() => {
                        mario.vel.set(0, -400);
                    }, 500);
                }

                // Wait for death animation to complete then restart/game over
                setTimeout(async () => {
                    physics.update = origPhysicsUpdate;
                    mario.traits.get(Solid).obstructs = true;
                    level.freezeCamera = false;

                    if (playerTrait.lives > 0) {
                        killable.revive();
                        mario.vel.set(0, 0);
                        isDeathRestart = true;
                        await startWorld(currentWorldName);
                    } else {
                        showGameOver();
                    }
                }, pitDeathHandled ? 2000 : 3000);
            }
        };
    }

    async function startWorld(name) {
        currentWorldName = name;
        worldsVisited++;

        // Show between-level fundraiser fact card (not on first world, not on death restart)
        if (worldsVisited > 1 && !isDeathRestart) {
            const cardText = pickNextCard();
            const cardLines = cardText.split('\n');
            const cardScene = new NarrativeScene(font, cardLines, {
                scrollSpeed: 0,
                showPrompt: true,
            });
            cardScene._skipDelay = 1.5;
            sceneRunner.addSceneManual(cardScene);
            sceneRunner.runNext();

            // Wait for card to complete before loading level
            await new Promise(resolve => {
                cardScene.events.listen(Scene.EVENT_COMPLETE, resolve);
            });
        }

        isDeathRestart = false;

        const level = await setupLevel(name);
        resetPlayer(mario, name);

        const playerProgressLayer = createPlayerProgressLayer(font, level);
        const dashboardLayer = createDashboardLayer(font, mario);

        const waitScreen = new TimedScene();
        waitScreen.countDown = 2;
        waitScreen.comp.layers.push(createColorLayer('#000'));
        waitScreen.comp.layers.push(dashboardLayer);
        waitScreen.comp.layers.push(playerProgressLayer);

        sceneRunner.addScene(waitScreen);
        sceneRunner.addScene(level);
        sceneRunner.runNext();

        watchForDeath(level);
    }

    const gameContext = {
        audioContext,
        videoContext,
        entityFactory,
        deltaTime: null,
        tick: 0,
    };

    const timer = new Timer(1/60);
    timer.update = function update(deltaTime) {
        gameContext.tick++;
        gameContext.deltaTime = deltaTime;
        sceneRunner.update(gameContext);
    };

    timer.start();

    // Show opening narrative crawl before first level
    const openingLines = pickRandom(OPENING_NARRATIVES);
    const narrativeScene = new NarrativeScene(font, openingLines, {
        title: 'THE FUNDRAISER',
        scrollSpeed: 16,
    });
    sceneRunner.addSceneManual(narrativeScene);
    sceneRunner.runNext();

    narrativeScene.events.listen(Scene.EVENT_COMPLETE, () => {
        startWorld('1-1');
    });
}

/* ============================================
   APP INIT
   ============================================ */

const canvas = document.getElementById('screen');

// Init splash effects
initParticles();
startTaglineRotation();

// Pre-fetch server leaderboard
fetchLeaderboard();

// PHASE 1: Splash -> Signup
document.getElementById('btn-play').addEventListener('click', () => {
    showScreen('signup-screen');
    setTimeout(() => {
        document.getElementById('player-name').focus();
    }, 300);
});

// Clear field errors on input
document.getElementById('player-email').addEventListener('input', () => {
    clearFieldError('player-email');
});

// PHASE 2: Signup -> Tutorial
document.getElementById('signup-form').addEventListener('submit', (e) => {
    e.preventDefault();

    const name = document.getElementById('player-name').value.trim();
    const lastName = document.getElementById('player-lastname')?.value.trim() || '';
    const email = document.getElementById('player-email').value.trim();
    const org = document.getElementById('player-org').value.trim();

    // Validate name
    if (!name) {
        document.getElementById('player-name').focus();
        return;
    }

    // Validate email
    if (!validateEmail(email)) {
        showFieldError('player-email', 'email-error');
        document.getElementById('player-email').focus();
        return;
    }

    const fullName = lastName ? `${name} ${lastName}` : name;

    playerData.name = fullName || 'Player';
    playerData.email = email;
    playerData.org = org;

    // Persist lead data
    try {
        const leads = JSON.parse(localStorage.getItem('dataro_leads') || '[]');
        leads.push({
            name: fullName,
            email,
            org,
            timestamp: new Date().toISOString(),
            plays: 1,
        });
        localStorage.setItem('dataro_leads', JSON.stringify(leads));
    } catch { /* localStorage not available */ }

    showScreen('tutorial-screen');
});

// PHASE 3: Tutorial -> Game
document.getElementById('btn-go').addEventListener('click', () => {
    hideAllOverlays();
    setupTouchControls();
    main(canvas);
});

// PHASE 4: Retry
document.getElementById('btn-retry').addEventListener('click', () => {
    // Quick reload for clean state
    window.location.reload();
});

// Pre-render leaderboard
renderLeaderboard('', 0);

// Prevent space bar from scrolling the page at any point
document.addEventListener('keydown', (e) => {
    if (e.code === 'Space' && e.target === document.body) {
        e.preventDefault();
    }
});

// Keyboard shortcuts on overlay screens
document.addEventListener('keydown', (e) => {
    if (e.code !== 'Enter' && e.code !== 'Space') return;

    const splash = document.getElementById('splash-screen');
    if (splash && splash.classList.contains('active')) {
        e.preventDefault();
        document.getElementById('btn-play').click();
        return;
    }

    // Only Enter on tutorial (Space might be pressed accidentally)
    if (e.code === 'Enter') {
        const tutorial = document.getElementById('tutorial-screen');
        if (tutorial && tutorial.classList.contains('active')) {
            e.preventDefault();
            document.getElementById('btn-go').click();
            return;
        }
    }
});

// Pre-fill form if returning player (reload after game over)
try {
    const leads = JSON.parse(localStorage.getItem('dataro_leads') || '[]');
    if (leads.length > 0) {
        const last = leads[leads.length - 1];
        const nameParts = (last.name || '').split(' ');
        if (nameParts[0]) document.getElementById('player-name').value = nameParts[0];
        if (nameParts[1]) {
            const lastNameEl = document.getElementById('player-lastname');
            if (lastNameEl) lastNameEl.value = nameParts.slice(1).join(' ');
        }
        if (last.email) document.getElementById('player-email').value = last.email;
        if (last.org) document.getElementById('player-org').value = last.org;
    }
} catch { /* ok */ }
