class MethodNotImplementedError extends Error {
    constructor(baseClass, method) {
        super(`Method '${method}' must be implemented by child class when extending from ${baseClass}`);
    }
}

export { MethodNotImplementedError }