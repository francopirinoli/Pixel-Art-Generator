/**
 * js/generators/hat_generator.js
 * Contains the logic for procedurally generating hats.
 */

import { getRandomInt, getRandomElement, drawScaledRect, getRandomInRange } from '../utils.js';
import { getPalette, MATERIAL_PALETTES } from '../palettes/material_palettes.js';

// --- Constants specific to hat generation or drawing ---
const LOGICAL_GRID_WIDTH = 64;
const LOGICAL_GRID_HEIGHT = 64;
const DISPLAY_SCALE = 4;
const CANVAS_WIDTH = LOGICAL_GRID_WIDTH * DISPLAY_SCALE;
const CANVAS_HEIGHT = LOGICAL_GRID_HEIGHT * DISPLAY_SCALE;
const CANVAS_PADDING = 4;

// --- Internal helper functions for drawing hat components ---

/**
 * Calculates the width of the crown at a specific Y progress.
 * This is a helper to be used by band decoration to fit correctly.
 */
function getCrownWidthAtProgress(progress, shape, baseWidth, topWidth) {
    if (shape === 'cylindrical') {
        return Math.round(topWidth + (baseWidth - topWidth) * (1 - progress));
    } else if (shape === 'flat_top_wide') {
        return Math.round(baseWidth - (baseWidth - topWidth) * Math.pow(progress, 0.7));
    } else if (shape === 'conical') {
        const curvedProgress = Math.pow(progress, 0.85); // Match the drawing logic's curve
        return Math.max(1, Math.round(topWidth + (baseWidth - topWidth) * curvedProgress));
    } else if (shape === 'domed' || shape === 'soft_beanie') {
        // For domed/beanie, progress is 0 at top, 1 at base.
        // We need to map y-coordinate progress to the width calculation.
        // This is a simplified approximation assuming y goes from crownTopY to crownBaseY.
        const radiusY = baseWidth / 2; // Approximation
        const yRel = radiusY * (1 - progress); // yRel from center of dome base
        const widthFactor = Math.sqrt(Math.max(0,1 - Math.pow(yRel / radiusY, 2)));
        let currentWidth = Math.floor(baseWidth * widthFactor);
         if (shape === 'soft_beanie') { // Apply similar slouch logic if needed
            const slouchFactor = Math.sin((1-progress) * Math.PI * 0.8) * (baseWidth * 0.1);
            currentWidth += Math.floor(slouchFactor);
        }
        return Math.max(1,currentWidth);
    }
    return baseWidth; // Fallback
}


/**
 * Draws the crown of the hat.
 * @param {CanvasRenderingContext2D} ctx - The drawing context.
 * @param {object} crownDetails - Properties like shape, height, baseWidth, topWidth, palette.
 * @param {number} centerX - Logical X center for the hat.
 * @param {number} crownBaseY - Logical Y for the base of the crown.
 * @returns {object} { crownTopY, actualCrownHeight, crownShapeInfo: [{y, width, x}] }
 */
