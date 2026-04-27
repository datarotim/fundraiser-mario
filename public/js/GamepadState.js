const AXIS_DEADZONE = 0.5;

export default class GamepadState {
    constructor(padIndex = 0) {
        this.padIndex = padIndex;
        this.callbacks = new Map();
        this.prevState = new Map();
    }

    addMapping(buttonIndex, callback) {
        this.callbacks.set(buttonIndex, callback);
    }

    poll() {
        const gamepads = navigator.getGamepads();
        const gp = gamepads ? gamepads[this.padIndex] : null;
        if (!gp || !gp.connected) return;

        for (const [idx, callback] of this.callbacks) {
            const btn = gp.buttons[idx];
            if (!btn) continue;
            const key = 'b' + idx;
            const was = this.prevState.get(key) || false;
            if (btn.pressed !== was) {
                this.prevState.set(key, btn.pressed);
                callback(btn.pressed ? 1 : 0);
            }
        }

        const ax = gp.axes[0] ?? 0;
        const ay = gp.axes[1] ?? 0;

        this._checkAxis('axLeft', ax < -AXIS_DEADZONE, 14);
        this._checkAxis('axRight', ax > AXIS_DEADZONE, 15);
        this._checkAxis('axUp', ay < -AXIS_DEADZONE, 12);
        this._checkAxis('axDown', ay > AXIS_DEADZONE, 13);
    }

    _checkAxis(key, pressed, buttonIdx) {
        const was = this.prevState.get(key) || false;
        if (pressed !== was) {
            this.prevState.set(key, pressed);
            const cb = this.callbacks.get(buttonIdx);
            if (cb) cb(pressed ? 1 : 0);
        }
    }

    isConnected() {
        const gamepads = navigator.getGamepads();
        const gp = gamepads ? gamepads[this.padIndex] : null;
        return gp && gp.connected;
    }
}
