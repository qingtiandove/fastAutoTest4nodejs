"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
class FastAutoTestError extends Error {
    constructor(err) {
        if (err instanceof Object) {
            super(err.message);
            this.message = err.message;
            this.stack = err.stack;
        }
        else {
            super(err);
            this.message = err;
        }
        this.name = this.constructor.name;
    }
}
exports.FastAutoTestError = FastAutoTestError;
class ElementNotFoundError extends FastAutoTestError {
}
exports.ElementNotFoundError = ElementNotFoundError;
