/**
 * js/generators/glove_generator.js
 * Contains the logic for procedurally generating gloves and gauntlets.
 */

import { getRandomInt, getRandomElement, drawScaledRect, getRandomInRange } from '../utils.js';
import { getPalette, MATERIAL_PALETTES } from '../palettes/material_palettes.js';

// --- Constants specific to glove generation or drawing ---
const SINGLE_GLOVE_LOGICAL_WIDTH = 28; // Max width for one glove's area
const SINGLE_GLOVE_LOGICAL_HEIGHT = 40; // Max height for one glove
const DISPLAY_SCALE = 4;

const PAIR_SPACING = 4; // Space between the two gloves
const CONTENT_LOGICAL_WIDTH = (SINGLE_GLOVE_LOGICAL_WIDTH * 2) + PAIR_SPACING;
const CANVAS_LOGICAL_WIDTH = CONTENT_LOGICAL_WIDTH + 8; // Add some padding

const CANVAS_WIDTH = CANVAS_LOGICAL_WIDTH * DISPLAY_SCALE;
const CANVAS_HEIGHT = SINGLE_GLOVE_LOGICAL_HEIGHT * DISPLAY_SCALE;
const CANVAS_PADDING_Y = 4; // Vertical padding within the canvas

// --- Internal helper functions for drawing glove components ---

/**
 * Draws a single glove.
 * @param {CanvasRenderingContext2D} ctx - The drawing context.
 * @param {object} gloveDetails - Properties like type, length, palette, etc.
 * @param {number} gloveAreaStartX - Logical X top-left corner for THIS glove's allocated drawing area.
 * @param {number} gloveAreaTopY - Logical Y top for THIS glove's allocated drawing area.
 * @param {boolean} isMirrored - True if this is the right glove (thumb on the right from viewer's perspective).
 */