function drawHatCrown(ctx, crownDetails, centerX, crownBaseY) {
    const {
        shape, 
        height,
        baseWidth,
        topWidth, 
        palette
    } = crownDetails;

    let crownTopY = crownBaseY - height;
    let actualCrownHeight = height;
    const crownShapeInfo = []; // To store width at each Y for decorations

    if (crownTopY < CANVAS_PADDING) {
        crownTopY = CANVAS_PADDING;
        actualCrownHeight = crownBaseY - crownTopY;
        if (actualCrownHeight <= 0) return { crownTopY: crownBaseY, actualCrownHeight: 0, crownShapeInfo };
    }


    if (shape === 'cylindrical' || shape === 'flat_top_wide') {
        for (let i = 0; i < actualCrownHeight; i++) {
            const y = crownTopY + i;
            const progress = (actualCrownHeight <= 1) ? 0 : i / (actualCrownHeight - 1);
            const currentWidth = (shape === 'flat_top_wide') ?
                                 Math.round(baseWidth - (baseWidth - topWidth) * Math.pow(progress, 0.7)) : 
                                 Math.round(topWidth + (baseWidth - topWidth) * (1 - progress)); 

            const x = centerX - Math.floor(currentWidth / 2);
            drawScaledRect(ctx, x, y, currentWidth, 1, palette.base, DISPLAY_SCALE);
            if (currentWidth > 1) {
                drawScaledRect(ctx, x, y, 1, 1, palette.highlight, DISPLAY_SCALE);
                drawScaledRect(ctx, x + currentWidth - 1, y, 1, 1, palette.shadow, DISPLAY_SCALE);
            }
            crownShapeInfo.push({y, width: currentWidth, x});
        }
        const topFlatX = centerX - Math.floor(topWidth / 2);
        drawScaledRect(ctx, topFlatX, crownTopY, topWidth, 1, palette.highlight, DISPLAY_SCALE);
        const topRowInfo = crownShapeInfo.find(s => s.y === crownTopY);
        if(topRowInfo) {
            topRowInfo.width = topWidth; 
            topRowInfo.x = topFlatX;
        } else {
            crownShapeInfo.push({y: crownTopY, width: topWidth, x: topFlatX });
        }


    } else if (shape === 'conical') {
        const bendDirection = getRandomElement([-1, 1]); 
        const bendFrequency = getRandomInRange(1.2, 2.5); 
        const tipBendIntensity = getRandomInRange(0.05, 0.15); 

        for (let i = 0; i < actualCrownHeight; i++) {
            const y = crownTopY + i;
            const progress = (actualCrownHeight <= 1) ? 0 : i / (actualCrownHeight - 1); 
            
            const curvedProgress = Math.pow(progress, 0.85); 
            let currentWidth = Math.max(1, Math.round(topWidth + (baseWidth - topWidth) * curvedProgress));


            let bendOffset = 0;
            if (actualCrownHeight > 15 && topWidth === 1) { 
                bendOffset = Math.round(Math.sin(progress * Math.PI * bendFrequency) * (baseWidth * 0.08) * bendDirection);
                if (progress < 0.3) {
                    const tipProgress = progress / 0.3; 
                    bendOffset += Math.round(Math.sin(tipProgress * Math.PI) * (baseWidth * tipBendIntensity) * bendDirection);
                }
                if (progress > 0.1 && progress < 0.9 && currentWidth > 2) {
                    currentWidth += getRandomInRange(-1,1) > 0 ? 1 : -1 * Math.min(1, Math.floor(currentWidth * 0.05));
                    currentWidth = Math.max(1, currentWidth);
                }
            }

            const x = centerX - Math.floor(currentWidth / 2) + bendOffset;
            drawScaledRect(ctx, x, y, currentWidth, 1, palette.base, DISPLAY_SCALE);
            crownShapeInfo.push({y, width: currentWidth, x});

            if (currentWidth > 1) {
                const highlightSide = (bendOffset > 0 && progress < 0.7 && topWidth === 1) ? x : x + currentWidth - 1;
                const shadowSide = (bendOffset > 0 && progress < 0.7 && topWidth === 1) ? x + currentWidth - 1 : x;
                drawScaledRect(ctx, highlightSide, y, 1, 1, palette.highlight, DISPLAY_SCALE);
                drawScaledRect(ctx, shadowSide, y, 1, 1, palette.shadow, DISPLAY_SCALE);
            } else if (currentWidth === 1) { 
                 drawScaledRect(ctx, x, y, 1, 1, palette.highlight, DISPLAY_SCALE);
            }
        }
        if (topWidth > 1) { // Ensure top of non-pointed conical hats are shaded.
            const topX = centerX - Math.floor(topWidth / 2);
             drawScaledRect(ctx, topX, crownTopY, topWidth, 1, palette.highlight, DISPLAY_SCALE);
             const topRowInfo = crownShapeInfo.find(s => s.y === crownTopY);
             if(topRowInfo) { 
                 topRowInfo.width = topWidth;
                 topRowInfo.x = topX;
             } else { 
                 crownShapeInfo.unshift({y: crownTopY, width: topWidth, x: topX }); 
             }
        }


    } else if (shape === 'domed' || shape === 'soft_beanie') {
        const radiusX = Math.floor(baseWidth / 2);
        const radiusY = actualCrownHeight;
        for (let yRel = 0; yRel < radiusY; yRel++) { 
            const y = crownTopY + yRel;
            const verticalProgress = yRel / (radiusY - 1 || 1); // Progress from top (0) to base (1) of dome
            // Calculate width based on ellipse formula, ensuring it's 0 at the very top (yRel=0) and baseWidth at yRel=radiusY-1
            const widthFactor = Math.sqrt(Math.max(0,1 - Math.pow((yRel - radiusY) / radiusY, 2))); 
            let currentWidth = Math.floor(baseWidth * widthFactor);

            if (shape === 'soft_beanie') {
                // Slouch effect: more pronounced towards the top, diminishes at base
                const slouchFactor = Math.sin(verticalProgress * Math.PI * 0.8) * (baseWidth * 0.1); // Max slouch near middle-top
                currentWidth += Math.floor(slouchFactor);
                // Slight pull-in at the very top for beanie
                if (yRel < radiusY * 0.3) {
                     currentWidth -= Math.floor(baseWidth * 0.05 * (1 - yRel/(radiusY*0.3)));
                }
                 // Gentle fold/crease near the base for beanies
                if (yRel > radiusY * 0.6) {
                    currentWidth -= Math.floor(Math.sin((verticalProgress -0.6) * Math.PI) * (baseWidth * 0.08));
                }
            }
            currentWidth = Math.max(1, currentWidth);
            const x = centerX - Math.floor(currentWidth / 2);

            drawScaledRect(ctx, x, y, currentWidth, 1, palette.base, DISPLAY_SCALE);
            crownShapeInfo.push({y, width: currentWidth, x});
            if (currentWidth > 1) {
                drawScaledRect(ctx, x, y, 1, 1, palette.highlight, DISPLAY_SCALE);
                drawScaledRect(ctx, x + currentWidth - 1, y, 1, 1, palette.shadow, DISPLAY_SCALE);
            }
            // Highlight on top of dome/beanie
            if (yRel < radiusY * 0.3 && currentWidth > 2) { 
                 drawScaledRect(ctx, centerX - Math.floor(currentWidth*0.3/2), y, Math.floor(currentWidth*0.3), 1, palette.highlight, DISPLAY_SCALE);
            }
        }
    }
    crownShapeInfo.sort((a, b) => a.y - b.y); // Ensure sorted by Y for later use
    return { crownTopY, actualCrownHeight, crownShapeInfo };
}


/**
 * Draws the brim of the hat.
 */
