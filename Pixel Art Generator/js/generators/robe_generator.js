/**
 * js/generators/robe_generator.js
 * Contains the logic for procedurally generating robes.
 */

import { getRandomInt, getRandomElement, drawScaledRect, getRandomInRange } from '../utils.js';
import { getPalette, MATERIAL_PALETTES }
from '../palettes/material_palettes.js';

// --- Constants specific to robe generation or drawing ---
const LOGICAL_GRID_WIDTH = 64;
const LOGICAL_GRID_HEIGHT = 64;
const DISPLAY_SCALE = 4;
const CANVAS_WIDTH = LOGICAL_GRID_WIDTH * DISPLAY_SCALE; // 256
const CANVAS_HEIGHT = LOGICAL_GRID_HEIGHT * DISPLAY_SCALE; // 256
const CANVAS_PADDING = 4; // Logical padding

// --- Internal helper functions for drawing robe components ---

/**
 * Draws the main body of the robe.
 * @param {CanvasRenderingContext2D} ctx - The drawing context.
 * @param {object} robeDetails - Properties like length, width, palette.
 * @param {number} centerX - Logical X center for the robe.
 * @param {number} topY - Logical Y for the top of the robe (shoulders).
 * @returns {object} Dimensions and key points: { shoulderWidth, bottomWidth, actualLength, necklineDepth, necklineWidth, bodyShapeInfo }
 */
function drawRobeBody(ctx, robeDetails, centerX, topY) {
    const {
        robeLengthType, // 'short', 'medium', 'long'
        mainPalette,
        shoulderWidth,
        flareAmount, // How much it widens at the bottom
        necklineType, // 'v_neck', 'round_neck', 'closed_high'
        sleeveAttachmentPoints, // { leftShoulderX, rightShoulderX, shoulderTopY }
        robeBodyStyle // NEW: 'a_line', 'flowing', 'gentle_s_curve'
    } = robeDetails;

    let actualLength;
    if (robeLengthType === 'short') {
        actualLength = getRandomInt(Math.floor(LOGICAL_GRID_HEIGHT * 0.45), Math.floor(LOGICAL_GRID_HEIGHT * 0.55));
    } else if (robeLengthType === 'medium') {
        actualLength = getRandomInt(Math.floor(LOGICAL_GRID_HEIGHT * 0.65), Math.floor(LOGICAL_GRID_HEIGHT * 0.75));
    } else { // long
        actualLength = getRandomInt(Math.floor(LOGICAL_GRID_HEIGHT * 0.85), LOGICAL_GRID_HEIGHT - CANVAS_PADDING - 2);
    }
    // Ensure it fits based on the calculated topY
    actualLength = Math.min(actualLength, LOGICAL_GRID_HEIGHT - topY - CANVAS_PADDING);
    actualLength = Math.max(Math.floor(LOGICAL_GRID_HEIGHT * 0.3), actualLength); // Ensure a minimum length


    const baseBottomWidth = shoulderWidth + flareAmount;
    const bodyShapeInfo = []; // Store {y, xStart, width} for each row

    let necklineDepth = 0;
    let necklineWidth = 0;

    if (necklineType === 'v_neck') {
        necklineDepth = getRandomInt(Math.floor(actualLength * 0.1), Math.floor(actualLength * 0.18));
        necklineWidth = Math.floor(shoulderWidth * 0.4);
    } else if (necklineType === 'round_neck') {
        necklineDepth = getRandomInt(Math.floor(actualLength * 0.08), Math.floor(actualLength * 0.15));
        necklineWidth = Math.floor(shoulderWidth * 0.5);
    } else { // closed_high
        necklineDepth = getRandomInt(1,3); // Can be slightly deeper for closed high if hood is up
        necklineWidth = Math.floor(shoulderWidth * 0.3);
    }


    for (let i = 0; i < actualLength; i++) {
        const y = topY + i;
        const progress = (actualLength <= 1) ? 0 : i / (actualLength - 1);
        let currentSegmentWidth;

        if (robeBodyStyle === 'flowing') {
            const baseWidth = shoulderWidth + (baseBottomWidth - shoulderWidth) * progress;
            const flowFactor = Math.sin(progress * Math.PI) * (flareAmount * 0.3);
            currentSegmentWidth = Math.round(baseWidth + flowFactor);
        } else if (robeBodyStyle === 'gentle_s_curve') {
            const midPoint = 0.4;
            let widthFactor;
            if (progress < midPoint) {
                widthFactor = progress / midPoint;
                currentSegmentWidth = shoulderWidth - (shoulderWidth - (shoulderWidth * 0.85)) * widthFactor;
            } else {
                widthFactor = (progress - midPoint) / (1 - midPoint);
                currentSegmentWidth = (shoulderWidth * 0.85) + (baseBottomWidth - (shoulderWidth * 0.85)) * widthFactor;
            }
            currentSegmentWidth = Math.round(currentSegmentWidth);
        } else { // a_line (default)
            currentSegmentWidth = Math.round(shoulderWidth + (baseBottomWidth - shoulderWidth) * progress);
        }
        currentSegmentWidth = Math.max(2, currentSegmentWidth);
        currentSegmentWidth = Math.min(currentSegmentWidth, LOGICAL_GRID_WIDTH - CANVAS_PADDING * 2); // Ensure robe body fits width


        let segmentX = centerX - Math.floor(currentSegmentWidth / 2);
        // Ensure segmentX is within canvas bounds
        segmentX = Math.max(CANVAS_PADDING, Math.min(segmentX, LOGICAL_GRID_WIDTH - CANVAS_PADDING - currentSegmentWidth));


        let drawLeftShoulder = true;
        let drawRightShoulder = true;
        let leftShoulderEndX = segmentX + currentSegmentWidth;
        let rightShoulderStartX = segmentX;


        if (i < necklineDepth) {
            let currentNeckOpeningWidth = 0;
            if (necklineType === 'v_neck') {
                currentNeckOpeningWidth = Math.floor(necklineWidth * (i / (necklineDepth -1||1)));
            } else if (necklineType === 'round_neck') {
                currentNeckOpeningWidth = Math.floor(necklineWidth * Math.sin((i / (necklineDepth-1||1)) * Math.PI / 2));
            } else {
                 currentNeckOpeningWidth = Math.floor(necklineWidth * (i / (necklineDepth -1||1)) * 0.5);
            }
            currentNeckOpeningWidth = Math.min(currentNeckOpeningWidth, currentSegmentWidth - 2);
            currentNeckOpeningWidth = Math.max(0, currentNeckOpeningWidth);


            if (currentNeckOpeningWidth > 0) {
                const neckStartX = centerX - Math.floor(currentNeckOpeningWidth / 2);
                const neckEndX = neckStartX + currentNeckOpeningWidth;

                const leftPartWidth = neckStartX - segmentX;
                if (leftPartWidth > 0) {
                    drawScaledRect(ctx, segmentX, y, leftPartWidth, 1, mainPalette.base, DISPLAY_SCALE);
                    drawScaledRect(ctx, segmentX, y, 1, 1, mainPalette.highlight, DISPLAY_SCALE);
                    drawScaledRect(ctx, neckStartX - 1, y, 1, 1, mainPalette.shadow, DISPLAY_SCALE);
                } else { drawLeftShoulder = false; }
                leftShoulderEndX = neckStartX;

                const rightPartWidth = (segmentX + currentSegmentWidth) - neckEndX;
                if (rightPartWidth > 0) {
                    drawScaledRect(ctx, neckEndX, y, rightPartWidth, 1, mainPalette.base, DISPLAY_SCALE);
                    drawScaledRect(ctx, neckEndX, y, 1, 1, mainPalette.highlight, DISPLAY_SCALE);
                    drawScaledRect(ctx, segmentX + currentSegmentWidth - 1, y, 1, 1, mainPalette.shadow, DISPLAY_SCALE);
                } else { drawRightShoulder = false; }
                rightShoulderStartX = neckEndX;

            } else {
                drawScaledRect(ctx, segmentX, y, currentSegmentWidth, 1, mainPalette.base, DISPLAY_SCALE);
                drawScaledRect(ctx, segmentX, y, 1, 1, mainPalette.highlight, DISPLAY_SCALE);
                drawScaledRect(ctx, segmentX + currentSegmentWidth - 1, y, 1, 1, mainPalette.shadow, DISPLAY_SCALE);
            }
        } else {
            drawScaledRect(ctx, segmentX, y, currentSegmentWidth, 1, mainPalette.base, DISPLAY_SCALE);
            drawScaledRect(ctx, segmentX, y, 1, 1, mainPalette.highlight, DISPLAY_SCALE);
            drawScaledRect(ctx, segmentX + currentSegmentWidth - 1, y, 1, 1, mainPalette.shadow, DISPLAY_SCALE);

            if (i > actualLength * 0.3 && i < actualLength * 0.9 && currentSegmentWidth > 5) {
                if (i % getRandomInt(3, 6) === 0) {
                    const foldX = segmentX + getRandomInt(1, currentSegmentWidth - 2);
                    drawScaledRect(ctx, foldX, y, 1, 1, mainPalette.shadow, DISPLAY_SCALE);
                    if (foldX + 1 < segmentX + currentSegmentWidth -1)
                       drawScaledRect(ctx, foldX + 1, y, 1, 1, mainPalette.highlight, DISPLAY_SCALE);
                }
            }
        }
        bodyShapeInfo.push({ y, xStart: segmentX, width: currentSegmentWidth, leftShoulderEndX, rightShoulderStartX, drawLeftShoulder, drawRightShoulder });
    }

    const shoulderRow = bodyShapeInfo.find(row => row.y === topY + Math.floor(necklineDepth / 2)) || bodyShapeInfo[0];
    if (shoulderRow) {
        sleeveAttachmentPoints.leftShoulderX = shoulderRow.xStart;
        sleeveAttachmentPoints.rightShoulderX = shoulderRow.xStart + shoulderRow.width -1;
        sleeveAttachmentPoints.shoulderTopY = shoulderRow.y;
        sleeveAttachmentPoints.shoulderActualWidth = shoulderRow.width;
    } else {
        sleeveAttachmentPoints.leftShoulderX = centerX - Math.floor(shoulderWidth/2);
        sleeveAttachmentPoints.rightShoulderX = centerX + Math.floor(shoulderWidth/2) -1;
        sleeveAttachmentPoints.shoulderTopY = topY;
        sleeveAttachmentPoints.shoulderActualWidth = shoulderWidth;
    }

    return {
        shoulderWidth,
        bottomWidth: baseBottomWidth,
        actualLength,
        necklineDepth,
        necklineWidth,
        bodyShapeInfo
    };
}

