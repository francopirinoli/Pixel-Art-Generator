/**
 * js/generators/sword_generator.js
 * Contains the logic for procedurally generating swords.
 */

import { getRandomInt, getRandomElement, drawScaledRect, getRandomInRange } from '../utils.js';
import { getPalette } from '../palettes/material_palettes.js';

// --- Constants specific to sword generation or drawing ---
const LOGICAL_GRID_WIDTH = 64;
const LOGICAL_GRID_HEIGHT = 64;
const DISPLAY_SCALE = 4;
const CANVAS_WIDTH = LOGICAL_GRID_WIDTH * DISPLAY_SCALE;   // 256 (64 * 4)
const CANVAS_HEIGHT = LOGICAL_GRID_HEIGHT * DISPLAY_SCALE; // 256 (64 * 4)
const MIN_BLADE_LENGTH_DAGGER = 10;
const MAX_BLADE_LENGTH_DAGGER = 20;
const MIN_BLADE_LENGTH_SHORTSWORD = 18;
const MAX_BLADE_LENGTH_SHORTSWORD = 28;
const MIN_BLADE_LENGTH_RAPIER = 35;
const MAX_BLADE_LENGTH_RAPIER = 50;
// MODIFIED: Increased length for Longswords (standard type)
const MIN_BLADE_LENGTH_STANDARD = 30; // Was 25
const MAX_BLADE_LENGTH_STANDARD = 50; // Was 45
const MIN_BLADE_LENGTH_KATANA = 35;
const MAX_BLADE_LENGTH_KATANA = 48;

const MIN_GRIP_LENGTH = 5;
const CANVAS_PADDING = 4; // Min padding from top/bottom of logical grid

// --- Internal helper functions for drawing sword components ---

function drawBladeComponent(ctx, bladeDetails, startLogicalX, startLogicalY) {
    const {
        logicalLength,
        initialLogicalWidth, 
        palette,
        shape, 
        tipShape, 
        curveDirection, 
        curveAmount,
        fuller 
    } = bladeDetails;

    const finalTipWidth = (tipShape === 'pointy' || tipShape === 'angled_katana' || tipShape === 'needle') ? 1 : initialLogicalWidth;
    let finalCurveOffsetAtBase = 0;

    for (let yOffset = 0; yOffset < logicalLength; yOffset++) {
        const y = startLogicalY + yOffset;
        let currentSegmentWidth;
        let currentXOffsetFromCenter = 0;

        if (curveDirection !== 'none' && logicalLength > 1) {
            const curveProgress = yOffset / (logicalLength - 1);
            if (shape === 'katana') {
                 currentXOffsetFromCenter = Math.sin(curveProgress * Math.PI * 0.7) * curveAmount;
            } else {
                 currentXOffsetFromCenter = Math.sin(curveProgress * Math.PI) * curveAmount;
            }
            if (curveDirection === 'left') {
                currentXOffsetFromCenter *= -1;
            }
        }
        const accumulatedCurveOffset = Math.round(currentXOffsetFromCenter);
        if (yOffset === logicalLength - 1) {
            finalCurveOffsetAtBase = accumulatedCurveOffset;
        }

        if (shape === 'tapered' || shape === 'rapier_blade') {
            const taperProgress = (logicalLength <= 1) ? 0 : yOffset / (logicalLength - 1);
            currentSegmentWidth = Math.round(finalTipWidth + (initialLogicalWidth - finalTipWidth) * taperProgress);
        } else if (shape === 'katana' && tipShape === 'angled_katana') {
            const kissakiLength = Math.max(3, Math.floor(initialLogicalWidth * 1.8)); 
            const bodyWidthAtKissakiStart = Math.max(finalTipWidth + 1, Math.round(initialLogicalWidth * 0.85), 2); 
            const bodyLength = logicalLength - kissakiLength;

            if (yOffset < kissakiLength) { 
                const progressInTip = (kissakiLength <= 1) ? 1 : yOffset / (kissakiLength - 1);
                currentSegmentWidth = Math.round(finalTipWidth + (bodyWidthAtKissakiStart - finalTipWidth) * progressInTip);
            } else { 
                const progressInBody = (bodyLength <= 0) ? 0 : (yOffset - kissakiLength) / (bodyLength - 1 || 1) ;
                currentSegmentWidth = Math.round(bodyWidthAtKissakiStart + (initialLogicalWidth - bodyWidthAtKissakiStart) * progressInBody);
            }
        } else { 
            currentSegmentWidth = initialLogicalWidth;
            if ((tipShape === 'pointy' || tipShape === 'needle') && initialLogicalWidth > 1) {
                const tipEffectLength = Math.max(1, Math.floor(initialLogicalWidth / (tipShape === 'needle' ? 0.8 : 1.5) )); 
                if (yOffset < tipEffectLength) {
                    const progressInTip = (tipEffectLength <= 1) ? 1 : yOffset / (tipEffectLength - 1);
                    currentSegmentWidth = Math.round(finalTipWidth + (initialLogicalWidth - finalTipWidth) * progressInTip);
                } else {
                    currentSegmentWidth = initialLogicalWidth;
                }
                if (yOffset === 0 && finalTipWidth === 1) currentSegmentWidth = 1;
            } else if ((tipShape === 'pointy' || tipShape === 'needle') && initialLogicalWidth === 1) {
                currentSegmentWidth = 1;
            }
        }
        currentSegmentWidth = Math.max(1, currentSegmentWidth);
        const segmentX = startLogicalX - Math.floor(currentSegmentWidth / 2) + accumulatedCurveOffset;

        drawScaledRect(ctx, segmentX, y, currentSegmentWidth, 1, palette.base, DISPLAY_SCALE);

        if (fuller === 'single_center' && currentSegmentWidth >= 3 && yOffset > logicalLength * 0.15 && yOffset < logicalLength * 0.85) {
            const fullerX = startLogicalX + accumulatedCurveOffset; 
            drawScaledRect(ctx, fullerX, y, 1, 1, palette.shadow, DISPLAY_SCALE);
        }

        if (currentSegmentWidth > 0) {
            let highlightX = segmentX;
            let shadowX = segmentX + currentSegmentWidth - 1;
            if (shape === 'katana') {
                if (currentSegmentWidth === 1 && yOffset === 0) { 
                    drawScaledRect(ctx, segmentX, y, 1, 1, palette.highlight, DISPLAY_SCALE);
                } else if (currentSegmentWidth > 1){
                    if (curveDirection === 'right' || (curveDirection === 'none' && Math.random() < 0.5)) { 
                        drawScaledRect(ctx, shadowX, y, 1, 1, palette.highlight, DISPLAY_SCALE); 
                        drawScaledRect(ctx, highlightX, y, 1, 1, palette.shadow, DISPLAY_SCALE); 
                    } else { 
                        drawScaledRect(ctx, highlightX, y, 1, 1, palette.highlight, DISPLAY_SCALE); 
                        drawScaledRect(ctx, shadowX, y, 1, 1, palette.shadow, DISPLAY_SCALE);    
                    }
                } else { 
                     drawScaledRect(ctx, segmentX, y, 1, 1, palette.base, DISPLAY_SCALE); 
                }
            } else { 
                drawScaledRect(ctx, highlightX, y, 1, 1, palette.highlight, DISPLAY_SCALE);
                if (currentSegmentWidth > 1) {
                    drawScaledRect(ctx, shadowX, y, 1, 1, palette.shadow, DISPLAY_SCALE);
                }
            }
        }
    }
    return finalCurveOffsetAtBase;
}