function drawHatBrim(ctx, brimDetails, centerX, crownBaseY, crownWidthAtBase) {
    const {
        shape, 
        brimWidthExtension, 
        palette
    } = brimDetails;

    if (shape === 'none' || brimWidthExtension <= 0) return;

    const totalBrimOuterWidth = crownWidthAtBase + brimWidthExtension * 2;
    const brimThickness = getRandomInt(1,3); 

    if (shape === 'flat_circular' || shape === 'downward_curved' || shape === 'upward_curved') {
        const outerRadiusX = Math.floor(totalBrimOuterWidth / 2);
        const innerRadiusX = Math.floor(crownWidthAtBase / 2);

        for (let t = 0; t < brimThickness; t++) { 
            const layerBaseY = crownBaseY + t; 

            for (let xRel = -outerRadiusX; xRel <= outerRadiusX; xRel++) {
                const x = centerX + xRel;

                // Only draw pixels that are part of the brim (outside inner radius, inside outer radius)
                if (Math.abs(xRel) >= innerRadiusX && Math.abs(xRel) < outerRadiusX) {
                    const normalizedXForCurve = (Math.abs(xRel) - innerRadiusX) / (outerRadiusX - innerRadiusX || 1);
                    
                    let yCurveOffset = 0;
                    if (shape === 'downward_curved') {
                        yCurveOffset = Math.floor(Math.pow(normalizedXForCurve, 1.5) * (brimWidthExtension * 0.15)); 
                    } else if (shape === 'upward_curved') {
                        yCurveOffset = -Math.floor(Math.pow(normalizedXForCurve, 1.5) * (brimWidthExtension * 0.15));
                    }

                    const finalDrawY = layerBaseY + yCurveOffset;

                    let color = palette.base;
                    if (t === 0 && brimThickness > 1) { 
                        color = palette.highlight;
                    } else if (t === brimThickness - 1 && brimThickness > 1) { 
                        color = palette.shadow;
                    }
                    // Edge shading for the brim's outer edge
                    if (Math.abs(xRel) >= outerRadiusX -1 ) { 
                         color = (xRel > 0 && xRel > innerRadiusX) ? palette.shadow : (xRel < 0 && xRel < -innerRadiusX ? palette.highlight : color);
                    }
                    drawScaledRect(ctx, x, finalDrawY, 1, 1, color, DISPLAY_SCALE);
                }
            }
        }
        // Shadow where brim meets crown
        if (brimThickness > 0 && crownWidthAtBase > 0 && innerRadiusX > 0) {
            drawScaledRect(ctx, centerX - innerRadiusX, crownBaseY, innerRadiusX * 2, 1, palette.shadow, DISPLAY_SCALE);
        }


    } else if (shape === 'front_cap_bill') {
        const billLength = brimWidthExtension + Math.floor(crownWidthAtBase * 0.2); // Bill extends further
        const billWidth = crownWidthAtBase + 2; // Bill slightly wider than crown base

        for (let i = 0; i < billLength; i++) {
            const y = crownBaseY + i; 
            const progress = i / (billLength -1 || 1); // Progress from crown to tip of bill
            // Bill tapers slightly towards the end
            const currentBillWidth = Math.floor(billWidth * (1 - progress * 0.2));
            const currentBillX = centerX - Math.floor(currentBillWidth / 2);
            // Bill curves downwards
            const yCurveOffset = Math.floor(Math.sin(progress * Math.PI / 2) * 2.5); 

            drawScaledRect(ctx, currentBillX, y + yCurveOffset, currentBillWidth, 1, palette.base, DISPLAY_SCALE);
            if (i === 0) { // Highlight where bill meets crown
                drawScaledRect(ctx, currentBillX, y + yCurveOffset, currentBillWidth, 1, palette.highlight, DISPLAY_SCALE);
            } else if (i === billLength -1) { // Shadow at the tip of the bill
                 drawScaledRect(ctx, currentBillX, y + yCurveOffset, currentBillWidth, 1, palette.shadow, DISPLAY_SCALE);
            }
        }
    }
}

/**
 * Draws helmet features like visors or cheek guards.
 */
