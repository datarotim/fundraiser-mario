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
import {setupKeyboard, setupInput2P} from './input.js';
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
import { startGamepad, stopGamepad } from './Gamepad.js';

/* ============================================
   PLAYER DATA & LEAD CAPTURE
   ============================================ */

const playerData = {
    name: '',
    lastName: '',
    org: '',
    email: '',
};

/* ============================================
   LEADERBOARD (server + localStorage fallback)
   ============================================ */

// Anchor "today" to Los Angeles time so the booth day is consistent
// regardless of server/client timezone. Handles DST automatically.
const PST_DATE_FMT = new Intl.DateTimeFormat('en-US', {
    timeZone: 'America/Los_Angeles',
    year: 'numeric', month: '2-digit', day: '2-digit',
});
function dateKeyInPST(d = new Date()) {
    return PST_DATE_FMT.format(d);
}

// In-memory cache of today's leaderboard (seeded from localStorage, updated from server)
let _leaderboardCache = (() => {
    try {
        const data = JSON.parse(localStorage.getItem('dataro_leaderboard') || '[]');
        const today = dateKeyInPST();
        return data.filter(e => {
            try { return dateKeyInPST(new Date(e.time)) === today; } catch { return false; }
        });
    } catch { return []; }
})();

function getLeaderboard() {
    return _leaderboardCache;
}

function getLeaderboardFromLocalStorage() {
    try {
        const data = JSON.parse(localStorage.getItem('dataro_leaderboard') || '[]');
        const today = dateKeyInPST();
        return data.filter(e => {
            try { return dateKeyInPST(new Date(e.time)) === today; } catch { return false; }
        });
    } catch {
        return [];
    }
}

function saveToLocalStorage(name, score, donors, world, lettersSent, responseRate) {
    let allData;
    try {
        allData = JSON.parse(localStorage.getItem('dataro_leaderboard') || '[]');
    } catch {
        allData = [];
    }
    allData.push({ name, score, donors, world, lettersSent, responseRate, time: Date.now() });
    allData.sort((a, b) => b.score - a.score);
    const trimmed = allData.slice(0, 200);
    try {
        localStorage.setItem('dataro_leaderboard', JSON.stringify(trimmed));
    } catch { /* storage full */ }
}

async function addToLeaderboard(name, score, donors, world, lettersSent, responseRate) {
    // Always save locally as fallback
    saveToLocalStorage(name, score, donors, world, lettersSent, responseRate);
    // Update cache with local data immediately so render is instant
    _leaderboardCache = getLeaderboardFromLocalStorage();

    // Post to server
    try {
        const resp = await fetch('/api/scores', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                name,
                lastName: playerData.lastName || '',
                org: playerData.org || '',
                email: playerData.email || '',
                score,
                donors,
                world,
                lettersSent,
                responseRate,
            }),
        });
        if (resp.ok) {
            const data = await resp.json();
            _leaderboardCache = data.leaderboard || [];
            console.log('[Leaderboard] Score saved to server successfully');
            return _leaderboardCache;
        }
        console.warn('[Leaderboard] Server returned', resp.status, '- using localStorage fallback');
    } catch (err) {
        console.warn('[Leaderboard] Could not reach server, using localStorage fallback:', err.message);
    }

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