/**
 * Draws the sleeves of the robe.
 */
function drawSleeves(ctx, sleeveDetails, bodyShapeInfo, sleeveAttachmentPoints) {
    const {
        sleeveType,
        sleeveLengthType,
        mainPalette,
        cuffPalette,
        shoulderWidth
    } = sleeveDetails;

    if (!sleeveAttachmentPoints || sleeveAttachmentPoints.leftShoulderX === undefined) {
        console.warn("Sleeve attachment points not defined, skipping sleeves.");
        return;
    }

    let actualSleeveLength;
    if (sleeveLengthType === 'short') {
        actualSleeveLength = getRandomInt(Math.floor(shoulderWidth * 0.5), Math.floor(shoulderWidth * 0.8));
    } else if (sleeveLengthType === 'three_quarter') {
        actualSleeveLength = getRandomInt(Math.floor(shoulderWidth * 1.2), Math.floor(shoulderWidth * 1.8));
    } else { // long
        actualSleeveLength = getRandomInt(Math.floor(shoulderWidth * 2.0), Math.floor(shoulderWidth * 2.8));
    }
    actualSleeveLength = Math.min(actualSleeveLength, LOGICAL_GRID_HEIGHT - sleeveAttachmentPoints.shoulderTopY - CANVAS_PADDING - 2);


    const armholeDepth = Math.floor(shoulderWidth * 0.35);
    const sleeveTopWidth = Math.max(2, Math.floor(armholeDepth * 0.8));

    for (let side = -1; side <= 1; side += 2) {
        const shoulderEdgeX = (side === -1) ? sleeveAttachmentPoints.leftShoulderX : sleeveAttachmentPoints.rightShoulderX;

        for (let i = 0; i < actualSleeveLength; i++) {
            const progress = (actualSleeveLength <= 1) ? 0 : i / (actualSleeveLength - 1);
            let currentSleeveSegmentWidth;
            let yOffsetFromShoulder = Math.floor(i * 0.8);
            let xOffsetFromShoulder = Math.floor(i * 0.6);

            if (sleeveType === 'straight') {
                currentSleeveSegmentWidth = Math.max(2, Math.round(sleeveTopWidth - (sleeveTopWidth * 0.2) * progress));
            } else if (sleeveType === 'flared') {
                currentSleeveSegmentWidth = Math.round(sleeveTopWidth + (shoulderWidth * 1.0) * progress);
            } else { // bishop
                const cuffPoint = 0.85;
                if (progress < cuffPoint) {
                    currentSleeveSegmentWidth = Math.round(sleeveTopWidth + (shoulderWidth * 0.8) * Math.sin(progress / cuffPoint * Math.PI));
                } else {
                    currentSleeveSegmentWidth = Math.max(2, Math.round(sleeveTopWidth * 0.6));
                }
                currentSleeveSegmentWidth = Math.max(2, currentSleeveSegmentWidth);
            }
            currentSleeveSegmentWidth = Math.max(2, currentSleeveSegmentWidth);


            const segmentY = sleeveAttachmentPoints.shoulderTopY + yOffsetFromShoulder;
            if (segmentY < CANVAS_PADDING) continue;
            if (segmentY >= LOGICAL_GRID_HEIGHT - CANVAS_PADDING) break;


            const segmentX = (side === -1) ?
                             shoulderEdgeX - xOffsetFromShoulder - currentSleeveSegmentWidth +1:
                             shoulderEdgeX + xOffsetFromShoulder;

            const bodyRow = bodyShapeInfo.find(row => row.y === segmentY);
            let clippedSegmentX = segmentX;
            let clippedWidth = currentSleeveSegmentWidth;

            if (bodyRow) {
                if (side === -1) {
                    const overlap = (segmentX + currentSleeveSegmentWidth) - bodyRow.leftShoulderEndX;
                    if (overlap > 0) {
                        clippedWidth = Math.max(1, currentSleeveSegmentWidth - overlap);
                    }
                } else {
                    const overlap = bodyRow.rightShoulderStartX - segmentX;
                    if (overlap > 0) {
                        clippedSegmentX = bodyRow.rightShoulderStartX;
                        clippedWidth = Math.max(1, currentSleeveSegmentWidth - overlap);
                    }
                }
            }
            if (clippedWidth <=0) continue;

            if (clippedSegmentX < CANVAS_PADDING) {
                clippedWidth -= (CANVAS_PADDING - clippedSegmentX);
                clippedSegmentX = CANVAS_PADDING;
            }
            if (clippedSegmentX + clippedWidth > LOGICAL_GRID_WIDTH - CANVAS_PADDING) {
                clippedWidth = (LOGICAL_GRID_WIDTH - CANVAS_PADDING) - clippedSegmentX;
            }
            if (clippedWidth <= 0) continue;


            drawScaledRect(ctx, clippedSegmentX, segmentY, clippedWidth, 1, mainPalette.base, DISPLAY_SCALE);
            if (clippedWidth > 1) {
                drawScaledRect(ctx, clippedSegmentX, segmentY, 1, 1, mainPalette.shadow, DISPLAY_SCALE);
                drawScaledRect(ctx, clippedSegmentX + clippedWidth - 1, segmentY, 1, 1, mainPalette.highlight, DISPLAY_SCALE);
            }

            if (cuffPalette &&
                ((sleeveType === 'bishop' && progress >= 0.85) || (sleeveType !== 'bishop' && progress >= 0.92)) ) {
                drawScaledRect(ctx, clippedSegmentX, segmentY, clippedWidth, 1, cuffPalette.base, DISPLAY_SCALE);
                 if (clippedWidth > 1) {
                    drawScaledRect(ctx, clippedSegmentX, segmentY, 1, 1, cuffPalette.shadow, DISPLAY_SCALE);
                    drawScaledRect(ctx, clippedSegmentX + clippedWidth - 1, segmentY, 1, 1, cuffPalette.highlight, DISPLAY_SCALE);
                }
            }
        }
    }
}

