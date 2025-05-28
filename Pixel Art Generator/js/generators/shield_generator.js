/**
 * js/generators/shield_generator.js
 * Contains the logic for procedurally generating shields.
 */

import { getRandomInt, getRandomElement, drawScaledRect, getRandomInRange } from '../utils.js'; 
import { getPalette, MATERIAL_PALETTES } from '../palettes/material_palettes.js';

// --- Constants specific to shield generation or drawing ---
const LOGICAL_GRID_WIDTH = 64;
const LOGICAL_GRID_HEIGHT = 64;
const DISPLAY_SCALE = 4;
const CANVAS_WIDTH = LOGICAL_GRID_WIDTH * DISPLAY_SCALE;   // 256
const CANVAS_HEIGHT = LOGICAL_GRID_HEIGHT * DISPLAY_SCALE; // 256
const CANVAS_PADDING = 4;

// --- Internal helper functions for drawing shield components ---

/**
 * Checks if a logical point is within the bounds of a given shield shape.
 * @param {number} lx - Logical X coordinate of the point.
 * @param {number} ly - Logical Y coordinate of the point.
 * @param {object} shieldDetails - Details of the shield (shape, width, height, towerStyle, cornerRadius, heaterTopStyle for main shape).
 * @param {number} shieldCenterX - Logical X center of the shield.
 * @param {number} shieldCenterY - Logical Y center of the shield.
 * @returns {boolean} True if the point is within the shield, false otherwise.
 */
function isPointInShield(lx, ly, shieldDetails, shieldCenterX, shieldCenterY) {
    const { shape, logicalWidth, logicalHeight, towerStyle, cornerRadius, heaterTopStyle } = shieldDetails;
    const halfWidth = Math.floor(logicalWidth / 2);
    const halfHeight = Math.floor(logicalHeight / 2);
    const shieldTopY = shieldCenterY - halfHeight;
    const shieldBottomY = shieldCenterY + halfHeight -1; 
    const shieldLeftX = shieldCenterX - halfWidth;
    const shieldRightX = shieldCenterX + halfWidth -1; 

    const relX = lx - shieldCenterX;
    const relY = ly - shieldCenterY;

    if (shape === 'round') {
        const radius = Math.min(halfWidth, halfHeight);
        return relX * relX + relY * relY <= radius * radius;
    } else if (shape === 'oval') {
        if (halfWidth === 0 || halfHeight === 0) return false;
        return (relX * relX) / (halfWidth * halfWidth || 1) + (relY * relY) / (halfHeight * halfHeight || 1) <= 1.05; 
    } else if (shape === 'tower') {
        if (towerStyle === 'rectangle') {
            return Math.abs(relX) <= halfWidth && Math.abs(relY) <= halfHeight;
        } else if (towerStyle === 'rounded_top') {
            const rectPartHeight = logicalHeight - halfWidth; 
            if (ly >= shieldTopY + halfWidth && ly <= shieldBottomY) { 
                return Math.abs(relX) <= halfWidth;
            } else if (ly < shieldTopY + halfWidth && ly >= shieldTopY) { 
                const yForCircle = ly - (shieldTopY + halfWidth); 
                return relX * relX + yForCircle * yForCircle <= halfWidth * halfWidth;
            }
        } else if (towerStyle === 'rounded_corners') {
            const r = cornerRadius || Math.min(halfWidth, halfHeight, 5); 
            if (lx >= shieldLeftX + r && lx <= shieldRightX - r && ly >= shieldTopY && ly <= shieldBottomY) return true; 
            if (lx >= shieldLeftX && lx <= shieldRightX && ly >= shieldTopY + r && ly <= shieldBottomY - r) return true; 

            if (lx < shieldLeftX + r && ly < shieldTopY + r && (lx - (shieldLeftX + r))**2 + (ly - (shieldTopY + r))**2 <= r**2) return true;
            if (lx > shieldRightX - r && ly < shieldTopY + r && (lx - (shieldRightX - r))**2 + (ly - (shieldTopY + r))**2 <= r**2) return true;
            if (lx < shieldLeftX + r && ly > shieldBottomY - r && (lx - (shieldLeftX + r))**2 + (ly - (shieldBottomY - r))**2 <= r**2) return true;
            if (lx > shieldRightX - r && ly > shieldBottomY - r && (lx - (shieldRightX - r))**2 + (ly - (shieldBottomY - r))**2 <= r**2) return true;
            return false;
        }
    } else if (shape === 'kite') {
        const topRoundedPartHeight = logicalHeight * getRandomInRange(0.40, 0.50); 
        const bottomTaperHeight = logicalHeight - topRoundedPartHeight;
        const maxShoulderWidth = logicalWidth; 

        if (ly >= shieldTopY && ly < shieldTopY + topRoundedPartHeight) { 
            const yProgressInTop = (ly - shieldTopY) / (topRoundedPartHeight > 1 ? topRoundedPartHeight - 1 : 1);
            const widthAtY = maxShoulderWidth * Math.sqrt(1 - Math.pow(yProgressInTop -1, 2)); 
            return Math.abs(relX) <= widthAtY / 2;
        } else if (ly >= shieldTopY + topRoundedPartHeight && ly <= shieldBottomY) { 
            const yInBottom = ly - (shieldTopY + topRoundedPartHeight);
            if (yInBottom < 0 || yInBottom >= bottomTaperHeight) return false;
            
            const progressToTip = (bottomTaperHeight <= 1) ? 1 : yInBottom / (bottomTaperHeight - 1);
            // MODIFIED: Increased power for sharper triangular tip
            const widthAtY = Math.max(1, maxShoulderWidth * (1 - Math.pow(progressToTip, 2.5))); 
            return Math.abs(relX) <= widthAtY / 2;
        }
    } else if (shape === 'heater') {
        const topPartHeight = logicalHeight * 0.33; 
        const bottomPartHeight = logicalHeight - topPartHeight;
        const shoulderInfluence = 0.25; 

        if (ly >= shieldTopY && ly < shieldTopY + topPartHeight) { 
            const yProgressInTop = (ly - shieldTopY) / (topPartHeight > 1 ? topPartHeight - 1 : 1);
            let widthAtY = logicalWidth;
            // Main fill top is flat, shoulders curve below that
            const flatPortionRatio = 0.7; 
            if (yProgressInTop > flatPortionRatio) {
                const curveProgress = (yProgressInTop - flatPortionRatio) / (1 - flatPortionRatio || 1);
                widthAtY = logicalWidth * (1 - Math.pow(curveProgress, 2) * shoulderInfluence);
            }
            return Math.abs(relX) <= widthAtY / 2;

        } else if (ly >= shieldTopY + topPartHeight && ly <= shieldBottomY) { 
            const yInBottom = ly - (shieldTopY + topPartHeight);
            if (yInBottom < 0 || yInBottom >= bottomPartHeight) return false; 
            
            const progressToTip = (bottomPartHeight <= 1) ? 1 : yInBottom / (bottomPartHeight - 1);
            
            let widthAtBaseOfTaper = logicalWidth;
            const flatPortionRatio = 0.7;
            const curveProgress = (1 - flatPortionRatio) / (1 - flatPortionRatio || 1); 
            widthAtBaseOfTaper = logicalWidth * (1 - Math.pow(curveProgress, 2) * shoulderInfluence);

            const widthAtY = Math.max(1, widthAtBaseOfTaper * (1 - Math.pow(progressToTip, 1.7))); 
            return Math.abs(relX) <= widthAtY / 2;
        }
    }
    return false;
}