function drawHiltComponent(ctx, hiltDetails, bladeBottomLogicalY, hiltCenterLogicalX) {
    const {
        crossguardStyle, crossguardWidth, crossguardHeight, vGuardDirection, crescentDirection,
        gripStyle, gripLength, gripWidth,
        palette, gripPalette,
        bladeInitialLogicalWidth, 
        pommelLogicalSize
    } = hiltDetails;

    const cgBaseY = bladeBottomLogicalY; 
    const cgCenterX = hiltCenterLogicalX; 

    const ferruleHeight = 1; 
    const ferruleWidth = Math.max(1, bladeInitialLogicalWidth - (bladeInitialLogicalWidth > 3 ? 1 : 0) );
    const ferruleX = cgCenterX - Math.floor(ferruleWidth / 2);
    drawScaledRect(ctx, ferruleX, cgBaseY, ferruleWidth, ferruleHeight, palette.shadow, DISPLAY_SCALE); 
    drawScaledRect(ctx, ferruleX, cgBaseY, ferruleWidth, 1, palette.base, DISPLAY_SCALE); 

    const guardDrawStartY = cgBaseY + ferruleHeight; 
    const actualGuardHeight = Math.max(0, crossguardHeight - ferruleHeight); 

    if (crossguardWidth > 0 && crossguardHeight > 0) {
        if (crossguardStyle === 'straight_bar' || crossguardStyle === 'stubby') {
            if (actualGuardHeight > 0) {
                const cgDrawX = cgCenterX - Math.floor(crossguardWidth / 2);
                drawScaledRect(ctx, cgDrawX, guardDrawStartY, crossguardWidth, actualGuardHeight, palette.base, DISPLAY_SCALE);
                drawScaledRect(ctx, cgDrawX, guardDrawStartY, crossguardWidth, 1, palette.highlight, DISPLAY_SCALE); 
                if (actualGuardHeight > 1) {
                    drawScaledRect(ctx, cgDrawX, guardDrawStartY + actualGuardHeight - 1, crossguardWidth, 1, palette.shadow, DISPLAY_SCALE); 
                    if (actualGuardHeight > 2) {
                         drawScaledRect(ctx, cgDrawX, guardDrawStartY + 1, 1, actualGuardHeight - 2, palette.highlight, DISPLAY_SCALE); 
                         drawScaledRect(ctx, cgDrawX + crossguardWidth - 1, guardDrawStartY + 1, 1, actualGuardHeight - 2, palette.shadow, DISPLAY_SCALE); 
                    }
                }
            }
        } else if (crossguardStyle === 'v_guard') {
            const armLength = Math.floor(crossguardWidth / 1.8); 
            const angleDepth = Math.max(1, Math.floor(crossguardHeight * 1.0)); 
            const armThickness = Math.max(1, Math.floor(crossguardHeight * 0.6)); 
            const vBaseSolidWidth = Math.max(ferruleWidth, armThickness + 1, bladeInitialLogicalWidth);

            let vGuardActualBaseHeight = Math.max(1, Math.floor(armThickness * 0.8));
            if (vGuardDirection === 'up' && actualGuardHeight > 0) { 
                vGuardActualBaseHeight = actualGuardHeight; 
            }
            vGuardActualBaseHeight = Math.max(1, vGuardActualBaseHeight); 

            drawScaledRect(ctx, cgCenterX - Math.floor(vBaseSolidWidth/2), guardDrawStartY, vBaseSolidWidth, vGuardActualBaseHeight, palette.base, DISPLAY_SCALE);
            drawScaledRect(ctx, cgCenterX - Math.floor(vBaseSolidWidth/2), guardDrawStartY, vBaseSolidWidth, 1, palette.highlight, DISPLAY_SCALE);
            if (vGuardActualBaseHeight > 1) {
                 drawScaledRect(ctx, cgCenterX - Math.floor(vBaseSolidWidth/2), guardDrawStartY + vGuardActualBaseHeight - 1, vBaseSolidWidth, 1, palette.shadow, DISPLAY_SCALE);
            }

            if (vGuardDirection === 'down') {
                const armStartY = guardDrawStartY + vGuardActualBaseHeight; 
                for(let i = 0; i <= armLength; i++) { 
                    const progress = armLength === 0 ? 1 : i / armLength;
                    const yPos = armStartY + Math.round(progress * angleDepth); 
                    const currentArmDrawThickness = Math.max(1, Math.round(armThickness - (armThickness - 1) * progress * 0.7)); 
                    drawScaledRect(ctx, cgCenterX - i - Math.floor(currentArmDrawThickness / 2), yPos - Math.floor(currentArmDrawThickness / 2), currentArmDrawThickness, currentArmDrawThickness, palette.base, DISPLAY_SCALE);
                    drawScaledRect(ctx, cgCenterX + i - Math.floor(currentArmDrawThickness / 2), yPos - Math.floor(currentArmDrawThickness / 2), currentArmDrawThickness, currentArmDrawThickness, palette.base, DISPLAY_SCALE);
                }
            } else { // vGuardDirection === 'up'
                 for(let i = 0; i <= armLength; i++) { 
                    const progress = armLength === 0 ? 1 : i / armLength;
                    const yPos = guardDrawStartY - Math.round(progress * angleDepth); 
                    const currentArmDrawThickness = Math.max(1, Math.round(armThickness - (armThickness - 1) * progress * 0.7)); 
                    drawScaledRect(ctx, cgCenterX - i - Math.floor(currentArmDrawThickness / 2), yPos - Math.floor(currentArmDrawThickness / 2), currentArmDrawThickness, currentArmDrawThickness, palette.base, DISPLAY_SCALE);
                    drawScaledRect(ctx, cgCenterX + i - Math.floor(currentArmDrawThickness / 2), yPos - Math.floor(currentArmDrawThickness / 2), currentArmDrawThickness, currentArmDrawThickness, palette.base, DISPLAY_SCALE);
                }
            }
        } else if (crossguardStyle === 'crescent_guard') {
            const crescentRadius = Math.max(1, Math.floor(crossguardWidth / 2)); 
            const crescentThickness = Math.max(2, crossguardHeight); 
             // MODIFIED: Connector height made slightly more substantial
            const connectorWidth = Math.max(1, bladeInitialLogicalWidth -1, Math.floor(crescentThickness * 0.7));
            let connectorHeight = Math.max(2, Math.floor(crescentThickness * 0.6)); // Was 0.5
            const connectorDrawY = guardDrawStartY; 

            if (actualGuardHeight > 0 && ( (crescentDirection === 'up' && actualGuardHeight > connectorHeight) || crescentDirection === 'down') ) {
                 // If guard points up, connector fills the space down to the grip.
                 // If guard points down, connector is its defined height.
                connectorHeight = (crescentDirection === 'up') ? actualGuardHeight : connectorHeight;
            }
            connectorHeight = Math.max(1, connectorHeight);


            drawScaledRect(ctx, cgCenterX - Math.floor(connectorWidth/2), connectorDrawY, connectorWidth, connectorHeight, palette.base, DISPLAY_SCALE);
            drawScaledRect(ctx, cgCenterX - Math.floor(connectorWidth/2), connectorDrawY, connectorWidth, 1, palette.highlight, DISPLAY_SCALE);
            if (connectorHeight > 1) {
                drawScaledRect(ctx, cgCenterX - Math.floor(connectorWidth/2), connectorDrawY + connectorHeight - 1, connectorWidth, 1, palette.shadow, DISPLAY_SCALE);
            }

            let arcCenterActualY;
            // MODIFIED: Crescent attachment point adjustment
            if (crescentDirection === 'up') { 
                // Arc sits on top of the connector
                arcCenterActualY = connectorDrawY - crescentRadius + Math.floor(crescentThickness/2);
            } else { 
                // Arc hangs below the connector
                arcCenterActualY = connectorDrawY + connectorHeight + crescentRadius - Math.floor(crescentThickness/2) ;
            }
            
            for (let x = -crescentRadius; x <= crescentRadius; x++) {
                for (let yRelToArcCenter = -crescentRadius; yRelToArcCenter <= crescentRadius; yRelToArcCenter++) {
                    const distSq = x*x + yRelToArcCenter*yRelToArcCenter;
                    if (distSq <= crescentRadius * crescentRadius && distSq > (crescentRadius - crescentThickness)*(crescentRadius - crescentThickness)) {
                        if ((crescentDirection === 'down' && yRelToArcCenter <= 0) || 
                            (crescentDirection === 'up' && yRelToArcCenter >= 0)) {   
                             let color = palette.base;
                             if (Math.abs(x) / crescentRadius > 0.8 || Math.abs(yRelToArcCenter) / crescentRadius < 0.3) {
                                 color = palette.highlight;
                             } else if (Math.abs(yRelToArcCenter) / crescentRadius > 0.8) {
                                 color = palette.shadow;
                             }
                             drawScaledRect(ctx, cgCenterX + x, arcCenterActualY + yRelToArcCenter, 1, 1, color, DISPLAY_SCALE);
                        }
                    }
                }
            }
        } else if (crossguardStyle === 'swept_hilt') {
            const barThickness = Math.max(1, Math.floor(actualGuardHeight > 0 ? actualGuardHeight : crossguardHeight / 1.2));
            const crossbarWidthActual = bladeInitialLogicalWidth + getRandomInt(0,2); 
            const crossbarX = cgCenterX - Math.floor(crossbarWidthActual/2);
            if(actualGuardHeight > 0) { 
                drawScaledRect(ctx, crossbarX, guardDrawStartY, crossbarWidthActual, barThickness, palette.base, DISPLAY_SCALE);
                drawScaledRect(ctx, crossbarX, guardDrawStartY, crossbarWidthActual, 1, palette.highlight, DISPLAY_SCALE);
            }

            const bowStartX = cgCenterX + Math.floor(crossbarWidthActual/2) - Math.floor(barThickness/2);
            const bowStartY = guardDrawStartY + Math.floor(barThickness / 2); 
            const bowEndX = cgCenterX;
            const gripEndLogicalY = guardDrawStartY + (actualGuardHeight > 0 ? actualGuardHeight : 0) + gripLength; 
            const bowEndY = gripEndLogicalY - Math.floor(pommelLogicalSize ? pommelLogicalSize / 3 : barThickness) ; 
            
            const controlX = bowStartX + Math.max(barThickness + 1, Math.floor(gripWidth * 0.8));
            const controlY = bowStartY + Math.floor((gripLength + Math.floor(pommelLogicalSize ? pommelLogicalSize / 2 : 0) - barThickness) / 2);
            let prevX = bowStartX; let prevY = bowStartY;
            for (let i = 1; i <= 10; i++) { 
                const t = i / 10;
                const currentX = Math.round(Math.pow(1 - t, 2) * bowStartX + 2 * (1 - t) * t * controlX + Math.pow(t, 2) * bowEndX);
                const currentY = Math.round(Math.pow(1 - t, 2) * bowStartY + 2 * (1 - t) * t * controlY + Math.pow(t, 2) * bowEndY);
                const dx = currentX - prevX; const dy = currentY - prevY;
                const steps = Math.max(Math.abs(dx), Math.abs(dy));
                for (let j = 0; j <= steps; j++) {
                    const stepT = steps === 0 ? 0 : j / steps;
                    const plotX = Math.round(prevX + dx * stepT);
                    const plotY = Math.round(prevY + dy * stepT);
                    drawScaledRect(ctx, plotX - Math.floor(barThickness/2), plotY - Math.floor(barThickness/2), barThickness, barThickness, palette.base, DISPLAY_SCALE);
                }
                prevX = currentX; prevY = currentY;
            }

        } else if (crossguardStyle === 'tsuba') {
            if(actualGuardHeight > 0) {
                const tsubaDrawX = cgCenterX - Math.floor(crossguardWidth / 2);
                const tsubaDrawY = guardDrawStartY; 
                const tangHoleWidth = bladeInitialLogicalWidth;
                const tsubaArmWidth = Math.floor((crossguardWidth - tangHoleWidth) / 2);

                if (tsubaArmWidth > 0) {
                    drawScaledRect(ctx, tsubaDrawX, tsubaDrawY, tsubaArmWidth, actualGuardHeight, palette.base, DISPLAY_SCALE);
                    drawScaledRect(ctx, cgCenterX + Math.ceil(tangHoleWidth / 2), tsubaDrawY, tsubaArmWidth, actualGuardHeight, palette.base, DISPLAY_SCALE);
                } else { 
                     drawScaledRect(ctx, tsubaDrawX, tsubaDrawY, crossguardWidth, actualGuardHeight, palette.base, DISPLAY_SCALE);
                }
                drawScaledRect(ctx, tsubaDrawX, tsubaDrawY, crossguardWidth, 1, palette.highlight, DISPLAY_SCALE);
                drawScaledRect(ctx, tsubaDrawX, tsubaDrawY + actualGuardHeight - 1, crossguardWidth, 1, palette.shadow, DISPLAY_SCALE);
            }
        }
    }

    const gripActualPalette = gripPalette || palette;
    const gripStartY = bladeBottomLogicalY + crossguardHeight; 

    if (gripStyle === 'cylinder' || gripStyle === 'tapered' || gripStyle === 'katana_grip') {
        for (let i = 0; i < gripLength; i++) {
            let currentGripWidth = gripWidth;
            if (gripStyle === 'tapered' && gripLength > 1) {
                const taperProgress = i / (gripLength - 1);
                currentGripWidth = Math.max(Math.floor(gripWidth / 1.5), Math.round(gripWidth - (gripWidth - Math.floor(gripWidth / 1.5)) * taperProgress));
                currentGripWidth = Math.max(1, currentGripWidth);
            }
            const segX = hiltCenterLogicalX - Math.floor(currentGripWidth / 2);
            drawScaledRect(ctx, segX, gripStartY + i, currentGripWidth, 1, gripActualPalette.base, DISPLAY_SCALE);
            drawScaledRect(ctx, segX, gripStartY + i, 1, 1, gripActualPalette.highlight, DISPLAY_SCALE);
            if (currentGripWidth > 1) {
                drawScaledRect(ctx, segX + currentGripWidth - 1, gripStartY + i, 1, 1, gripActualPalette.shadow, DISPLAY_SCALE);
            }
            if (gripStyle === 'katana_grip' && (i % 3 === 0 || i % 3 === 1) && i < gripLength -1) {
                 drawScaledRect(ctx, segX + Math.floor(currentGripWidth/4), gripStartY + i, Math.ceil(currentGripWidth/2), 1, gripActualPalette.shadow, DISPLAY_SCALE);
            }
        }
    } else if (gripStyle === 'wrapped') {
        const gripBaseX = hiltCenterLogicalX - Math.floor(gripWidth / 2);
        drawScaledRect(ctx, gripBaseX, gripStartY, gripWidth, gripLength, gripActualPalette.base, DISPLAY_SCALE);
        for (let i = 0; i < gripLength; i += 2) {
            drawScaledRect(ctx, gripBaseX, gripStartY + i, gripWidth, 1, gripActualPalette.shadow, DISPLAY_SCALE);
        }
    }
}

