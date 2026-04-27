import Keyboard from './KeyboardState.js';
import InputRouter from './InputRouter.js';
import GamepadState from './GamepadState.js';
import Jump from './traits/Jump.js';
import PipeTraveller from './traits/PipeTraveller.js';
import Go from './traits/Go.js';
import Thrower from './traits/Thrower.js';

const KEYMAP = {
    UP: 'ArrowUp',
    DOWN: 'ArrowDown',
    LEFT: 'ArrowLeft',
    RIGHT: 'ArrowRight',
    A: "Space",
    B: "ShiftLeft",
};

export function setupKeyboard(window) {
    const input = new Keyboard();
    const router = new InputRouter();

    input.listenTo(window);

    input.addMapping(KEYMAP.A, keyState => {
        if (keyState) {
            router.route(entity => entity.traits.get(Jump).start());
        } else {
            router.route(entity => entity.traits.get(Jump).cancel());
        }
    });

    input.addMapping(KEYMAP.B, keyState => {
        router.route(entity => entity.turbo(keyState));
    });

    input.addMapping(KEYMAP.UP, keyState => {
        router.route(entity => {
            entity.traits.get(PipeTraveller).direction.y += keyState ? -1 : 1;
        });
    });

    input.addMapping(KEYMAP.DOWN, keyState => {
        router.route(entity => {
            entity.traits.get(PipeTraveller).direction.y += keyState ? 1 : -1;
        });
    });

    input.addMapping(KEYMAP.RIGHT, keyState => {
        router.route(entity => {
            entity.traits.get(Go).dir += keyState ? 1 : -1;
            entity.traits.get(PipeTraveller).direction.x += keyState ? 1 : -1;
        });
    });

    input.addMapping(KEYMAP.LEFT, keyState => {
        router.route(entity => {
            entity.traits.get(Go).dir += keyState ? -1 : 1;
            entity.traits.get(PipeTraveller).direction.x += keyState ? -1 : 1;
        });
    });

    input.addMapping('KeyZ', keyState => {
        if (keyState) {
            router.route(entity => {
                if (entity.traits.has(Thrower)) {
                    entity.traits.get(Thrower).throw();
                }
            });
        }
    });

    return router;
}

const P1_KEYS = {
    UP: 'ArrowUp', DOWN: 'ArrowDown', LEFT: 'ArrowLeft', RIGHT: 'ArrowRight',
    JUMP: 'Space', RUN: 'ShiftLeft', THROW: 'KeyZ',
};

const P2_KEYS = {
    UP: 'KeyW', DOWN: 'KeyS', LEFT: 'KeyA', RIGHT: 'KeyD',
    JUMP: 'KeyE', RUN: 'KeyQ', THROW: 'KeyF',
};

function wirePlayerKeys(keyboard, router, keymap, sourceId) {
    keyboard.addMapping(keymap.JUMP, keyState => {
        if (keyState) {
            router.route(entity => entity.traits.get(Jump).start(), sourceId);
        } else {
            router.route(entity => entity.traits.get(Jump).cancel(), sourceId);
        }
    });

    keyboard.addMapping(keymap.RUN, keyState => {
        router.route(entity => entity.turbo(keyState), sourceId);
    });

    keyboard.addMapping(keymap.UP, keyState => {
        router.route(entity => {
            entity.traits.get(PipeTraveller).direction.y += keyState ? -1 : 1;
        }, sourceId);
    });

    keyboard.addMapping(keymap.DOWN, keyState => {
        router.route(entity => {
            entity.traits.get(PipeTraveller).direction.y += keyState ? 1 : -1;
        }, sourceId);
    });

    keyboard.addMapping(keymap.RIGHT, keyState => {
        router.route(entity => {
            entity.traits.get(Go).dir += keyState ? 1 : -1;
            entity.traits.get(PipeTraveller).direction.x += keyState ? 1 : -1;
        }, sourceId);
    });

    keyboard.addMapping(keymap.LEFT, keyState => {
        router.route(entity => {
            entity.traits.get(Go).dir += keyState ? -1 : 1;
            entity.traits.get(PipeTraveller).direction.x += keyState ? -1 : 1;
        }, sourceId);
    });

    keyboard.addMapping(keymap.THROW, keyState => {
        if (keyState) {
            router.route(entity => {
                if (entity.traits.has(Thrower)) {
                    entity.traits.get(Thrower).throw();
                }
            }, sourceId);
        }
    });
}

