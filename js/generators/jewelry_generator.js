/**
 * js/generators/jewelry_generator.js
 * Contains the logic for procedurally generating jewelry (rings, pendants, collars, etc.).
 */

import { getRandomInt, getRandomElement, drawScaledRect, getRandomInRange } from '../utils.js';
import { getPalette, MATERIAL_PALETTES } from '../palettes/material_palettes.js';

// --- Constants specific to jewelry generation or drawing ---
const LOGICAL_GRID_WIDTH = 64;
const LOGICAL_GRID_HEIGHT = 64;
const DISPLAY_SCALE = 4;
const CANVAS_WIDTH = LOGICAL_GRID_WIDTH * DISPLAY_SCALE;
const CANVAS_HEIGHT = LOGICAL_GRID_HEIGHT * DISPLAY_SCALE;
const CANVAS_PADDING = 4;

// --- Internal helper functions for drawing jewelry components ---

/**
 * Draws a ring band.
 * @param {CanvasRenderingContext2D} ctx - The drawing context.
 * @param {object} ringDetails - Properties like centerX, centerY, outerRadius, innerRadius, palette, decoration, bandStyle, hasSetting, totalSettingWidth, totalSettingHeight (gem + setting).
 */
function drawRingBand(ctx, ringDetails) {
    const { centerX, centerY, outerRadius, innerRadius, palette, decoration, decorationPalette, bandStyle, hasSetting, totalSettingWidth, totalSettingHeight } = ringDetails;

    for (let y = -outerRadius; y <= outerRadius; y++) {
        for (let x = -outerRadius; x <= outerRadius; x++) {
            const distSq = x * x + y * y;
            if (distSq <= outerRadius * outerRadius && distSq > innerRadius * innerRadius) {
                // Skip drawing band part where a large setting might be
                if (hasSetting &&
                    y < -innerRadius * 0.3 && 
                    y > -outerRadius - (totalSettingHeight/2) && 
                    Math.abs(x) < Math.ceil(totalSettingWidth / 2) +1 ) { 
                    continue;
                }

                let color = palette.base;

                if (bandStyle === 'domed') {
                    const normalizedDistFromCenterOfBand = Math.abs(distSq - (outerRadius*outerRadius + innerRadius*innerRadius)/2) / ((outerRadius*outerRadius - innerRadius*innerRadius)/2 || 1);
                    if (normalizedDistFromCenterOfBand > 0.50) { 
                        if (y < -innerRadius * 0.1 && Math.abs(x) < outerRadius * 0.8) color = palette.highlight; 
                        else if (y > innerRadius * 0.1 && Math.abs(x) < outerRadius * 0.8) color = palette.shadow; 
                        else if (x < 0) color = palette.highlight;
                        else color = palette.shadow;
                    } else { 
                         color = palette.base;
                    }
                } else {
                    // Basic shading for other styles
                    if (y < -innerRadius * 0.5 && distSq > (outerRadius - 1) * (outerRadius - 1) * 0.6) color = palette.highlight;
                    else if (y > innerRadius * 0.5 && distSq > (outerRadius - 1) * (outerRadius - 1) * 0.6) color = palette.shadow;
                    else if (x < -innerRadius * 0.5 && distSq > (outerRadius - 1) * (outerRadius - 1) * 0.6) color = palette.highlight;
                    else if (x > innerRadius * 0.5 && distSq > (outerRadius - 1) * (outerRadius - 1) * 0.6) color = palette.shadow;
                }


                drawScaledRect(ctx, centerX + x, centerY + y, 1, 1, color, DISPLAY_SCALE);

                const isInSettingArea = hasSetting && y < -innerRadius * 0.3 && Math.abs(x) < Math.ceil(totalSettingWidth / 2)+1;

                if (!isInSettingArea) {
                    if (decoration === 'engraved' && decorationPalette && (Math.abs(x) % 5 === 2 || Math.abs(y) % 5 === 2) && distSq < (outerRadius - 1) * (outerRadius - 1) && distSq > (innerRadius + 1) * (innerRadius + 1)) {
                        drawScaledRect(ctx, centerX + x, centerY + y, 1, 1, decorationPalette.shadow, DISPLAY_SCALE);
                    } else if (bandStyle === 'twisted' && decorationPalette) {
                        if ((x + y + Math.floor(outerRadius)) % 7 < 2) {
                             drawScaledRect(ctx, centerX + x, centerY + y, 1, 1, palette.highlight, DISPLAY_SCALE);
                        } else if ((x + y + Math.floor(outerRadius)) % 7 < 4) {
                             drawScaledRect(ctx, centerX + x, centerY + y, 1, 1, palette.shadow, DISPLAY_SCALE);
                        }
                    } else if (bandStyle === 'channel_set' && decorationPalette && Math.abs(y) > innerRadius * 0.4 && Math.abs(y) < outerRadius * 0.95 && Math.abs(x) < innerRadius * 0.6) {
                        if ((x*3 + y*2 + Math.floor(outerRadius)) % 9 <= 1) { 
                            drawScaledRect(ctx, centerX + x -1, centerY + y -1, 2, 2, decorationPalette.highlight, DISPLAY_SCALE); 
                            drawScaledRect(ctx, centerX + x, centerY + y, 1, 1, decorationPalette.base, DISPLAY_SCALE);
                        } else if ((x*3 + y*2 + Math.floor(outerRadius)) % 9 === 2 || (x*3 + y*2 + Math.floor(outerRadius)) % 9 === 3) { 
                            drawScaledRect(ctx, centerX + x, centerY + y, 1, 1, palette.shadow, DISPLAY_SCALE);
                        }
                    }
                }
            }
        }
    }
}

/**
 * Draws a gemstone with optional setting.
 */
