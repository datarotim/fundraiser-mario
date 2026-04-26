// USB SNES-style gamepad support.
// Polls navigator.getGamepads() and dispatches synthetic KeyboardEvents so
// the existing keyboard pipeline (gameplay input, overlay shortcuts,
// narrative "any key" skip) works unchanged.

const BUTTON_MAP = {
    0: { code: 'KeyZ',      key: 'z' },          // B  — throw letter
    1: { code: 'ShiftLeft', key: 'Shift' },      // A  — run (also counts as "any key")
    2: { code: 'Space',     key: ' ' },          // Y  — jump
    3: { code: 'ShiftLeft', key: 'Shift' },      // X  — run
    8: { code: 'Enter',     key: 'Enter' },      // Select — confirm
    9: { code: 'Escape',    key: 'Escape' },     // Start  — pause
    12: { code: 'ArrowUp',    key: 'ArrowUp' },
    13: { code: 'ArrowDown',  key: 'ArrowDown' },
    14: { code: 'ArrowLeft',  key: 'ArrowLeft' },
    15: { code: 'ArrowRight', key: 'ArrowRight' },
};

const AXIS_DEADZONE = 0.5;

function dispatchKey(type, mapping) {
    window.dispatchEvent(new KeyboardEvent(type, {
        code: mapping.code,
        key: mapping.key,
        bubbles: true,
    }));
}

export function startGamepad() {
    const prev = new Map();

    function setState(id, pressed, mapping) {
        const was = prev.get(id) || false;
        if (pressed === was) return;
        prev.set(id, pressed);
        if (mapping) dispatchKey(pressed ? 'keydown' : 'keyup', mapping);
    }

    function poll() {
        const gp = (navigator.getGamepads() || []).find(g => g && g.connected);
        if (gp) {
            for (const [idxStr, mapping] of Object.entries(BUTTON_MAP)) {
                const idx = Number(idxStr);
                const btn = gp.buttons[idx];
                if (btn) setState(`b${idx}`, btn.pressed, mapping);
            }
            // Axes fallback for controllers that report D-pad as analog axes
            const ax = gp.axes[0] ?? 0;
            const ay = gp.axes[1] ?? 0;
            setState('axLeft',  ax < -AXIS_DEADZONE, BUTTON_MAP[14]);
            setState('axRight', ax >  AXIS_DEADZONE, BUTTON_MAP[15]);
            setState('axUp',    ay < -AXIS_DEADZONE, BUTTON_MAP[12]);
            setState('axDown',  ay >  AXIS_DEADZONE, BUTTON_MAP[13]);
        }
        requestAnimationFrame(poll);
    }

    window.addEventListener('gamepadconnected', (e) => {
        console.log('[Gamepad] Connected:', e.gamepad.id, 'mapping:', e.gamepad.mapping);
    });
    requestAnimationFrame(poll);
}