/**
 * Draws the hood.
 */
function drawHood(ctx, hoodDetails, robeNecklineY, robeShoulderWidth, robeCenterX, mainPalette) {
    const { hasHood, hoodUp, hoodPalette } = hoodDetails;
    if (!hasHood) return;

    const paletteToUse = hoodPalette || mainPalette;
    const hoodDepth = Math.floor(robeShoulderWidth * 0.7);
    let hoodWidthAtBase = robeShoulderWidth + getRandomInt(4, 8);
    hoodWidthAtBase = Math.min(hoodWidthAtBase, LOGICAL_GRID_WIDTH - CANVAS_PADDING * 2);


    if (hoodUp) {
        let hoodTopY = robeNecklineY - Math.floor(hoodDepth * 0.8);
        hoodTopY = Math.max(CANVAS_PADDING, hoodTopY);

        const hoodActualHeight = robeNecklineY - hoodTopY + Math.floor(hoodDepth * 0.3);
        const openingHeightRatio = 0.7;
        const openingTopY = hoodTopY + Math.floor(hoodActualHeight * (1 - openingHeightRatio) * 0.6);
        const openingBottomY = openingTopY + Math.floor(hoodActualHeight * openingHeightRatio);

        const maxOpeningWidth = Math.floor(hoodWidthAtBase * 0.55);
        const topOpeningWidth = Math.floor(maxOpeningWidth * 0.7);

        for (let y = hoodTopY; y < openingBottomY + Math.floor(hoodDepth * 0.2); y++) {
            if (y >= LOGICAL_GRID_HEIGHT - CANVAS_PADDING) break;

            const verticalProgress = (y - hoodTopY) / (hoodActualHeight -1 || 1);

            let outerSegmentWidth = Math.floor(hoodWidthAtBase * (1 - Math.pow(verticalProgress, 1.5) * 0.6));
            outerSegmentWidth = Math.max(1, outerSegmentWidth);
            let outerSegmentX = robeCenterX - Math.floor(outerSegmentWidth / 2);

            let effectiveOuterSegmentWidth = outerSegmentWidth;
            if (outerSegmentX < CANVAS_PADDING) {
                effectiveOuterSegmentWidth -= (CANVAS_PADDING - outerSegmentX);
                outerSegmentX = CANVAS_PADDING;
            }
            if (outerSegmentX + effectiveOuterSegmentWidth > LOGICAL_GRID_WIDTH - CANVAS_PADDING) {
                effectiveOuterSegmentWidth = (LOGICAL_GRID_WIDTH - CANVAS_PADDING) - outerSegmentX;
            }
            if (effectiveOuterSegmentWidth <= 0) continue;


            let currentOpeningWidth = 0;
            if (y >= openingTopY && y < openingBottomY) {
                const openingProgress = (y - openingTopY) / (openingBottomY - openingTopY -1 || 1);
                if (openingProgress < 0.5) {
                    currentOpeningWidth = Math.floor(topOpeningWidth + (maxOpeningWidth - topOpeningWidth) * (openingProgress * 2));
                } else {
                    currentOpeningWidth = Math.floor(maxOpeningWidth - (maxOpeningWidth - topOpeningWidth * 1.2) * ((openingProgress - 0.5) * 2));
                }
                currentOpeningWidth = Math.max(0, Math.min(currentOpeningWidth, effectiveOuterSegmentWidth - 2));
            }
            const openingXStart = robeCenterX - Math.floor(currentOpeningWidth / 2);


            const leftPartWidth = openingXStart - outerSegmentX;
            if (leftPartWidth > 0) {
                drawScaledRect(ctx, outerSegmentX, y, leftPartWidth, 1, paletteToUse.base, DISPLAY_SCALE);
                drawScaledRect(ctx, outerSegmentX, y, 1, 1, paletteToUse.highlight, DISPLAY_SCALE);
                if (currentOpeningWidth > 0) {
                    drawScaledRect(ctx, openingXStart - 1, y, 1, 1, paletteToUse.shadow, DISPLAY_SCALE);
                }
            }

            const rightPartStartX = openingXStart + currentOpeningWidth;
            const rightPartWidth = (outerSegmentX + effectiveOuterSegmentWidth) - rightPartStartX;
            if (rightPartWidth > 0) {
                drawScaledRect(ctx, rightPartStartX, y, rightPartWidth, 1, paletteToUse.base, DISPLAY_SCALE);
                drawScaledRect(ctx, rightPartStartX + rightPartWidth - 1, y, 1, 1, paletteToUse.shadow, DISPLAY_SCALE);
                 if (currentOpeningWidth > 0) {
                    drawScaledRect(ctx, rightPartStartX, y, 1, 1, paletteToUse.highlight, DISPLAY_SCALE);
                }
            }

            if (currentOpeningWidth > 0) {
                drawScaledRect(ctx, openingXStart, y, currentOpeningWidth, 1, paletteToUse.shadow, DISPLAY_SCALE);
                if (y === openingTopY && currentOpeningWidth > 1) {
                     drawScaledRect(ctx, openingXStart +1, y, currentOpeningWidth -2, 1, paletteToUse.base, DISPLAY_SCALE);
                }
            }
            if (y < hoodTopY + 3 && effectiveOuterSegmentWidth > 2) {
                 drawScaledRect(ctx, robeCenterX - Math.floor(effectiveOuterSegmentWidth * 0.2), y, Math.floor(effectiveOuterSegmentWidth * 0.4), 1, paletteToUse.highlight, DISPLAY_SCALE);
            }
        }
    } else { // Hood down
        const hoodRestY = robeNecklineY - Math.floor(hoodDepth * 0.1);
        const numFolds = getRandomInt(3, 5);
        const foldMaxHeight = Math.floor(hoodDepth * 0.8 / numFolds);

        for (let i = 0; i < numFolds; i++) {
            const y = hoodRestY + i * Math.floor(foldMaxHeight * 0.7);
            if (y + foldMaxHeight >= LOGICAL_GRID_HEIGHT - CANVAS_PADDING) break;

            const foldProgress = i / (numFolds -1 || 1);
            const currentBaseWidth = hoodWidthAtBase * (1 - foldProgress * 0.3);
            const curveFactor = Math.sin(foldProgress * Math.PI * 0.5) * (currentBaseWidth * 0.15);
            const currentWidth = Math.max(2, Math.floor(currentBaseWidth - curveFactor));

            const currentX = robeCenterX - Math.floor(currentWidth / 2);
            const currentFoldHeight = Math.max(1, foldMaxHeight - getRandomInt(0, Math.floor(foldMaxHeight * 0.3)));

            drawScaledRect(ctx, currentX, y, currentWidth, currentFoldHeight, paletteToUse.base, DISPLAY_SCALE);
            drawScaledRect(ctx, currentX, y, currentWidth, 1, paletteToUse.highlight, DISPLAY_SCALE);
            if (currentFoldHeight > 1) {
                drawScaledRect(ctx, currentX, y + currentFoldHeight -1, currentWidth, 1, paletteToUse.shadow, DISPLAY_SCALE);
                 if (currentWidth > 1) {
                    drawScaledRect(ctx, currentX, y + 1, 1, currentFoldHeight - 2, paletteToUse.highlight, DISPLAY_SCALE);
                    drawScaledRect(ctx, currentX + currentWidth - 1, y + 1, 1, currentFoldHeight - 2, paletteToUse.shadow, DISPLAY_SCALE);
                }
            }
        }
    }
}