function drawGemstone(ctx, gemDetails) {
    const { centerX, centerY, width, height, shape, palette, hasSetting, settingPalette, settingStyle } = gemDetails;

    const settingThickness = hasSetting ? Math.max(1, Math.floor(Math.min(width, height) / 4)) : 0; 

    if (hasSetting && settingPalette) {
        const gemActualX = centerX - Math.floor(width / 2); 
        const gemActualY = centerY - Math.floor(height / 2);

        if (settingStyle === 'bezel') {
            const bezelX = gemActualX - settingThickness;
            const bezelY = gemActualY - settingThickness;
            const bezelWidth = width + settingThickness * 2;
            const bezelHeight = height + settingThickness * 2;

            drawScaledRect(ctx, bezelX, bezelY, bezelWidth, bezelHeight, settingPalette.base, DISPLAY_SCALE);
            drawScaledRect(ctx, bezelX, bezelY, bezelWidth, settingThickness, settingPalette.highlight, DISPLAY_SCALE); 
            drawScaledRect(ctx, bezelX, bezelY + bezelHeight - settingThickness, bezelWidth, settingThickness, settingPalette.shadow, DISPLAY_SCALE); 
            drawScaledRect(ctx, bezelX, bezelY + settingThickness, settingThickness, bezelHeight - settingThickness*2, settingPalette.highlight, DISPLAY_SCALE); 
            drawScaledRect(ctx, bezelX + bezelWidth - settingThickness, bezelY + settingThickness, settingThickness, bezelHeight - settingThickness*2, settingPalette.shadow, DISPLAY_SCALE); 
            drawScaledRect(ctx, gemActualX, gemActualY, width, 1, settingPalette.shadow, DISPLAY_SCALE); 
            drawScaledRect(ctx, gemActualX, gemActualY + height -1, width, 1, settingPalette.highlight, DISPLAY_SCALE); 
            drawScaledRect(ctx, gemActualX, gemActualY+1, 1, height -2, settingPalette.shadow, DISPLAY_SCALE); 
            drawScaledRect(ctx, gemActualX + width -1, gemActualY+1, 1, height -2, settingPalette.highlight, DISPLAY_SCALE); 


        } else if (settingStyle === 'prong') {
            const prongSize = Math.max(2, settingThickness + 1);
            drawScaledRect(ctx, gemActualX - Math.floor(prongSize/3) , gemActualY - Math.floor(prongSize/3), prongSize, prongSize, settingPalette.highlight, DISPLAY_SCALE);
            drawScaledRect(ctx, gemActualX + width - Math.floor(prongSize*2/3), gemActualY - Math.floor(prongSize/3), prongSize, prongSize, settingPalette.highlight, DISPLAY_SCALE);
            drawScaledRect(ctx, gemActualX - Math.floor(prongSize/3), gemActualY + height - Math.floor(prongSize*2/3), prongSize, prongSize, settingPalette.shadow, DISPLAY_SCALE);
            drawScaledRect(ctx, gemActualX + width - Math.floor(prongSize*2/3), gemActualY + height - Math.floor(prongSize*2/3), prongSize, prongSize, settingPalette.shadow, DISPLAY_SCALE);
        }
    }

    // Draw Gem
    if (shape === 'round' || shape === 'oval') {
        const radiusX = Math.floor(width / 2);
        const radiusY = Math.floor(height / 2);
        for (let dy = -radiusY; dy <= radiusY; dy++) {
            for (let dx = -radiusX; dx <= radiusX; dx++) {
                if ((dx * dx) / (radiusX * radiusX || 1) + (dy * dy) / (radiusY * radiusY || 1) <= 1.05) {
                    let color = palette.base;
                    const distFactor = Math.sqrt((dx * dx) / (radiusX * radiusX || 1) + (dy * dy) / (radiusY * radiusY || 1));

                    if (palette.name === 'Opal' && Math.random() < 0.20) {
                        const fleckColor = getRandomElement([MATERIAL_PALETTES.GEM_RED.highlight, MATERIAL_PALETTES.GEM_GREEN.highlight, MATERIAL_PALETTES.GEM_BLUE.highlight, MATERIAL_PALETTES.GEM_ORANGE.highlight, MATERIAL_PALETTES.GEM_PURPLE.highlight]);
                        color = fleckColor;
                    } else if (palette.name === 'Pearl' && distFactor < 0.5) {
                        color = palette.highlight;
                    } else if (distFactor < 0.4 && width > 2 && height > 2) color = palette.highlight;
                    else if (dx < 0 && dy < 0 && distFactor > 0.6) color = palette.highlight;
                    else if (dx > 0 && dy > 0 && distFactor > 0.6) color = palette.shadow;
                    else if (distFactor > 0.85) {
                        if (dy < 0) color = palette.highlight; else color = palette.shadow;
                    }
                    drawScaledRect(ctx, centerX + dx, centerY + dy, 1, 1, color, DISPLAY_SCALE);
                }
            }
        }
    } else if (shape === 'square' || shape === 'rectangle') {
        const gemX = centerX - Math.floor(width / 2);
        const gemY = centerY - Math.floor(height / 2);
        drawScaledRect(ctx, gemX, gemY, width, height, palette.base, DISPLAY_SCALE);
        if (width > 1 && height > 1) {
            drawScaledRect(ctx, gemX, gemY, width, 1, palette.highlight, DISPLAY_SCALE);
            drawScaledRect(ctx, gemX, gemY + 1, 1, height - 2, palette.highlight, DISPLAY_SCALE);
            drawScaledRect(ctx, gemX + width - 1, gemY + 1, 1, height - 2, palette.shadow, DISPLAY_SCALE);
            drawScaledRect(ctx, gemX, gemY + height - 1, width, 1, palette.shadow, DISPLAY_SCALE);
            if (width > 2 && height > 2) {
                 drawScaledRect(ctx, gemX + 1, gemY + 1, width - 2, height - 2, palette.base, DISPLAY_SCALE);
                 drawScaledRect(ctx, gemX + 1, gemY + 1, width - 2, 1, palette.highlight, DISPLAY_SCALE);
                 if (width > 4 && height > 4) {
                    const glareSize = Math.max(1, Math.floor(Math.min(width,height)/3));
                    drawScaledRect(ctx, centerX - Math.floor(glareSize/2), centerY - Math.floor(glareSize/2), glareSize, glareSize, palette.highlight, DISPLAY_SCALE);
                 }
            }
        }
    } else if (shape === 'teardrop') {
        const pointY = centerY - Math.floor(height / 2);
        const bulbRadiusX = Math.floor(width / 2);
        const bulbHeightRelative = Math.floor(height * 0.65);
        const bulbCenterY = centerY + Math.floor(height / 2) - Math.floor(bulbHeightRelative / 2);

        for (let dy = -Math.floor(bulbHeightRelative/2); dy <= Math.floor(bulbHeightRelative/2); dy++) {
            for (let dx = -bulbRadiusX; dx <= bulbRadiusX; dx++) {
                if ((dx * dx) / (bulbRadiusX * bulbRadiusX || 1) + (dy * dy) / ((bulbHeightRelative/2) * (bulbHeightRelative/2) || 1) <= 1) {
                     let color = palette.base;
                     if (dy < -bulbHeightRelative * 0.35) color = palette.highlight;
                     else if (dy > bulbHeightRelative * 0.35) color = palette.shadow;
                     drawScaledRect(ctx, centerX + dx, bulbCenterY + dy, 1, 1, color, DISPLAY_SCALE);
                }
            }
        }
        const pointPartHeight = height - bulbHeightRelative;
        for (let yOffset = 0; yOffset < pointPartHeight; yOffset++) {
            const progress = yOffset / (pointPartHeight -1 || 1);
            const currentWidth = Math.max(1, Math.floor(bulbRadiusX * 2 * (1 - progress*progress*progress)));
            const x = centerX - Math.floor(currentWidth / 2);
            drawScaledRect(ctx, x, pointY + yOffset, currentWidth, 1, palette.base, DISPLAY_SCALE);
             if (yOffset < Math.max(1,pointPartHeight*0.35)) drawScaledRect(ctx, x, pointY + yOffset, currentWidth, 1, palette.highlight, DISPLAY_SCALE);
        }
    }
}