function drawHelmetFeatures(ctx, featureDetails, crownShapeInfo, centerX, crownTopY, crownHeight, mainPalette) {
    const { visorType, cheekGuardType, palette } = featureDetails;

    if (visorType && visorType !== 'none' && crownShapeInfo && crownShapeInfo.length > 0) {
        const eyeLevelY = crownTopY + Math.floor(crownHeight * 0.40); 
        let crownRowAtEyeLevel = crownShapeInfo.find(row => row.y === eyeLevelY);
        if (!crownRowAtEyeLevel) { 
            let minDist = Infinity;
            for (const row of crownShapeInfo) {
                const dist = Math.abs(row.y - eyeLevelY);
                if (dist < minDist) {
                    minDist = dist;
                    crownRowAtEyeLevel = row;
                }
            }
        }


        if (crownRowAtEyeLevel) {
            const helmetWidthAtEyes = crownRowAtEyeLevel.width;
            const helmetXAtEyes = crownRowAtEyeLevel.x;
            const visorSlitPixelHeight = 1; 
            const visorColor = palette.outline || palette.shadow; 

            if (visorType === 't_slit') {
                const horizontalSlitWidth = Math.max(3, Math.floor(helmetWidthAtEyes * 0.45));
                const horizontalSlitX = centerX - Math.floor(horizontalSlitWidth / 2);
                
                if (horizontalSlitX >= helmetXAtEyes && horizontalSlitX + horizontalSlitWidth <= helmetXAtEyes + helmetWidthAtEyes) {
                    for (let h = 0; h < visorSlitPixelHeight; h++) {
                        drawScaledRect(ctx, horizontalSlitX, eyeLevelY + h, horizontalSlitWidth, 1, visorColor, DISPLAY_SCALE);
                    }
                }

                const verticalSlitHeight = Math.max(3, Math.floor(crownHeight * 0.30));
                const verticalSlitY = eyeLevelY + visorSlitPixelHeight; 
                const verticalSlitWidth = 1;
                
                if (centerX >= helmetXAtEyes && centerX < helmetXAtEyes + helmetWidthAtEyes && verticalSlitY + verticalSlitHeight < crownTopY + crownHeight) {
                     for (let h = 0; h < verticalSlitHeight; h++) {
                        const currentRowForVertical = crownShapeInfo.find(r => r.y === verticalSlitY + h);
                        if (currentRowForVertical && centerX >= currentRowForVertical.x && centerX < currentRowForVertical.x + currentRowForVertical.width) {
                            drawScaledRect(ctx, centerX, verticalSlitY + h, verticalSlitWidth, 1, visorColor, DISPLAY_SCALE);
                        }
                    }
                }
            } else if (visorType === 'horizontal_slit') {
                const slitWidth = Math.max(4, Math.floor(helmetWidthAtEyes * 0.70));
                const slitX = centerX - Math.floor(slitWidth / 2);
                if (slitX >= helmetXAtEyes && slitX + slitWidth <= helmetXAtEyes + helmetWidthAtEyes) {
                     for (let h = 0; h < visorSlitPixelHeight * 2; h++) { 
                        drawScaledRect(ctx, slitX, eyeLevelY + h, slitWidth, 1, visorColor, DISPLAY_SCALE);
                    }
                }
            }
        }
    }

    if (cheekGuardType && cheekGuardType !== 'none' && crownShapeInfo && crownShapeInfo.length > 0) {
        const cheekGuardHeight = Math.floor(crownHeight * (cheekGuardType === 'extended_cheeks' ? 0.60 : 0.45)); 
        const cheekGuardStartY = crownTopY + Math.floor(crownHeight * 0.25); 
        const baseCheekWidth = Math.floor((crownShapeInfo[0].width || centerX) * 0.28); 

        for (let side = -1; side <= 1; side += 2) {
            for (let i = 0; i < cheekGuardHeight; i++) {
                const y = cheekGuardStartY + i;
                if (y >= crownTopY + crownHeight -1) continue; 

                const row = crownShapeInfo.find(r => r.y === y);
                if (!row) continue;

                const progress = i / (cheekGuardHeight -1 || 1);
                let currentWidth = Math.max(2, Math.floor(baseCheekWidth * (1 - progress * (cheekGuardType === 'extended_cheeks' ? 0.2 : 0.5))));
                
                let x;
                if (side === -1) { 
                    x = row.x - currentWidth + Math.floor(currentWidth * 0.15); 
                } else { 
                    x = row.x + row.width - Math.floor(currentWidth * 0.15) ;
                }
                
                x = Math.max(CANVAS_PADDING, Math.min(x, LOGICAL_GRID_WIDTH - CANVAS_PADDING - currentWidth));
                const effectiveWidth = (x + currentWidth > LOGICAL_GRID_WIDTH - CANVAS_PADDING) ? (LOGICAL_GRID_WIDTH - CANVAS_PADDING - x) : currentWidth;
                if (effectiveWidth <= 0) continue;

                drawScaledRect(ctx, x, y, effectiveWidth, 1, palette.base, DISPLAY_SCALE);
                if (effectiveWidth > 1) {
                    drawScaledRect(ctx, (side === -1 ? x : x + effectiveWidth -1) , y, 1, 1, (side === -1 ? palette.highlight : palette.shadow), DISPLAY_SCALE);
                    drawScaledRect(ctx, (side === -1 ? x + effectiveWidth -1 : x), y, 1, 1, (side === -1 ? palette.shadow : palette.highlight), DISPLAY_SCALE);
                }
            }
        }
    }
}


/**
 * Draws decorations on the hat.
 */