function renderLeaderboard(currentPlayerName, currentScore, listId = 'leaderboard-list', limit = 0) {
    const list = document.getElementById(listId);
    if (!list) return;

    const fullBoard = getLeaderboard();
    const board = limit > 0 ? fullBoard.slice(0, limit) : fullBoard;

    list.innerHTML = '';
    board.forEach((entry, i) => {
        const isMe = entry.name === currentPlayerName && entry.score === currentScore;
        const div = document.createElement('div');
        div.className = `lb-entry${isMe ? ' highlight' : ''}`;
        const name = entry.name || 'Anonymous';
        const score = Number(entry.score) || 0;
        const org = entry.org ? ` <span class="lb-org">${escapeHtml(truncate(entry.org, 24))}</span>` : '';
        div.innerHTML = `
            <span class="lb-rank">#${i + 1}</span>
            <span class="lb-name">${escapeHtml(truncate(name, 20))}</span>${org}
            <span class="lb-score">$${score.toLocaleString()}</span>
        `;
        list.appendChild(div);
    });

    if (board.length === 0) {
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

const FOCUSABLE_SELECTOR =
    'button, a[href], input:not([type=hidden]):not([disabled]), select, textarea, [tabindex]:not([tabindex="-1"])';

function getFocusable(root) {
    if (!root) return [];
    return [...root.querySelectorAll(FOCUSABLE_SELECTOR)]
        .filter(el => !el.disabled && !el.hidden && el.offsetParent !== null);
}

function focusFirstInActiveOverlay() {
    const overlay = document.querySelector('.overlay-screen.active');
    if (!overlay) return;
    const items = getFocusable(overlay);
    if (items.length) items[0].focus();
}

function moveOverlayFocus(direction) {
    const overlay = document.querySelector('.overlay-screen.active');
    if (!overlay) return false;
    const items = getFocusable(overlay);
    if (!items.length) return false;
    const current = document.activeElement;
    const idx = items.indexOf(current);
    const nextIdx = idx < 0 ? 0 : (idx + direction + items.length) % items.length;
    items[nextIdx].focus();
    return true;
}

function showScreen(id) {
    document.querySelectorAll('.overlay-screen').forEach(s => s.classList.remove('active'));
    const screen = document.getElementById(id);
    if (screen) screen.classList.add('active');
    setTimeout(focusFirstInActiveOverlay, 50);
}

function hideAllOverlays() {
    document.querySelectorAll('.overlay-screen').forEach(s => s.classList.remove('active'));
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
   HOME SCREEN MUSIC
   ============================================ */

// The <audio id="splash-music"> element starts muted-autoplay (which
// browsers allow without a user gesture). On the first interaction we
// unmute it so the music is audible the instant the user touches the
// page. We listen during the capture phase so we unmute before any
// click handler (e.g. PLAY NOW) runs and transitions screens.
const splashMusic = document.getElementById('splash-music');
const _splashGestureEvents = ['pointerdown', 'mousedown', 'touchstart', 'keydown', 'click'];
let _splashMusicHandled = false;

function _activateSplashMusic() {
    if (_splashMusicHandled) return;
    _splashMusicHandled = true;
    if (splashMusic) {
        splashMusic.muted = false;
        splashMusic.volume = 0.5;
        if (splashMusic.paused) splashMusic.play().catch(() => {});
    }
    _splashGestureEvents.forEach(evt =>
        window.removeEventListener(evt, _activateSplashMusic, true));
}

function stopSplashMusic() {
    if (splashMusic) {
        splashMusic.pause();
        splashMusic.currentTime = 0;
    }
    _splashMusicHandled = true;
    _splashGestureEvents.forEach(evt =>
        window.removeEventListener(evt, _activateSplashMusic, true));
}

// Kick off muted autoplay (browsers permit muted playback without a gesture).
if (splashMusic) {
    splashMusic.volume = 0.5;
    splashMusic.play().catch(() => { /* fine - will start on first gesture */ });
}

/* ============================================
   GAME-OVER IDLE TIMEOUT
   ============================================ */

// 15s in EVENT mode (booth kiosk), 45s in DIGITAL mode (web players need
// more time to read the board before being reset to splash).
const GAMEOVER_IDLE_EVENT_MS   = 15000;
const GAMEOVER_IDLE_DIGITAL_MS = 45000;
const IDLE_RESET_EVENTS = ['keydown', 'click', 'touchstart'];
let _gameOverIdleTimer = null;

function getGameOverIdleMs() {
    return (__ADMIN && __ADMIN.mode === 'digital')
        ? GAMEOVER_IDLE_DIGITAL_MS
        : GAMEOVER_IDLE_EVENT_MS;
}

// Narrative scene auto-advance hold: 15s event, 45s digital.
function getNarrativeHoldSec() {
    return (__ADMIN && __ADMIN.mode === 'digital') ? 45 : 15;
}

function _resetGameOverIdle() {
    if (_gameOverIdleTimer !== null) clearTimeout(_gameOverIdleTimer);
    _gameOverIdleTimer = setTimeout(() => {
        window.location.reload();
    }, getGameOverIdleMs());
}

function startGameOverIdleTimer() {
    IDLE_RESET_EVENTS.forEach(e => window.addEventListener(e, _resetGameOverIdle));
    _resetGameOverIdle();
}

/* ============================================
   MAIN GAME
   ============================================ */

async function main(canvas) {
    const videoContext = canvas.getContext('2d');
    const is2P = window.gameMode === '2p';

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
    mario._isPlayer = true;

    let luigi = null;
    const allPlayers = [mario];

    if (is2P) {
        luigi = entityFactory.luigi();
        luigi._isPlayer = true;
        allPlayers.push(luigi);
        makePlayer(mario, "ANNUAL", { hasTimer: true });
        makePlayer(luigi, "GIFTS", { hasTimer: false });
        stopGamepad();
    } else {
        makePlayer(mario, "MARIO");
    }

    const p1Trait = mario.traits.get(Player);
    const firstName = playerData.name.split(' ')[0] || 'PLAYER';
    if (!is2P) {
        p1Trait.name = firstName.toUpperCase().slice(0, 10);
    }

    window.mario = mario;

    let inputRouter;
    if (is2P) {
        inputRouter = setupInput2P(window);
        inputRouter.assignSource('p1', mario);
        inputRouter.assignSource('p2', luigi);
    } else {
        inputRouter = setupKeyboard(window);
        inputRouter.addReceiver(mario);
    }

    function getTeamStats() {
        if (!is2P) return mario.traits.get(Player);
        const p1 = mario.traits.get(Player);
        const p2 = luigi.traits.get(Player);
        return {
            name: 'TEAM',
            score: p1.score + p2.score,
            coins: p1.coins + p2.coins,
            lives: Math.max(p1.lives, p2.lives),
            lettersSent: p1.lettersSent + p2.lettersSent,
            world: p1.world,
        };
    }

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

        if (is2P) {
            level.coopMode = true;
        }

        bootstrapPlayer(mario, level);
        if (is2P) {
            bootstrapPlayer(luigi, level);
            luigi.pos.x = mario.pos.x + 16;
            luigi.pos.y = mario.pos.y;
        }

        level.camera.size.x = canvas.width;
        level.camera.size.y = canvas.height - 16;

        level.events.listen(Level.EVENT_TRIGGER, (spec, trigger, touches) => {
            if (spec.type === "goto") {
                for (const _ of findPlayers(touches)) {
                    const stats = getTeamStats();
                    const victoryScene = new VictoryScene(font, stats, {
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
                    const stats = getTeamStats();
                    const victoryScene = new VictoryScene(font, stats, {
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
                        if (is2P) {
                            luigi.pos.copy(mario.pos);
                            luigi.pos.x += 16;
                        }
                        sceneRunner.addScene(level);
                        sceneRunner.runNext();
                    });
                }
            } else {
                level.events.emit(Level.EVENT_COMPLETE);
            }
        });

        const dashboardLayer = is2P
            ? createDashboardLayer(font, mario, luigi)
            : createDashboardLayer(font, mario);
        level.comp.layers.push(dashboardLayer);

        const enemyLabelLayer = createEnemyLabelLayer(level.entities, font);
        level.comp.layers.push(enemyLabelLayer);

        const revealLayer = createDataroRevealLayer(font);
        level.comp.layers.push(revealLayer);

        return level;
    }

    let currentWorldName = null;
    let worldsVisited = 0;
    let isDeathRestart = false;

    function showGameOver() {
        const stats = getTeamStats();
        const score = stats.score;
        const donors = stats.coins;
        const world = stats.world;
        const lettersSent = stats.lettersSent;
        const responseRate = lettersSent > 0
            ? Math.round((donors / lettersSent) * 100)
            : 0;

        const scoreEl = document.getElementById('final-score');
        animateCounter(scoreEl, score);

        document.getElementById('final-donors').textContent = donors;
        document.getElementById('final-letters').textContent = lettersSent;
        document.getElementById('final-response-rate').textContent = responseRate + '%';
        document.getElementById('final-world').textContent = world;
        document.getElementById('gameover-msg').textContent =
            DATARO_MESSAGES[Math.floor(Math.random() * DATARO_MESSAGES.length)];

        const name = playerData.name || 'Anonymous';

        renderLeaderboard(name, score);
        const rankEl = document.getElementById('player-rank');
        if (rankEl) rankEl.textContent = '—';

        showScreen('gameover-screen');

        const touchCtrl = document.getElementById('touch-controls');
        if (touchCtrl) touchCtrl.classList.add('hidden');

        addToLeaderboard(name, score, donors, world, lettersSent, responseRate).then(() => {
            renderLeaderboard(name, score);
            if (rankEl) rankEl.textContent = `#${getPlayerRank(score)}`;
        });

        startGameOverIdleTimer();

        try {
            const leads = JSON.parse(localStorage.getItem('dataro_leads') || '[]');
            const existingIdx = leads.findIndex(l => l.name === playerData.name);
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
            const eased = 1 - Math.pow(1 - progress, 3);
            el.textContent = '$' + Math.floor(target * eased).toLocaleString();
            if (progress < 1) requestAnimationFrame(tick);
        };
        requestAnimationFrame(tick);
    }

    function startDeathAnimation(player, isPit) {
        player.traits.get(Solid).obstructs = false;
        const physics = player.traits.get(Physics);
        const origUpdate = physics.update.bind(physics);
        physics.update = function(entity, gameContext, level) {
            const {deltaTime} = gameContext;
            entity.pos.y += entity.vel.y * deltaTime;
            entity.vel.y += level.gravity * deltaTime;
        };
        if (isPit) {
            player.vel.set(0, player.vel.y);
        } else {
            player.vel.set(0, 0);
            setTimeout(() => player.vel.set(0, -400), 500);
        }
        return origUpdate;
    }

    function restorePlayer(player, origPhysicsUpdate) {
        player.traits.get(Physics).update = origPhysicsUpdate;
        player.traits.get(Solid).obstructs = true;
    }

    function watchForDeath(level) {
        if (is2P) {
            watchForDeath2P(level);
            return;
        }

        let deathHandled = false;
        let pitDeathHandled = false;

        const originalUpdate = level.update.bind(level);
        level.update = function(gameContext) {
            originalUpdate(gameContext);

            const killable = mario.traits.get(Killable);

            if (!killable.dead && !pitDeathHandled) {
                const bottomOfScreen = level.camera.pos.y + level.camera.size.y;
                if (mario.pos.y > bottomOfScreen) {
                    pitDeathHandled = true;
                    if (mario.powered) {
                        mario.powered = false;
                        mario.size.set(14, 16);
                    }
                    mario.invincibleTimer = 0;
                    killable.kill();
                    mario.finalize();
                }
            }

            if (killable.dead && !deathHandled) {
                deathHandled = true;

                const playerTrait = mario.traits.get(Player);
                playerTrait.lives -= 1;

                level.freezeCamera = true;
                level.music.pause();

                const origPhysicsUpdate = startDeathAnimation(mario, pitDeathHandled);

                if (!pitDeathHandled) {
                    level.entities.forEach(entity => {
                        if (entity !== mario) {
                            entity.vel.set(0, 0);
                            entity.update = function() {};
                        }
                    });
                }

                setTimeout(async () => {
                    restorePlayer(mario, origPhysicsUpdate);
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

    function watchForDeath2P(level) {
        const deathState = new Map();
        for (const p of allPlayers) {
            deathState.set(p, { handled: false, pitDeath: false, origPhysics: null });
        }
        let bothDeadResolved = false;

        const originalUpdate = level.update.bind(level);
        level.update = function(gameContext) {
            originalUpdate(gameContext);

            for (const player of allPlayers) {
                const state = deathState.get(player);
                const killable = player.traits.get(Killable);

                if (!killable.dead && !state.pitDeath) {
                    const bottom = level.camera.pos.y + level.camera.size.y;
                    if (player.pos.y > bottom) {
                        state.pitDeath = true;
                        if (player.powered) {
                            player.powered = false;
                            player.size.set(14, 16);
                        }
                        player.invincibleTimer = 0;
                        killable.kill();
                        player.finalize();
                    }
                }

                if (killable.dead && !state.handled) {
                    state.handled = true;
                    const pt = player.traits.get(Player);
                    pt.lives -= 1;

                    const partner = allPlayers.find(p => p !== player);
                    const partnerDead = partner.traits.get(Killable).dead;

                    state.origPhysics = startDeathAnimation(player, state.pitDeath);

                    if (partnerDead) {
                        level.freezeCamera = true;
                        level.music.pause();
                        if (!state.pitDeath) {
                            level.entities.forEach(entity => {
                                if (!allPlayers.includes(entity)) {
                                    entity.vel.set(0, 0);
                                    entity.update = function() {};
                                }
                            });
                        }
                    }

                    const delay = state.pitDeath ? 2000 : 3000;
                    setTimeout(async () => {
                        if (bothDeadResolved) return;

                        restorePlayer(player, state.origPhysics);

                        const partnerAlive = !partner.traits.get(Killable).dead;

                        if (partnerAlive && pt.lives > 0) {
                            killable.revive();
                            player.pos.copy(partner.pos);
                            player.pos.y -= 20;
                            player.vel.set(0, 0);
                            if (player.powered) {
                                player.powered = false;
                                player.size.set(14, 16);
                            }
                            state.handled = false;
                            state.pitDeath = false;
                            if (!level.entities.has(player)) {
                                level.entities.add(player);
                            }
                        } else if (partnerAlive && pt.lives <= 0) {
                            // This player is out of lives, partner continues solo
                        } else if (!partnerAlive && !bothDeadResolved) {
                            bothDeadResolved = true;
                            const anyLives = allPlayers.some(p => p.traits.get(Player).lives > 0);
                            if (anyLives) {
                                level.freezeCamera = false;
                                for (const p of allPlayers) {
                                    if (p.traits.get(Killable).dead && p.traits.get(Player).lives > 0) {
                                        p.traits.get(Killable).revive();
                                        p.vel.set(0, 0);
                                        restorePlayer(p, deathState.get(p).origPhysics || p.traits.get(Physics).update);
                                    }
                                }
                                isDeathRestart = true;
                                await startWorld(currentWorldName);
                            } else {
                                showGameOver();
                            }
                        }
                    }, delay);
                }
            }
        };
    }

    async function startWorld(name) {
        currentWorldName = name;
        worldsVisited++;

        if (worldsVisited > 1 && !isDeathRestart) {
            const cardText = pickNextCard();
            const cardLines = cardText.split('\n');
            const cardScene = new NarrativeScene(font, cardLines, {
                scrollSpeed: 0,
                showPrompt: true,
                holdSeconds: getNarrativeHoldSec(),
            });
            cardScene._skipDelay = 1.5;
            sceneRunner.addSceneManual(cardScene);
            sceneRunner.runNext();

            await new Promise(resolve => {
                cardScene.events.listen(Scene.EVENT_COMPLETE, resolve);
            });
        }

        isDeathRestart = false;

        const level = await setupLevel(name);
        resetPlayer(mario, name);
        if (is2P) {
            resetPlayer(luigi, name);
        }

        const playerProgressLayer = createPlayerProgressLayer(font, level);
        const dashboardLayer = is2P
            ? createDashboardLayer(font, mario, luigi)
            : createDashboardLayer(font, mario);

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

    /* ----------------------------------------
       PAUSE MENU
       ---------------------------------------- */

    function getCurrentLevel() {
        const scene = sceneRunner.scenes[sceneRunner.sceneIndex];
        return (scene instanceof Level) ? scene : null;
    }

    const pauseChime = new Audio('/audio/fx/pause.ogg');
    pauseChime.volume = 0.6;

    function startPauseAudio() {
        try {
            pauseChime.currentTime = 0;
            pauseChime.play().catch(() => {});
        } catch { /* ok */ }
        if (splashMusic) {
            splashMusic.muted = false;
            splashMusic.volume = 0.35;
            splashMusic.play().catch(() => {});
        }
    }

    function stopPauseAudio() {
        if (splashMusic) {
            splashMusic.pause();
            splashMusic.currentTime = 0;
        }
    }

    let pauseMessageInterval = null;
    function startPauseMessageRotation() {
        const el = document.getElementById('pause-marketing-msg');
        if (!el) return;
        let idx = Math.floor(Math.random() * DATARO_MESSAGES.length);
        el.textContent = DATARO_MESSAGES[idx];
        el.style.opacity = '1';
        pauseMessageInterval = setInterval(() => {
            idx = (idx + 1) % DATARO_MESSAGES.length;
            el.style.opacity = '0';
            setTimeout(() => {
                el.textContent = DATARO_MESSAGES[idx];
                el.style.opacity = '1';
            }, 350);
        }, 4500);
    }

    function stopPauseMessageRotation() {
        if (pauseMessageInterval !== null) {
            clearInterval(pauseMessageInterval);
            pauseMessageInterval = null;
        }
    }

    function pauseGame() {
        if (timer.paused) return;
        timer.pause();
        const level = getCurrentLevel();
        if (level) level.music.pause();
        showScreen('pause-screen');
        startPauseAudio();
        startPauseMessageRotation();
    }

    function resumeGame() {
        if (!timer.paused) return;
        stopPauseMessageRotation();
        stopPauseAudio();
        hideAllOverlays();
        const level = getCurrentLevel();
        if (level) level.music.playTheme();
        timer.resume();
    }

    function exitToSplash() {
        window.location.reload();
    }

    window.addEventListener('keydown', (e) => {
        if (e.code !== 'Escape') return;

        const activeOverlay = document.querySelector('.overlay-screen.active');

        if (activeOverlay && activeOverlay.id === 'pause-screen') {
            e.preventDefault();
            resumeGame();
            return;
        }

        if (activeOverlay) return;

        e.preventDefault();
        pauseGame();
    });

    document.getElementById('btn-resume').addEventListener('click', resumeGame);
    document.getElementById('btn-exit').addEventListener('click', exitToSplash);

    const openingLines = pickRandom(OPENING_NARRATIVES);
    const narrativeScene = new NarrativeScene(font, openingLines, {
        title: 'THE FUNDRAISER',
        holdSeconds: getNarrativeHoldSec(),
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

/* ============================================
   ADMIN CONFIG (aspect ratio + signup fields)
   ============================================ */

const ADMIN_DEFAULTS = {
    mode: 'event',
    fields: { firstName: true, lastName: false, org: false, email: false },
    aspectRatio: '16-9',
    twoPlayerEnabled: true,
    fiestaEnabled: true,
};

const UTM_BY_MODE = {
    event:   'https://dataro.io/?utm_source=super_datario&utm_medium=offline&utm_campaign=event-super-datario-global-2026&utm_content=game_cta',
    digital: 'https://dataro.io/?utm_source=super_datario&utm_medium=referral&utm_campaign=event-super-datario-global-2026&utm_content=game_cta',
};

function readCachedAdminConfig() {
    try {
        const raw = JSON.parse(localStorage.getItem('dataro_admin_config') || '{}');
        return {
            mode: raw.mode === 'digital' ? 'digital' : 'event',
            fields: { ...ADMIN_DEFAULTS.fields, ...(raw.fields || {}) },
            aspectRatio: raw.aspectRatio === '4-3' ? '4-3' : '16-9',
            twoPlayerEnabled: raw.twoPlayerEnabled !== false,
            fiestaEnabled: raw.fiestaEnabled !== false,
        };
    } catch {
        return { ...ADMIN_DEFAULTS, fields: { ...ADMIN_DEFAULTS.fields } };
    }
}

let __ADMIN = readCachedAdminConfig();

function applyAdminConfig(cfg) {
    __ADMIN = cfg;
    if (cfg.aspectRatio === '4-3') {
        canvas.width = 256;
        canvas.className = 'aspect-4-3';
    } else {
        canvas.width = 432;
        canvas.className = 'aspect-16-9';
    }

    // Sign-up form field visibility
    const showField = (id, on) => {
        const el = document.getElementById(id);
        if (el) el.style.display = on ? '' : 'none';
    };
    const fields = cfg.fields || ADMIN_DEFAULTS.fields;
    showField('group-firstname', fields.firstName);
    showField('group-lastname',  fields.lastName);
    showField('group-org',       fields.org);
    showField('group-email',     fields.email);
    const nameEl  = document.getElementById('player-name');
    const emailEl = document.getElementById('player-email');
    if (nameEl)  nameEl.required  = !!fields.firstName;
    if (emailEl) emailEl.required = !!fields.email;

    // Two Player Mode gate: hide tutorial mode-toggle when disabled, and
    // force the active mode back to 1P so any prior selection is cleared.
    const modeToggleEl = document.querySelector('.mode-toggle');
    if (modeToggleEl) {
        modeToggleEl.style.display = cfg.twoPlayerEnabled === false ? 'none' : '';
    }
    if (cfg.twoPlayerEnabled === false) {
        const m1 = document.getElementById('mode-1p');
        const m2 = document.getElementById('mode-2p');
        if (m1) m1.classList.add('active');
        if (m2) m2.classList.remove('active');
        const p2Controls = document.getElementById('p2-controls-info');
        if (p2Controls) p2Controls.style.display = 'none';
        window.__teamModeActive = false;
    }

    // Fiesta Mode gate: hide pause-menu Fiesta button, and clear any active
    // fiesta state. Konami listener checks window.__ADMIN.fiestaEnabled at
    // keypress time so it'll early-return when disabled.
    window.__ADMIN = cfg;
    const fiestaBtn = document.getElementById('btn-fiesta');
    if (fiestaBtn) fiestaBtn.style.display = cfg.fiestaEnabled === false ? 'none' : '';
    if (cfg.fiestaEnabled === false) {
        document.body.classList.remove('fiesta-mode');
        try { localStorage.setItem('dataro.fiestaMode', 'off'); } catch {}
    }

    // Mode-driven behaviour
    const mode = cfg.mode === 'digital' ? 'digital' : 'event';
    const utm = UTM_BY_MODE[mode];
    const dataroBtn = document.getElementById('btn-dataro');
    if (dataroBtn) dataroBtn.href = utm;
    const pauseDataroBtn = document.getElementById('btn-pause-dataro');
    if (pauseDataroBtn) pauseDataroBtn.href = utm;
    const prizePill = document.querySelector('.conf-badge');
    if (prizePill) prizePill.style.display = mode === 'digital' ? 'none' : '';

    // In DIGITAL mode every Dataro logo on the page links to the CTA URL;
    // in EVENT mode the logos are decorative (kiosk has no browser to click).
    document.querySelectorAll('.dataro-badge').forEach(badge => {
        badge.onclick = (mode === 'digital')
            ? () => window.open(utm, '_blank', 'noopener')
            : null;
        badge.style.cursor = mode === 'digital' ? 'pointer' : '';
        badge.setAttribute('role', mode === 'digital' ? 'link' : 'img');
    });
}

applyAdminConfig(__ADMIN);

fetch('/api/admin-settings').then(r => r.ok ? r.json() : null).then(cfg => {
    if (!cfg) return;
    localStorage.setItem('dataro_admin_config', JSON.stringify(cfg));
    applyAdminConfig(cfg);
}).catch(() => {});

// Init splash effects
initParticles();
startTaglineRotation();

// Unmute the muted-autoplay home screen music on the first user gesture
// (capture phase, so it runs before any click handler that transitions screens).
_splashGestureEvents.forEach(evt =>
    window.addEventListener(evt, _activateSplashMusic, true));

// Start listening for USB gamepads (dispatches synthetic keyboard events)
startGamepad();

// Update controller detection display
function updateControllerDetect() {
    const el = document.getElementById('controller-detect');
    if (!el) return;
    const gamepads = navigator.getGamepads ? navigator.getGamepads() : [];
    const connected = [...gamepads].filter(g => g && g.connected);
    if (connected.length === 0) {
        el.textContent = 'No controllers detected';
    } else if (connected.length === 1) {
        el.textContent = '1 controller connected';
    } else {
        el.textContent = connected.length + ' controllers connected';
    }
}
window.addEventListener('gamepadconnected', updateControllerDetect);
window.addEventListener('gamepaddisconnected', updateControllerDetect);
setInterval(updateControllerDetect, 2000);

// Pre-fetch server leaderboard, then re-render splash top 5 with fresh data
fetchLeaderboard().then(() => renderLeaderboard('', 0, 'splash-leaderboard-list', 5));

// PHASE 1: Splash -> Signup (skip when no fields are enabled)
document.getElementById('btn-play').addEventListener('click', () => {
    const fields = (__ADMIN && __ADMIN.fields) || ADMIN_DEFAULTS.fields;
    const anyField = Object.values(fields).some(Boolean);
    if (anyField) {
        showScreen('signup-screen');
    } else {
        const teamMode = window.gameMode === '2p';
        playerData.name = teamMode ? 'PLAYER 1' : 'PLAYER';
        playerData.lastName = '';
        playerData.org = '';
        playerData.email = '';
        showScreen('tutorial-screen');
    }
});

// PHASE 2: Signup -> Tutorial
document.getElementById('signup-form').addEventListener('submit', (e) => {
    e.preventDefault();

    const fields = (__ADMIN && __ADMIN.fields) || ADMIN_DEFAULTS.fields;
    const first = document.getElementById('player-name').value.trim();
    const last  = document.getElementById('player-lastname').value.trim();
    const org   = document.getElementById('player-org').value.trim();
    const email = document.getElementById('player-email').value.trim();

    // Respect admin toggles: any enabled field gets required-style validation
    if (fields.firstName && !first) {
        document.getElementById('player-name').focus();
        return;
    }
    if (fields.email && !email) {
        document.getElementById('player-email').focus();
        return;
    }

    playerData.name = first || 'PLAYER';
    playerData.lastName = last;
    playerData.org = org;
    playerData.email = email;

    try {
        const leads = JSON.parse(localStorage.getItem('dataro_leads') || '[]');
        leads.push({
            name: playerData.name,
            lastName: playerData.lastName,
            org: playerData.org,
            email: playerData.email,
            timestamp: new Date().toISOString(),
            plays: 1,
        });
        localStorage.setItem('dataro_leads', JSON.stringify(leads));
    } catch { /* localStorage not available */ }

    showScreen('tutorial-screen');
});

// Mode toggle
window.gameMode = '1p';
const modeToggle1P = document.getElementById('mode-1p');
const modeToggle2P = document.getElementById('mode-2p');
if (modeToggle1P && modeToggle2P) {
    modeToggle1P.addEventListener('click', () => {
        window.gameMode = '1p';
        modeToggle1P.classList.add('active');
        modeToggle2P.classList.remove('active');
        const p2Controls = document.getElementById('p2-controls-info');
        if (p2Controls) p2Controls.style.display = 'none';
    });
    modeToggle2P.addEventListener('click', () => {
        window.gameMode = '2p';
        modeToggle2P.classList.add('active');
        modeToggle1P.classList.remove('active');
        const p2Controls = document.getElementById('p2-controls-info');
        if (p2Controls) p2Controls.style.display = '';
    });
}

// PHASE 3: Tutorial -> Game
document.getElementById('btn-go').addEventListener('click', () => {
    hideAllOverlays();
    stopSplashMusic();
    setupTouchControls();
    main(canvas);
});

// PHASE 4: Retry
document.getElementById('btn-retry').addEventListener('click', () => {
    // Quick reload for clean state
    window.location.reload();
});

// Pre-render leaderboards (splash top 5 + full game-over list) from cached local data
renderLeaderboard('', 0);
renderLeaderboard('', 0, 'splash-leaderboard-list', 5);

// Prevent space bar from scrolling the page at any point
document.addEventListener('keydown', (e) => {
    if (e.code === 'Space' && e.target === document.body) {
        e.preventDefault();
    }
});

// Arrow Up/Down on overlay screens moves focus through the tab order
document.addEventListener('keydown', (e) => {
    if (e.code !== 'ArrowUp' && e.code !== 'ArrowDown') return;
    const activeOverlay = document.querySelector('.overlay-screen.active');
    if (!activeOverlay) return;
    if (moveOverlayFocus(e.code === 'ArrowDown' ? 1 : -1)) {
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
        if (last.name) document.getElementById('player-name').value = last.name;
        if (last.org)  document.getElementById('player-org').value  = last.org;
    }
} catch { /* ok */ }