/**
 * Draws a generic base shape for pendants, amulets, etc.
 */
function drawJewelryBaseShape(ctx, baseDetails) {
    const { centerX, centerY, baseShape, width, height, palette, decoration, decorationPalette } = baseDetails;

    if (baseShape === 'round_disc' || baseShape === 'oval_plate') {
        const radiusX = Math.floor(width / 2);
        const radiusY = Math.floor(height / 2);
        const thickness = getRandomInt(3,5); // Visual thickness for the edge
        for (let y = -radiusY; y <= radiusY; y++) {
            for (let x = -radiusX; x <= radiusX; x++) {
                const distSqFactor = (x * x) / (radiusX * radiusX || 1) + (y * y) / (radiusY * radiusY || 1);
                if (distSqFactor <= 1) {
                    let color = palette.base;
                    // Shading for perceived thickness/bevel
                    if (distSqFactor > 1 - (thickness / Math.min(radiusX,radiusY) || 1) * 0.6 ) {
                        if (y < -radiusY * 0.3 || x < -radiusX * 0.3) color = palette.highlight;
                        else if (y > radiusY * 0.3 || x > radiusX * 0.3) color = palette.shadow;
                    } else { // Inner surface shading
                         if (y < -radiusY * 0.1 && Math.abs(x) < radiusX * 0.5) color = palette.highlight;
                         else if (y > radiusY * 0.1 && Math.abs(x) < radiusX * 0.5) color = palette.shadow;
                    }
                    drawScaledRect(ctx, centerX + x, centerY + y, 1, 1, color, DISPLAY_SCALE);
                    if (decoration === 'engraved' && decorationPalette && (Math.abs(x*y*3) % 13 <= 1) && distSqFactor > 0.1 && distSqFactor < 0.9) {
                        drawScaledRect(ctx, centerX + x, centerY + y, 1, 1, decorationPalette.shadow, DISPLAY_SCALE);
                    }
                }
            }
        }
    } else if (baseShape === 'square_plate' || baseShape === 'rectangular_bar') {
        const plateX = centerX - Math.floor(width/2);
        const plateY = centerY - Math.floor(height/2);
        drawScaledRect(ctx, plateX, plateY, width, height, palette.base, DISPLAY_SCALE);
        // Simple beveled edge shading
        drawScaledRect(ctx, plateX, plateY, width, 1, palette.highlight, DISPLAY_SCALE); // Top
        drawScaledRect(ctx, plateX, plateY+1, 1, height-2, palette.highlight, DISPLAY_SCALE); // Left
        drawScaledRect(ctx, plateX+width-1, plateY+1, 1, height-2, palette.shadow, DISPLAY_SCALE); // Right
        drawScaledRect(ctx, plateX, plateY+height-1, width, 1, palette.shadow, DISPLAY_SCALE); // Bottom
        if (decoration === 'engraved' && decorationPalette && width > 5 && height > 5) {
            for(let i=2; i < width-2; i+=5) {
                 for(let j=2; j < height-2; j+=5) {
                    if ((i+j)%2 === 0) drawScaledRect(ctx, plateX+i, plateY+j, 1,1, decorationPalette.shadow, DISPLAY_SCALE);
                 }
            }
        }
    } else if (baseShape === 'diamond_shape') {
        const halfH = Math.floor(height/2);
        const halfW = Math.floor(width/2);
        for(let yRel = -halfH; yRel <= halfH; yRel++) {
            const progressY = Math.abs(yRel) / (halfH || 1); // 0 at center, 1 at top/bottom
            const currentW = Math.max(1, Math.floor(width * (1 - progressY))); // Width at this Y
            const xStart = centerX - Math.floor(currentW/2);
            for(let xRel = 0; xRel < currentW; xRel++) {
                let color = palette.base;
                if (yRel < -halfH * 0.5) color = palette.highlight; // Top facets
                else if (yRel > halfH * 0.5) color = palette.shadow; // Bottom facets
                else if (xRel < currentW * 0.15 || xRel > currentW * 0.85) color = palette.highlight; // Side highlights
                drawScaledRect(ctx, xStart + xRel, centerY + yRel, 1, 1, color, DISPLAY_SCALE);
            }
        }
    } else if (baseShape === 'teardrop_shape') {
        const pointY = centerY - Math.floor(height / 2); // Topmost point of teardrop
        const bulbRadiusX = Math.floor(width / 2);
        const bulbHeightRelative = Math.floor(height * 0.7); // Rounded bottom part
        const bulbCenterY = centerY + Math.floor(height / 2) - Math.floor(bulbHeightRelative / 2);

        // Draw rounded bottom (bulb)
        for (let dy = -Math.floor(bulbHeightRelative/2); dy <= Math.floor(bulbHeightRelative/2); dy++) {
            for (let dx = -bulbRadiusX; dx <= bulbRadiusX; dx++) {
                if ((dx * dx) / (bulbRadiusX * bulbRadiusX || 1) + (dy * dy) / ((bulbHeightRelative/2) * (bulbHeightRelative/2) || 1) <= 1) {
                     let color = palette.base;
                     if (dy < -bulbHeightRelative * 0.35) color = palette.highlight; // Upper part of bulb
                     else if (dy > bulbHeightRelative * 0.35) color = palette.shadow; // Lower part of bulb
                     drawScaledRect(ctx, centerX + dx, bulbCenterY + dy, 1, 1, color, DISPLAY_SCALE);
                }
            }
        }
        // Draw tapered top point
        const pointPartHeight = height - bulbHeightRelative;
        for (let yOffset = 0; yOffset < pointPartHeight; yOffset++) {
            const progress = yOffset / (pointPartHeight -1 || 1); // 0 at bulb top, 1 at tip
            const currentWidth = Math.max(1, Math.floor(bulbRadiusX * 2 * (1 - progress*progress*progress))); // Sharper taper
            const x = centerX - Math.floor(currentWidth / 2);
            drawScaledRect(ctx, x, pointY + yOffset, currentWidth, 1, palette.base, DISPLAY_SCALE);
             if (yOffset < Math.max(1,pointPartHeight*0.35)) drawScaledRect(ctx, x, pointY + yOffset, currentWidth, 1, palette.highlight, DISPLAY_SCALE); // Highlight tip
        }
    }
}