function drawPommelComponent(ctx, pommelDetails, gripBottomLogicalY, pommelCenterLogicalX) {
    const { pommelShape, logicalSize, palette, hasGem, gemPalette } = pommelDetails;
    const pommelBaseX = pommelCenterLogicalX - Math.floor(logicalSize / 2);
    const pommelBaseY = gripBottomLogicalY;

    if (pommelShape === 'square' || pommelShape === 'finial' || pommelShape === 'katana_cap') {
        drawScaledRect(ctx, pommelBaseX, pommelBaseY, logicalSize, logicalSize, palette.base, DISPLAY_SCALE);
        if (logicalSize > 0) {
            drawScaledRect(ctx, pommelBaseX, pommelBaseY, logicalSize, 1, palette.highlight, DISPLAY_SCALE);
            drawScaledRect(ctx, pommelBaseX, pommelBaseY + logicalSize - 1, logicalSize, 1, palette.shadow, DISPLAY_SCALE);
            if (logicalSize > 1) {
                drawScaledRect(ctx, pommelBaseX, pommelBaseY + 1, 1, logicalSize - 2, palette.highlight, DISPLAY_SCALE);
                drawScaledRect(ctx, pommelBaseX + logicalSize - 1, pommelBaseY + 1, 1, logicalSize - 2, palette.shadow, DISPLAY_SCALE);
            }
        }
    } else if (pommelShape === 'round' || pommelShape === 'disc') {
        const radius = Math.floor(logicalSize / 2);
        for (let dy = -radius; dy <= radius; dy++) {
            for (let dx = -radius; dx <= radius; dx++) {
                if (dx * dx + dy * dy <= radius * radius) {
                    drawScaledRect(ctx, pommelCenterLogicalX + dx, pommelBaseY + dy + radius, 1, 1, palette.base, DISPLAY_SCALE);
                    if (dy < 0 && dx*dx + (dy+1)*(dy+1) > radius*radius) { 
                         drawScaledRect(ctx, pommelCenterLogicalX + dx, pommelBaseY + dy + radius, 1, 1, palette.highlight, DISPLAY_SCALE);
                    }
                     if (dx*dx + dy*dy > (radius-1)*(radius-1) && dy >=0) { 
                         drawScaledRect(ctx, pommelCenterLogicalX + dx, pommelBaseY + dy + radius, 1, 1, palette.shadow, DISPLAY_SCALE);
                     }
                }
            }
        }
    }

    if (hasGem && gemPalette && logicalSize >=2) { 
        const gemSize = Math.max(1, Math.floor(logicalSize / 2.5)); 
        const actualGemSize = Math.min(gemSize, logicalSize -1); 
        if (actualGemSize < 1) return; 

        const gemX = pommelCenterLogicalX - Math.floor(actualGemSize / 2);
        const gemY = pommelBaseY + Math.floor(logicalSize / 2) - Math.floor(actualGemSize / 2);
        
        drawScaledRect(ctx, gemX, gemY, actualGemSize, actualGemSize, gemPalette.base, DISPLAY_SCALE);
        if (actualGemSize > 0) { 
            drawScaledRect(ctx, gemX, gemY, 1, 1, gemPalette.highlight, DISPLAY_SCALE); 
        }
    }
}

