/**
 * js/utils.js
 * Utility functions for the Pixel Art Item Generator
 */

/**
 * Returns a random integer between min (inclusive) and max (inclusive).
 * @param {number} min - The minimum value.
 * @param {number} max - The maximum value.
 * @returns {number} A random integer within the specified range.
 */
export function getRandomInt(min, max) {
    min = Math.ceil(min);
    max = Math.floor(max);
    return Math.floor(Math.random() * (max - min + 1)) + min;
}

/**
 * Returns a random element from an array.
 * @param {Array<any>} array - The array to pick an element from.
 * @returns {any} A random element from the array, or undefined if the array is empty.
 */
export function getRandomElement(array) {
    if (!array || array.length === 0) {
        return undefined;
    }
    return array[getRandomInt(0, array.length - 1)];
}

/**
 * Returns a random float between min (inclusive) and max (exclusive).
 * @param {number} min - The minimum value.
 * @param {number} max - The maximum value.
 * @returns {number} A random float within the specified range.
 */
export function getRandomInRange(min, max) {
    return Math.random() * (max - min) + min;
}

/**
 * Draws a scaled rectangle on the canvas.
 * This is useful for drawing logical pixels as larger blocks.
 * @param {CanvasRenderingContext2D} ctx - The canvas 2D rendering context.
 * @param {number} logicalX - The logical X coordinate of the top-left corner.
 * @param {number} logicalY - The logical Y coordinate of the top-left corner.
 * @param {number} logicalWidth - The logical width of the rectangle.
 * @param {number} logicalHeight - The logical height of the rectangle.
 * @param {string} color - The fill color of the rectangle.
 * @param {number} scaleFactor - The factor by which to scale the logical units.
 */
export function drawScaledRect(ctx, logicalX, logicalY, logicalWidth, logicalHeight, color, scaleFactor) {
    if (!ctx) {
        console.error("Canvas context is not provided to drawScaledRect.");
        return;
    }
    ctx.fillStyle = color;
    ctx.fillRect(
        logicalX * scaleFactor,
        logicalY * scaleFactor,
        logicalWidth * scaleFactor,
        logicalHeight * scaleFactor
    );
}

// You can add more utility functions here as needed, for example:
// - Color manipulation functions (e.g., lighten, darken)
// - Seedable random number generator (if reproducibility becomes critical)

console.log("js/utils.js loaded with getRandomInRange.");