/**
 * Draws decorations like trim or a belt.
 */
function drawRobeDecorations(ctx, decorationDetails, bodyShapeInfo, actualLength, topY, centerX, mainPalette) {
    const { hasTrim, trimPalette, trimStyle, hasBelt, beltPalette, beltStyle, hasSymbol, symbolPalette, symbolShape } = decorationDetails;

    if (hasTrim && trimPalette) {
        const trimWidth = (trimStyle === 'wide_band') ? getRandomInt(2,3) : 1;
        const hemY = topY + actualLength - trimWidth;
        const hemRow = bodyShapeInfo.find(row => row.y === hemY) || bodyShapeInfo[bodyShapeInfo.length -1];
        if (hemRow) {
            for (let w = 0; w < trimWidth; w++) {
                const currentY = hemY + w - (trimWidth -1);
                const rowForThisTrim = bodyShapeInfo.find(r => r.y === currentY) || hemRow;
                if (!rowForThisTrim) continue;
                let color = trimPalette.base;
                if (w === 0 && trimWidth > 1) color = trimPalette.highlight;
                else if (w === trimWidth -1 && trimWidth > 1) color = trimPalette.shadow;
                drawScaledRect(ctx, rowForThisTrim.xStart, currentY, rowForThisTrim.width, 1, color, DISPLAY_SCALE);

                if (trimStyle === 'patterned_dots' && w === Math.floor(trimWidth/2)) {
                    for(let tx = rowForThisTrim.xStart; tx < rowForThisTrim.xStart + rowForThisTrim.width; tx += 3) {
                        drawScaledRect(ctx, tx, currentY, 1, 1, trimPalette.highlight, DISPLAY_SCALE);
                    }
                } else if (trimStyle === 'runic_border' && w === Math.floor(trimWidth/2)) {
                    for(let tx = rowForThisTrim.xStart + 1; tx < rowForThisTrim.xStart + rowForThisTrim.width -1; tx += getRandomInt(4,6)) {
                        drawScaledRect(ctx, tx, currentY -1, 1, 3, trimPalette.shadow, DISPLAY_SCALE);
                        if (Math.random() < 0.5) drawScaledRect(ctx, tx + (Math.random() < 0.5 ? -1:1), currentY, 1,1, trimPalette.shadow, DISPLAY_SCALE);
                    }
                }
            }
        }

        if (bodyShapeInfo.length > 0) {
            for(let i=0; i < bodyShapeInfo.length * 0.25; i++){
                const row = bodyShapeInfo[i];
                if (!row) continue;
                for (let w = 0; w < trimWidth; w++) {
                    let color = trimPalette.base;
                     if (w === 0 && trimWidth > 1) color = trimPalette.highlight;

                    if (row.drawLeftShoulder) drawScaledRect(ctx, row.xStart + w, row.y, 1, 1, color, DISPLAY_SCALE);
                    if (row.drawRightShoulder) drawScaledRect(ctx, row.xStart + row.width - 1 - w, row.y, 1, 1, color, DISPLAY_SCALE);
                    if (row.leftShoulderEndX !== row.xStart + row.width) {
                        drawScaledRect(ctx, row.leftShoulderEndX - 1 - w, row.y, 1, 1, color, DISPLAY_SCALE);
                        drawScaledRect(ctx, row.rightShoulderStartX + w, row.y, 1, 1, color, DISPLAY_SCALE);
                    }
                }
            }
        }
    }

    if (hasBelt && beltPalette) {
        const beltHeight = (beltStyle === 'wide_sash') ? getRandomInt(5,8) : getRandomInt(2, 4);
        const beltY = topY + Math.floor(actualLength * getRandomInRange(0.35, 0.45));
        const bodyRowForBelt = bodyShapeInfo.find(row => row.y >= beltY && row.y < beltY + beltHeight) || bodyShapeInfo[Math.floor(bodyShapeInfo.length/2)];
        if (!bodyRowForBelt) return;
        const beltWidth = bodyRowForBelt.width;
        const beltX = bodyRowForBelt.xStart;

        for (let h = 0; h < beltHeight; h++) {
            let color = beltPalette.base;
            if (h === 0 && beltHeight > 1) color = beltPalette.highlight;
            else if (h === beltHeight -1 && beltHeight > 1) color = beltPalette.shadow;
            drawScaledRect(ctx, beltX, beltY + h, beltWidth, 1, color, DISPLAY_SCALE);

            if (beltStyle === 'wide_sash' && h > 0 && h < beltHeight -1 && h % 2 === 0) {
                 drawScaledRect(ctx, beltX + getRandomInt(1,3), beltY + h, beltWidth - getRandomInt(2,5), 1, beltPalette.shadow, DISPLAY_SCALE);
            } else if (beltStyle === 'jeweled_belt' && h === Math.floor(beltHeight/2)) {
                const gemPalette = getPalette(getRandomElement(['GEM_RED', 'GEM_BLUE', 'GEM_GREEN']));
                for (let gx = beltX + 2; gx < beltX + beltWidth - 2; gx += 5){
                    drawScaledRect(ctx, gx, beltY + h, 2, 1, gemPalette.base, DISPLAY_SCALE);
                    drawScaledRect(ctx, gx, beltY + h, 1, 1, gemPalette.highlight, DISPLAY_SCALE);
                }
            }
        }


        if (beltStyle === 'buckle' && beltWidth > 5 && beltHeight > 1) {
            const buckleSize = beltHeight + getRandomInt(1,2);
            const buckleX = centerX - Math.floor(buckleSize / 2);
            const buckleY = beltY - Math.floor((buckleSize - beltHeight)/2) ;
            const buckleMetalPalette = getPalette(getRandomElement(['SILVER', 'GOLD', 'BRONZE', 'STEEL']));
            drawScaledRect(ctx, buckleX, buckleY, buckleSize, buckleSize, buckleMetalPalette.base, DISPLAY_SCALE);
            drawScaledRect(ctx, buckleX, buckleY, 1, buckleSize, buckleMetalPalette.highlight, DISPLAY_SCALE);
        }
    }

    if (hasSymbol && symbolPalette && symbolShape) {
        const chestY = topY + Math.floor(actualLength * 0.25);
        const bodyRowForSymbol = bodyShapeInfo.find(row => row.y >= chestY) || bodyShapeInfo[Math.floor(bodyShapeInfo.length * 0.25)];
        if (!bodyRowForSymbol) return;

        const availableWidth = bodyRowForSymbol.width * 0.6;
        const availableHeight = actualLength * 0.2;
        const symbolSizeBase = Math.min(availableWidth, availableHeight, 16);
        const symbolSize = Math.max(6, Math.floor(symbolSizeBase));

        const symbolCenterX = centerX;
        const symbolCenterY = chestY + Math.floor(symbolSize/3);

        if (symbolShape === 'circle') {
            const radius = Math.floor(symbolSize / 2);
            for (let dy = -radius; dy <= radius; dy++) {
                for (let dx = -radius; dx <= radius; dx++) {
                    if (dx * dx + dy * dy <= radius * radius) {
                        if (bodyShapeInfo.some(r => r.y === symbolCenterY + dy && symbolCenterX + dx >= r.xStart && symbolCenterX + dx < r.xStart + r.width))
                            drawScaledRect(ctx, symbolCenterX + dx, symbolCenterY + dy, 1, 1, symbolPalette.base, DISPLAY_SCALE);
                    }
                }
            }
        } else if (symbolShape === 'single_rune') {
            // MODIFIED: Abstract rune drawing logic
            const runeThickness = Math.max(1, Math.floor(symbolSize / 5));
            const rx = symbolCenterX - Math.floor(symbolSize / 2);
            const ry = symbolCenterY - Math.floor(symbolSize / 2);
            const runeType = getRandomInt(1, 4); // 4 different simple rune patterns

            if (runeType === 1) { // Vertical line with two horizontal arms
                for (let r = 0; r < symbolSize; r++) { // Main vertical
                    if (bodyShapeInfo.some(row => row.y === ry + r && rx + Math.floor(symbolSize/2) - Math.floor(runeThickness/2) >= row.xStart && rx + Math.floor(symbolSize/2) + Math.ceil(runeThickness/2) <= row.xStart + row.width))
                        drawScaledRect(ctx, rx + Math.floor(symbolSize/2) - Math.floor(runeThickness/2), ry + r, runeThickness, 1, symbolPalette.base, DISPLAY_SCALE);
                }
                for (let r = 0; r < Math.floor(symbolSize / 2); r++) { // Top arm
                     if (bodyShapeInfo.some(row => row.y === ry + Math.floor(symbolSize * 0.25) && rx + r >= row.xStart && rx + r + runeThickness <= row.xStart + row.width))
                        drawScaledRect(ctx, rx + r, ry + Math.floor(symbolSize * 0.25), runeThickness, 1, symbolPalette.base, DISPLAY_SCALE);
                }
                 for (let r = 0; r < Math.floor(symbolSize / 2); r++) { // Bottom arm (offset)
                     if (bodyShapeInfo.some(row => row.y === ry + Math.floor(symbolSize * 0.75) && rx + Math.floor(symbolSize/2) + r >= row.xStart && rx + Math.floor(symbolSize/2) + r + runeThickness <= row.xStart + row.width))
                        drawScaledRect(ctx, rx + Math.floor(symbolSize/2) + r, ry + Math.floor(symbolSize * 0.75), runeThickness, 1, symbolPalette.base, DISPLAY_SCALE);
                }
            } else if (runeType === 2) { // Angled lines (like > or <)
                for (let r = 0; r < symbolSize; r++) {
                    const x1 = rx + r;
                    const y1 = ry + Math.floor(symbolSize/2) - Math.floor(r/2);
                    const x2 = rx + r;
                    const y2 = ry + Math.floor(symbolSize/2) + Math.floor(r/2);
                    if (bodyShapeInfo.some(row => row.y === y1 && x1 >= row.xStart && x1 + runeThickness <= row.xStart + row.width))
                        drawScaledRect(ctx, x1, y1, runeThickness, 1, symbolPalette.base, DISPLAY_SCALE);
                    if (bodyShapeInfo.some(row => row.y === y2 && x2 >= row.xStart && x2 + runeThickness <= row.xStart + row.width))
                        drawScaledRect(ctx, x2, y2, runeThickness, 1, symbolPalette.base, DISPLAY_SCALE);
                }
            } else if (runeType === 3) { // Triangle-like shape
                for (let r = 0; r < symbolSize; r++) {
                    const currentWidth = Math.max(runeThickness, Math.floor(symbolSize * (r / (symbolSize - 1 || 1))));
                    const startX = rx + Math.floor((symbolSize - currentWidth) / 2);
                     if (bodyShapeInfo.some(row => row.y === ry + r && startX >= row.xStart && startX + currentWidth <= row.xStart + row.width))
                        drawScaledRect(ctx, startX, ry + r, currentWidth, runeThickness, symbolPalette.base, DISPLAY_SCALE);
                }
            } else { // Z-like or N-like shape
                for (let r = 0; r < symbolSize; r++) { // Top horizontal
                    if (bodyShapeInfo.some(row => row.y === ry && rx + r >= row.xStart && rx + r + runeThickness <= row.xStart + row.width))
                        drawScaledRect(ctx, rx + r, ry, runeThickness, 1, symbolPalette.base, DISPLAY_SCALE);
                }
                for (let r = 0; r < symbolSize; r++) { // Diagonal
                    if (bodyShapeInfo.some(row => row.y === ry + r && rx + r >= row.xStart && rx + r + runeThickness <= row.xStart + row.width))
                        drawScaledRect(ctx, rx + r, ry + r, runeThickness, 1, symbolPalette.base, DISPLAY_SCALE);
                }
                for (let r = 0; r < symbolSize; r++) { // Bottom horizontal
                     if (bodyShapeInfo.some(row => row.y === ry + symbolSize - runeThickness && rx + r >= row.xStart && rx + r + runeThickness <= row.xStart + row.width))
                        drawScaledRect(ctx, rx + r, ry + symbolSize - runeThickness, runeThickness, 1, symbolPalette.base, DISPLAY_SCALE);
                }
            }
        } else if (symbolShape === 'crescent_moon_symbol') {
             const crescentOuterRadius = Math.floor(symbolSize / 2);
             const crescentThickness = Math.max(1, Math.floor(crescentOuterRadius / 3));
             const crescentInnerRadius = crescentOuterRadius - crescentThickness;
             for (let yRel = -crescentOuterRadius; yRel <= crescentOuterRadius; yRel++) {
                for (let xRel = -crescentOuterRadius; xRel <= crescentOuterRadius; xRel++) {
                    const distSq = xRel * xRel + yRel * yRel;
                    if (distSq <= crescentOuterRadius * crescentOuterRadius && distSq > crescentInnerRadius * crescentInnerRadius) {
                        if (xRel < Math.floor(crescentInnerRadius * 0.2)) {
                             if (bodyShapeInfo.some(r => r.y === symbolCenterY + yRel && symbolCenterX + xRel >= r.xStart && symbolCenterX + xRel < r.xStart + r.width))
                                drawScaledRect(ctx, symbolCenterX + xRel, symbolCenterY + yRel, 1, 1, symbolPalette.highlight, DISPLAY_SCALE);
                        }
                    }
                }
            }
        } else if (symbolShape === 'star_symbol') {
            const armLength = Math.floor(symbolSize / 2);
            const armThickness = Math.max(1, Math.floor(symbolSize / 5));
            for(let i = -armLength; i <= armLength; i++) {
                if (bodyShapeInfo.some(r => r.y === symbolCenterY + i && symbolCenterX - Math.floor(armThickness/2) >= r.xStart && symbolCenterX + Math.ceil(armThickness/2) <= r.xStart+r.width))
                 drawScaledRect(ctx, symbolCenterX - Math.floor(armThickness/2), symbolCenterY + i, armThickness, 1, symbolPalette.base, DISPLAY_SCALE);
            }
            for(let i = -armLength; i <= armLength; i++) {
                 if (bodyShapeInfo.some(r => r.y === symbolCenterY - Math.floor(armThickness/2) && symbolCenterX + i >= r.xStart && symbolCenterX + i + armThickness <= r.xStart+r.width))
                 drawScaledRect(ctx, symbolCenterX + i, symbolCenterY - Math.floor(armThickness/2), 1, armThickness, symbolPalette.base, DISPLAY_SCALE);
            }
        }
    }
}


