/**
 * js/generators/boots_generator.js
 * Contains the logic for procedurally generating boots.
 */

// MODIFIED: Added getRandomInRange to the import from utils.js
import { getRandomInt, getRandomElement, drawScaledRect, getRandomInRange } from '../utils.js';
import { getPalette } from '../palettes/material_palettes.js';

// --- Constants specific to boot generation or drawing ---
const SINGLE_BOOT_LOGICAL_WIDTH = 22;
const SINGLE_BOOT_LOGICAL_HEIGHT = 36;
const DISPLAY_SCALE = 4;

const PAIR_SPACING = 2;
const CONTENT_LOGICAL_WIDTH = (SINGLE_BOOT_LOGICAL_WIDTH * 2) + PAIR_SPACING;
const CANVAS_LOGICAL_WIDTH = CONTENT_LOGICAL_WIDTH + 4;

const CANVAS_WIDTH = CANVAS_LOGICAL_WIDTH * DISPLAY_SCALE;
const CANVAS_HEIGHT = SINGLE_BOOT_LOGICAL_HEIGHT * DISPLAY_SCALE;
const CANVAS_PADDING_Y = 2;

// --- Internal helper functions for drawing boot components ---

/**
 * Draws a single boot with a clearer side-profile appearance.
 * Heels point inwards, toes point outwards.
 * @param {CanvasRenderingContext2D} ctx - The context of the offscreen canvas.
 * @param {object} bootDetails - Properties like height, style, palette.
 * @param {number} bootAreaStartX - Logical X top-left corner for THIS boot's allocated drawing area.
 * @param {number} bootAreaTopY - Logical Y top for THIS boot's allocated drawing area.
 * @param {boolean} isMirrored - True if this is the right boot (toe points right on screen, heel left).
 */
