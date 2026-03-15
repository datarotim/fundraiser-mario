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
import SceneRunner from './SceneRunner.js';
import Scene from './Scene.js';
import TimedScene from './TimedScene.js';
import NarrativeScene from './NarrativeScene.js';
import VictoryScene from './VictoryScene.js';
import { connectEntity } from './traits/Pipe.js';
import { OPENING_NARRATIVES, pickRandom, pickNextCard } from './narrative.js';

async function main(canvas) {
    const videoContext = canvas.getContext('2d');
    const audioContext = new AudioContext();

    const [entityFactory, font] = await Promise.all([
        loadEntities(audioContext),
        loadFont(),
    ]);


    const loadLevel = await createLevelLoader(entityFactory);

    const sceneRunner = new SceneRunner();

    const mario = entityFactory.mario();
    makePlayer(mario, "MARIO");

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
            }
        });

        level.events.listen(Pipe.EVENT_PIPE_COMPLETE, async pipe => {
            if (pipe.props.goesTo) {
                const nextLevel = await setupLevel(pipe.props.goesTo.name);
                sceneRunner.addScene(nextLevel);
                sceneRunner.runNext();
                if (pipe.props.backTo) {
                    console.log(pipe.props);
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

        const revealLayer = createDataroRevealLayer(font);
        level.comp.layers.push(revealLayer);

        return level;
    }

    let currentWorldName = null;
    let deathHandled = false;
    let worldsVisited = 0;
    let isDeathRestart = false;

    function watchForDeath(level) {
        deathHandled = false;

        const originalUpdate = level.update.bind(level);
        level.update = function(gameContext) {
            originalUpdate(gameContext);

            const killable = mario.traits.get(Killable);
            if (killable.dead && !deathHandled) {
                deathHandled = true;

                const playerTrait = mario.traits.get(Player);
                playerTrait.lives -= 1;

                // Death animation: disable tile collisions so Mario falls through
                const physics = mario.traits.get(Physics);
                const origPhysicsUpdate = physics.update.bind(physics);
                physics.update = function(entity, gameContext, level) {
                    const {deltaTime} = gameContext;
                    entity.pos.x += entity.vel.x * deltaTime;
                    entity.pos.y += entity.vel.y * deltaTime;
                    entity.vel.y += level.gravity * deltaTime;
                };
                mario.traits.get(Solid).obstructs = false;

                // Launch upward then fall through floor
                mario.vel.set(0, -400);

                // After 3 seconds, respawn or let game over show
                setTimeout(async () => {
                    // Restore physics
                    physics.update = origPhysicsUpdate;
                    mario.traits.get(Solid).obstructs = true;

                    if (playerTrait.lives > 0) {
                        killable.revive();
                        mario.vel.set(0, 0);
                        isDeathRestart = true;
                        await startWorld(currentWorldName);
                    }
                    // If lives <= 0, game over overlay in dashboard handles it
                }, 3000);
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
    }

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

const canvas = document.getElementById('screen');

const start = () => {
    window.removeEventListener('click', start);
    const overlay = document.getElementById('start-overlay');
    if (overlay) overlay.remove();
    main(canvas);
};

window.addEventListener('click', start);