/**
 * Draws a chain or cord.
 * The attachPointY is the Y-coordinate where the BOTTOM of the bail connects to the pendant.
 */
function drawGenericChain(ctx, chainDetails, attachPointX, attachPointY, isPaired = false, pairOffsetX = 0) {
    const { chainLength, palette, linkSize, type, bailHeight } = chainDetails;
    const numLinks = Math.floor(chainLength / (linkSize || 1));
    let chainActualStartY = attachPointY;

    // Draw Bail (connector piece)
    if (bailHeight && bailHeight > 0) {
        const bailWidth = Math.max(2, (linkSize || 1) + 2 + (type === 'thick_chain' ? 1 : 0));
        const bailX = attachPointX - Math.floor(bailWidth / 2);
        const bailTopEdgeY = attachPointY - bailHeight; // Bail extends upwards from attachPointY

        drawScaledRect(ctx, bailX, bailTopEdgeY, bailWidth, bailHeight, palette.base, DISPLAY_SCALE);
        // Bail shading
        drawScaledRect(ctx, bailX, bailTopEdgeY, bailWidth, 1, palette.highlight, DISPLAY_SCALE); // Top edge
        if(bailWidth > 1) {
            drawScaledRect(ctx, bailX, bailTopEdgeY + 1, 1, bailHeight - 1, palette.highlight, DISPLAY_SCALE); // Left edge
            drawScaledRect(ctx, bailX + bailWidth - 1, bailTopEdgeY + 1, 1, bailHeight - 1, palette.shadow, DISPLAY_SCALE); // Right edge
        }
        if (bailHeight > 1) { // Bottom edge shadow (if not just 1px high)
             drawScaledRect(ctx, bailX + 1, bailTopEdgeY + bailHeight -1, bailWidth -2, 1, palette.shadow, DISPLAY_SCALE);
        }
        chainActualStartY = bailTopEdgeY; // Chain starts from the top of the bail
    }


    for (let side = 0; side < (isPaired ? 2 : 1); side++) {
        const currentAttachXForSide = isPaired ? (side === 0 ? attachPointX - pairOffsetX : attachPointX + pairOffsetX) : attachPointX;
        let prevLinkCenterX = currentAttachXForSide;
        let prevLinkCenterY = chainActualStartY;


        for (let i = 0; i < numLinks; i++) {
            const progress = i / (numLinks - 1 || 1); // 0 at bail, 1 at end of chain
            // Chain links go upwards from chainActualStartY
            let currentLinkCenterY = chainActualStartY - (i * (linkSize||1)) - Math.floor((linkSize||1) / 2);

            // Horizontal spread for the chain loop
            const horizontalSpreadMax = (LOGICAL_GRID_WIDTH / (isPaired ? 3.7 : 2.1) - (isPaired ? Math.abs(pairOffsetX) : 0)) * 0.92 + (LOGICAL_GRID_WIDTH / (isPaired ? 11 : 6));
            let currentHorizontalSpread = horizontalSpreadMax * Math.sin(progress * Math.PI * 0.99); // Sine curve for spread

            if (isPaired && side === 1) currentHorizontalSpread *= -1; // Right side of pair goes opposite direction
            
            let currentLinkCenterX = currentAttachXForSide + (isPaired ? currentHorizontalSpread : ( (i%4 < 2 ? -0.8 : 0.8) * currentHorizontalSpread * Math.sin(progress * Math.PI * 0.5) ) );

            // Adjust link position to maintain consistent spacing (simple approach)
            const targetPrevX = (i === 0) ? currentAttachXForSide : prevLinkCenterX;
            const targetPrevY = (i === 0) ? chainActualStartY : prevLinkCenterY;

            const dx = currentLinkCenterX - targetPrevX;
            const dy = currentLinkCenterY - targetPrevY;
            const dist = Math.sqrt(dx*dx + dy*dy);
            const desiredDist = (linkSize||1) * 0.95; // Slightly less than linkSize for overlap

            if (dist > desiredDist && dist > 0) { // If links are too far, pull them closer
                currentLinkCenterX = targetPrevX + (dx / dist) * desiredDist;
                currentLinkCenterY = targetPrevY + (dy / dist) * desiredDist;
            }


            if (currentLinkCenterY > CANVAS_PADDING - (linkSize||1) && currentLinkCenterY < LOGICAL_GRID_HEIGHT - CANVAS_PADDING + (linkSize||1)) {
                let linkColor = palette.base;
                if (type === 'chain_links' && i % 4 === 0) linkColor = palette.highlight;
                else if (type === 'chain_links' && i % 4 === 2) linkColor = palette.shadow;
                if (type === 'beaded_cord' && i % 5 === 0) linkColor = palette.highlight;

                const drawX = Math.floor(currentLinkCenterX - (linkSize||1) / 2);
                const drawY = Math.floor(currentLinkCenterY - (linkSize||1) / 2);

                if (type === 'thick_chain') {
                    drawScaledRect(ctx, drawX, drawY, (linkSize||1), (linkSize||1), palette.base, DISPLAY_SCALE);
                    drawScaledRect(ctx, drawX, drawY, (linkSize||1), 1, palette.highlight, DISPLAY_SCALE);
                    if((linkSize||1) > 1) {
                        drawScaledRect(ctx, drawX, drawY+(linkSize||1)-1, (linkSize||1), 1, palette.shadow, DISPLAY_SCALE);
                        drawScaledRect(ctx, drawX, drawY+1, 1, (linkSize||1)-2, palette.highlight, DISPLAY_SCALE);
                        drawScaledRect(ctx, drawX+(linkSize||1)-1, drawY+1, 1, (linkSize||1)-2, palette.shadow, DISPLAY_SCALE);
                    }
                } else {
                    drawScaledRect(ctx, drawX, drawY, (linkSize||1), (linkSize||1), linkColor, DISPLAY_SCALE);
                }
                prevLinkCenterX = currentLinkCenterX;
                prevLinkCenterY = currentLinkCenterY;
            }
        }
    }
}