function drawSingleBoot(ctx, bootDetails, bootAreaStartX, bootAreaTopY, isMirrored = false) {
    const { bootType, mainPalette, solePalette, cuffPalette,
            footTotalLength,
            footHeight, legHeight, legInitialWidth, legTopWidth,
            heelExtensionLength, toeExtensionLength,
            hasCuff, toeShape,
            // NEW: Heel and Buckle details
            heelStyle, heelHeightActual,
            hasBuckles, numBuckles, bucklePalette
        } = bootDetails;

    const soleVisualHeight = Math.max(1, Math.floor(footHeight / 6)) + 1; // How thick the sole appears
    const footUpperHeight = footHeight - soleVisualHeight;

    const legShaftDrawingCenterX = bootAreaStartX + Math.floor(SINGLE_BOOT_LOGICAL_WIDTH / 2);

    // --- Leg Part ---
    const ankleY = bootAreaTopY + legHeight;
    for (let i = 0; i < legHeight; i++) {
        const y = bootAreaTopY + i;
        const taperProgress = (legHeight <= 1) ? 0 : i / (legHeight - 1);
        const currentLegWidth = Math.max(1, Math.round(legTopWidth + (legInitialWidth - legTopWidth) * (1 - taperProgress)));
        const legSegX = legShaftDrawingCenterX - Math.floor(currentLegWidth / 2);

        drawScaledRect(ctx, legSegX, y, currentLegWidth, 1, mainPalette.base, DISPLAY_SCALE);
        if (currentLegWidth > 1) {
            const highlightX = isMirrored ? legSegX + currentLegWidth - 1 : legSegX;
            const shadowX = isMirrored ? legSegX : legSegX + currentLegWidth - 1;
            drawScaledRect(ctx, highlightX, y, 1, 1, mainPalette.highlight, DISPLAY_SCALE);
            drawScaledRect(ctx, shadowX, y, 1, 1, mainPalette.shadow, DISPLAY_SCALE);
        }
    }

    // --- Foot Part ---
    const instepLeftX = legShaftDrawingCenterX - Math.floor(legInitialWidth / 2);
    const instepRightX = legShaftDrawingCenterX + Math.ceil(legInitialWidth / 2) - 1;

    let absHeelTipX, absToeTipX;
    if (!isMirrored) { // Left Boot (heel right/inward, toe left/outward)
        absHeelTipX = instepRightX + heelExtensionLength;
        absToeTipX = instepLeftX - toeExtensionLength;
    } else { // Right Boot (heel left/inward, toe right/outward)
        absHeelTipX = instepLeftX - heelExtensionLength;
        absToeTipX = instepRightX + toeExtensionLength;
    }

    // --- Sole & Heel ---
    const soleMinXOverall = Math.min(absHeelTipX, absToeTipX);
    const soleMaxXOverall = Math.max(absHeelTipX, absToeTipX);
    const soleLengthOverall = soleMaxXOverall - soleMinXOverall + 1;
    const soleDrawY = ankleY + footUpperHeight;

    if (solePalette) {
        // Draw main sole part (excluding heel block if present)
        let mainSoleStartX = soleMinXOverall;
        let mainSoleLength = soleLengthOverall;

        if (heelStyle !== 'none' && heelHeightActual > 0) {
            const heelBlockWidth = Math.max(2, Math.floor(legInitialWidth * 0.8)); // Heel block width relative to instep
            let heelBlockX;

            if (!isMirrored) { // Left boot, heel is on the right
                heelBlockX = absHeelTipX - heelBlockWidth + 1;
                mainSoleLength = heelBlockX - soleMinXOverall; // Main sole stops before heel
            } else { // Right boot, heel is on the left
                heelBlockX = absHeelTipX;
                mainSoleStartX = heelBlockX + heelBlockWidth; // Main sole starts after heel
                mainSoleLength = soleMaxXOverall - mainSoleStartX + 1;
            }
            mainSoleLength = Math.max(0, mainSoleLength);


            // Draw Heel Block
            const heelTopY = soleDrawY + soleVisualHeight - heelHeightActual; // Heel sits under the main sole line
            drawScaledRect(ctx, heelBlockX, heelTopY, heelBlockWidth, heelHeightActual, solePalette.base, DISPLAY_SCALE);
            drawScaledRect(ctx, heelBlockX, heelTopY + heelHeightActual - 1, heelBlockWidth, 1, solePalette.shadow, DISPLAY_SCALE); // Bottom of heel
            if (heelBlockWidth > 1) {
                drawScaledRect(ctx, isMirrored ? heelBlockX + heelBlockWidth -1 : heelBlockX, heelTopY, 1, heelHeightActual, solePalette.highlight, DISPLAY_SCALE); // Outer edge
                drawScaledRect(ctx, isMirrored ? heelBlockX : heelBlockX + heelBlockWidth -1, heelTopY, 1, heelHeightActual, solePalette.shadow, DISPLAY_SCALE); // Inner edge
            }
        }

        // Draw the main part of the sole
        if (mainSoleLength > 0) {
            drawScaledRect(ctx, mainSoleStartX, soleDrawY, mainSoleLength, soleVisualHeight, solePalette.base, DISPLAY_SCALE);
            drawScaledRect(ctx, mainSoleStartX, soleDrawY + soleVisualHeight - 1, mainSoleLength, 1, solePalette.shadow, DISPLAY_SCALE); // Bottom edge of sole
            if (mainSoleLength > 1) {
                 // Highlight outer edge of sole, shadow inner edge
                const soleOuterEdgeX = isMirrored ? mainSoleStartX + mainSoleLength -1 : mainSoleStartX;
                const soleInnerEdgeX = isMirrored ? mainSoleStartX : mainSoleStartX + mainSoleLength -1;
                drawScaledRect(ctx, soleOuterEdgeX, soleDrawY, 1, soleVisualHeight, solePalette.highlight, DISPLAY_SCALE);
                drawScaledRect(ctx, soleInnerEdgeX, soleDrawY, 1, soleVisualHeight, solePalette.shadow, DISPLAY_SCALE);
            }
        }
    }

    // --- Foot Upper ---
    // Heel Block (Upper part, above sole)
    for (let i = 0; i < heelExtensionLength; i++) {
        const currentX = isMirrored ? instepLeftX - 1 - i : instepRightX + 1 + i;
        let h = footUpperHeight;
        if (i > heelExtensionLength * 0.3) {
            h = Math.max(1, footUpperHeight - Math.floor(footUpperHeight * 0.25 * ((i - heelExtensionLength * 0.5) / (heelExtensionLength * 0.5 || 1))));
        }
        drawScaledRect(ctx, currentX, ankleY + (footUpperHeight - h), 1, h, mainPalette.base, DISPLAY_SCALE);
        drawScaledRect(ctx, currentX, ankleY + (footUpperHeight - h), 1, 1, mainPalette.highlight, DISPLAY_SCALE);
    }

    // Toe Box
    for (let i = 0; i < toeExtensionLength; i++) {
        const currentX = isMirrored ? instepRightX + 1 + i : instepLeftX - 1 - i;
        let h = footUpperHeight;
        const toeProgress = (toeExtensionLength <= 1) ? 1 : i / (toeExtensionLength - 1);

        if (toeShape === 'rounded') {
            h = Math.max(1, Math.floor(footUpperHeight * (1 - Math.pow(toeProgress, 1.8) * 0.5)));
        } else if (toeShape === 'pointed') {
            h = Math.max(1, Math.floor(footUpperHeight * (1 - toeProgress * 0.7)));
        } else { // square
            h = footUpperHeight * 0.8;
        }
        const yOffset = footUpperHeight - h;
        drawScaledRect(ctx, currentX, ankleY + yOffset, 1, h, mainPalette.base, DISPLAY_SCALE);
        drawScaledRect(ctx, currentX, ankleY + yOffset, 1, 1, mainPalette.highlight, DISPLAY_SCALE);
    }

    // Fill instep
    drawScaledRect(ctx, instepLeftX, ankleY, legInitialWidth, footUpperHeight, mainPalette.base, DISPLAY_SCALE);
    drawScaledRect(ctx, instepLeftX, ankleY, legInitialWidth, 1, mainPalette.highlight, DISPLAY_SCALE);

    // --- Cuff ---
    if (cuffPalette && hasCuff) {
        const cuffHeight = Math.max(1, Math.floor(legHeight / 5)) + 1;
        const cuffWidth = legTopWidth + 2;
        const cuffX = legShaftDrawingCenterX - Math.floor(cuffWidth / 2);
        const cuffY = bootAreaTopY;

        drawScaledRect(ctx, cuffX, cuffY, cuffWidth, cuffHeight, cuffPalette.base, DISPLAY_SCALE);
        drawScaledRect(ctx, cuffX, cuffY, cuffWidth, 1, cuffPalette.highlight, DISPLAY_SCALE);
    }

    // --- Buckles (NEW) ---
    if (hasBuckles && bucklePalette && numBuckles > 0) {
        const buckleWidth = 3;
        const buckleHeight = 2;
        const strapHeight = 1; // Strap under the buckle

        for (let i = 0; i < numBuckles; i++) {
            // Position buckles on the side of the leg shaft
            // Distribute them along the leg height, avoiding cuff area
            const buckleVerticalPositionRatio = (numBuckles === 1) ? 0.65 : (0.4 + (i * 0.35)); // Adjusted for better spacing
            let buckleCenterY = bootAreaTopY + Math.floor(legHeight * buckleVerticalPositionRatio);
            if (hasCuff) buckleCenterY = Math.max(bootAreaTopY + Math.floor(legHeight / 5) + 2 + buckleHeight, buckleCenterY); // Avoid cuff

            const currentLegWidthAtBuckleY = Math.max(1, Math.round(legTopWidth + (legInitialWidth - legTopWidth) * (1 - (buckleCenterY - bootAreaTopY) / (legHeight -1 || 1) )));
            const legEdgeX = legShaftDrawingCenterX + (isMirrored ? -Math.floor(currentLegWidthAtBuckleY / 2) : Math.floor(currentLegWidthAtBuckleY / 2));

            const buckleX = isMirrored ? legEdgeX - buckleWidth : legEdgeX;

            // Draw strap part first (slightly darker than buckle)
            drawScaledRect(ctx, buckleX, buckleCenterY - Math.floor(strapHeight / 2) , buckleWidth, strapHeight, bucklePalette.shadow, DISPLAY_SCALE);
            // Draw buckle
            drawScaledRect(ctx, buckleX, buckleCenterY - Math.floor(buckleHeight / 2), buckleWidth, buckleHeight, bucklePalette.base, DISPLAY_SCALE);
            drawScaledRect(ctx, buckleX, buckleCenterY - Math.floor(buckleHeight / 2), 1, buckleHeight, bucklePalette.highlight, DISPLAY_SCALE); // Buckle pin/edge
        }
    }
}