/**
 * Draws the base shape of the shield.
 */
function drawShieldShape(ctx, shieldDetails, centerX, centerY) {
    const { palette } = shieldDetails;
    const shieldTopY = centerY - Math.floor(shieldDetails.logicalHeight / 2);
    const shieldLeftX = centerX - Math.floor(shieldDetails.logicalWidth / 2);

    // Main fill
    for (let lyGrid = 0; lyGrid < shieldDetails.logicalHeight; lyGrid++) {
        for (let lxGrid = 0; lxGrid < shieldDetails.logicalWidth; lxGrid++) {
            const lx = shieldLeftX + lxGrid;
            const ly = shieldTopY + lyGrid;

            if (isPointInShield(lx, ly, shieldDetails, centerX, centerY)) {
                drawScaledRect(ctx, lx, ly, 1, 1, palette.base, DISPLAY_SCALE);
            }
        }
    }
    // Shading and Outline pass - Refined for cleaner edges
    for (let lyGrid = 0; lyGrid < shieldDetails.logicalHeight; lyGrid++) {
        for (let lxGrid = 0; lxGrid < shieldDetails.logicalWidth; lxGrid++) {
            const lx = shieldLeftX + lxGrid;
            const ly = shieldTopY + lyGrid;

            if (isPointInShield(lx, ly, shieldDetails, centerX, centerY)) {
                const isTopEdge = !isPointInShield(lx, ly - 1, shieldDetails, centerX, centerY);
                const isLeftEdge = !isPointInShield(lx - 1, ly, shieldDetails, centerX, centerY);
                const isBottomEdge = !isPointInShield(lx, ly + 1, shieldDetails, centerX, centerY);
                const isRightEdge = !isPointInShield(lx + 1, ly, shieldDetails, centerX, centerY);
                const isAnyEdge = isTopEdge || isLeftEdge || isBottomEdge || isRightEdge;

                if (isAnyEdge) {
                    let edgeColor = null;
                    if (palette.outline) { // Prioritize outline color if available
                        edgeColor = palette.outline;
                    } else { // No outline, apply highlight/shadow directly to the base edge
                        if (isTopEdge || isLeftEdge) {
                            edgeColor = palette.highlight;
                        } else if (isBottomEdge || isRightEdge) {
                            edgeColor = palette.shadow;
                        }
                    }
                    if (edgeColor) {
                        drawScaledRect(ctx, lx, ly, 1, 1, edgeColor, DISPLAY_SCALE);
                    }
                }
            }
        }
    }
}

/**
 * Draws decorations on the shield.
 */
