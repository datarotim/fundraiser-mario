export default class InputRouter {
    constructor() {
        this.receivers = new Set();
        this.sourceMap = new Map();
    }

    addReceiver(receiver) {
        this.receivers.add(receiver);
    }

    dropReceiver(receiver) {
        this.receivers.delete(receiver);
    }

    assignSource(sourceId, receiver) {
        this.sourceMap.set(sourceId, receiver);
    }

    route(routeInput, sourceId) {
        if (sourceId !== undefined && this.sourceMap.size > 0) {
            const receiver = this.sourceMap.get(sourceId);
            if (receiver) {
                routeInput(receiver);
            }
        } else {
            for (const receiver of this.receivers) {
                routeInput(receiver);
            }
        }
    }
}