/**
 * Generates a procedural pair of boots.
 */
export function generateBoots(options = {}) {
    console.log("generateBoots called with options:", options);

    const offscreenCanvas = document.createElement('canvas');
    offscreenCanvas.width = CANVAS_WIDTH;
    offscreenCanvas.height = CANVAS_HEIGHT;
    const ctx = offscreenCanvas.getContext('2d');

    if (!ctx) {
        console.error("Failed to get 2D context for offscreen canvas in generateBoots.");
        return { type: 'boots', name: 'Error Boots', seed: Date.now(), itemData: { error: "Canvas context failed" }, imageDataUrl: createErrorDataURL("CTX Fail") };
    }
    ctx.imageSmoothingEnabled = false;
    ctx.clearRect(0, 0, CANVAS_WIDTH, CANVAS_HEIGHT);

    // --- Define Boot Properties ---
    const bootTypes = ['ankle_boot', 'calf_high', 'knee_high'];
    const bootType = getRandomElement(bootTypes);
    const toeShapes = ['rounded', 'square', 'pointed'];
    const toeShape = getRandomElement(toeShapes);

    // EXPANDED: Main material options
    const mainMaterials = ['LEATHER', 'DARK_STEEL', 'IRON', 'BRONZE', 'BLACK_PAINT', 'RED_PAINT', 'BONE', 'BLUE_PAINT', 'GREEN_PAINT', 'OBSIDIAN', 'ENCHANTED'];
    const mainMaterialName = getRandomElement(mainMaterials);
    const mainPalette = getPalette(mainMaterialName);

    // EXPANDED: Sole material options
    const soleMaterials = ['LEATHER', 'WOOD', 'IRON', 'BLACK_PAINT', 'DARK_STEEL', 'STONE', 'OBSIDIAN'];
    const soleMaterialName = getRandomElement(soleMaterials);
    const solePalette = getPalette(soleMaterialName);

    const hasCuff = Math.random() < 0.65;
    let cuffMaterialName = null;
    let cuffPalette = null;
    if (hasCuff) {
        const cuffMaterials = ['LEATHER', 'GOLD', 'SILVER', 'WHITE_PAINT', 'WOOD', 'BONE', 'FUR_WHITE', 'FUR_BROWN']; // Added fur options
        cuffMaterialName = getRandomElement(cuffMaterials.filter(m => m !== mainMaterialName));
        if (!cuffMaterialName && cuffMaterials.length > 0) cuffMaterialName = getRandomElement(cuffMaterials);
        if (cuffMaterialName) {
            if (cuffMaterialName === 'FUR_WHITE') cuffPalette = getPalette('BONE'); // Use BONE for white fur
            else if (cuffMaterialName === 'FUR_BROWN') cuffPalette = getPalette('WOOD'); // Use WOOD for brown fur
            else cuffPalette = getPalette(cuffMaterialName);
        } else { hasCuff = false; }
    }

    // NEW: Heel properties
    const heelStyles = ['none', 'low_block', 'medium_block'];
    const heelStyle = getRandomElement(heelStyles);
    let heelHeightActual = 0;
    if (heelStyle === 'low_block') {
        heelHeightActual = getRandomInt(2, 3);
    } else if (heelStyle === 'medium_block') {
        heelHeightActual = getRandomInt(3, 5);
    }

    // NEW: Buckle properties
    const hasBuckles = Math.random() < 0.5; // 50% chance of having buckles
    const numBuckles = hasBuckles ? getRandomInt(1, 2) : 0;
    const buckleMaterials = ['IRON', 'STEEL', 'BRONZE', 'SILVER', 'GOLD'];
    const bucklePalette = hasBuckles ? getPalette(getRandomElement(buckleMaterials)) : null;


    let footTotalLength, footHeight, legHeight, legInitialWidth, legTopWidth, heelExtensionLength, toeExtensionLength;

    footTotalLength = getRandomInt(Math.floor(SINGLE_BOOT_LOGICAL_WIDTH * 0.7), SINGLE_BOOT_LOGICAL_WIDTH - 2);
    footHeight = getRandomInt(4, 7) + heelHeightActual; // Foot height includes heel now

    // MODIFIED: legInitialWidth calculation for wider shafts
    legInitialWidth = Math.floor(footTotalLength * getRandomInRange(0.35, 0.55)); // Increased multiplier
    legInitialWidth = Math.max(4, Math.min(legInitialWidth, 8)); // Adjusted clamps for wider shafts

    // MODIFIED: heelExtensionLength calculation to bring shaft closer to heel edge
    heelExtensionLength = Math.floor(footTotalLength * getRandomInRange(0.05, 0.15)); // Reduced multiplier
    heelExtensionLength = Math.max(1, heelExtensionLength);
    toeExtensionLength = footTotalLength - legInitialWidth - heelExtensionLength;
    toeExtensionLength = Math.max(Math.floor(footTotalLength * 0.3), toeExtensionLength);


    if (bootType === 'ankle_boot') {
        legHeight = getRandomInt(footHeight, footHeight + 4);
    } else if (bootType === 'calf_high') {
        legHeight = getRandomInt(Math.floor(SINGLE_BOOT_LOGICAL_HEIGHT * 0.25), Math.floor(SINGLE_BOOT_LOGICAL_HEIGHT * 0.45));
    } else { // knee_high
        legHeight = getRandomInt(Math.floor(SINGLE_BOOT_LOGICAL_HEIGHT * 0.4), SINGLE_BOOT_LOGICAL_HEIGHT - footHeight - CANVAS_PADDING_Y - 2);
    }
    legHeight = Math.max(4, legHeight);

    // MODIFIED: legTopWidth calculation to allow for slightly wider tops
    legTopWidth = Math.floor(legInitialWidth * getRandomInRange(0.95, 1.25)); // Adjusted range
    legTopWidth = Math.max(3, legTopWidth); // Ensured top is at least 3px if initial is wider


    const contentPaddingX = Math.floor((CANVAS_LOGICAL_WIDTH - CONTENT_LOGICAL_WIDTH) / 2);
    const leftBootAreaStartX = contentPaddingX;
    const rightBootAreaStartX = contentPaddingX + SINGLE_BOOT_LOGICAL_WIDTH + PAIR_SPACING;

    const totalBootVisualHeight = legHeight + footHeight;
    const bootAreaTopY = Math.floor((SINGLE_BOOT_LOGICAL_HEIGHT - totalBootVisualHeight) / 2) + CANVAS_PADDING_Y;
    const finalBootTopY = Math.max(CANVAS_PADDING_Y, bootAreaTopY);


    const bootDetails = {
        bootType, mainPalette, solePalette, cuffPalette,
        footTotalLength, footHeight, legHeight, legInitialWidth, legTopWidth,
        heelExtensionLength, toeExtensionLength,
        hasCuff, toeShape,
        // NEW: Pass heel and buckle details
        heelStyle, heelHeightActual,
        hasBuckles, numBuckles, bucklePalette
    };

    drawSingleBoot(ctx, bootDetails, leftBootAreaStartX, finalBootTopY, false);
    drawSingleBoot(ctx, bootDetails, rightBootAreaStartX, finalBootTopY, true);


    let itemName = `${mainMaterialName} ${toeShape} ${bootType.replace('_', ' ')}`;
    if (heelStyle !== 'none') itemName += ` (${heelStyle.replace('_', ' ')} heel)`;
    if (hasCuff && cuffMaterialName) itemName += ` with ${cuffMaterialName.replace('FUR_', '')} ${cuffMaterialName.includes('FUR') ? 'Fur ' : ''}Cuff`;
    if (hasBuckles) itemName += ` with ${numBuckles} Buckle${numBuckles > 1 ? 's' : ''}`;

    const itemSeed = options.seed || Date.now();

    const generatedItemData = {
        type: 'boots',
        name: itemName,
        seed: itemSeed,
        itemData: {
            style: bootType,
            toeShape: toeShape,
            mainMaterial: mainMaterialName.toLowerCase(),
            soleMaterial: soleMaterialName.toLowerCase(),
            cuffMaterial: cuffMaterialName ? cuffMaterialName.toLowerCase().replace('fur_', '') : null,
            hasCuff,
            footTotalLength,
            footHeight,
            legHeight,
            legInitialWidth,
            legTopWidth,
            heelExtensionLength,
            toeExtensionLength,
            // NEW: Store heel and buckle data
            heelStyle,
            heelHeight: heelHeightActual,
            hasBuckles,
            numBuckles,
            buckleMaterial: hasBuckles && bucklePalette ? bucklePalette.name.toLowerCase() : null,
            colors: {
                main: mainPalette,
                sole: solePalette,
                cuff: cuffPalette,
                buckle: bucklePalette
            }
        },
        imageDataUrl: offscreenCanvas.toDataURL()
    };

    console.log("Boots generated:", generatedItemData.name);
    return generatedItemData;
}