/**
 * Draws a circlet band.
 */
function drawCircletBand(ctx, circletDetails) {
    const { centerX, centerY, bandWidth, bandHeight, palette, decoration, decorationPalette, bandStyle } = circletDetails;
    const arcRadiusX = Math.floor(bandWidth / 2);
    const arcRadiusY = Math.floor(bandHeight * 0.35); 
    const bandThickness = getRandomInt(4, 7); 

    for (let x = -arcRadiusX; x <= arcRadiusX; x++) {
        const y_offset_normalized = Math.sqrt(Math.max(0, 1 - (x * x) / (arcRadiusX * arcRadiusX || 1)));
        const yBase = centerY - Math.floor(y_offset_normalized * arcRadiusY) - Math.floor(bandThickness * 0.35); 


        if (yBase < CANVAS_PADDING || yBase + bandThickness > LOGICAL_GRID_HEIGHT - CANVAS_PADDING) continue;

        for (let t = 0; t < bandThickness; t++) {
            let color = palette.base;
             if (bandStyle === 'twisted' && decorationPalette) {
                if ((x + yBase + t + Math.floor(arcRadiusX)) % 9 < 3) color = palette.highlight;
                else if ((x + yBase + t + Math.floor(arcRadiusX)) % 9 < 6) color = palette.shadow;
            } else {
                if (t < bandThickness * 0.3) color = palette.highlight;
                else if (t > bandThickness * 0.7) color = palette.shadow;
                // Highlight the very front center of the circlet
                else if (y_offset_normalized > 0.92 && Math.abs(x) < arcRadiusX * 0.25 && t > bandThickness*0.3 && t < bandThickness*0.7) color = palette.highlight;
            }

            drawScaledRect(ctx, centerX + x, yBase + t, 1, 1, color, DISPLAY_SCALE);

            if (decoration === 'engraved' && decorationPalette && (Math.abs(x) % 11 === 0 || Math.abs(x) % 11 === 1) && t > 1 && t < bandThickness - 2) {
                drawScaledRect(ctx, centerX + x, yBase + t, 1, 1, decorationPalette.shadow, DISPLAY_SCALE);
            }
        }
    }
}


/**
 * Generates a procedural piece of jewelry.
 * @param {object} options - Options for generation, may include 'subType'.
 */