function drawHatDecoration(ctx, decorationDetails, crownBaseY, crownHeight, crownShapeDetails, centerX, crownShapeInfo) {
    const { type, palette, symbolShape, featherLength } = decorationDetails;
    if (type === 'none' || !palette) return;

    if (type === 'band') {
        const bandHeight = getRandomInt(2, 4);
        const bandTopPossibleY = crownBaseY - bandHeight - Math.floor(crownHeight * 0.15);
        const bandBottomPossibleY = crownBaseY - bandHeight;
        const bandY = Math.max(crownBaseY - crownHeight +1 , Math.min(bandTopPossibleY, bandBottomPossibleY));


        for (let h = 0; h < bandHeight; h++) {
            const currentBandY = bandY + h;
            const crownRow = crownShapeInfo.find(row => row.y === currentBandY);
            let bandWidth = crownShapeDetails.baseWidth; 
            let bandX = centerX - Math.floor(bandWidth / 2);

            if (crownRow) {
                bandWidth = crownRow.width + getRandomInt(-1,1); 
                bandX = crownRow.x - Math.floor((bandWidth - crownRow.width)/2) ;
            } else { 
                 const progress = (crownBaseY - currentBandY) / (crownHeight || 1);
                 bandWidth = getCrownWidthAtProgress(1-progress, crownShapeDetails.shape, crownShapeDetails.baseWidth, crownShapeDetails.topWidth) +getRandomInt(-1,1);
                 bandX = centerX - Math.floor(bandWidth/2);
            }
            bandWidth = Math.max(1, bandWidth);
            bandX = Math.max(CANVAS_PADDING, Math.min(bandX, LOGICAL_GRID_WIDTH - CANVAS_PADDING - bandWidth));
            if (bandX + bandWidth > LOGICAL_GRID_WIDTH - CANVAS_PADDING) {
                bandWidth = LOGICAL_GRID_WIDTH - CANVAS_PADDING - bandX;
            }
            if (bandWidth <=0) continue;


            drawScaledRect(ctx, bandX, currentBandY, bandWidth, 1, palette.base, DISPLAY_SCALE);
            if (h === 0 && bandHeight > 1) {
                drawScaledRect(ctx, bandX, currentBandY, bandWidth, 1, palette.highlight, DISPLAY_SCALE);
            } else if (h === bandHeight - 1 && bandHeight > 1) {
                drawScaledRect(ctx, bandX, currentBandY, bandWidth, 1, palette.shadow, DISPLAY_SCALE);
            }
        }

        const lastBandRowY = bandY + bandHeight -1;
        const crownRowForBuckle = crownShapeInfo.find(row => row.y === lastBandRowY) || crownShapeInfo.find(row => row.y >= bandY);
        const actualBandWidthForBuckle = crownRowForBuckle ? crownRowForBuckle.width : crownShapeDetails.baseWidth;

        if (Math.random() < 0.4 && actualBandWidthForBuckle > 4 && bandHeight > 1) {
            const buckleSize = bandHeight;
            const buckleX = (crownRowForBuckle ? crownRowForBuckle.x : centerX - Math.floor(actualBandWidthForBuckle/2)) + Math.floor(actualBandWidthForBuckle * 0.1);
            const bucklePalette = getPalette(getRandomElement(['SILVER', 'GOLD', 'BRONZE']));
            drawScaledRect(ctx, buckleX, bandY, buckleSize, buckleSize, bucklePalette.base, DISPLAY_SCALE);
        }

    } else if (type === 'feather' && featherLength) {
        const attachSide = getRandomElement([-1, 1]); 
        const crownWidthAtAttachLevel = getCrownWidthAtProgress(0.7, crownShapeDetails.shape, crownShapeDetails.baseWidth, crownShapeDetails.topWidth);
        const featherBaseX = centerX + (attachSide * (crownWidthAtAttachLevel / 2 - 1)) + (attachSide * getRandomInt(0,1));
        const featherBaseY = crownBaseY - Math.floor(crownHeight * 0.65) + getRandomInt(-2,2) ; 

        const numSegments = featherLength;
        const maxFeatherWidth = Math.max(2, Math.floor(featherLength / 3.5)); 
        const baseAngle = attachSide * getRandomInRange(Math.PI / 2.8, Math.PI / 2.1); 

        for (let i = 0; i < numSegments; i++) {
            const progress = i / (numSegments - 1 || 1);
            const currentAngle = baseAngle - (Math.pow(progress, 1.5) * Math.PI / 5 * attachSide) ; 
            const x = featherBaseX + Math.round(Math.cos(currentAngle) * i * 0.7); 
            const y = featherBaseY - Math.round(Math.sin(currentAngle) * i * 0.7);

            let width;
            if (progress < 0.15) { 
                width = Math.max(1, Math.round(maxFeatherWidth * 0.2 * (progress / 0.15)));
            } else if (progress < 0.5) { 
                width = Math.max(1, Math.round(maxFeatherWidth * (0.2 + ((progress - 0.15) / 0.35) * 0.8) ));
            } else if (progress > 0.8) { 
                width = Math.max(1, Math.round(maxFeatherWidth * ((1 - progress) / 0.2)));
            } else { 
                width = maxFeatherWidth;
            }
            width = Math.max(1,width);

            drawScaledRect(ctx, x - Math.floor(width/2), y, width, 1, palette.base, DISPLAY_SCALE);
            if (progress > 0.6 && width > 1) { 
                 drawScaledRect(ctx, x + (attachSide === 1 ? Math.floor(width/2) : -Math.floor(width/2)), y, 1, 1, palette.highlight, DISPLAY_SCALE);
            }
             if (progress < 0.3 && width > 0) { 
                 drawScaledRect(ctx, x - Math.floor(width/2), y, width, 1, palette.shadow, DISPLAY_SCALE);
            }
        }
    } else if (type === 'symbol' && symbolShape) {
        const symbolSize = Math.max(4, Math.floor(crownShapeDetails.baseWidth * 0.3));
        const symbolX = centerX;
        const symbolY = crownBaseY - Math.floor(crownHeight / 2); 

        if (symbolShape === 'circle_badge') {
            const radius = Math.floor(symbolSize / 2);
            for(let dy = -radius; dy <= radius; dy++) {
                for(let dx = -radius; dx <= radius; dx++) {
                    if(dx*dx + dy*dy <= radius*radius) {
                        const crownRow = crownShapeInfo.find(r => r.y === symbolY + dy);
                        if (crownRow && symbolX + dx >= crownRow.x && symbolX + dx < crownRow.x + crownRow.width) {
                             drawScaledRect(ctx, symbolX + dx, symbolY + dy, 1, 1, palette.base, DISPLAY_SCALE);
                        }
                    }
                }
            }
        } else if (symbolShape === 'simple_star') {
            const arm = Math.floor(symbolSize/2);
            const armThickness = Math.max(1, Math.floor(arm/2));
             for(let i = -arm; i <= arm; i++) {
                const crownRow = crownShapeInfo.find(r => r.y === symbolY + i);
                if (crownRow && symbolX - Math.floor(armThickness/2) >= crownRow.x && symbolX + Math.ceil(armThickness/2) <= crownRow.x + crownRow.width) {
                    drawScaledRect(ctx, symbolX - Math.floor(armThickness/2), symbolY + i, armThickness, 1, palette.base, DISPLAY_SCALE);
                }
             }
            const crownRowHoriz = crownShapeInfo.find(r => r.y === symbolY - Math.floor(armThickness/2));
            if(crownRowHoriz) {
                for(let i = -arm; i <= arm; i++) {
                    if (symbolX + i >= crownRowHoriz.x && symbolX + i + armThickness <= crownRowHoriz.x + crownRowHoriz.width) {
                        drawScaledRect(ctx, symbolX + i, symbolY - Math.floor(armThickness/2), 1, armThickness, palette.base, DISPLAY_SCALE);
                    }
                }
            }
        }
    }
}