function drawSingleGlove(ctx, gloveDetails, gloveAreaStartX, gloveAreaTopY, isMirrored = false) {
    const {
        gloveType,
        mainPalette,
        secondaryPalette, // For knuckles, some decorations
        decorationPalette, // For general decorations like trim, studs
        gloveLength,
        hasFingers,
        knuckleStyle,
        decorationStyle,
        cuffHeight,
        handHeight,
        fingerBaseHeight,
        fingerLengthRatios
    } = gloveDetails;

    const gloveTopActualY = gloveAreaTopY;

    const cuffBottomY = gloveTopActualY + cuffHeight;
    const handBottomY = cuffBottomY + handHeight;

    // --- Draw Cuff/Arm ---
    const cuffBaseWidth = Math.floor(SINGLE_GLOVE_LOGICAL_WIDTH * getRandomInRange(0.55, 0.75)); // Cuff base can be wider
    let cuffTopWidth = (gloveType === 'plate_gauntlet') ?
                         Math.floor(cuffBaseWidth * getRandomInRange(1.2, 1.7)) : // More pronounced flare for gauntlets
                         Math.floor(cuffBaseWidth * getRandomInRange(0.9, 1.2));
    cuffTopWidth = Math.min(cuffTopWidth, SINGLE_GLOVE_LOGICAL_WIDTH - 2);

    for (let i = 0; i < cuffHeight; i++) {
        const y = gloveTopActualY + i;
        const progress = (cuffHeight <= 1) ? 0 : i / (cuffHeight - 1);
        let curveOffset = 0;
        if (gloveType !== 'plate_gauntlet' && cuffHeight > 5) {
            curveOffset = Math.floor(Math.sin(progress * Math.PI) * 2); // Slightly more curve
        }
        const currentWidth = Math.max(2,Math.round(cuffTopWidth + (cuffBaseWidth - cuffTopWidth) * progress) + curveOffset);
        const x = gloveAreaStartX + Math.floor((SINGLE_GLOVE_LOGICAL_WIDTH - currentWidth) / 2);

        drawScaledRect(ctx, x, y, currentWidth, 1, mainPalette.base, DISPLAY_SCALE);
        if (currentWidth > 1) {
            drawScaledRect(ctx, x, y, 1, 1, mainPalette.highlight, DISPLAY_SCALE);
            drawScaledRect(ctx, x + currentWidth - 1, y, 1, 1, mainPalette.shadow, DISPLAY_SCALE);
        }
    }

    // Cuff Trim Decoration
    if (decorationStyle === 'cuff_trim' && decorationPalette && cuffHeight > 2) {
        const trimHeight = getRandomInt(1,2);
        const trimY = gloveTopActualY;
        const trimWidth = Math.round(cuffTopWidth + ((gloveType !== 'plate_gauntlet' && cuffHeight > 5) ? Math.floor(Math.sin(0 * Math.PI) * 2) : 0) ); // Match top width
        const trimX = gloveAreaStartX + Math.floor((SINGLE_GLOVE_LOGICAL_WIDTH - trimWidth) / 2);
        for(let t=0; t < trimHeight; t++){
            drawScaledRect(ctx, trimX, trimY + t, trimWidth, 1, decorationPalette.base, DISPLAY_SCALE);
            if(t === 0 && trimHeight > 1) drawScaledRect(ctx, trimX, trimY + t, trimWidth, 1, decorationPalette.highlight, DISPLAY_SCALE);
        }
    }


    // --- Draw Hand/Palm ---
    const palmBaseWidth = Math.floor(cuffBaseWidth * getRandomInRange(1.0, 1.15));
    const palmTopWidth = Math.floor(palmBaseWidth * getRandomInRange(0.80, 0.90)); // More taper

    for (let i = 0; i < handHeight; i++) {
        const y = cuffBottomY + i;
        const progress = (handHeight <= 1) ? 0 : i / (handHeight - 1);
        const currentPalmWidth = Math.max(2, Math.round(palmBaseWidth - (palmBaseWidth - palmTopWidth) * progress));
        const palmX = gloveAreaStartX + Math.floor((SINGLE_GLOVE_LOGICAL_WIDTH - currentPalmWidth) / 2);

        drawScaledRect(ctx, palmX, y, currentPalmWidth, 1, mainPalette.base, DISPLAY_SCALE);
        if (currentPalmWidth > 1) {
            drawScaledRect(ctx, palmX, y, 1, 1, mainPalette.highlight, DISPLAY_SCALE);
            drawScaledRect(ctx, palmX + currentPalmWidth - 1, y, 1, 1, mainPalette.shadow, DISPLAY_SCALE);
        }
    }

    // Hand Studs Decoration
    if (decorationStyle === 'hand_studs' && decorationPalette) {
        const numStuds = getRandomInt(2, 4);
        const studSize = 1;
        for (let s = 0; s < numStuds; s++) {
            const studY = cuffBottomY + Math.floor(handHeight * (0.3 + s * 0.15)); // Spread studs on back of hand
            const currentPalmWidthAtStudY = Math.max(2, Math.round(palmBaseWidth - (palmBaseWidth - palmTopWidth) * ((studY - cuffBottomY)/(handHeight-1||1)) ));
            const studX = gloveAreaStartX + Math.floor((SINGLE_GLOVE_LOGICAL_WIDTH - currentPalmWidthAtStudY) / 2) + Math.floor(currentPalmWidthAtStudY * (0.25 + s * 0.2)) - Math.floor(studSize/2) ;
             if (studX > gloveAreaStartX && studX < gloveAreaStartX + SINGLE_GLOVE_LOGICAL_WIDTH - studSize) {
                 drawScaledRect(ctx, studX, studY, studSize, studSize, decorationPalette.highlight, DISPLAY_SCALE);
             }
        }
    }


    // --- Draw Fingers ---
    const numFingers = 4;
    const fingerWidth = Math.max(2, Math.floor((palmTopWidth * 0.95) / numFingers) -1); // Slightly thicker fingers
    const fingerGap = 1;
    const totalFingerBlockWidth = (fingerWidth * numFingers) + (fingerGap * (numFingers - 1));
    const firstFingerX = gloveAreaStartX + Math.floor((SINGLE_GLOVE_LOGICAL_WIDTH - totalFingerBlockWidth) / 2);


    for (let f = 0; f < numFingers; f++) {
        const fingerStartX = firstFingerX + f * (fingerWidth + fingerGap);
        const currentFingerHeight = Math.floor(fingerBaseHeight * fingerLengthRatios[f]);

        if (!hasFingers && gloveType === 'fingerless') {
             const stubHeight = Math.max(1, Math.floor(fingerBaseHeight * (0.35 + f * 0.08)));
             for (let i = 0; i < stubHeight; i++) {
                const y = handBottomY + i;
                drawScaledRect(ctx, fingerStartX, y, fingerWidth, 1, mainPalette.base, DISPLAY_SCALE);
                 if (fingerWidth > 1) {
                    drawScaledRect(ctx, fingerStartX, y, 1, 1, mainPalette.highlight, DISPLAY_SCALE);
                    drawScaledRect(ctx, fingerStartX + fingerWidth - 1, y, 1, 1, mainPalette.shadow, DISPLAY_SCALE);
                }
             }
             continue;
        }

        for (let i = 0; i < currentFingerHeight; i++) {
            const y = handBottomY + i;
            let segWidth = fingerWidth;
            const tipTaperStartRatio = 0.55; // Start tapering a bit earlier for more rounded look
            if (hasFingers && i > Math.floor(currentFingerHeight * tipTaperStartRatio)) {
                const tipProgress = (i - Math.floor(currentFingerHeight * tipTaperStartRatio)) / (currentFingerHeight * (1 - tipTaperStartRatio) -1 || 1);
                segWidth = Math.max(1, Math.round(fingerWidth * (1 - Math.pow(tipProgress, 1.5))));
            }
            const x = fingerStartX + Math.floor((fingerWidth - segWidth)/2);

            drawScaledRect(ctx, x, y, segWidth, 1, mainPalette.base, DISPLAY_SCALE);

            if (gloveType === 'plate_gauntlet' && i > 0 && i % Math.floor(fingerWidth * 1.2) === 0 && i < currentFingerHeight -1) {
                 drawScaledRect(ctx, x, y, segWidth, 1, mainPalette.shadow, DISPLAY_SCALE);
            } else if (segWidth > 1) {
                drawScaledRect(ctx, x, y, 1, 1, mainPalette.highlight, DISPLAY_SCALE);
                drawScaledRect(ctx, x + segWidth - 1, y, 1, 1, mainPalette.shadow, DISPLAY_SCALE);
            } else if (segWidth === 1) {
                 drawScaledRect(ctx, x, y, 1, 1, mainPalette.highlight, DISPLAY_SCALE);
            }
        }
        if (decorationStyle === 'finger_guards' && gloveType === 'plate_gauntlet' && decorationPalette && hasFingers) {
            const guardHeight = Math.max(1, Math.floor(fingerWidth * 0.8));
            const guardY = handBottomY -1;
            const guardWidth = fingerWidth;
            drawScaledRect(ctx, fingerStartX, guardY, guardWidth, guardHeight, decorationPalette.base, DISPLAY_SCALE);
            drawScaledRect(ctx, fingerStartX, guardY, guardWidth, 1, decorationPalette.highlight, DISPLAY_SCALE);
        }

    }

    // --- Draw Thumb ---
    const thumbWidth = Math.max(2, fingerWidth + 1);
    const thumbHeight = Math.floor((handHeight + fingerBaseHeight) * 0.65);
    const thumbAttachY = cuffBottomY + Math.floor(handHeight * 0.20);

    // Calculate palm width at thumb attachment Y
    const palmProgressAtThumbAttach = (thumbAttachY - cuffBottomY) / (handHeight - 1 || 1);
    const thumbBasePalmWidth = Math.max(2, Math.round(palmBaseWidth - (palmBaseWidth - palmTopWidth) * palmProgressAtThumbAttach));
    const thumbBasePalmX = gloveAreaStartX + Math.floor((SINGLE_GLOVE_LOGICAL_WIDTH - thumbBasePalmWidth) / 2);

    // MODIFIED: Corrected thumb base positioning for better attachment to palm sides
    let initialThumbX;
    if (isMirrored) { // Right glove, thumb on its left side of the palm
        initialThumbX = thumbBasePalmX - Math.round(thumbWidth * 0.4); // Thumb's left edge starts, overlapping palm's left edge
    } else { // Left glove, thumb on its right side of the palm
        initialThumbX = (thumbBasePalmX + thumbBasePalmWidth - 1) - thumbWidth + Math.round(thumbWidth * 0.6); // Thumb's left edge starts, overlapping palm's right edge
    }


    for (let i = 0; i < thumbHeight; i++) {
        const y = thumbAttachY + i;
        let currentThumbWidth = thumbWidth;
        const progress = i / (thumbHeight -1 || 1);

        const tipTaperStartRatioThumb = 0.45;
        if (i > thumbHeight * tipTaperStartRatioThumb) {
             const tipProgressThumb = (i - thumbHeight * tipTaperStartRatioThumb) / (thumbHeight * (1-tipTaperStartRatioThumb) -1 ||1);
            currentThumbWidth = Math.max(1, Math.round(thumbWidth * (1 - Math.pow(tipProgressThumb, 1.7))));
        }

        // Angling logic for thumb splay
        const angleOffset = Math.floor(progress * (isMirrored ? -2.0 : 2.0) * (1 - progress * 0.7) ); // Adjusted splay
        let currentThumbX = initialThumbX + angleOffset;

        // Adjust X for tapering width to keep the attachment side more stable
        if (!isMirrored) { // Left glove, thumb on right, tapering from right
            currentThumbX += Math.floor((thumbWidth - currentThumbWidth));
        }
        // For mirrored (right glove), tapering from left, initialThumbX is already left edge.


        drawScaledRect(ctx, currentThumbX, y, currentThumbWidth, 1, mainPalette.base, DISPLAY_SCALE);
        if (currentThumbWidth > 1) {
            drawScaledRect(ctx, currentThumbX, y, 1, 1, mainPalette.highlight, DISPLAY_SCALE);
            drawScaledRect(ctx, currentThumbX + currentThumbWidth - 1, y, 1, 1, mainPalette.shadow, DISPLAY_SCALE);
        }
    }

    // --- Knuckle/Hand Decoration ---
    if (secondaryPalette && knuckleStyle !== 'none') {
        const knuckleY = cuffBottomY + Math.floor(handHeight * 0.25);
        const currentPalmWidthAtKnuckle = Math.round(palmBaseWidth - (palmBaseWidth - palmTopWidth) * ((knuckleY - cuffBottomY) / (handHeight-1||1) ));
        const knucklePlateX = gloveAreaStartX + Math.floor((SINGLE_GLOVE_LOGICAL_WIDTH - currentPalmWidthAtKnuckle) / 2) + 1;
        const knucklePlateWidth = currentPalmWidthAtKnuckle - 2;


        if (knuckleStyle === 'reinforced') {
            const plateHeight = Math.max(2, Math.floor(handHeight * 0.4));
            if (knucklePlateWidth > 0) {
                drawScaledRect(ctx, knucklePlateX, knuckleY, knucklePlateWidth, plateHeight, secondaryPalette.base, DISPLAY_SCALE);
                drawScaledRect(ctx, knucklePlateX, knuckleY, knucklePlateWidth, 1, secondaryPalette.highlight, DISPLAY_SCALE);
                if (plateHeight > 1) drawScaledRect(ctx, knucklePlateX, knuckleY + plateHeight -1, knucklePlateWidth, 1, secondaryPalette.shadow, DISPLAY_SCALE);
            }
        } else if (knuckleStyle === 'spiked' && gloveType === 'plate_gauntlet') {
            const spikeSize = Math.max(2, Math.floor(fingerWidth * 1.0));
            for (let f = 0; f < numFingers; f++) {
                const fingerBaseX = firstFingerX + f * (fingerWidth + fingerGap) + Math.floor(fingerWidth / 2);
                for (let s = 0; s < spikeSize; s++) {
                    const y_spike = knuckleY - s -1;
                    const currentSpikeWidth = Math.max(1, Math.round(spikeSize * (1 - s/(spikeSize-1||1) * 0.6 )));
                    const x_spike = fingerBaseX - Math.floor(currentSpikeWidth/2);
                    drawScaledRect(ctx, x_spike, y_spike, currentSpikeWidth, 1, secondaryPalette.base, DISPLAY_SCALE);
                    if(s === spikeSize -1 && currentSpikeWidth > 0) drawScaledRect(ctx, x_spike,y_spike,currentSpikeWidth,1, secondaryPalette.highlight, DISPLAY_SCALE);
                }
            }
        }
    }
}