function wireGamepad(gp, router, sourceId) {
    // Y = Jump (button 2)
    gp.addMapping(2, keyState => {
        if (keyState) {
            router.route(entity => entity.traits.get(Jump).start(), sourceId);
        } else {
            router.route(entity => entity.traits.get(Jump).cancel(), sourceId);
        }
    });

    // A = Run (button 1)
    gp.addMapping(1, keyState => {
        router.route(entity => entity.turbo(keyState), sourceId);
    });

    // B = Throw (button 0)
    gp.addMapping(0, keyState => {
        if (keyState) {
            router.route(entity => {
                if (entity.traits.has(Thrower)) entity.traits.get(Thrower).throw();
            }, sourceId);
        }
    });

    // X = Throw (button 3)
    gp.addMapping(3, keyState => {
        if (keyState) {
            router.route(entity => {
                if (entity.traits.has(Thrower)) entity.traits.get(Thrower).throw();
            }, sourceId);
        }
    });

    // D-pad Up (button 12)
    gp.addMapping(12, keyState => {
        router.route(entity => {
            entity.traits.get(PipeTraveller).direction.y += keyState ? -1 : 1;
        }, sourceId);
    });

    // D-pad Down (button 13)
    gp.addMapping(13, keyState => {
        router.route(entity => {
            entity.traits.get(PipeTraveller).direction.y += keyState ? 1 : -1;
        }, sourceId);
    });

    // D-pad Left (button 14)
    gp.addMapping(14, keyState => {
        router.route(entity => {
            entity.traits.get(Go).dir += keyState ? -1 : 1;
            entity.traits.get(PipeTraveller).direction.x += keyState ? -1 : 1;
        }, sourceId);
    });

    // D-pad Right (button 15)
    gp.addMapping(15, keyState => {
        router.route(entity => {
            entity.traits.get(Go).dir += keyState ? 1 : -1;
            entity.traits.get(PipeTraveller).direction.x += keyState ? 1 : -1;
        }, sourceId);
    });
}

export function setupInput2P(window) {
    const router = new InputRouter();

    const kb1 = new Keyboard();
    kb1.listenTo(window);
    wirePlayerKeys(kb1, router, P1_KEYS, 'p1');

    const kb2 = new Keyboard();
    kb2.listenTo(window);
    wirePlayerKeys(kb2, router, P2_KEYS, 'p2');

    const gp0 = new GamepadState(0);
    wireGamepad(gp0, router, 'p1');

    const gp1 = new GamepadState(1);
    wireGamepad(gp1, router, 'p2');

    function pollGamepads() {
        gp0.poll();
        gp1.poll();
        requestAnimationFrame(pollGamepads);
    }
    requestAnimationFrame(pollGamepads);

    // Start/Select buttons dispatch synthetic events for pause/overlay navigation
    const uiGp0 = new GamepadState(0);
    const uiGp1 = new GamepadState(1);

    uiGp0.addMapping(9, keyState => {
        if (keyState) window.dispatchEvent(new KeyboardEvent('keydown', { code: 'Escape', key: 'Escape', bubbles: true }));
    });
    uiGp0.addMapping(8, keyState => {
        if (keyState) window.dispatchEvent(new KeyboardEvent('keydown', { code: 'Enter', key: 'Enter', bubbles: true }));
    });
    uiGp1.addMapping(9, keyState => {
        if (keyState) window.dispatchEvent(new KeyboardEvent('keydown', { code: 'Escape', key: 'Escape', bubbles: true }));
    });
    uiGp1.addMapping(8, keyState => {
        if (keyState) window.dispatchEvent(new KeyboardEvent('keydown', { code: 'Enter', key: 'Enter', bubbles: true }));
    });

    function pollUIGamepads() {
        uiGp0.poll();
        uiGp1.poll();
        requestAnimationFrame(pollUIGamepads);
    }
    requestAnimationFrame(pollUIGamepads);

    return router;
}