/**
 * Generates a procedural hat.
 * @param {object} options - Options for generation, may include 'subType' and 'mainType'.
 */
export function generateHat(options = {}) {
    console.log("generateHat called with options:", options);

    const offscreenCanvas = document.createElement('canvas');
    offscreenCanvas.width = CANVAS_WIDTH;
    offscreenCanvas.height = CANVAS_HEIGHT;
    const ctx = offscreenCanvas.getContext('2d');

    if (!ctx) {
        console.error("Failed to get 2D context for offscreen canvas in generateHat.");
        return { type: 'hat', name: 'Error Hat', seed: Date.now(), itemData: { error: "Canvas context failed" }, imageDataUrl: createErrorDataURL("CTX Fail") };
    }
    ctx.imageSmoothingEnabled = false;
    ctx.clearRect(0, 0, CANVAS_WIDTH, CANVAS_HEIGHT);

    // --- Define Hat Properties ---
    const allHatTypes = ['wizard_hat', 'top_hat', 'beanie', 'wide_brim_fedora', 'cap', 'simple_helmet', 'straw_hat', 'conical_helmet', 'knight_helm_visor', 'barbute_helm'];
    const helmetSubTypes = ['simple_helmet', 'conical_helmet', 'knight_helm_visor', 'barbute_helm'];
    const nonHelmetHatSubTypes = ['wizard_hat', 'top_hat', 'beanie', 'wide_brim_fedora', 'cap', 'straw_hat'];

    let hatType;

    if (options.subType && allHatTypes.includes(options.subType)) {
        hatType = options.subType;
    } else if (options.mainType === 'helmet') {
        hatType = getRandomElement(helmetSubTypes);
        if(options.subType) console.warn(`Unknown helmet subType: ${options.subType}. Defaulting to random helmet: ${hatType}`);
    } else if (options.mainType === 'hat') {
        hatType = getRandomElement(nonHelmetHatSubTypes);
        if(options.subType) console.warn(`Unknown hat subType: ${options.subType}. Defaulting to random non-helmet hat: ${hatType}`);
    } else {
        hatType = getRandomElement(allHatTypes);
        if(options.subType) console.warn(`Unknown hat subType: ${options.subType} and no mainType. Defaulting to random hat/helmet: ${hatType}`);
        else if(options.mainType) console.warn(`Unknown mainType: ${options.mainType}. Defaulting to random hat/helmet: ${hatType}`);
    }


    let crownShape, crownHeight, crownBaseWidth, crownTopWidth;
    let brimShape, brimWidthExtension;
    let mainMaterialName, brimMaterialName = null;
    let visorType = 'none', cheekGuardType = 'none', helmetFeaturePalette = null;


    const clothMaterials = ['RED_PAINT', 'BLUE_PAINT', 'GREEN_PAINT', 'BLACK_PAINT', 'WHITE_PAINT', 'PURPLE_PAINT', 'LEATHER', 'PAPER'];
    const metalMaterials = ['IRON', 'STEEL', 'BRONZE', 'DARK_STEEL', 'GOLD', 'SILVER'];
    const naturalMaterials = ['WOOD', 'LEATHER', 'BONE', 'STRAW'];
    if (!MATERIAL_PALETTES.STRAW) MATERIAL_PALETTES.STRAW = {name: 'Straw', base: '#F0E68C', shadow: '#DAA520', highlight: '#FFFACD', outline: '#B8860B'};


    if (hatType === 'wizard_hat') {
        crownShape = 'conical';
        crownHeight = getRandomInt(LOGICAL_GRID_HEIGHT * 0.5, LOGICAL_GRID_HEIGHT * 0.8);
        crownBaseWidth = getRandomInt(LOGICAL_GRID_WIDTH * 0.3, LOGICAL_GRID_WIDTH * 0.5);
        crownTopWidth = 1; 
        brimShape = getRandomElement(['flat_circular', 'downward_curved', 'none']);
        brimWidthExtension = (brimShape !== 'none') ? getRandomInt(Math.floor(crownBaseWidth * 0.3), Math.floor(crownBaseWidth * 0.8)) : 0;
        mainMaterialName = getRandomElement(clothMaterials.concat(['ENCHANTED', 'OBSIDIAN']));
    } else if (hatType === 'top_hat') {
        crownShape = 'cylindrical';
        crownHeight = getRandomInt(LOGICAL_GRID_HEIGHT * 0.35, LOGICAL_GRID_HEIGHT * 0.55);
        crownBaseWidth = getRandomInt(LOGICAL_GRID_WIDTH * 0.3, LOGICAL_GRID_WIDTH * 0.45);
        crownTopWidth = crownBaseWidth - getRandomInt(0,2); 
        brimShape = 'flat_circular';
        brimWidthExtension = getRandomInt(Math.floor(crownBaseWidth * 0.2), Math.floor(crownBaseWidth * 0.4));
        mainMaterialName = getRandomElement(['BLACK_PAINT', 'DARK_STEEL', 'LEATHER']);
    } else if (hatType === 'beanie') {
        crownShape = 'soft_beanie';
        crownHeight = getRandomInt(LOGICAL_GRID_HEIGHT * 0.25, LOGICAL_GRID_HEIGHT * 0.4);
        crownBaseWidth = getRandomInt(LOGICAL_GRID_WIDTH * 0.35, LOGICAL_GRID_WIDTH * 0.5);
        crownTopWidth = Math.floor(crownBaseWidth * 0.7); 
        brimShape = 'none'; 
        brimWidthExtension = 0;
        mainMaterialName = getRandomElement(clothMaterials);
    } else if (hatType === 'wide_brim_fedora') {
        crownShape = 'domed'; 
        crownHeight = getRandomInt(LOGICAL_GRID_HEIGHT * 0.2, LOGICAL_GRID_HEIGHT * 0.3);
        crownBaseWidth = getRandomInt(LOGICAL_GRID_WIDTH * 0.3, LOGICAL_GRID_WIDTH * 0.45);
        crownTopWidth = crownBaseWidth; 
        brimShape = getRandomElement(['flat_circular', 'downward_curved']);
        brimWidthExtension = getRandomInt(Math.floor(crownBaseWidth * 0.5), Math.floor(crownBaseWidth * 1.2));
        mainMaterialName = getRandomElement(['LEATHER', 'BLACK_PAINT', 'PAPER', 'WOOD']); 
    } else if (hatType === 'cap') {
        crownShape = 'domed';
        crownHeight = getRandomInt(LOGICAL_GRID_HEIGHT * 0.18, LOGICAL_GRID_HEIGHT * 0.28);
        crownBaseWidth = getRandomInt(LOGICAL_GRID_WIDTH * 0.3, LOGICAL_GRID_WIDTH * 0.4);
        crownTopWidth = crownBaseWidth;
        brimShape = 'front_cap_bill';
        brimWidthExtension = getRandomInt(Math.floor(crownBaseWidth * 0.3), Math.floor(crownBaseWidth * 0.6));
        mainMaterialName = getRandomElement(clothMaterials);
    } else if (hatType === 'simple_helmet' || hatType === 'barbute_helm') { 
        crownShape = 'domed';
        crownHeight = getRandomInt(LOGICAL_GRID_HEIGHT * 0.3, LOGICAL_GRID_HEIGHT * 0.5); 
        crownBaseWidth = getRandomInt(LOGICAL_GRID_WIDTH * 0.4, LOGICAL_GRID_WIDTH * 0.6); 
        crownTopWidth = crownBaseWidth;
        brimShape = 'none';
        brimWidthExtension = 0;
        mainMaterialName = getRandomElement(metalMaterials);
        if (hatType === 'barbute_helm') {
            cheekGuardType = 'extended_cheeks'; 
            helmetFeaturePalette = getPalette(mainMaterialName); 
        }
    } else if (hatType === 'conical_helmet' || hatType === 'knight_helm_visor') { 
        crownShape = 'conical';
        crownHeight = getRandomInt(LOGICAL_GRID_HEIGHT * 0.35, LOGICAL_GRID_HEIGHT * 0.55);
        crownBaseWidth = getRandomInt(LOGICAL_GRID_WIDTH * 0.4, LOGICAL_GRID_WIDTH * 0.55);
        crownTopWidth = (hatType === 'knight_helm_visor') ? Math.max(3, Math.floor(crownBaseWidth * 0.5)) : Math.max(2, Math.floor(crownBaseWidth * getRandomInRange(0.2, 0.4)));
        brimShape = 'none'; 
        brimWidthExtension = 0;
        mainMaterialName = getRandomElement(metalMaterials);
        if (hatType === 'knight_helm_visor') {
            visorType = getRandomElement(['t_slit', 'horizontal_slit']);
            helmetFeaturePalette = getPalette(mainMaterialName); 
            if (Math.random() < 0.5) { 
                cheekGuardType = 'standard_cheeks';
            }
        }
    } else { // straw_hat
        crownShape = 'flat_top_wide'; 
        crownHeight = getRandomInt(LOGICAL_GRID_HEIGHT * 0.15, LOGICAL_GRID_HEIGHT * 0.25);
        crownBaseWidth = getRandomInt(LOGICAL_GRID_WIDTH * 0.25, LOGICAL_GRID_WIDTH * 0.35);
        crownTopWidth = crownBaseWidth + getRandomInt(2,5); 
        brimShape = 'flat_circular';
        brimWidthExtension = getRandomInt(Math.floor(crownBaseWidth * 0.8), Math.floor(crownBaseWidth * 1.5));
        mainMaterialName = 'STRAW';
    }

    const mainPalette = getPalette(mainMaterialName);
    const brimPalette = brimMaterialName ? getPalette(brimMaterialName) : mainPalette;

    const decorationTypes = ['none', 'band', 'feather', 'symbol'];
    const canHaveStandardDecorations = !['simple_helmet', 'conical_helmet', 'knight_helm_visor', 'barbute_helm'].includes(hatType);
    const decorationType = canHaveStandardDecorations && Math.random() < 0.6 ? getRandomElement(decorationTypes) : 'none';

    let decorationPalette = null;
    let symbolShape = null;
    let featherLength = 0;

    if (decorationType !== 'none') {
        const decorMaterials = ['LEATHER', 'GOLD', 'SILVER', 'RED_PAINT', 'BLUE_PAINT', 'BLACK_PAINT', 'ENCHANTED', 'BONE'];
        decorationPalette = getPalette(getRandomElement(decorMaterials.filter(m => m !== mainMaterialName)));
        if (decorationType === 'symbol') {
            symbolShape = getRandomElement(['circle_badge', 'simple_star']);
        } else if (decorationType === 'feather') {
            featherLength = getRandomInt(Math.floor(crownHeight * 0.6), crownHeight + 5); 
            decorationPalette = getPalette(getRandomElement(['WHITE_PAINT', 'RED_PAINT', 'BLUE_PAINT', 'BLACK_PAINT', 'GEM_GREEN', 'GEM_YELLOW', 'PURPLE_PAINT']));
        }
    }

    const hatCenterX = Math.floor(LOGICAL_GRID_WIDTH / 2);
    
    let estimatedVisualHeight = crownHeight;
    if (brimShape !== 'none' && brimShape !== 'front_cap_bill') {
        estimatedVisualHeight += 5; 
    } else if (brimShape === 'front_cap_bill') {
        estimatedVisualHeight += 2; 
    }
    if (decorationType === 'feather') estimatedVisualHeight += featherLength * 0.2; 

    let hatTopY = Math.floor((LOGICAL_GRID_HEIGHT - estimatedVisualHeight) / 2);
    hatTopY = Math.max(CANVAS_PADDING, hatTopY);
    const crownTopYToDraw = hatTopY; 
    const crownBaseYToDraw = crownTopYToDraw + crownHeight;


    const crownDetails = { shape: crownShape, height: crownHeight, baseWidth: crownBaseWidth, topWidth: crownTopWidth, palette: mainPalette };
    const { crownTopY, actualCrownHeight, crownShapeInfo } = drawHatCrown(ctx, crownDetails, hatCenterX, crownBaseYToDraw); 

    const brimDetails = { shape: brimShape, brimWidthExtension, palette: brimPalette };
    drawHatBrim(ctx, brimDetails, hatCenterX, crownBaseYToDraw, crownBaseWidth); 

    if (visorType !== 'none' || cheekGuardType !== 'none') {
        const featureDetails = { visorType, cheekGuardType, palette: helmetFeaturePalette || mainPalette };
        drawHelmetFeatures(ctx, featureDetails, crownShapeInfo, hatCenterX, crownTopY, actualCrownHeight, mainPalette);
    }


    if (decorationType !== 'none') {
        const decorationDetailsToDraw = { type: decorationType, palette: decorationPalette, symbolShape, featherLength };
        drawHatDecoration(ctx, decorationDetailsToDraw, crownTopY + actualCrownHeight, actualCrownHeight, crownDetails, hatCenterX, crownShapeInfo);
    }

    let subTypeNameForDisplay = hatType.replace(/_/g, ' ');
    subTypeNameForDisplay = subTypeNameForDisplay.split(' ').map(word => word.charAt(0).toUpperCase() + word.slice(1)).join(' ');
    
    let itemName = `${mainPalette.name} ${subTypeNameForDisplay}`;

    if (visorType !== 'none') itemName += ` with ${visorType.replace('_',' ')}`;
    if (cheekGuardType !== 'none') itemName += ` (${cheekGuardType.replace('_',' ')})`;
    if (decorationType !== 'none' && decorationPalette && canHaveStandardDecorations) {
        itemName += ` with ${decorationPalette.name} ${decorationType}`;
        if (symbolShape) itemName += ` (${symbolShape.replace('_',' ')})`;
    }

    const itemSeed = options.seed || Date.now();

    const generatedItemData = {
        type: options.mainType || (helmetSubTypes.includes(hatType) ? 'helmet' : 'hat'), // Set type based on mainType or inferred
        name: itemName,
        seed: itemSeed,
        itemData: {
            hatType, // This is the specific sub-type
            subType: options.subType || hatType, // Store selected subType
            crownShape,
            brimShape,
            mainMaterial: mainMaterialName.toLowerCase(),
            brimMaterial: brimMaterialName ? brimMaterialName.toLowerCase() : mainMaterialName.toLowerCase(),
            visorType,
            cheekGuardType,
            helmetFeatureMaterial: helmetFeaturePalette ? helmetFeaturePalette.name.toLowerCase() : null,
            decorationType,
            decorationMaterial: decorationPalette ? decorationPalette.name.toLowerCase() : null,
            symbolShape,
            dimensions: { crownHeight, crownBaseWidth, crownTopWidth, brimWidthExtension, featherLength },
            colors: {
                main: mainPalette,
                brim: brimPalette,
                decoration: decorationPalette,
                helmetFeatures: helmetFeaturePalette
            }
        },
        imageDataUrl: offscreenCanvas.toDataURL()
    };

    console.log("Hat/Helmet generated:", generatedItemData.name);
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

console.log("js/generators/hat_generator.js loaded.");