// REMOVED: Local getRandomInRange function, as it's now imported from utils.js

/** Helper to create a simple Data URL for error states */
function createErrorDataURL(message = "ERR") {
    const errorCanvas = document.createElement('canvas');
    errorCanvas.width = CANVAS_WIDTH; errorCanvas.height = CANVAS_HEIGHT;
    const ctx = errorCanvas.getContext('2d');
    if (ctx) {
        ctx.imageSmoothingEnabled = false; ctx.fillStyle = 'rgba(255,0,0,0.7)';
        ctx.fillRect(0, 0, CANVAS_WIDTH, CANVAS_HEIGHT);
        const fontSize = Math.floor(CANVAS_WIDTH / 16);
        ctx.font = `bold ${fontSize}px sans-serif`; ctx.fillStyle = 'white';
        ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
        ctx.fillText(message, CANVAS_WIDTH / 2, CANVAS_HEIGHT / 2);
        try { return errorCanvas.toDataURL(); } catch (e) { console.error("Error converting error canvas to Data URL:", e); }
    }
    return "data:image/gif;base64,R0lGODlhAQABAIAAAAAAAP///yH5BAEAAAAALAAAAAABAAEAAAIBRAA7";
}

console.log("js/generators/boots_generator.js loaded with wider shafts, closer heels, heel styles and buckles.");