function drawShieldDecoration(ctx, shieldDetailsFull, decorationDetails, shieldDrawCenterX, shieldDrawCenterY) {
    const { decorationType, decorationPalette, decorationPaletteSecondary, hasGem, gemPalette, bandOrientation, numBands, chevronDirection } = decorationDetails;
    const { logicalWidth, logicalHeight, shape, heaterTopBorderStyle } = shieldDetailsFull; 

    const decMargin = Math.max(2, Math.floor(Math.min(logicalWidth, logicalHeight) * 0.15));
    const decMaxWidth = logicalWidth - decMargin * 2;
    const decMaxHeight = logicalHeight - decMargin * 2;


    if (decorationType === 'boss') {
        const bossRadius = Math.max(3,Math.floor(Math.min(decMaxWidth, decMaxHeight) / 2.8)); 
        for (let dy = -bossRadius; dy <= bossRadius; dy++) {
            for (let dx = -bossRadius; dx <= bossRadius; dx++) {
                if (dx * dx + dy * dy <= bossRadius * bossRadius) {
                    const lx = shieldDrawCenterX + dx;
                    const ly = shieldDrawCenterY + dy;
                    if (isPointInShield(lx, ly, shieldDetailsFull, shieldDrawCenterX, shieldDrawCenterY)) {
                        let color = decorationPalette.base;
                        const distFactor = Math.sqrt(dx*dx + dy*dy) / (bossRadius || 1);
                        if (distFactor < 0.3) color = decorationPalette.highlight; 
                        else if (distFactor > 0.7 && (dx < 0 || dy < 0)) color = decorationPalette.highlight; 
                        else if (distFactor > 0.7) color = decorationPalette.shadow; 
                        drawScaledRect(ctx, lx, ly, 1, 1, color, DISPLAY_SCALE);
                    }
                }
            }
        }
    } else if (decorationType === 'stripes' || decorationType === 'bands') {
        const currentNumBands = decorationType === 'bands' ? numBands : getRandomInt(1, 2);
        const bandThickness = Math.max(1, Math.floor((decorationType === 'bands' ? logicalHeight : decMaxHeight) / (currentNumBands * 4 + 1)));
        const bandEffectiveLength = Math.floor((decorationType === 'bands' ? logicalWidth : decMaxWidth) * 0.98); 

        for (let i = 0; i < currentNumBands; i++) {
            if (bandOrientation === 'horizontal' || decorationType === 'stripes') {
                const bandYBaseInShield = (shieldDrawCenterY - Math.floor(logicalHeight/2)) + Math.floor(logicalHeight * (i + 0.5) / currentNumBands) - Math.floor(bandThickness/2);
                const bandXStart = shieldDrawCenterX - Math.floor(bandEffectiveLength/2);
                for(let sx = 0; sx < bandEffectiveLength; sx++){
                    const lx = bandXStart + sx;
                    for(let sy = 0; sy < bandThickness; sy++){
                        const ly = bandYBaseInShield + sy;
                         if (isPointInShield(lx, ly, shieldDetailsFull, shieldDrawCenterX, shieldDrawCenterY)) {
                            drawScaledRect(ctx, lx, ly, 1, 1, decorationPalette.base, DISPLAY_SCALE);
                            if(sy === 0 && bandThickness > 0) drawScaledRect(ctx, lx, ly, 1, 1, decorationPalette.highlight, DISPLAY_SCALE);
                         }
                    }
                }
            } else { // Vertical Bands
                const bandXBaseInShield = (shieldDrawCenterX - Math.floor(logicalWidth/2)) + Math.floor(logicalWidth * (i + 0.5) / currentNumBands) - Math.floor(bandThickness/2);
                const bandYStart = shieldDrawCenterY - Math.floor(bandEffectiveLength / 2); 
                 for(let sy = 0; sy < bandEffectiveLength; sy++){ 
                    const ly = bandYStart + sy;
                    for(let sx = 0; sx < bandThickness; sx++){
                        const lx = bandXBaseInShield + sx;
                         if (isPointInShield(lx, ly, shieldDetailsFull, shieldDrawCenterX, shieldDrawCenterY)) {
                            drawScaledRect(ctx, lx, ly, 1, 1, decorationPalette.base, DISPLAY_SCALE);
                            if(sx === 0 && bandThickness > 0) drawScaledRect(ctx, lx, ly, 1, 1, decorationPalette.highlight, DISPLAY_SCALE);
                         }
                    }
                }
            }
        }
    } else if (decorationType === 'border') {
        const borderWidth = Math.max(1, Math.floor(Math.min(logicalWidth, logicalHeight) * 0.08));
        const shieldTopAbsY = shieldDrawCenterY - Math.floor(logicalHeight / 2);
        const shieldLeftAbsX = shieldDrawCenterX - Math.floor(logicalWidth / 2);

        for (let b = 0; b < borderWidth; b++) { 
            for (let lyGrid = 0; lyGrid < logicalHeight; lyGrid++) {
                for (let lxGrid = 0; lxGrid < logicalWidth; lxGrid++) {
                    const lx = shieldLeftAbsX + lxGrid;
                    const ly = shieldTopAbsY + lyGrid;

                    if (!isPointInShield(lx, ly, shieldDetailsFull, shieldDrawCenterX, shieldDrawCenterY)) continue;

                    let isPartOfThisBorderLayer = false;
                    let distToTrueEdge = Infinity;
                    
                    for(let checkDist=0; checkDist <=b; checkDist++){
                        if( !isPointInShield(lx,ly - checkDist, shieldDetailsFull, shieldDrawCenterX, shieldDrawCenterY) ||
                            !isPointInShield(lx,ly + checkDist, shieldDetailsFull, shieldDrawCenterX, shieldDrawCenterY) ||
                            !isPointInShield(lx - checkDist,ly, shieldDetailsFull, shieldDrawCenterX, shieldDrawCenterY) ||
                            !isPointInShield(lx + checkDist,ly, shieldDetailsFull, shieldDrawCenterX, shieldDrawCenterY) ) {
                            distToTrueEdge = checkDist;
                            break;
                        }
                    }
                    if (distToTrueEdge === b) { 
                        isPartOfThisBorderLayer = true;
                    }
                    
                    if (isPartOfThisBorderLayer) {
                        let color = decorationPalette.base;
                        let yPosForBorder = ly; 

                        // Heater Top Border Shape applied to the border decoration
                        if (shape === 'heater' && ly < shieldTopAbsY + Math.floor(logicalHeight * 0.25) && b < borderWidth ) { // Apply only to top-ish part of border
                            const heaterBorderTopY = shieldTopAbsY + b; 
                            const xRelToCenter = lx - shieldDrawCenterX;
                            const normX = Math.abs(xRelToCenter) / (logicalWidth/2 || 1); 
                            const curveMagnitude = Math.max(1, Math.floor(borderWidth * 1.5)); // Increased curve magnitude

                            if (heaterTopBorderStyle === 'concave') {
                                yPosForBorder = heaterBorderTopY + Math.floor(Math.pow(normX, 2.2) * curveMagnitude); // Sharper concave
                            } else if (heaterTopBorderStyle === 'v_shaped') {
                                yPosForBorder = heaterBorderTopY + Math.floor(normX * curveMagnitude); // More pronounced V
                            }
                        }
                        
                        if (b === 0 && borderWidth > 1) color = decorationPalette.highlight; 
                        else if (b === borderWidth -1 && borderWidth > 1) color = decorationPalette.shadow; 
                        
                        if (isPointInShield(lx, yPosForBorder, shieldDetailsFull, shieldDrawCenterX, shieldDrawCenterY)) {
                           drawScaledRect(ctx, lx, yPosForBorder, 1, 1, color, DISPLAY_SCALE);
                        }
                    }
                }
            }
        }
    } else if (decorationType === 'riveted_edge') {
        const rivetSize = 1;
        const rivetSpacing = getRandomInt(5, 8); 
        const shieldTopAbsY = shieldDrawCenterY - Math.floor(logicalHeight / 2);
        const shieldLeftAbsX = shieldDrawCenterX - Math.floor(logicalWidth / 2);
        for (let lyGrid = 0; lyGrid < logicalHeight; lyGrid++) {
            for (let lxGrid = 0; lxGrid < logicalWidth; lxGrid++) {
                const lx = shieldLeftAbsX + lxGrid;
                const ly = shieldTopAbsY + lyGrid;
                if (isPointInShield(lx, ly, shieldDetailsFull, shieldDrawCenterX, shieldDrawCenterY)) {
                    let isEdgePixel = false;
                    if (!isPointInShield(lx, ly - 1, shieldDetailsFull, shieldDrawCenterX, shieldDrawCenterY) ||
                        !isPointInShield(lx, ly + 1, shieldDetailsFull, shieldDrawCenterX, shieldDrawCenterY) ||
                        !isPointInShield(lx - 1, ly, shieldDetailsFull, shieldDrawCenterX, shieldDrawCenterY) ||
                        !isPointInShield(lx + 1, ly, shieldDetailsFull, shieldDrawCenterX, shieldDrawCenterY)) {
                        isEdgePixel = true;
                    }
                    if (isEdgePixel && ((lxGrid + lyGrid*2) % rivetSpacing < rivetSize) ) { 
                         drawScaledRect(ctx, lx, ly, rivetSize, rivetSize, decorationPalette.highlight, DISPLAY_SCALE);
                    }
                }
            }
        }
    } else if (decorationType === 'quadrants' && decorationPaletteSecondary) {
        const shieldTopAbsY = shieldDrawCenterY - Math.floor(logicalHeight / 2);
        const shieldLeftAbsX = shieldDrawCenterX - Math.floor(logicalWidth / 2);
        for (let lyGrid = 0; lyGrid < logicalHeight; lyGrid++) {
            for (let lxGrid = 0; lxGrid < logicalWidth; lxGrid++) {
                const lx = shieldLeftAbsX + lxGrid;
                const ly = shieldTopAbsY + lyGrid;
                if (isPointInShield(lx, ly, shieldDetailsFull, shieldDrawCenterX, shieldDrawCenterY)) {
                    let currentPalette = decorationPalette; 
                    if ((lx < shieldDrawCenterX && ly < shieldDrawCenterY) || (lx >= shieldDrawCenterX && ly >= shieldDrawCenterY)) {
                        currentPalette = decorationPalette;
                    } else {
                        currentPalette = decorationPaletteSecondary;
                    }
                    drawScaledRect(ctx, lx, ly, 1, 1, currentPalette.base, DISPLAY_SCALE);
                }
            }
        }
    } else if (decorationType === 'sunburst') {
        const numRays = getRandomInt(10, 20); 
        const rayOriginX = shieldDrawCenterX;
        const rayOriginY = shieldDrawCenterY;
        const maxRayLength = Math.min(logicalWidth, logicalHeight) / 2 * 0.9; 
        const rayThickness = 1;

        for (let i = 0; i < numRays; i++) {
            const angle = (i / numRays) * 2 * Math.PI + getRandomInRange(-0.1, 0.1); 
            for (let l = 0; l < maxRayLength; l += 1) { 
                const lx = Math.round(rayOriginX + l * Math.cos(angle));
                const ly = Math.round(rayOriginY + l * Math.sin(angle));
                if (isPointInShield(lx, ly, shieldDetailsFull, shieldDrawCenterX, shieldDrawCenterY)) {
                    drawScaledRect(ctx, lx, ly, rayThickness, rayThickness, l < maxRayLength * 0.3 ? decorationPalette.highlight : decorationPalette.base, DISPLAY_SCALE);
                } else {
                    break; 
                }
            }
        }
    }
    else if (decorationType === 'cross') { 
        const crossArmLengthRatio = 0.5; 
        const crossArmThicknessRatio = 0.12;
        const armLength = Math.floor(Math.min(decMaxWidth, decMaxHeight) * crossArmLengthRatio / 2);
        const armThickness = Math.max(1, Math.floor(Math.min(decMaxWidth, decMaxHeight) * crossArmThicknessRatio));

        for(let dy = -armLength; dy <= armLength; dy++){ 
            for(let dx = -Math.floor(armThickness/2); dx < Math.ceil(armThickness/2); dx++){
                const lx = shieldDrawCenterX + dx;
                const ly = shieldDrawCenterY + dy;
                if(isPointInShield(lx, ly, shieldDetailsFull, shieldDrawCenterX, shieldDrawCenterY)){
                    drawScaledRect(ctx, lx, ly, 1, 1, decorationPalette.base, DISPLAY_SCALE);
                }
            }
        }
        for(let dx = -armLength; dx <= armLength; dx++){ 
             for(let dy = -Math.floor(armThickness/2); dy < Math.ceil(armThickness/2); dy++){
                const lx = shieldDrawCenterX + dx;
                const ly = shieldDrawCenterY + dy;
                 if(isPointInShield(lx, ly, shieldDetailsFull, shieldDrawCenterX, shieldDrawCenterY)){
                    drawScaledRect(ctx, lx, ly, 1, 1, decorationPalette.base, DISPLAY_SCALE);
                }
            }
        }
    }
    else if (decorationType === 'triangle' || decorationType === 'chevron') { 
        const heightRatio = decorationType === 'chevron' ? 0.35 : 0.45;
        const baseRatio = decorationType === 'chevron' ? 0.55 : 0.45;
        const triHeight = Math.floor(decMaxHeight * heightRatio);
        const triBase = Math.floor(decMaxWidth * baseRatio);
        const orientation = chevronDirection || getRandomElement(['up', 'down']); 
        const thickness = decorationType === 'chevron' ? Math.max(1, Math.floor(triBase / 6)) : triBase; 

        for (let y = 0; y < triHeight; y++) {
            const progress = (triHeight <=1) ? 1 : y / (triHeight - 1); 
            let currentWidth;
            let yPos;

            if (orientation === 'up') {
                currentWidth = Math.max(1, Math.floor(triBase * progress)); 
                yPos = shieldDrawCenterY + Math.floor(triHeight/2) - y;
            } else { // Down
                currentWidth = Math.max(1, Math.floor(triBase * (1 - progress))); 
                yPos = shieldDrawCenterY - Math.floor(triHeight/2) + y;
            }
            const xStart = shieldDrawCenterX - Math.floor(currentWidth / 2);

            if (decorationType === 'chevron') {
                for(let t=0; t<thickness; t++){
                    if (isPointInShield(xStart+t, yPos, shieldDetailsFull, shieldDrawCenterX, shieldDrawCenterY))
                        drawScaledRect(ctx, xStart+t, yPos, 1, 1, decorationPalette.base, DISPLAY_SCALE);
                }
                for(let t=0; t<thickness; t++){
                     if (isPointInShield(xStart + currentWidth - thickness + t, yPos, shieldDetailsFull, shieldDrawCenterX, shieldDrawCenterY))
                        drawScaledRect(ctx, xStart + currentWidth - thickness + t, yPos, 1, 1, decorationPalette.base, DISPLAY_SCALE);
                }
                if (y === (orientation === 'up' ? triHeight -1 : 0) && currentWidth > thickness) { 
                     for(let bx=thickness; bx < currentWidth - thickness; bx++){ 
                         if (isPointInShield(xStart + bx, yPos, shieldDetailsFull, shieldDrawCenterX, shieldDrawCenterY))
                            drawScaledRect(ctx, xStart+bx, yPos, 1, 1, decorationPalette.base, DISPLAY_SCALE);
                     }
                }

            } else { // Solid Triangle
                for (let x = 0; x < currentWidth; x++) {
                    const lx = xStart + x;
                    if(isPointInShield(lx, yPos, shieldDetailsFull, shieldDrawCenterX, shieldDrawCenterY)){
                        drawScaledRect(ctx, lx, yPos, 1, 1, decorationPalette.base, DISPLAY_SCALE);
                    }
                }
            }
        }
    } 
    else if (decorationType === 'circle_emblem') { 
        const emblemRadius = Math.max(2, Math.floor(Math.min(decMaxWidth, decMaxHeight) / 3.5));
         for (let dy = -emblemRadius; dy <= emblemRadius; dy++) {
            for (let dx = -emblemRadius; dx <= emblemRadius; dx++) {
                if (dx * dx + dy * dy <= emblemRadius * emblemRadius) {
                    const lx = shieldDrawCenterX + dx;
                    const ly = shieldDrawCenterY + dy;
                    if (isPointInShield(lx, ly, shieldDetailsFull, shieldDrawCenterX, shieldDrawCenterY)) {
                        drawScaledRect(ctx, lx, ly, 1, 1, decorationPalette.base, DISPLAY_SCALE);
                         if (dx * dx + dy * dy >= (emblemRadius -1)*(emblemRadius-1) && emblemRadius > 1) {
                            drawScaledRect(ctx, lx, ly, 1, 1, decorationPalette.highlight, DISPLAY_SCALE);
                        }
                    }
                }
            }
        }
    }
    else if (decorationType === 'diamond' || decorationType === 'diamond_outline') { 
        const diamondHalfHeight = Math.floor(decMaxHeight / 2.5); 
        const diamondHalfWidth = Math.floor(decMaxWidth / 2.5);
        const outlineThickness = decorationType === 'diamond_outline' ? Math.max(1, Math.floor(Math.min(diamondHalfWidth, diamondHalfHeight) / 4)) : 0;

        for (let y = -diamondHalfHeight; y <= diamondHalfHeight; y++) {
            const progressY = diamondHalfHeight === 0 ? 1 : Math.abs(y) / diamondHalfHeight; 
            const currentWidthAtCenterline = Math.max(0, Math.floor(diamondHalfWidth * (1 - progressY)));
            for (let x = -currentWidthAtCenterline; x <= currentWidthAtCenterline; x++) {
                const lx = shieldDrawCenterX + x;
                const ly = shieldDrawCenterY + y;
                 if (isPointInShield(lx, ly, shieldDetailsFull, shieldDrawCenterX, shieldDrawCenterY)) {
                    if (decorationType === 'diamond_outline') {
                        const distToDiamondEdge = Math.abs(Math.abs(x) / (diamondHalfWidth+0.01) + Math.abs(y) / (diamondHalfHeight+0.01) - 1); 
                        if (distToDiamondEdge < (outlineThickness / Math.min(diamondHalfWidth, diamondHalfHeight)) * 2 ) { 
                             drawScaledRect(ctx, lx, ly, 1, 1, decorationPalette.base, DISPLAY_SCALE);
                        }
                    } else { // Solid diamond
                        drawScaledRect(ctx, lx, ly, 1, 1, decorationPalette.base, DISPLAY_SCALE);
                    }
                }
            }
        }
    } 
    else if (decorationType === 'saltire') { 
        const armThickness = Math.max(1, Math.floor(Math.min(decMaxWidth, decMaxHeight) / 8));
        const armLength = Math.floor(Math.min(decMaxWidth, decMaxHeight) / 2.5);

        for(let i = -armLength; i <= armLength; i++){
            for(let t = -Math.floor(armThickness/2); t < Math.ceil(armThickness/2); t++){
                const lx1 = shieldDrawCenterX + i + t;
                const ly1 = shieldDrawCenterY + i; 
                if(isPointInShield(lx1, ly1, shieldDetailsFull, shieldDrawCenterX, shieldDrawCenterY)){
                    drawScaledRect(ctx, lx1, ly1, 1, 1, decorationPalette.base, DISPLAY_SCALE);
                }
                const lx2 = shieldDrawCenterX + i + t;
                const ly2 = shieldDrawCenterY - i; 
                 if(isPointInShield(lx2, ly2, shieldDetailsFull, shieldDrawCenterX, shieldDrawCenterY)){
                    drawScaledRect(ctx, lx2, ly2, 1, 1, decorationPalette.base, DISPLAY_SCALE);
                }
            }
        }
    } 
    else if (decorationType === 'half_horizontal' || decorationType === 'half_vertical') { 
        const shieldTopAbsY = shieldDrawCenterY - Math.floor(logicalHeight / 2);
        const shieldLeftAbsX = shieldDrawCenterX - Math.floor(logicalWidth / 2);
        for (let lyRel = 0; lyRel < logicalHeight; lyRel++) {
            for (let lxRel = 0; lxRel < logicalWidth; lxRel++) {
                const lx = shieldLeftAbsX + lxRel;
                const ly = shieldTopAbsY + lyRel;
                if (isPointInShield(lx, ly, shieldDetailsFull, shieldDrawCenterX, shieldDrawCenterY)) {
                    let useDecColor = false;
                    if (decorationType === 'half_horizontal' && lyRel >= logicalHeight / 2) {
                        useDecColor = true;
                    } else if (decorationType === 'half_vertical' && lxRel >= logicalWidth / 2) {
                        useDecColor = true;
                    }
                    if (useDecColor) {
                        drawScaledRect(ctx, lx, ly, 1, 1, decorationPalette.base, DISPLAY_SCALE);
                    }
                }
            }
        }
    }


    if (hasGem && gemPalette) {
        const gemSize = Math.max(2, Math.floor(Math.min(decMaxWidth, decMaxHeight) / 4)); 
        const gemRadius = Math.floor(gemSize/2);

        for (let dy = -gemRadius; dy <= gemRadius; dy++) {
            for (let dx = -gemRadius; dx <= gemRadius; dx++) {
                 if (dx * dx + dy * dy <= gemRadius * gemRadius) { 
                    const lx = shieldDrawCenterX + dx;
                    const ly = shieldDrawCenterY + dy;
                    if (isPointInShield(lx, ly, shieldDetailsFull, shieldDrawCenterX, shieldDrawCenterY)) {
                        drawScaledRect(ctx, lx, ly, 1, 1, gemPalette.base, DISPLAY_SCALE);
                        if (dx <= -gemRadius +1 && dy <= -gemRadius+1 && gemSize > 1) { 
                             drawScaledRect(ctx, lx, ly, 1, 1, gemPalette.highlight, DISPLAY_SCALE);
                        }
                    }
                 }
            }
        }
    }
}