export function generateJewelry(options = {}) {
    console.log("generateJewelry called with options:", options);

    const offscreenCanvas = document.createElement('canvas');
    offscreenCanvas.width = CANVAS_WIDTH;
    offscreenCanvas.height = CANVAS_HEIGHT;
    const ctx = offscreenCanvas.getContext('2d');

    if (!ctx) {
        console.error("Failed to get 2D context for offscreen canvas in generateJewelry.");
        return { type: 'jewelry', name: 'Error Jewelry', seed: Date.now(), itemData: { error: "Canvas context failed" }, imageDataUrl: createErrorDataURL("CTX Fail") };
    }
    ctx.imageSmoothingEnabled = false;
    ctx.clearRect(0, 0, CANVAS_WIDTH, CANVAS_HEIGHT);

    // MODIFIED: Determine jewelryType based on options.subType
    let jewelryType;
    const defaultJewelryTypes = ['ring', 'pendant', 'amulet', 'earring_stud', 'earring_dangle', 'earring_hoop', 'circlet', 'collar'];
    if (options.subType && defaultJewelryTypes.includes(options.subType)) {
        jewelryType = options.subType;
    } else {
        jewelryType = getRandomElement(defaultJewelryTypes);
        if (options.subType) console.warn(`Unknown jewelry subType: ${options.subType}. Defaulting to random: ${jewelryType}`);
    }


    const metalMaterials = ['GOLD', 'SILVER', 'BRONZE', 'STEEL', 'DARK_STEEL', 'OBSIDIAN', 'ENCHANTED', 'COPPER', 'ROSE_GOLD'];
    const metalMaterialName = getRandomElement(metalMaterials);
    const metalPalette = getPalette(metalMaterialName === 'ROSE_GOLD' ? 'COPPER' : metalMaterialName); // Rose gold uses copper palette

    const gemMaterials = ['GEM_RED', 'GEM_BLUE', 'GEM_GREEN', 'GEM_PURPLE', 'GEM_YELLOW', 'GEM_ORANGE', 'GEM_CYAN', 'GEM_WHITE', 'OBSIDIAN', 'ENCHANTED', 'PEARL', 'OPAL', 'DIAMOND'];
    const hasGem = Math.random() < 0.85;
    let gemMaterialName = null;
    let gemPalette = null;
    let gemShape = 'round';
    let gemWidth = 0, gemHeight = 0;
    let hasSetting = false;
    let settingStyle = 'bezel';
    let settingPalette = metalPalette; // Default setting to main metal
    let totalSettingWidth = 0;
    let totalSettingHeight = 0;


    if (hasGem) {
        gemMaterialName = getRandomElement(gemMaterials);
        gemPalette = getPalette(gemMaterialName === 'DIAMOND' ? 'GEM_WHITE' : gemMaterialName); // Diamond uses white gem palette
        gemShape = getRandomElement(['round', 'square', 'rectangle', 'oval', 'teardrop']);
        
        // Base gem sizes, can be overridden by jewelry type
        gemWidth = getRandomInt(8, 18);
        gemHeight = (gemShape === 'round' || gemShape === 'square') ? gemWidth : getRandomInt(Math.floor(gemWidth * 0.5), Math.floor(gemWidth * 1.8));
        if (gemShape === 'teardrop') gemHeight = Math.max(gemWidth, Math.floor(gemWidth * 1.8));

        // Adjust gem size based on jewelry type
        if (jewelryType.includes('ring')) { gemWidth = getRandomInt(8,14); gemHeight = (gemShape === 'round' || gemShape === 'square') ? gemWidth : getRandomInt(8,16);}
        if (jewelryType.includes('earring')) { gemWidth = getRandomInt(8,16); gemHeight = (gemShape === 'round' || gemShape === 'square') ? gemWidth : getRandomInt(8,18);}
        if (jewelryType === 'circlet' || jewelryType === 'collar') { gemWidth = getRandomInt(10,18); gemHeight = (gemShape === 'round' || gemShape === 'square') ? gemWidth : getRandomInt(10,20);}
    
        if (Math.random() < 0.8) { // Chance for a setting
            hasSetting = true;
            settingStyle = getRandomElement(['bezel', 'prong']);
            if (Math.random() < 0.3) { // Chance for contrast setting material
                const contrastMetals = metalMaterials.filter(m => m !== metalMaterialName && m !== 'ROSE_GOLD');
                if (contrastMetals.length > 0) settingPalette = getPalette(getRandomElement(contrastMetals));
            }
        }
        // Calculate total size including setting
        const settingThickness = hasSetting ? Math.max(1, Math.floor(Math.min(gemWidth, gemHeight) / 4.5)) : 0;
        const prongSize = Math.max(2, settingThickness + 1); // Used for prong style setting
        totalSettingWidth = gemWidth + (hasSetting && settingStyle === 'bezel' ? settingThickness * 2 : (hasSetting && settingStyle === 'prong' ? prongSize : 0) );
        totalSettingHeight = gemHeight + (hasSetting && settingStyle === 'bezel' ? settingThickness * 2 : (hasSetting && settingStyle === 'prong' ? prongSize : 0) );
    }


    const decorationTypes = ['none', 'engraved', 'filigree']; // Filigree could be complex, maybe a texture overlay
    const itemDecoration = getRandomElement(decorationTypes);
    let decorationPalette = null;
    if (itemDecoration !== 'none') {
        const decorMaterials = metalMaterials.filter(m => m !== metalMaterialName && m !== 'ROSE_GOLD');
        decorationPalette = getPalette(getRandomElement(decorMaterials.length > 0 ? decorMaterials : [metalMaterialName === 'ROSE_GOLD' ? 'COPPER' : metalMaterialName]));
    }

    // MODIFIED: Item Naming
    let subTypeNameForDisplay = jewelryType.replace(/_/g, ' ');
    subTypeNameForDisplay = subTypeNameForDisplay.split(' ').map(word => word.charAt(0).toUpperCase() + word.slice(1)).join(' ');
    let itemName = `${metalPalette.name} ${subTypeNameForDisplay}`;

    if (itemDecoration !== 'none') itemName += ` (${itemDecoration})`;
    if (hasGem) {
        itemName += ` with ${gemPalette.name} ${gemShape} Gem`;
        if(hasSetting) itemName += ` (${settingStyle} set)`;
    }

    const centerX = Math.floor(LOGICAL_GRID_WIDTH / 2);
    const centerY = Math.floor(LOGICAL_GRID_HEIGHT / 2);

    if (jewelryType === 'ring') {
        const outerRadius = getRandomInt(20, 28); 
        const thicknessOptions = [5, 6, 7, 8, 9]; 
        const thickness = getRandomElement(thicknessOptions);
        const innerRadius = outerRadius - thickness;
        const bandStyleOptions = ['plain', 'twisted', 'channel_set', 'domed'];
        const bandStyle = getRandomElement(bandStyleOptions);
        
        drawRingBand(ctx, { centerX, centerY, outerRadius, innerRadius, palette: metalPalette, decoration: itemDecoration, decorationPalette, bandStyle, hasSetting, totalSettingWidth, totalSettingHeight });

        if (hasGem) {
            const gemBaseY = centerY - outerRadius + thickness; 
            const gemVisualCenterY = gemBaseY - Math.floor(totalSettingHeight / 2) + Math.floor(thickness * 0.15); 

            drawGemstone(ctx, { centerX, centerY: gemVisualCenterY, width: gemWidth, height: gemHeight, shape: gemShape, palette: gemPalette, hasSetting, settingPalette, settingStyle });
        }
    } else if (jewelryType === 'pendant' || jewelryType === 'amulet') {
        const bodySize = (jewelryType === 'amulet') ? getRandomInt(28, 42) : getRandomInt(24, 36); 
        const bodyShapeOptions = ['round_disc', 'square_plate', 'oval_plate', 'diamond_shape', 'teardrop_shape'];
        const bodyShape = getRandomElement(bodyShapeOptions);
        
        let bodyWidth = bodySize;
        let bodyHeight = bodySize;
        if(bodyShape === 'oval_plate') {
            bodyWidth = Math.random() < 0.5 ? bodySize : Math.floor(bodySize * 0.6);
            bodyHeight = bodyWidth === bodySize ? Math.floor(bodySize * 0.6) : bodySize;
        } else if (bodyShape === 'diamond_shape'){
            bodyWidth = Math.floor(bodySize * 0.65); bodyHeight = bodySize;
        } else if (bodyShape === 'teardrop_shape'){
            bodyWidth = Math.floor(bodySize * 0.7); bodyHeight = bodySize;
        }

        const bodyCenterY = centerY + Math.floor(LOGICAL_GRID_HEIGHT / 9) + 3; 
        drawJewelryBaseShape(ctx, {centerX, centerY: bodyCenterY, baseShape: bodyShape, width: bodyWidth, height: bodyHeight, palette: metalPalette, decoration:itemDecoration, decorationPalette});

        if (hasGem) {
            drawGemstone(ctx, { centerX, centerY: bodyCenterY, width: gemWidth, height: gemHeight, shape: gemShape, palette: gemPalette, hasSetting, settingPalette, settingStyle });
        }

        const chainMaterials = ['SILVER', 'GOLD', 'IRON', 'LEATHER', 'BRONZE', 'DARK_STEEL', 'COPPER'];
        const chainPalette = getPalette(getRandomElement(chainMaterials));
        const chainTypes = ['chain_links', 'cord', 'beaded_cord', 'thick_chain'];
        const chainType = getRandomElement(chainTypes);
        const linkSize = (chainType === 'cord') ? 1 : (chainType === 'thick_chain' ? 3 : getRandomInt(2,3));
        const bailHeight = getRandomInt(6,9); 

        const chainAttachActualY = bodyCenterY - Math.floor(bodyHeight/2);
        drawGenericChain(ctx, { chainLength: LOGICAL_GRID_HEIGHT * 0.8, palette: chainPalette, linkSize, type: chainType, bailHeight }, centerX, chainAttachActualY);

    } else if (jewelryType.includes('earring')) { // Handles earring_stud, earring_dangle, earring_hoop
        const earringPairOffset = Math.floor(LOGICAL_GRID_WIDTH / 5.5);
        const maxEarringHeightEstimate = jewelryType === 'earring_dangle' ? 50 : (jewelryType === 'earring_hoop' ? 32 : 24);
        const earringOverallTopY = centerY - Math.floor(maxEarringHeightEstimate / 2) + Math.floor(LOGICAL_GRID_HEIGHT / 9);


        const currentGemWidth = hasGem ? gemWidth : getRandomInt(8,14);
        const currentGemHeight = hasGem ? gemHeight : currentGemWidth;
        const currentGemShape = hasGem ? gemShape : 'round';
        const currentGemPalette = hasGem ? gemPalette : metalPalette;
        const currentHasSetting = hasGem ? hasSetting : false;
        const currentSettingStyle = hasGem ? settingStyle : 'bezel';
        const currentSettingPalette = hasGem ? settingPalette : metalPalette;
        
        const currentHoopOuterRadius = getRandomInt(10, 16); 
        const currentHoopThickness = getRandomInt(2,4);


        for (let i = 0; i < 2; i++) { // Draw a pair
            const currentCenterX = centerX + (i === 0 ? -earringPairOffset : earringPairOffset);
            let componentTopY = earringOverallTopY;

            if (jewelryType === 'earring_stud') {
                const studCenterY = componentTopY + Math.floor(currentGemHeight / 2);
                drawGemstone(ctx, { centerX: currentCenterX, centerY: studCenterY, width: currentGemWidth, height: currentGemHeight, shape: currentGemShape, palette: currentGemPalette, hasSetting: currentHasSetting, settingPalette: currentSettingPalette, settingStyle: currentSettingStyle });
                if (hasGem && !currentHasSetting) { // Simple post shadow if no setting
                    drawScaledRect(ctx, currentCenterX -1, studCenterY + Math.floor(currentGemHeight/2) + 1, 2, 2, metalPalette.shadow, DISPLAY_SCALE);
                }
            } else if (jewelryType === 'earring_dangle') {
                const hookSize = getRandomInt(8,11);
                const actualHookTopY = componentTopY;
                
                // Draw hook
                drawScaledRect(ctx, currentCenterX - 1, actualHookTopY, 1, hookSize, metalPalette.base, DISPLAY_SCALE); // Vertical part
                drawScaledRect(ctx, currentCenterX, actualHookTopY + hookSize -2, 2, 2, metalPalette.base, DISPLAY_SCALE); // Bottom curve
                drawScaledRect(ctx, currentCenterX -1, actualHookTopY, 1, 1, metalPalette.highlight, DISPLAY_SCALE); // Top highlight

                const dangleAttachY = actualHookTopY + hookSize + 1;
                if (hasGem) {
                    const connectorLength = Math.max(3,Math.floor(currentGemHeight/3.5));
                    drawScaledRect(ctx, currentCenterX, dangleAttachY, 1, connectorLength, metalPalette.base, DISPLAY_SCALE); // Connector line
                    drawGemstone(ctx, { centerX: currentCenterX, centerY: dangleAttachY + connectorLength + Math.floor(currentGemHeight / 2), width: currentGemWidth, height: currentGemHeight, shape: currentGemShape, palette: currentGemPalette, hasSetting: currentHasSetting, settingPalette: currentSettingPalette, settingStyle: currentSettingStyle });
                } else { // Metal dangle piece if no gem
                    const dangleMetalHeight = getRandomInt(18, 28);
                    const mDangleWidth = getRandomInt(7,12);
                    drawScaledRect(ctx, currentCenterX - Math.floor(mDangleWidth/2), dangleAttachY, mDangleWidth, dangleMetalHeight, metalPalette.base, DISPLAY_SCALE);
                    drawScaledRect(ctx, currentCenterX - Math.floor(mDangleWidth/2), dangleAttachY, 1, dangleMetalHeight, metalPalette.highlight, DISPLAY_SCALE);
                     if(mDangleWidth > 1) drawScaledRect(ctx, currentCenterX + Math.floor(mDangleWidth/2) -1, dangleAttachY, 1, dangleMetalHeight, metalPalette.shadow, DISPLAY_SCALE);
                }
            } else if (jewelryType === 'earring_hoop') {
                const hoopInnerRadius = currentHoopOuterRadius - currentHoopThickness;
                const hoopVisualCenterY = componentTopY + currentHoopOuterRadius; // Center of the hoop circle

                drawRingBand(ctx, { centerX: currentCenterX, centerY: hoopVisualCenterY, outerRadius: currentHoopOuterRadius, innerRadius: hoopInnerRadius, palette: metalPalette, decoration: 'none', bandStyle:'plain' });
                // Clasp/Post for hoop
                drawScaledRect(ctx, currentCenterX -1, componentTopY -1 , 3, 3, metalPalette.base, DISPLAY_SCALE);
                drawScaledRect(ctx, currentCenterX -1, componentTopY -1, 1,1, metalPalette.highlight, DISPLAY_SCALE);
            }
        }
    } else if (jewelryType === 'circlet') {
        const circletWidth = LOGICAL_GRID_WIDTH * getRandomInRange(0.9, 0.98);
        const circletVisualHeight = LOGICAL_GRID_HEIGHT * getRandomInRange(0.35, 0.45); // Visual height of the arc
        const circletDrawCenterY = CANVAS_PADDING + Math.floor(circletVisualHeight * 0.2) + 20; // Position higher on canvas
        const bandStyle = Math.random() < 0.5 ? 'twisted' : (Math.random() < 0.8 ? 'plain' : 'engraved');

        drawCircletBand(ctx, {centerX, centerY: circletDrawCenterY, bandWidth: circletWidth, bandHeight: circletVisualHeight, palette: metalPalette, decoration:(bandStyle==='engraved'? 'engraved' : itemDecoration), decorationPalette, bandStyle});
        if (hasGem) {
            // Position gem at the front-center of the circlet arc
            const gemYOffsetFactor = Math.sqrt(Math.max(0, 1 - (0) / ( (circletWidth/2) * (circletWidth/2) || 1))); // y_offset_normalized for x=0
            const bandCenterTopY = circletDrawCenterY - Math.floor(gemYOffsetFactor * circletVisualHeight * 0.35) - Math.floor(getRandomInt(4,7) * 0.35); // Top edge of band at center
            const gemCenterY = bandCenterTopY - Math.floor(totalSettingHeight / 2) + Math.floor(gemHeight * 0.1); // Place gem slightly above band center

            drawGemstone(ctx, { centerX, centerY: gemCenterY, width: gemWidth, height: gemHeight, shape: gemShape, palette: gemPalette, hasSetting, settingPalette, settingStyle });
        }
    } else if (jewelryType === 'collar' || jewelryType === 'choker') { // Choker is an alias for collar
        const collarWidth = LOGICAL_GRID_WIDTH * getRandomInRange(0.8, 0.95);
        const collarVisualHeight = LOGICAL_GRID_HEIGHT * getRandomInRange(0.3, 0.4); // Visual height of the arc
        const collarBandThickness = getRandomInt(12,20); // Thickness of the collar band
        const collarArcHeight = Math.floor(collarVisualHeight * 0.25); 
        const collarTotalVisualTop = CANVAS_PADDING + 15; 
        const collarDrawCenterY = collarTotalVisualTop + collarArcHeight + Math.floor(collarBandThickness / 2);


        const arcRadiusXCollar = Math.floor(collarWidth / 2);
        const arcRadiusYCollar = Math.floor(collarVisualHeight * 0.25); 

        for (let x = -arcRadiusXCollar; x <= arcRadiusXCollar; x++) {
            const y_offset_normalized = Math.sqrt(Math.max(0, 1 - (x * x) / (arcRadiusXCollar * arcRadiusXCollar || 1)));
            const yBase = collarDrawCenterY - Math.floor(y_offset_normalized * arcRadiusYCollar);

            if (yBase - Math.floor(collarBandThickness/2) < CANVAS_PADDING || yBase + Math.ceil(collarBandThickness/2) > LOGICAL_GRID_HEIGHT - CANVAS_PADDING) continue;


            for(let t=0; t < collarBandThickness; t++){
                let color = metalPalette.base;
                const currentPixelY = yBase - Math.floor(collarBandThickness/2) + t;

                if (t < collarBandThickness * 0.2) color = metalPalette.highlight;
                else if (t > collarBandThickness * 0.8) color = metalPalette.shadow;
                else if (y_offset_normalized > 0.95 && t > collarBandThickness * 0.25 && t < collarBandThickness * 0.75) { 
                    color = metalPalette.highlight;
                }
                drawScaledRect(ctx, centerX + x, currentPixelY, 1, 1, color, DISPLAY_SCALE);
                 if (itemDecoration === 'engraved' && decorationPalette && (Math.abs(x) % 12 === 6 || Math.abs(x) % 12 === 7) && t > 2 && t < collarBandThickness -3) {
                    drawScaledRect(ctx, centerX + x, currentPixelY, 1, 1, decorationPalette.shadow, DISPLAY_SCALE);
                }
            }
        }

         if (hasGem) {
            const gemVisualCenterY = collarDrawCenterY - Math.floor(totalSettingHeight/2) - Math.floor(collarBandThickness*0.1); 
            drawGemstone(ctx, { centerX, centerY: gemVisualCenterY, width: gemWidth, height: gemHeight, shape: gemShape, palette: gemPalette, hasSetting, settingPalette, settingStyle });
        }
    }


    const itemSeed = options.seed || Date.now();

    const generatedItemData = {
        type: 'jewelry',
        name: itemName,
        seed: itemSeed,
        itemData: {
            jewelryType, // Actual type used
            subType: options.subType || jewelryType, // Store selected subType
            metal: metalMaterialName.toLowerCase(),
            metalColors: metalPalette,
            decoration: itemDecoration,
            decorationColors: decorationPalette,
            hasGem,
            gemMaterial: hasGem ? gemMaterialName.toLowerCase().replace('gem_', '') : null,
            gemShape: hasGem ? gemShape : null,
            gemWidth: hasGem ? gemWidth : null,
            gemHeight: hasGem ? gemHeight : null,
            gemColors: gemPalette,
            hasSetting,
            settingStyle: hasSetting ? settingStyle : null,
            settingColors: hasSetting ? settingPalette : null,
        },
        imageDataUrl: offscreenCanvas.toDataURL()
    };

    console.log("Jewelry generated:", generatedItemData.name);
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
        const fontSize = Math.floor(CANVAS_WIDTH / 10);
        ctx.font = `bold ${fontSize}px sans-serif`; ctx.fillStyle = 'white';
        ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
        ctx.fillText(message, CANVAS_WIDTH / 2, CANVAS_HEIGHT / 2);
        try { return errorCanvas.toDataURL(); } catch (e) { console.error("Error converting error canvas to Data URL:", e); }
    }
    return "data:image/gif;base64,R0lGODlhAQABAIAAAAAAAP///yH5BAEAAAAALAAAAAABAAEAAAIBRAA7";
}

console.log("js/generators/jewelry_generator.js loaded with collar fix and earring spacing adjustment.");