/**
 * Generates a procedural pair of gloves.
 */
export function generateGloves(options = {}) {
    console.log("generateGloves called with options:", options);

    const offscreenCanvas = document.createElement('canvas');
    offscreenCanvas.width = CANVAS_WIDTH;
    offscreenCanvas.height = CANVAS_HEIGHT;
    const ctx = offscreenCanvas.getContext('2d');

    if (!ctx) {
        console.error("Failed to get 2D context for offscreen canvas in generateGloves.");
        return { type: 'gloves', name: 'Error Gloves', seed: Date.now(), itemData: { error: "Canvas context failed" }, imageDataUrl: createErrorDataURL("CTX Fail") };
    }
    ctx.imageSmoothingEnabled = false;
    ctx.clearRect(0, 0, CANVAS_WIDTH, CANVAS_HEIGHT);

    const gloveTypes = ['cloth_simple', 'leather_basic', 'plate_gauntlet', 'fingerless', 'armored_leather'];
    const gloveType = getRandomElement(gloveTypes);

    let mainMaterialName;
    if (gloveType === 'cloth_simple') {
        mainMaterialName = getRandomElement(['WHITE_PAINT', 'BLACK_PAINT', 'RED_PAINT', 'BLUE_PAINT', 'GREEN_PAINT', 'PAPER', 'YELLOW_PAINT', 'PURPLE_PAINT']);
    } else if (gloveType === 'leather_basic' || gloveType === 'fingerless' || gloveType === 'armored_leather') {
        mainMaterialName = 'LEATHER';
    } else {
        mainMaterialName = getRandomElement(['IRON', 'STEEL', 'DARK_STEEL', 'BRONZE', 'OBSIDIAN', 'SILVER', 'GOLD', 'ENCHANTED']);
    }
    const mainPalette = getPalette(mainMaterialName);

    let secondaryPalette = null;
    let knuckleStyle = 'none';
    if (gloveType === 'plate_gauntlet' || gloveType === 'armored_leather' || Math.random() < 0.3) {
        knuckleStyle = getRandomElement(['none', 'reinforced', 'spiked']);
        if (knuckleStyle !== 'none') {
            const secondaryMaterials = ['IRON', 'STEEL', 'BRONZE', 'GOLD', 'SILVER', (mainMaterialName === 'LEATHER' ? 'BONE' : 'DARK_STEEL'), 'OBSIDIAN'];
            secondaryPalette = getPalette(getRandomElement(secondaryMaterials.filter(m => m !== mainMaterialName)));
        }
        if (knuckleStyle === 'spiked' && gloveType !== 'plate_gauntlet') knuckleStyle = 'reinforced';
    }

    const decorationStyles = ['none', 'cuff_trim', 'hand_studs'];
    if (gloveType === 'plate_gauntlet' || gloveType === 'armored_leather') {
        decorationStyles.push('finger_guards');
    }
    const decorationStyle = getRandomElement(decorationStyles);
    let decorationPalette = null;
    if (decorationStyle !== 'none') {
        const decorMaterials = ['GOLD', 'SILVER', 'BRONZE', 'STEEL', (mainMaterialName === 'LEATHER' ? 'IRON' : 'LEATHER'), 'ENCHANTED'];
        decorationPalette = getPalette(getRandomElement(decorMaterials.filter(m => m !== mainMaterialName && m !== (secondaryPalette ? secondaryPalette.name : ''))));
    }


    const gloveLengths = ['wrist', 'forearm', 'elbow'];
    const gloveLength = getRandomElement(gloveLengths);
    const hasFingers = gloveType !== 'fingerless';

    let cuffHeight, handHeight, fingerBaseHeight;
    const totalMaxHeight = SINGLE_GLOVE_LOGICAL_HEIGHT - CANVAS_PADDING_Y * 2;

    if (gloveLength === 'wrist') {
        cuffHeight = getRandomInt(5, 9);
        handHeight = getRandomInt(9, 13);
        fingerBaseHeight = hasFingers ? getRandomInt(10, 14) : 3;
    } else if (gloveLength === 'forearm') {
        cuffHeight = getRandomInt(12, 18);
        handHeight = getRandomInt(10, 14);
        fingerBaseHeight = hasFingers ? getRandomInt(11, 15) : 4;
    } else { // elbow
        cuffHeight = getRandomInt(18, Math.floor(totalMaxHeight * 0.65));
        handHeight = getRandomInt(11, 15);
        fingerBaseHeight = hasFingers ? getRandomInt(12, 16) : 4;
    }

    let currentTotalHeight = cuffHeight + handHeight + fingerBaseHeight;
    if (currentTotalHeight > totalMaxHeight) {
        const diff = currentTotalHeight - totalMaxHeight;
        cuffHeight -= Math.floor(diff * 0.5);
        handHeight -= Math.floor(diff * 0.3);
        fingerBaseHeight -= Math.ceil(diff * 0.2);
        cuffHeight = Math.max(3, cuffHeight);
        handHeight = Math.max(7, handHeight);
        fingerBaseHeight = Math.max(hasFingers ? 7 : 2, fingerBaseHeight);
    }
    const fingerLengthRatios = [];
    for (let f = 0; f < 4; f++) {
        if (f === 1 || f === 2) {
            fingerLengthRatios.push(getRandomInRange(0.93, 1.0));
        } else {
            fingerLengthRatios.push(getRandomInRange(0.78, 0.91));
        }
    }


    const contentPaddingX = Math.floor((CANVAS_LOGICAL_WIDTH - CONTENT_LOGICAL_WIDTH) / 2);
    const leftGloveAreaStartX = contentPaddingX;
    const rightGloveAreaStartX = contentPaddingX + SINGLE_GLOVE_LOGICAL_WIDTH + PAIR_SPACING;

    const finalGloveTopActualY = CANVAS_PADDING_Y + (totalMaxHeight - (cuffHeight + handHeight + fingerBaseHeight));


    const gloveDetails = {
        gloveType, mainPalette, secondaryPalette, decorationPalette, gloveLength, hasFingers, knuckleStyle, decorationStyle,
        cuffHeight, handHeight, fingerBaseHeight, fingerLengthRatios
    };

    drawSingleGlove(ctx, gloveDetails, leftGloveAreaStartX, finalGloveTopActualY, false);
    drawSingleGlove(ctx, gloveDetails, rightGloveAreaStartX, finalGloveTopActualY, true);


    let itemName = `${mainPalette.name} ${gloveType.replace('_', ' ')}`;
    if (gloveLength !== 'wrist') itemName += ` (${gloveLength} length)`;
    if (knuckleStyle !== 'none' && secondaryPalette) itemName += ` with ${secondaryPalette.name} ${knuckleStyle} knuckles`;
    if (decorationStyle !== 'none' && decorationPalette) itemName += ` (${decorationStyle.replace(/_/g, ' ')} decoration)`;


    const itemSeed = options.seed || Date.now();

    const generatedItemData = {
        type: 'gloves',
        name: itemName,
        seed: itemSeed,
        itemData: {
            gloveType,
            mainMaterial: mainMaterialName.toLowerCase(),
            gloveLength,
            hasFingers,
            knuckleStyle,
            secondaryMaterial: secondaryPalette ? secondaryPalette.name.toLowerCase() : null,
            decorationStyle,
            decorationMaterial: decorationPalette ? decorationPalette.name.toLowerCase() : null,
            cuffHeight,
            handHeight,
            fingerBaseHeight,
            fingerLengthRatios,
            colors: {
                main: mainPalette,
                secondary: secondaryPalette,
                decoration: decorationPalette
            }
        },
        imageDataUrl: offscreenCanvas.toDataURL()
    };

    console.log("Gloves generated:", generatedItemData.name);
    return generatedItemData;
}

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

console.log("js/generators/glove_generator.js loaded with symmetry, finger, shape, palette and decoration improvements.");