/**
 * Generates a procedural robe.
 */
export function generateRobe(options = {}) {
    console.log("generateRobe called with options:", options);

    const offscreenCanvas = document.createElement('canvas');
    offscreenCanvas.width = CANVAS_WIDTH;
    offscreenCanvas.height = CANVAS_HEIGHT;
    const ctx = offscreenCanvas.getContext('2d');

    if (!ctx) {
        console.error("Failed to get 2D context for offscreen canvas in generateRobe.");
        return { type: 'robe', name: 'Error Robe', seed: Date.now(), itemData: { error: "Canvas context failed" }, imageDataUrl: createErrorDataURL("CTX Fail") };
    }
    ctx.imageSmoothingEnabled = false;
    ctx.clearRect(0, 0, CANVAS_WIDTH, CANVAS_HEIGHT);

    const robeColorPalettes = [
        'RED_PAINT', 'BLUE_PAINT', 'GREEN_PAINT', 'PURPLE_PAINT', 'BLACK_PAINT',
        'WHITE_PAINT', 'YELLOW_PAINT', 'ENCHANTED', 'OBSIDIAN', 'LEATHER', 'BONE',
        'DARK_STEEL', 'IVORY', 'GEM_PURPLE', 'GEM_BLUE', 'STONE',
        MATERIAL_PALETTES.GREEN_LEAF ? 'GREEN_LEAF' : 'GREEN_PAINT',
        MATERIAL_PALETTES.PAPER ? 'PAPER' : 'WHITE_PAINT'
    ].filter(p => p);
    const mainMaterialName = getRandomElement(robeColorPalettes);
    const mainPalette = getPalette(mainMaterialName);

    const robeLengthTypes = ['short', 'medium', 'long'];
    const robeLengthType = getRandomElement(robeLengthTypes);

    const robeBodyStyles = ['a_line', 'flowing', 'gentle_s_curve'];
    const robeBodyStyle = getRandomElement(robeBodyStyles);

    const shoulderWidth = getRandomInt(Math.floor(LOGICAL_GRID_WIDTH * 0.22), Math.floor(LOGICAL_GRID_WIDTH * 0.35));
    const flareAmount = getRandomInt(Math.floor(shoulderWidth * 0.15), Math.floor(shoulderWidth * 1.0));

    const necklineTypes = ['v_neck', 'round_neck', 'closed_high'];
    const necklineType = getRandomElement(necklineTypes);

    const sleeveTypes = ['straight', 'flared', 'bishop'];
    const sleeveType = getRandomElement(sleeveTypes);
    const sleeveLengthTypes = ['short', 'three_quarter', 'long'];
    const sleeveLengthType = getRandomElement(sleeveLengthTypes);
    let cuffPalette = null;
    if (sleeveType === 'bishop' || Math.random() < 0.3) {
        const cuffMaterials = ['LEATHER', 'GOLD', 'SILVER', 'BRONZE', (mainMaterialName === 'WHITE_PAINT' ? 'BLACK_PAINT' : 'WHITE_PAINT')];
        cuffPalette = getPalette(getRandomElement(cuffMaterials));
    }


    const hasHood = Math.random() < 0.6;
    const hoodUp = hasHood && Math.random() < 0.5;
    let hoodPalette = null;
    if (hasHood && Math.random() < 0.4) {
        const hoodMaterials = robeColorPalettes.filter(m => m !== mainMaterialName);
        if (hoodMaterials.length > 0) hoodPalette = getPalette(getRandomElement(hoodMaterials));
    }

    const hasTrim = Math.random() < 0.7;
    let trimPalette = null;
    const trimStyles = ['thin_line', 'wide_band', 'patterned_dots', 'runic_border'];
    let trimStyle = 'thin_line';
    if (hasTrim) {
        trimStyle = getRandomElement(trimStyles);
        const trimMaterials = ['GOLD', 'SILVER', 'ENCHANTED', (mainMaterialName === 'LEATHER' ? 'BONE' : 'LEATHER'), 'WHITE_PAINT', 'BLACK_PAINT', 'COPPER'];
        trimPalette = getPalette(getRandomElement(trimMaterials));
    }

    const hasBelt = Math.random() < 0.65;
    let beltPalette = null;
    const beltStyles = ['simple_sash', 'buckle', 'wide_sash', 'jeweled_belt'];
    let beltStyle = 'simple_sash';
    if (hasBelt) {
        beltStyle = getRandomElement(beltStyles);
        const beltMaterials = ['LEATHER', 'DARK_STEEL', 'BRONZE', 'SILVER', 'GOLD', 'ROPE_BROWN'];
        if (!MATERIAL_PALETTES.ROPE_BROWN) MATERIAL_PALETTES.ROPE_BROWN = {name: 'Rope Brown', base: '#8B4513', shadow: '#5C2E0D', highlight: '#A0522D'};
        beltPalette = getPalette(getRandomElement(beltMaterials));
    }

    const hasSymbol = Math.random() < 0.4;
    let symbolPalette = null;
    let symbolShape = null;
    if (hasSymbol) {
        const symbolMaterials = ['GOLD', 'SILVER', 'ENCHANTED', 'OBSIDIAN', 'BONE', 'RED_PAINT', 'BLUE_PAINT', 'PURPLE_PAINT'];
        symbolPalette = getPalette(getRandomElement(symbolMaterials));
        symbolShape = getRandomElement(['circle', 'single_rune', 'diamond', 'crescent_moon_symbol', 'star_symbol']);
    }


    const robeCenterX = Math.floor(LOGICAL_GRID_WIDTH / 2);

    let estimatedActualLength;
    if (robeLengthType === 'short') {
        estimatedActualLength = Math.floor(LOGICAL_GRID_HEIGHT * 0.50);
    } else if (robeLengthType === 'medium') {
        estimatedActualLength = Math.floor(LOGICAL_GRID_HEIGHT * 0.70);
    } else { // long
        estimatedActualLength = Math.floor(LOGICAL_GRID_HEIGHT * 0.90);
    }
    const robeTopY = Math.max(CANVAS_PADDING, Math.floor((LOGICAL_GRID_HEIGHT - estimatedActualLength) / 2));


    const sleeveAttachmentPoints = { leftShoulderX: 0, rightShoulderX: 0, shoulderTopY: 0, shoulderActualWidth: 0 };

    const robeBodyDetails = {
        robeLengthType, mainPalette, shoulderWidth, flareAmount, necklineType, sleeveAttachmentPoints, robeBodyStyle
    };
    const bodyInfo = drawRobeBody(ctx, robeBodyDetails, robeCenterX, robeTopY);

    const sleeveDetailsToDraw = {
        sleeveType, sleeveLengthType, mainPalette, cuffPalette, shoulderWidth
    };
    drawSleeves(ctx, sleeveDetailsToDraw, bodyInfo.bodyShapeInfo, sleeveAttachmentPoints);

    if (hasHood) {
        const hoodDetailsToDraw = { hasHood, hoodUp, hoodPalette: hoodPalette || mainPalette };
        let hoodAnchorY = robeTopY + bodyInfo.necklineDepth;
        if (necklineType === 'closed_high') hoodAnchorY = robeTopY + 1;
        drawHood(ctx, hoodDetailsToDraw, hoodAnchorY, bodyInfo.shoulderWidth, robeCenterX, mainPalette);
    }

    const decorationDetailsToDraw = {
        hasTrim, trimPalette, trimStyle, hasBelt, beltPalette, beltStyle, hasSymbol, symbolPalette, symbolShape
    };
    drawRobeDecorations(ctx, decorationDetailsToDraw, bodyInfo.bodyShapeInfo, bodyInfo.actualLength, robeTopY, robeCenterX, mainPalette);


    let itemName = `${mainPalette.name} ${robeBodyStyle.replace('_',' ')} ${robeLengthType} Robe`;
    if (hasHood) itemName += ` (${hoodUp ? 'Hood Up' : 'Hood Down'})`;
    itemName += ` (${sleeveLengthType.replace('_','-')} ${sleeveType} sleeves)`;
    if (hasTrim && trimPalette) itemName += ` with ${trimPalette.name} ${trimStyle.replace('_',' ')} Trim`;
    if (hasBelt && beltPalette) itemName += ` and ${beltPalette.name} ${beltStyle.replace('_',' ')}`;
    if (hasSymbol && symbolPalette) itemName += ` with ${symbolPalette.name} ${symbolShape.replace('_symbol','')} Symbol`;


    const itemSeed = options.seed || Date.now();

    const generatedItemData = {
        type: 'robe',
        name: itemName,
        seed: itemSeed,
        itemData: {
            mainMaterial: mainMaterialName.toLowerCase(),
            robeBodyStyle,
            length: robeLengthType,
            sleeveType,
            sleeveLength: sleeveLengthType,
            neckline: necklineType,
            hasHood,
            hoodUp,
            hoodMaterial: (hasHood && hoodPalette) ? hoodPalette.name.toLowerCase() : null,
            hasTrim,
            trimMaterial: (hasTrim && trimPalette) ? trimPalette.name.toLowerCase() : null,
            trimStyle,
            hasBelt,
            beltMaterial: (hasBelt && beltPalette) ? beltPalette.name.toLowerCase() : null,
            beltStyle,
            hasSymbol,
            symbolMaterial: (hasSymbol && symbolPalette) ? symbolPalette.name.toLowerCase() : null,
            symbolShape,
            colors: {
                main: mainPalette,
                cuff: cuffPalette,
                hood: hoodPalette,
                trim: trimPalette,
                belt: beltPalette,
                symbol: symbolPalette
            }
        },
        imageDataUrl: offscreenCanvas.toDataURL()
    };

    console.log("Robe generated:", generatedItemData.name);
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
        const fontSize = Math.floor(CANVAS_WIDTH / 12);
        ctx.font = `bold ${fontSize}px sans-serif`; ctx.fillStyle = 'white';
        ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
        ctx.fillText(message, CANVAS_WIDTH / 2, CANVAS_HEIGHT / 2);
        try { return errorCanvas.toDataURL(); } catch (e) { console.error("Error converting error canvas to Data URL:", e); }
    }
    return "data:image/gif;base64,R0lGODlhAQABAIAAAAAAAP///yH5BAEAAAAALAAAAAABAAEAAAIBRAA7";
}

console.log("js/generators/robe_generator.js loaded with more shape, fitting, palette, and decoration variety.");