/**
 * Generates a procedural shield.
 * @param {object} options - Options for generation, may include 'subType'.
 */
export function generateShield(options = {}) {
    console.log("generateShield called with options:", options);

    const offscreenCanvas = document.createElement('canvas');
    offscreenCanvas.width = CANVAS_WIDTH;
    offscreenCanvas.height = CANVAS_HEIGHT;
    const ctx = offscreenCanvas.getContext('2d');

    if (!ctx) {
        console.error("Failed to get 2D context for offscreen canvas in generateShield.");
        return { type: 'shield', name: 'Error Shield', seed: Date.now(), itemData: { error: "Canvas context failed" }, imageDataUrl: createErrorDataURL("CTX Fail") };
    }
    ctx.imageSmoothingEnabled = false;
    ctx.clearRect(0, 0, CANVAS_WIDTH, CANVAS_HEIGHT);

    let shieldShape;
    const defaultShieldShapes = ['round', 'kite', 'tower', 'heater', 'oval'];
    
    if (options.subType) {
        switch (options.subType) {
            case 'kite':
                shieldShape = 'kite';
                break;
            case 'tower':
                shieldShape = 'tower';
                break;
            case 'round': 
                shieldShape = getRandomElement(['round', 'oval']);
                break;
            case 'heater':
                shieldShape = 'heater';
                break;
            default:
                shieldShape = getRandomElement(defaultShieldShapes);
                console.warn(`Unknown shield subType: ${options.subType}. Defaulting to random: ${shieldShape}`);
        }
    } else {
        shieldShape = getRandomElement(defaultShieldShapes);
    }


    let logicalWidth, logicalHeight, towerStyle = null, cornerRadius = 0, heaterTopStyle = 'flat', heaterTopBorderStyle = null; 
    if (shieldShape === 'round') {
        logicalWidth = getRandomInt(26, 48); 
        logicalHeight = logicalWidth; 
    } else if (shieldShape === 'oval') {
        logicalWidth = getRandomInt(22, 40);
        logicalHeight = getRandomInt(34, 52);
        if (Math.random() < 0.5) { 
            [logicalWidth, logicalHeight] = [logicalHeight, logicalWidth];
        }
    } else if (shieldShape === 'kite') {
        logicalWidth = getRandomInt(20, 30); 
        logicalHeight = getRandomInt(45, 58); 
    } else if (shieldShape === 'heater') {
        logicalWidth = getRandomInt(24, 38); 
        logicalHeight = getRandomInt(30, 48);
        heaterTopStyle = 'flat'; // Main fill top is flat
        heaterTopBorderStyle = getRandomElement(['flat', 'concave', 'v_shaped']); 
    } else { // tower (shape === 'tower')
        towerStyle = getRandomElement(['rectangle', 'rounded_top', 'rounded_corners']);
        logicalWidth = getRandomInt(18, (towerStyle === 'rounded_top' ? 32 : 28) ); 
        logicalHeight = getRandomInt(38, 58); 
        if (towerStyle === 'rounded_corners') {
            cornerRadius = getRandomInt(3, Math.min(Math.floor(logicalWidth/3), Math.floor(logicalHeight/3), 7));
        }
        if (logicalHeight < logicalWidth * 1.4) logicalHeight = Math.floor(logicalWidth * getRandomInRange(1.4, 2.2));
    }
    logicalWidth = Math.min(logicalWidth, LOGICAL_GRID_WIDTH - CANVAS_PADDING * 2);
    logicalHeight = Math.min(logicalHeight, LOGICAL_GRID_HEIGHT - CANVAS_PADDING * 2);
    logicalWidth = Math.max(14, logicalWidth); 
    logicalHeight = Math.max(18, logicalHeight); 


    const shieldMaterials = ['WOOD', 'IRON', 'STEEL', 'BRONZE', 'DARK_STEEL', 'BONE', 
                             'RED_PAINT', 'GREEN_PAINT', 'BLUE_PAINT', 'BLACK_PAINT', 'WHITE_PAINT', 'YELLOW_PAINT', 'PURPLE_PAINT'];
    const shieldMaterialName = getRandomElement(shieldMaterials);
    const shieldPalette = getPalette(shieldMaterialName);

    const decorationTypes = ['none', 'boss', 'stripes', 'border', 'cross', 'triangle', 
                             'circle_emblem', 'bands', 'chevron', 'diamond', 'diamond_outline', 
                             'saltire', 'half_horizontal', 'half_vertical', 
                             'quadrants', 'sunburst', 'riveted_edge']; 
    const decorationType = getRandomElement(decorationTypes);
    let decorationPaletteName = null;
    let decorationPalette = null;
    let decorationPaletteSecondaryName = null; 
    let decorationPaletteSecondary = null;    
    let bandOrientation = 'horizontal';
    let numBands = 1;
    let chevronDirection = 'up';

    if (decorationType !== 'none') {
        const decorationMaterials = ['GOLD', 'SILVER', 'BRONZE', 'IRON', 'STEEL', 'OBSIDIAN', 'DARK_STEEL', 'ENCHANTED', 'BONE',
                                     'RED_PAINT', 'GREEN_PAINT', 'BLUE_PAINT', 'BLACK_PAINT', 'WHITE_PAINT', 'YELLOW_PAINT', 'PURPLE_PAINT'];
        decorationPaletteName = getRandomElement(decorationMaterials);
        if (decorationPaletteName === shieldMaterialName && decorationMaterials.length > 1) {
            let tempPaletteName = shieldMaterialName;
            while(tempPaletteName === shieldMaterialName) {
                tempPaletteName = getRandomElement(decorationMaterials);
            }
            decorationPaletteName = tempPaletteName;
        }
        decorationPalette = getPalette(decorationPaletteName);

        if (decorationType === 'quadrants') {
            const secondaryDecorMaterials = decorationMaterials.filter(m => m !== shieldMaterialName && m !== decorationPaletteName);
            if (secondaryDecorMaterials.length > 0) {
                decorationPaletteSecondaryName = getRandomElement(secondaryDecorMaterials);
                decorationPaletteSecondary = getPalette(decorationPaletteSecondaryName);
            } else { 
                decorationPaletteSecondary = getPalette(decorationMaterials.find(m => m !== shieldMaterialName) || shieldMaterialName);
            }
        }

        if (decorationType === 'bands') {
            bandOrientation = getRandomElement(['horizontal', 'vertical']);
            numBands = getRandomInt(2, 4);
        } else if (decorationType === 'chevron') {
            chevronDirection = getRandomElement(['up', 'down']);
        }
    }

    const hasGem = Math.random() < 0.20 && !['stripes', 'bands', 'border', 'half_horizontal', 'half_vertical', 'cross', 'saltire', 'quadrants', 'sunburst', 'riveted_edge'].includes(decorationType); 
    let gemColorName = null;
    let gemPalette = null;
    if (hasGem) {
        const gemColors = ['GEM_RED', 'GEM_BLUE', 'GEM_GREEN', 'GEM_PURPLE', 'GEM_YELLOW', 'GEM_ORANGE', 'GEM_CYAN', 'GEM_WHITE'];
        gemColorName = getRandomElement(gemColors);
        gemPalette = getPalette(gemColorName);
    }

    const shieldCenterX = Math.floor(LOGICAL_GRID_WIDTH / 2);
    const shieldCenterY = Math.floor(LOGICAL_GRID_HEIGHT / 2);

    const shieldDetails = {
        shape: shieldShape, 
        logicalWidth,
        logicalHeight,
        palette: shieldPalette,
        towerStyle,
        cornerRadius,
        heaterTopStyle, 
        heaterTopBorderStyle 
    };
    drawShieldShape(ctx, shieldDetails, shieldCenterX, shieldCenterY);

    const decorationDetails = {
        decorationType,
        decorationPalette,
        decorationPaletteSecondary, 
        hasGem,
        gemPalette,
        bandOrientation, 
        numBands,
        chevronDirection
    };
    if (decorationType !== 'none') {
        drawShieldDecoration(ctx, shieldDetails, decorationDetails, shieldCenterX, shieldCenterY);
    }
    

    let subTypeNameForDisplay = options.subType ? options.subType.replace(/_/g, ' ') : shieldShape.replace(/_/g, ' ');
    if (options.subType === 'round' && shieldShape === 'oval') { 
        subTypeNameForDisplay = "Oval";
    } else if (options.subType === 'round' && shieldShape === 'round') {
         subTypeNameForDisplay = "Round";
    }

    subTypeNameForDisplay = subTypeNameForDisplay.split(' ').map(word => word.charAt(0).toUpperCase() + word.slice(1)).join(' ');
    
    let itemName = `${shieldMaterialName} ${subTypeNameForDisplay} Shield`;
    if (shieldShape === 'tower' && towerStyle) {
        itemName = `${shieldMaterialName} ${towerStyle.replace('_',' ')} Tower Shield`;
    } else if (shieldShape === 'heater' && heaterTopBorderStyle) { 
        itemName = `${shieldMaterialName} ${heaterTopBorderStyle.replace('_',' ')} Top Border Heater Shield`;
    }


    if (decorationType !== 'none' && decorationPaletteName) {
        if (decorationType === 'bands') {
            itemName += ` with ${decorationPaletteName} ${bandOrientation} ${decorationType}`;
        } else if (decorationType === 'chevron') {
            itemName += ` with ${decorationPaletteName} ${chevronDirection}-pointing ${decorationType}`;
        } else {
            itemName += ` with ${decorationPaletteName} ${decorationType.replace(/_/g,' ')}`;
        }
        if (decorationType === 'quadrants' && decorationPaletteSecondaryName) {
            itemName += ` & ${decorationPaletteSecondaryName}`;
        }
    }
    if (hasGem && gemColorName) {
        itemName += ` and ${gemColorName.replace('GEM_', '')} Gem`;
    }
    const itemSeed = options.seed || Date.now();

    const generatedItemData = {
        type: 'shield',
        name: itemName,
        seed: itemSeed,
        itemData: {
            shape: shieldShape, 
            subType: options.subType || shieldShape, 
            towerStyle: towerStyle,
            heaterTopStyle: heaterTopStyle, 
            heaterTopBorderStyle: heaterTopBorderStyle, 
            cornerRadius: towerStyle === 'rounded_corners' ? cornerRadius : null,
            material: shieldMaterialName.toLowerCase(),
            logicalWidth,
            logicalHeight,
            colors: shieldPalette,
            decoration: {
                type: decorationType,
                material: decorationPaletteName ? decorationPaletteName.toLowerCase() : null,
                materialSecondary: decorationPaletteSecondaryName ? decorationPaletteSecondaryName.toLowerCase() : null,
                colors: decorationPalette,
                colorsSecondary: decorationPaletteSecondary,
                bandOrientation: decorationType === 'bands' ? bandOrientation : null,
                numBands: decorationType === 'bands' ? numBands : null,
                chevronDirection: decorationType === 'chevron' ? chevronDirection : null,
                hasGem: hasGem,
                gemColor: gemColorName ? gemColorName.toLowerCase().replace('gem_','') : null,
                gemColors: gemPalette
            }
        },
        imageDataUrl: offscreenCanvas.toDataURL()
    };

    console.log("Shield generated:", generatedItemData.name);
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

console.log("js/generators/shield_generator.js loaded");