/**
 * Generates a procedural sword.
 * @param {object} options - Options for generation, may include 'subType'.
 */
export function generateSword(options = {}) {
    console.log("generateSword called with options:", options);

    const offscreenCanvas = document.createElement('canvas');
    offscreenCanvas.width = CANVAS_WIDTH;
    offscreenCanvas.height = CANVAS_HEIGHT;
    const ctx = offscreenCanvas.getContext('2d');

    if (!ctx) {
        console.error("Failed to get 2D context for offscreen canvas in generateSword.");
        return { type: 'sword', name: 'Error Sword', seed: Date.now(), itemData: { error: "Canvas context failed" }, imageDataUrl: createErrorDataURL("CTX Fail") };
    }
    ctx.imageSmoothingEnabled = false;
    ctx.clearRect(0, 0, CANVAS_WIDTH, CANVAS_HEIGHT);

    const bladeMaterials = ['STEEL', 'IRON', 'GOLD', 'BRONZE', 'SILVER', 'OBSIDIAN', 'DARK_STEEL', 'ENCHANTED', 'BONE'];
    const bladeMaterialName = getRandomElement(bladeMaterials);
    const bladePalette = getPalette(bladeMaterialName);
    
    let currentSwordType;
    const defaultSwordTypes = ['standard', 'dagger', 'shortsword', 'rapier', 'katana']; 

    if (options.subType) {
        if (options.subType === 'longsword') {
            currentSwordType = 'standard';
        } else if (defaultSwordTypes.includes(options.subType)) {
            currentSwordType = options.subType;
        } else {
            currentSwordType = getRandomElement(defaultSwordTypes);
            console.warn(`Unknown sword subType: ${options.subType}. Defaulting to random: ${currentSwordType}`);
        }
    } else {
        currentSwordType = getRandomElement(defaultSwordTypes);
    }
    
    let bladeLogicalLength, bladeInitialLogicalWidthCurrent, bladeShape, bladeTipShape, bladeCurveDirection, bladeCurveAmount;
    let bladeFuller = 'none';

    if (currentSwordType === 'katana') {
        bladeShape = 'katana';
        bladeLogicalLength = getRandomInt(MIN_BLADE_LENGTH_KATANA, MAX_BLADE_LENGTH_KATANA);
        bladeInitialLogicalWidthCurrent = getRandomInt(3, 4); 
        bladeTipShape = 'angled_katana';
        bladeCurveDirection = 'right'; 
        bladeCurveAmount = getRandomInt(Math.floor(bladeLogicalLength / 18), Math.floor(bladeLogicalLength / 10));
    } else if (currentSwordType === 'dagger') {
        bladeShape = 'tapered';
        bladeLogicalLength = getRandomInt(MIN_BLADE_LENGTH_DAGGER, MAX_BLADE_LENGTH_DAGGER);
        bladeInitialLogicalWidthCurrent = getRandomInt(2, 4); 
        bladeTipShape = 'pointy';
        bladeCurveDirection = 'none';
        bladeCurveAmount = 0;
        if (Math.random() < 0.4) bladeFuller = 'single_center';
    } else if (currentSwordType === 'shortsword') {
        bladeShape = getRandomElement(['straight', 'tapered']);
        bladeLogicalLength = getRandomInt(MIN_BLADE_LENGTH_SHORTSWORD, MAX_BLADE_LENGTH_SHORTSWORD);
        bladeInitialLogicalWidthCurrent = getRandomInt(3, 5); 
        bladeTipShape = 'pointy';
        bladeCurveDirection = (Math.random() < 0.15) ? getRandomElement(['left', 'right']) : 'none';
        bladeCurveAmount = (bladeCurveDirection !== 'none') ? getRandomInt(Math.floor(bladeLogicalLength / 15), Math.floor(bladeLogicalLength / 8)) : 0;
        if (Math.random() < 0.5) bladeFuller = 'single_center';
    } else if (currentSwordType === 'rapier') {
        bladeShape = 'rapier_blade'; 
        bladeLogicalLength = getRandomInt(MIN_BLADE_LENGTH_RAPIER, MAX_BLADE_LENGTH_RAPIER);
        bladeInitialLogicalWidthCurrent = getRandomInt(1, 2); 
        bladeTipShape = 'needle'; 
        bladeCurveDirection = 'none';
        bladeCurveAmount = 0;
    } else { // standard sword (Longsword)
        bladeShape = getRandomElement(['straight', 'tapered']);
        bladeLogicalLength = getRandomInt(MIN_BLADE_LENGTH_STANDARD, MAX_BLADE_LENGTH_STANDARD); // Uses updated constants
        bladeInitialLogicalWidthCurrent = getRandomInt(3, 6); 
        bladeTipShape = (bladeShape === 'tapered' || (bladeShape === 'straight' && Math.random() < 0.8)) ? 'pointy' : 'flat';
        bladeCurveDirection = (Math.random() < 0.25) ? getRandomElement(['left', 'right']) : 'none';
        bladeCurveAmount = (bladeCurveDirection !== 'none') ? getRandomInt(Math.floor(bladeLogicalLength / 12), Math.floor(bladeLogicalLength / 6)) : 0;
        if (Math.random() < 0.6) bladeFuller = 'single_center';
    }

    const hiltMaterials = ['WOOD', 'IRON', 'STEEL', 'BONE', 'DARK_STEEL', 'BRONZE', 'GOLD'];
    const hiltMaterialName = getRandomElement(hiltMaterials);
    const hiltPalette = getPalette(hiltMaterialName);
    const gripMaterialName = (currentSwordType === 'katana') ? 'LEATHER' : getRandomElement(['LEATHER', 'WOOD', hiltMaterialName, 'BONE', 'IVORY']);
    const gripPalette = getPalette(gripMaterialName);

    let crossguardStyle, vGuardDirection, crossguardLogicalWidth, crossguardLogicalHeight, crescentDirection; 
    if (currentSwordType === 'katana') {
        crossguardStyle = 'tsuba';
    } else if (currentSwordType === 'rapier') {
        crossguardStyle = getRandomElement(['swept_hilt', 'crescent_guard', 'v_guard']); 
    } else {
        crossguardStyle = getRandomElement(['straight_bar', 'v_guard', 'swept_hilt', 'stubby', 'crescent_guard', 'tsuba']);
    }
    vGuardDirection = (crossguardStyle === 'v_guard') ? getRandomElement(['up', 'down']) : 'down';
    crescentDirection = (crossguardStyle === 'crescent_guard') ? getRandomElement(['up', 'down']) : 'down';

    if (crossguardStyle === 'stubby') {
        crossguardLogicalWidth = bladeInitialLogicalWidthCurrent + getRandomInt(2,4); 
        crossguardLogicalHeight = getRandomInt(2,4); 
    } else if (crossguardStyle === 'swept_hilt') {
        crossguardLogicalWidth = getRandomInt(bladeInitialLogicalWidthCurrent + 3, bladeInitialLogicalWidthCurrent + 5); 
        crossguardLogicalHeight = getRandomInt(2,4); 
    } else if (crossguardStyle === 'v_guard') {
        crossguardLogicalWidth = getRandomInt(bladeInitialLogicalWidthCurrent + 6, bladeInitialLogicalWidthCurrent + 14); 
        crossguardLogicalHeight = getRandomInt(3,5); 
    } else if (crossguardStyle === 'tsuba') {
        crossguardLogicalWidth = bladeInitialLogicalWidthCurrent + getRandomInt(6, 10); 
        crossguardLogicalHeight = getRandomInt(1,3); 
    } else if (crossguardStyle === 'crescent_guard') {
        crossguardLogicalWidth = getRandomInt(bladeInitialLogicalWidthCurrent + 7, bladeInitialLogicalWidthCurrent + 15); 
        crossguardLogicalHeight = getRandomInt(3,5); 
    }
    else { // straight_bar
        crossguardLogicalWidth = getRandomInt(bladeInitialLogicalWidthCurrent + 4, bladeInitialLogicalWidthCurrent + 12); 
        crossguardLogicalHeight = getRandomInt(2, 4); 
    }
    crossguardLogicalHeight = Math.max(1, crossguardLogicalHeight); 

    let gripStyle = (currentSwordType === 'katana') ? 'katana_grip' : getRandomElement(['cylinder', 'tapered', 'wrapped']);
    let gripLogicalLength = (currentSwordType === 'katana') ? getRandomInt(10,16) : getRandomInt(MIN_GRIP_LENGTH, 15); 
    // MODIFIED: Ensure handle is not longer than blade
    gripLogicalLength = Math.min(gripLogicalLength, bladeLogicalLength -1); // -1 to ensure it's visually shorter
    gripLogicalLength = Math.max(MIN_GRIP_LENGTH, gripLogicalLength); // Ensure it doesn't go below min

    const gripLogicalWidth = Math.max(2, getRandomInt(bladeInitialLogicalWidthCurrent - (currentSwordType === 'katana' ? 0 : 1), bladeInitialLogicalWidthCurrent + (currentSwordType === 'katana' ? 0 : 1)));

    const pommelMaterials = [hiltMaterialName, bladeMaterialName, 'GOLD', 'SILVER', 'BRONZE', 'BONE', 'DARK_STEEL', 'OBSIDIAN'];
    const pommelMaterialName = getRandomElement(pommelMaterials);
    const pommelPalette = getPalette(pommelMaterialName);
    let pommelShape = (currentSwordType === 'katana') ? 'katana_cap' : getRandomElement(['round', 'square', 'disc', 'finial']);
    let pommelLogicalSizeCurrent;
    const hasGemOnPommel = Math.random() < 0.40; 
    let pommelGemColorName = null;
    let pommelGemPalette = null;
    if (hasGemOnPommel) {
        const gemColors = ['GEM_RED', 'GEM_BLUE', 'GEM_GREEN', 'GEM_PURPLE', 'GEM_YELLOW', 'GEM_ORANGE', 'GEM_CYAN', 'GEM_WHITE', 'ENCHANTED'];
        pommelGemColorName = getRandomElement(gemColors);
        pommelGemPalette = getPalette(pommelGemColorName);
    }

    if (pommelShape === 'finial') {
        pommelLogicalSizeCurrent = Math.max(1, Math.floor(gripLogicalWidth * 0.7)); 
    } else if (pommelShape === 'disc') {
        pommelLogicalSizeCurrent = getRandomInt(gripLogicalWidth, gripLogicalWidth + 2);
        pommelLogicalSizeCurrent = Math.max(2, pommelLogicalSizeCurrent); 
    } else if (pommelShape === 'katana_cap') {
        pommelLogicalSizeCurrent = gripLogicalWidth;
    }
    else { 
        pommelLogicalSizeCurrent = getRandomInt(Math.max(2, gripLogicalWidth) , gripLogicalWidth + 1); 
        pommelLogicalSizeCurrent = Math.max(2, pommelLogicalSizeCurrent);
    }
    if (hasGemOnPommel && pommelLogicalSizeCurrent < 3) { 
        pommelLogicalSizeCurrent = 3; 
    }

    const currentPommelDetails = { 
        pommelShape, 
        logicalSize: pommelLogicalSizeCurrent, 
        palette: pommelPalette,
        hasGem: hasGemOnPommel,
        gemPalette: pommelGemPalette
    };

    let currentTotalLogicalHeight = bladeLogicalLength + crossguardLogicalHeight + gripLogicalLength + pommelLogicalSizeCurrent;
    const maxAllowedTotalHeight = LOGICAL_GRID_HEIGHT - (CANVAS_PADDING * 2);

    if (currentTotalLogicalHeight > maxAllowedTotalHeight) {
        const overrun = currentTotalLogicalHeight - maxAllowedTotalHeight;
        let bladeReductionTarget = MIN_BLADE_LENGTH_STANDARD; 
        if(currentSwordType === 'dagger') bladeReductionTarget = MIN_BLADE_LENGTH_DAGGER;
        else if(currentSwordType === 'shortsword') bladeReductionTarget = MIN_BLADE_LENGTH_SHORTSWORD;
        else if(currentSwordType === 'rapier') bladeReductionTarget = MIN_BLADE_LENGTH_RAPIER;
        else if(currentSwordType === 'katana') bladeReductionTarget = MIN_BLADE_LENGTH_KATANA;

        const bladeReduction = Math.min(bladeLogicalLength - bladeReductionTarget, Math.ceil(overrun * 0.6));
        bladeLogicalLength -= bladeReduction;
        const remainingOverrunAfterBlade = Math.max(0, overrun - bladeReduction);
        
        const gripReduction = Math.min(gripLogicalLength - MIN_GRIP_LENGTH, Math.ceil(remainingOverrunAfterBlade));
        gripLogicalLength -= gripReduction;
        
        currentTotalLogicalHeight = bladeLogicalLength + crossguardLogicalHeight + gripLogicalLength + pommelLogicalSizeCurrent;
    }

    const initialSwordCenterLogicalX = Math.floor(LOGICAL_GRID_WIDTH / 2);
    let swordTipStartLogicalY = Math.floor((LOGICAL_GRID_HEIGHT - currentTotalLogicalHeight) / 2);
    swordTipStartLogicalY = Math.max(CANVAS_PADDING, swordTipStartLogicalY);

    const bladeBottomLogicalY = swordTipStartLogicalY + bladeLogicalLength;
    const gripStartLogicalY = bladeBottomLogicalY + crossguardLogicalHeight;
    const pommelStartLogicalY = gripStartLogicalY + gripLogicalLength; 

    const bladeDetails = {
        logicalLength: bladeLogicalLength,
        initialLogicalWidth: bladeInitialLogicalWidthCurrent,
        palette: bladePalette,
        shape: bladeShape,
        tipShape: bladeTipShape,
        curveDirection: bladeCurveDirection,
        curveAmount: bladeCurveAmount,
        fuller: bladeFuller
    };
    const finalBladeCurveOffset = drawBladeComponent(ctx, bladeDetails, initialSwordCenterLogicalX, swordTipStartLogicalY);
    const actualHiltAndPommelCenterX = initialSwordCenterLogicalX + finalBladeCurveOffset;

    const hiltDetails = {
        crossguardStyle, crossguardWidth: crossguardLogicalWidth, crossguardHeight: crossguardLogicalHeight, 
        vGuardDirection, crescentDirection,
        gripStyle, gripLength: gripLogicalLength, gripWidth: gripLogicalWidth,
        palette: hiltPalette, gripPalette: gripPalette,
        bladeInitialLogicalWidth: bladeInitialLogicalWidthCurrent,
        pommelLogicalSize: pommelLogicalSizeCurrent 
    };
    drawHiltComponent(ctx, hiltDetails, bladeBottomLogicalY, actualHiltAndPommelCenterX);
    
    drawPommelComponent(ctx, currentPommelDetails, pommelStartLogicalY, actualHiltAndPommelCenterX);

    let subTypeNameForDisplay = options.subType ? options.subType.replace(/_/g, ' ') : currentSwordType.replace(/_/g, ' ');
    subTypeNameForDisplay = subTypeNameForDisplay.split(' ').map(word => word.charAt(0).toUpperCase() + word.slice(1)).join(' ');
    
    let itemName = `${bladeMaterialName} ${subTypeNameForDisplay}`;
    if (bladeShape !== currentSwordType && bladeShape !== 'rapier_blade' && bladeShape !== 'katana' && options.subType !== bladeShape) {
         itemName += ` (${bladeShape})`; 
    }
    if (bladeCurveDirection !== 'none' && currentSwordType !== 'katana') itemName += ` ${bladeCurveDirection}-curved`;
    itemName += ` (${bladeTipShape} tip, ${crossguardStyle.replace(/_/g,' ')}`;
    if (crossguardStyle === 'v_guard') itemName += ` ${vGuardDirection}`;
    if (crossguardStyle === 'crescent_guard') itemName += ` ${crescentDirection}`;
    itemName += ` guard, ${pommelShape} pommel`;
    if (hasGemOnPommel && pommelGemColorName) itemName += ` w/ ${pommelGemColorName.replace('GEM_', '')} gem`;


    const itemSeed = options.seed || Date.now();

    const generatedItemData = {
        type: 'sword',
        name: itemName,
        seed: itemSeed,
        itemData: {
            swordType: currentSwordType, 
            subType: options.subType || currentSwordType, 
            blade: {
                material: bladeMaterialName.toLowerCase(),
                logicalLength: bladeLogicalLength,
                initialLogicalWidth: bladeInitialLogicalWidthCurrent,
                shape: bladeShape,
                tipShape: bladeTipShape,
                curveDirection: bladeCurveDirection,
                curveAmount: bladeCurveAmount,
                fuller: bladeFuller,
                finalCurveOffset: finalBladeCurveOffset,
                colors: bladePalette
            },
            hilt: {
                hiltMaterial: hiltMaterialName.toLowerCase(), gripMaterial: gripMaterialName.toLowerCase(),
                crossguardStyle, crossguardWidth: crossguardLogicalWidth, crossguardHeight: crossguardLogicalHeight,
                vGuardDirection, crescentDirection,
                gripStyle, gripLength: gripLogicalLength, gripWidth: gripLogicalWidth,
                hiltColors: hiltPalette, gripColors: gripPalette
            },
            pommel: {
                material: pommelMaterialName.toLowerCase(),
                shape: pommelShape, logicalSize: pommelLogicalSizeCurrent,
                hasGem: hasGemOnPommel,
                gemColor: pommelGemColorName ? pommelGemColorName.toLowerCase().replace('gem_', '') : null,
                colors: pommelPalette,
                gemColors: pommelGemPalette
            }
        },
        imageDataUrl: offscreenCanvas.toDataURL()
    };

    console.log("Sword generated:", generatedItemData.name);
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

console.log("js/generators/sword_generator.js loaded with V6 guard connection fixes.");
