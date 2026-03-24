export const createDebugLogger = (isProd) => (...args) => {
    if (!isProd) {
        console.debug(...args);
    }
}