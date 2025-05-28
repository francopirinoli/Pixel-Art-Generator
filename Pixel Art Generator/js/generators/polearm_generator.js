/**
 * js/generators/polearm_generator.js
 * Contains the logic for procedurally generating polearms.
 */

import { getRandomInt, getRandomElement, drawScaledRect, getRandomInRange } from '../utils.js';
import { getPalette } from '../palettes/material_palettes.js';

// --- Constants specific to polearm generation or drawing ---
const LOGICAL_GRID_WIDTH = 32; 
const LOGICAL_GRID_HEIGHT = 64; 
const DISPLAY_SCALE = 4;
const CANVAS_WIDTH = LOGICAL_GRID_WIDTH * DISPLAY_SCALE;   // 128
const CANVAS_HEIGHT = LOGICAL_GRID_HEIGHT * DISPLAY_SCALE; // 256
const CANVAS_PADDING = 2;
const MIN_SHAFT_LENGTH = 25; 

// --- Internal helper functions for drawing polearm components ---

/**
 * Draws the polearm shaft.
 * @param {CanvasRenderingContext2D} ctx - The context of the offscreen canvas.
 * @param {object} shaftDetails - Properties like length, thickness, palette, detailType.
 * @param {number} startX - Logical X center for the shaft.
 * @param {number} headBottomY - Logical Y where the bottom of the head (or top of shaft) is.
 */
function drawShaft(ctx, shaftDetails, startX, headBottomY) {
    const { logicalLength, logicalThickness, palette, detailType, materialName, hasButtCap, buttCapMaterial, wrapPalette } = shaftDetails;
    const shaftX = startX - Math.floor(logicalThickness / 2);

    for (let i = 0; i < logicalLength; i++) {
        const y = headBottomY + i;
        drawScaledRect(ctx, shaftX, y, logicalThickness, 1, palette.base, DISPLAY_SCALE);
        
        if (materialName === 'WOOD' && detailType === 'grain') {
            if (i % getRandomInt(4, 8) === 0 && logicalThickness > 0) {
                const grainX = shaftX + getRandomInt(0, logicalThickness -1);
                drawScaledRect(ctx, grainX, y, 1, 1, palette.shadow, DISPLAY_SCALE);
            }
        } else if (['IRON', 'STEEL', 'DARK_STEEL', 'BRONZE'].includes(materialName) && detailType === 'rivets') {
            if (i % getRandomInt(5, 10) === 0 && logicalThickness > 0) {
                const rivetX = shaftX + Math.floor(logicalThickness/2) + getRandomElement([-1,0,1])*(logicalThickness > 1 ? 1:0) ;
                 if(rivetX >= shaftX && rivetX < shaftX + logicalThickness){
                    drawScaledRect(ctx, rivetX, y, 1, 1, palette.shadow, DISPLAY_SCALE);
                 }
            }
        } else if (detailType === 'wrapped' && wrapPalette) { 
             if ((i + Math.floor(shaftX/2)) % 4 < 2 && logicalThickness > 0) {
                drawScaledRect(ctx, shaftX, y, logicalThickness, 1, wrapPalette.base, DISPLAY_SCALE); 
             } else if (logicalThickness > 1 && (i + Math.floor(shaftX/2) + 2) % 4 < 2) {
                 drawScaledRect(ctx, shaftX, y, logicalThickness, 1, wrapPalette.base, DISPLAY_SCALE); 
             }
        } else if (detailType === 'metal_bands' && wrapPalette) { 
            if (i > logicalLength * 0.1 && i < logicalLength * 0.9 && i % getRandomInt(8, 15) < 2) {
                drawScaledRect(ctx, shaftX -1, y, logicalThickness + 2, 1, wrapPalette.base, DISPLAY_SCALE);
                drawScaledRect(ctx, shaftX -1, y, 1, 1, wrapPalette.highlight, DISPLAY_SCALE);
                drawScaledRect(ctx, shaftX + logicalThickness, y, 1, 1, wrapPalette.shadow, DISPLAY_SCALE);
            }
        }


        if (logicalThickness > 1) {
            drawScaledRect(ctx, shaftX, y, 1, 1, palette.highlight, DISPLAY_SCALE);
            drawScaledRect(ctx, shaftX + logicalThickness - 1, y, 1, 1, palette.shadow, DISPLAY_SCALE);
        } else if (logicalThickness === 1 && detailType !== 'wrapped' && detailType !== 'metal_bands') {
             drawScaledRect(ctx, shaftX, y, 1, 1, palette.highlight, DISPLAY_SCALE);
        }
    }
    if (hasButtCap && buttCapMaterial) {
        const capPalette = getPalette(buttCapMaterial);
        const capHeight = Math.max(1, Math.floor(logicalThickness * 1.2)); 
        const capY = headBottomY + logicalLength;
        const capWidth = logicalThickness + (logicalThickness === 1 ? 0 : 2); 
        const capX = startX - Math.floor(capWidth / 2);

        drawScaledRect(ctx, capX, capY, capWidth, capHeight, capPalette.base, DISPLAY_SCALE);
        if (capHeight > 0) drawScaledRect(ctx, capX, capY + capHeight -1, capWidth, 1, capPalette.shadow, DISPLAY_SCALE);
        if (capWidth > 1 && capHeight > 1) {
            drawScaledRect(ctx, capX, capY, 1, capHeight, capPalette.highlight, DISPLAY_SCALE);
        }
    }
}

function drawHead(ctx, headDetails, mountX, mountY) {
    const { headType, logicalSize, palette, secondaryPalette, shaftThickness, 
            axeBladeShape, rearComponentType, rearComponentHeight, 
            prongStyle, prongSplay, // For Trident
            glaiveCurveStyle, glaiveCurveIntensity, glaiveTipStyle, glaiveBackStyle, // For Glaive
            hasReinforcedSocket, socketPalette // For Spears/Glaives
         } = headDetails; 

    // Draw reinforced socket first if applicable (for spears, glaives)
    if (hasReinforcedSocket && socketPalette && (headType.includes('spear') || headType === 'glaive_blade')) {
        const socketHeight = Math.max(2, Math.floor(shaftThickness * 2.5) +1); // Slightly taller socket
        const socketWidth = shaftThickness + 2;
        const socketX = mountX - Math.floor(socketWidth / 2);
        const socketY = mountY - Math.floor(socketHeight * 0.4); // Socket slightly overlaps top of shaft start more
        drawScaledRect(ctx, socketX, socketY, socketWidth, socketHeight, socketPalette.base, DISPLAY_SCALE);
        drawScaledRect(ctx, socketX, socketY, socketWidth, 1, socketPalette.highlight, DISPLAY_SCALE);
        if(socketWidth > 1) {
            drawScaledRect(ctx, socketX, socketY+1, 1, socketHeight-1, socketPalette.highlight, DISPLAY_SCALE);
            drawScaledRect(ctx, socketX + socketWidth -1, socketY+1, 1, socketHeight-1, socketPalette.shadow, DISPLAY_SCALE);
        }
         if(socketHeight > 1) drawScaledRect(ctx, socketX+1, socketY + socketHeight -1, socketWidth -2, 1, socketPalette.shadow, DISPLAY_SCALE);
    }


    if (headType === 'spear_point' || headType === 'leaf_spear' || headType === 'barbed_spear') {
        const pointHeight = logicalSize;
        let pointBaseWidth = Math.max(1, Math.floor(logicalSize / (headType === 'leaf_spear' ? 1.8 : 3.0) )); // Leaf spear wider base
        pointBaseWidth = Math.min(pointBaseWidth, shaftThickness + 4); // Allow slightly wider base

        for (let yRel = 0; yRel < pointHeight; yRel++) { 
            const y = mountY - 1 - yRel; 
            let currentWidth;
            const progressToTip = (pointHeight <=1) ? 1 : yRel / (pointHeight - 1); 

            if (headType === 'leaf_spear') {
                const peakPosRatio = getRandomInRange(0.20, 0.40); 
                let effectiveProgress;
                if (progressToTip < peakPosRatio) { 
                    effectiveProgress = (peakPosRatio === 0) ? 1 : progressToTip / peakPosRatio;
                    currentWidth = Math.max(1, Math.round(shaftThickness + (pointBaseWidth - shaftThickness) * effectiveProgress)); // Taper from shaft thickness
                } else { 
                    effectiveProgress = (1-peakPosRatio === 0) ? 1 : (progressToTip - peakPosRatio) / (1 - peakPosRatio);
                    currentWidth = Math.max(1, Math.round(pointBaseWidth * (1 - Math.pow(effectiveProgress, 1.5)) )); // More curve to tip
                }
                currentWidth = Math.min(currentWidth, Math.floor(pointBaseWidth * 1.1)); // Cap max width
            } else { 
                currentWidth = Math.max(1, Math.round(1 + (pointBaseWidth - 1) * (1 - progressToTip))); 
            }
            currentWidth = Math.max(1, currentWidth);

            const x = mountX - Math.floor(currentWidth / 2);
            drawScaledRect(ctx, x, y, currentWidth, 1, palette.base, DISPLAY_SCALE);
            if(currentWidth > 0) drawScaledRect(ctx, x, y, 1, 1, palette.highlight, DISPLAY_SCALE);
            if(currentWidth > 1) drawScaledRect(ctx, x + currentWidth -1, y, 1, 1, palette.shadow, DISPLAY_SCALE);

            if (headType === 'barbed_spear' && yRel > pointHeight * 0.3 && yRel < pointHeight * 0.7) { 
                const barbLength = Math.max(1, Math.floor(pointBaseWidth * getRandomInRange(0.6, 0.9)));
                const barbAngle = getRandomInRange(0.3, 0.6); 
                if ((pointHeight - 1 - yRel) % getRandomInt(2,4) === 0) { 
                    drawScaledRect(ctx, x - barbLength, y + Math.floor(barbLength * barbAngle), barbLength, 1, palette.base, DISPLAY_SCALE); 
                    drawScaledRect(ctx, x + currentWidth, y + Math.floor(barbLength * barbAngle), barbLength, 1, palette.base, DISPLAY_SCALE); 
                }
            }
        }
    } else if (headType === 'trident_head') {
        const mainPointHeight = logicalSize;
        const mainPointBaseWidth = Math.max(1, Math.floor(logicalSize / 4.0)); 
        const sideProngHeightFactor = getRandomInRange(0.60, 0.90); // More variation in side prong length
        const sideProngHeight = Math.floor(mainPointHeight * sideProngHeightFactor);
        const sideProngBaseWidth = Math.max(1, Math.floor(mainPointBaseWidth * getRandomInRange(0.6, 1.1)));
        const actualProngSplay = prongSplay || getRandomInRange(0.9, 1.8); 
        const prongSpacing = Math.max(1, Math.floor(mainPointBaseWidth * actualProngSplay) + Math.floor(shaftThickness/2) + getRandomInt(1,2));
        const crossbarHeight = Math.max(1, Math.floor(shaftThickness * getRandomInRange(0.7, 1.2))); // More varied crossbar
        const crossbarWidth = prongSpacing * 2 + sideProngBaseWidth + getRandomInt(-1, 1); // Crossbar width more dynamic
        const crossbarY = mountY - crossbarHeight;
        const crossbarPalette = secondaryPalette || palette;

        drawScaledRect(ctx, mountX - Math.floor(crossbarWidth/2), crossbarY, crossbarWidth, crossbarHeight, crossbarPalette.base, DISPLAY_SCALE);
        drawScaledRect(ctx, mountX - Math.floor(crossbarWidth/2), crossbarY, 1, crossbarHeight, crossbarPalette.highlight, DISPLAY_SCALE);
        if(crossbarWidth > 1) drawScaledRect(ctx, mountX + Math.floor(crossbarWidth/2)-1, crossbarY, 1, crossbarHeight, crossbarPalette.shadow, DISPLAY_SCALE);


        for (let yRel = 0; yRel < mainPointHeight; yRel++) { 
            const y = crossbarY - 1 - yRel;
            const progressToTip = (mainPointHeight <=1)? 1 : yRel / (mainPointHeight - 1);
            const currentWidth = Math.max(1, Math.round(1 + (mainPointBaseWidth - 1) * (1 - progressToTip)));
            const x = mountX - Math.floor(currentWidth / 2);
            drawScaledRect(ctx, x, y, currentWidth, 1, palette.base, DISPLAY_SCALE);
            if(currentWidth > 0) drawScaledRect(ctx, x, y, 1, 1, palette.highlight, DISPLAY_SCALE);
        }
        for (let side = -1; side <= 1; side += 2) {
            const prongCenterX = mountX + (side * prongSpacing);
            const sideProngMountY = crossbarY - Math.floor(mainPointBaseWidth/2 * 0.3); // Prongs start slightly higher on crossbar
            for (let yRel = 0; yRel < sideProngHeight; yRel++) {
                const y = sideProngMountY - 1 - yRel; 
                const progressToTip = (sideProngHeight <=1)? 1 : yRel / (sideProngHeight - 1);
                let currentWidth = Math.max(1, Math.round(1 + (sideProngBaseWidth - 1) * (1 - progressToTip)));
                let xOffset = 0;
                if (prongStyle === 'curved_outward') {
                    xOffset = side * Math.floor(Math.sin(progressToTip * Math.PI * 0.6) * (sideProngBaseWidth * 0.6)); // More pronounced curve
                } else if (prongStyle === 'leaf_shaped' && sideProngBaseWidth > 1) {
                     const peakPosRatio = 0.4;
                     if (progressToTip < peakPosRatio) currentWidth = Math.max(1, Math.round(1 + (sideProngBaseWidth*1.5-1) * (progressToTip/peakPosRatio) ));
                     else currentWidth = Math.max(1, Math.round(sideProngBaseWidth*1.5 * (1- (progressToTip-peakPosRatio)/(1-peakPosRatio)) ));
                } else if (prongStyle === 'barbed_tip' && yRel < sideProngHeight * 0.25 && yRel > sideProngHeight * 0.1) { // Barbs near tip
                    if (yRel % 2 === 0) currentWidth = Math.max(1, currentWidth +1); 
                }
                currentWidth = Math.max(1, currentWidth);
                const x = prongCenterX - Math.floor(currentWidth / 2) + xOffset;
                drawScaledRect(ctx, x, y, currentWidth, 1, palette.base, DISPLAY_SCALE);
                 if(currentWidth > 0) drawScaledRect(ctx, x + (xOffset > 0 ? currentWidth -1 : 0), y, 1, 1, palette.highlight, DISPLAY_SCALE);
            }
        }
    } else if (headType === 'poleaxe_head') { 
        const overallHeadVerticalSpan = logicalSize + getRandomInt(2,6); // Make poleaxe heads slightly larger on average
        const topSpikeHeight = Math.floor(overallHeadVerticalSpan * getRandomInRange(0.4, 0.60)); 
        const topSpikeBaseWidth = Math.max(1, Math.floor(shaftThickness * getRandomInRange(0.8, 1.3)));

        for (let yRel = 0; yRel < topSpikeHeight; yRel++) { 
            const y = mountY - 1 - yRel;
            const progressToTip = (topSpikeHeight <=1)? 1 : yRel / (topSpikeHeight - 1);
            const currentWidth = Math.max(1, Math.round(topSpikeBaseWidth * (1 - progressToTip)));
            const x = mountX - Math.floor(currentWidth / 2);
            drawScaledRect(ctx, x, y, currentWidth, 1, palette.base, DISPLAY_SCALE);
            if(currentWidth > 0) drawScaledRect(ctx, x,y,1,1, palette.highlight, DISPLAY_SCALE);
        }

        const sideComponentMountY = mountY + Math.floor(shaftThickness/2); 
        const sideComponentVerticalSpan = Math.floor(overallHeadVerticalSpan * getRandomInRange(0.45, 0.65)); // Larger side components
        const axeBladeReach = Math.floor(overallHeadVerticalSpan * getRandomInRange(0.3, 0.5)); // Wider axe blade
        const rearComponentLength = Math.floor(overallHeadVerticalSpan * getRandomInRange(0.2, 0.35));

        const axeBladeTop = sideComponentMountY - Math.floor(sideComponentVerticalSpan / 2);
        const axeBladeSocketWidth = Math.max(1, Math.floor(shaftThickness * 0.8)); // Wider socket base for axe

        for (let yOffset = 0; yOffset < sideComponentVerticalSpan; yOffset++) {
            const y = axeBladeTop + yOffset;
            const yProgress = (sideComponentVerticalSpan <= 1) ? 0.5 : yOffset / (sideComponentVerticalSpan - 1); 

            let currentXReach;
            if (axeBladeShape === 'straight_edge') {
                currentXReach = axeBladeReach * getRandomInRange(0.75, 0.95); 
            } else if (axeBladeShape === 'rounded_edge' || axeBladeShape === 'convex_edge') { 
                const verticalCenterProgress = Math.abs(yOffset - sideComponentVerticalSpan / 2) / (sideComponentVerticalSpan / 2);
                currentXReach = Math.floor(axeBladeReach * (1 - Math.pow(verticalCenterProgress, 1.3) * 0.25)); // More defined curve
            } else { // bearded_edge
                const verticalCenterProgress = Math.abs(yOffset - sideComponentVerticalSpan / 2) / (sideComponentVerticalSpan / 2);
                currentXReach = Math.floor(axeBladeReach * (0.6 + 0.4 * (1 - verticalCenterProgress))); 
                if (yOffset > sideComponentVerticalSpan * 0.4) { 
                    const beardProgress = (yOffset - sideComponentVerticalSpan * 0.4) / (sideComponentVerticalSpan * 0.6);
                    currentXReach = Math.floor(currentXReach + axeBladeReach * 0.35 * Math.sin(beardProgress * Math.PI / 1.8)); // More pronounced beard
                }
            }
            currentXReach = Math.max(axeBladeSocketWidth + 1, currentXReach); // Ensure blade extends past socket
            
            const bladeBaseX = mountX + Math.floor(shaftThickness/2);
            for(let w = 0; w < currentXReach; w++){
                 if (w < currentXReach) { 
                     drawScaledRect(ctx, bladeBaseX + w, y, 1, 1, secondaryPalette ? secondaryPalette.base : palette.base, DISPLAY_SCALE);
                 }
            }
            // Highlight cutting edge
            drawScaledRect(ctx, bladeBaseX + currentXReach - 1, y, 1, 1, secondaryPalette ? secondaryPalette.highlight : palette.highlight, DISPLAY_SCALE);
            // Shadow near socket
            if (currentXReach > axeBladeSocketWidth + 1) {
                drawScaledRect(ctx, bladeBaseX + axeBladeSocketWidth, y, 1, 1, secondaryPalette ? secondaryPalette.shadow : palette.shadow, DISPLAY_SCALE);
            }
        }

        const rearComponentTop = sideComponentMountY - Math.floor(rearComponentHeight / 2); 
        if (rearComponentType === 'rear_spike') {
            for (let xOffset = 0; xOffset < rearComponentLength; xOffset++) {
                const x = mountX - Math.floor(shaftThickness/2) - 1 - xOffset;
                const progressToTip = (rearComponentLength <=1)? 1 : xOffset / (rearComponentLength - 1);
                const currentHeight = Math.max(1, Math.round(rearComponentHeight * (1 - progressToTip)));
                const yStart = rearComponentTop + Math.floor((rearComponentHeight - currentHeight) / 2);
                drawScaledRect(ctx, x, yStart, 1, currentHeight, palette.base, DISPLAY_SCALE);
            }
        } else if (rearComponentType === 'rear_hammer' || rearComponentType === 'rear_axe_small') {
            const hammerWidth = rearComponentLength; 
            const hammerHeight = rearComponentHeight;
            drawScaledRect(ctx, mountX - Math.floor(shaftThickness/2) - hammerWidth, rearComponentTop, hammerWidth, hammerHeight, palette.base, DISPLAY_SCALE);
            drawScaledRect(ctx, mountX - Math.floor(shaftThickness/2) - hammerWidth, rearComponentTop, hammerWidth, 1, palette.highlight, DISPLAY_SCALE); 
            drawScaledRect(ctx, mountX - Math.floor(shaftThickness/2) -1, rearComponentTop, 1, hammerHeight, palette.shadow, DISPLAY_SCALE); 
            if (rearComponentType === 'rear_axe_small') { // Add a slight cutting edge indication
                drawScaledRect(ctx, mountX - Math.floor(shaftThickness/2) - hammerWidth, rearComponentTop + Math.floor(hammerHeight/2), 1, 1, palette.highlight, DISPLAY_SCALE);
            }
        } else if (rearComponentType === 'rear_hook') {
            const hookThickness = Math.max(1, Math.floor(rearComponentHeight/2.5)); // Thicker hook
            const hookLength = rearComponentLength;
            // Vertical part of hook
            drawScaledRect(ctx, mountX - Math.floor(shaftThickness/2) - hookThickness, rearComponentTop, hookThickness, rearComponentHeight, palette.base, DISPLAY_SCALE);
            // Horizontal part of hook
            drawScaledRect(ctx, mountX - Math.floor(shaftThickness/2) - hookLength, rearComponentTop, hookLength - hookThickness +1 , hookThickness, palette.base, DISPLAY_SCALE);
        }

    } else if (headType === 'glaive_blade') {
        const bladeLength = logicalSize; 
        const bladeMaxWidth = Math.max(3, Math.floor(logicalSize / getRandomInRange(3.0, 5.0))); // Slightly wider glaives
        const curveDir = getRandomElement([-1, 1]); 
        const actualCurveIntensity = glaiveCurveIntensity || bladeMaxWidth * getRandomInRange(0.5, 1.0); // More curve potential
        const actualGlaiveCurveStyle = glaiveCurveStyle || 'simple_convex';
        const actualGlaiveTipStyle = glaiveTipStyle || 'sharp_point';

        for (let yRel = 0; yRel < bladeLength; yRel++) { 
            const y = mountY - 1 - yRel; 
            const progressToTip = (bladeLength <=1)? 1 : yRel / (bladeLength - 1); 

            let currentWidth;
            if (actualGlaiveTipStyle === 'clipped_point' && progressToTip < 0.15) {
                currentWidth = Math.max(1, Math.floor(bladeMaxWidth * 0.8)); 
            } else if (actualGlaiveTipStyle === 'rounded_tip' && progressToTip < 0.1) {
                currentWidth = Math.max(1, Math.floor(bladeMaxWidth * (0.5 + 0.5 * Math.sin(progressToTip / 0.1 * Math.PI/2)) ));
            }
            else {
                currentWidth = Math.max(1, Math.round(1 + (bladeMaxWidth - 1) * (1 - Math.pow(progressToTip, 1.3)))); // Standard taper
            }
            
            let xOffset = 0;
            if (actualGlaiveCurveStyle === 'simple_convex') {
                 xOffset = Math.round(Math.sin((1-progressToTip) * Math.PI * 0.9) * actualCurveIntensity * curveDir); // Stronger PI influence
            } else if (actualGlaiveCurveStyle === 'simple_concave') {
                 xOffset = -Math.round(Math.sin((1-progressToTip) * Math.PI * 0.9) * actualCurveIntensity * curveDir); 
            } else if (actualGlaiveCurveStyle === 's_curve') {
                 xOffset = Math.round(Math.sin((1-progressToTip) * Math.PI * 1.7) * actualCurveIntensity * curveDir * 0.6); // Adjusted S-curve
            } else if (actualGlaiveCurveStyle === 'subtle_curve') {
                 xOffset = Math.round(Math.sin((1-progressToTip) * Math.PI * 0.4) * actualCurveIntensity * curveDir * 0.4);
            } else if (actualGlaiveCurveStyle === 'heavy_chop') { // Wider, less curved, more cleaver like
                 xOffset = Math.round(Math.sin((1-progressToTip) * Math.PI * 0.3) * actualCurveIntensity * curveDir * 0.2);
                 currentWidth = Math.max(bladeMaxWidth -1, Math.round(bladeMaxWidth * (0.8 + 0.2 * (1-progressToTip)) ));
            }
            currentWidth = Math.max(1, currentWidth);
            
            const x = mountX - Math.floor(currentWidth / 2) + xOffset;
            drawScaledRect(ctx, x, y, currentWidth, 1, palette.base, DISPLAY_SCALE);

            // Shading based on curve direction and edge
            const highlightEdge = curveDir === 1 ? x + currentWidth -1 : x;
            const shadowEdge = curveDir === 1 ? x : x + currentWidth -1;
            if(currentWidth > 0) drawScaledRect(ctx, highlightEdge, y, 1, 1, palette.highlight, DISPLAY_SCALE);
            if(currentWidth > 1) drawScaledRect(ctx, shadowEdge, y, 1, 1, palette.shadow, DISPLAY_SCALE);


            if (glaiveBackStyle === 'small_spike' && yRel > bladeLength * 0.55 && yRel < bladeLength * 0.75 && (yRel % 3 === 0)) {
                const spikeLen = getRandomInt(1,3);
                const backEdgeX = x - (curveDir > 0 ? 1 : -currentWidth); // Position on the back
                drawScaledRect(ctx, backEdgeX - (curveDir > 0 ? spikeLen -1 : 0) , y, spikeLen, 1, palette.base, DISPLAY_SCALE);
            } else if (glaiveBackStyle === 'notched_back' && yRel > bladeLength * 0.3 && yRel < bladeLength * 0.9 && (yRel % 4 === 0 || yRel % 4 === 1)) {
                const notchDepth = 1;
                const backEdgeX = x - (curveDir > 0 ? notchDepth : -currentWidth - notchDepth);
                // This will "erase" a pixel to create a notch, assuming background is clear
                // For a proper notch, one might draw the main blade then clearRect, or draw around the notch.
                // Simplified: just don't draw the pixel at the back edge for a notch effect.
                // This part is tricky with current drawScaledRect, might need more advanced path drawing for true notches.
                // For now, let's simulate by making that pixel use a shadow color.
                if (currentWidth > 1) {
                     drawScaledRect(ctx, (curveDir > 0 ? x -1 : x + currentWidth), y, 1, 1, palette.shadow, DISPLAY_SCALE);
                }
            }
        }
    }
}


/**
 * Generates a procedural polearm.
 * @param {object} options - Options for generation, may include 'subType'.
 */
export function generatePolearm(options = {}) {
    console.log("generatePolearm called with options:", options);

    const offscreenCanvas = document.createElement('canvas');
    offscreenCanvas.width = CANVAS_WIDTH; 
    offscreenCanvas.height = CANVAS_HEIGHT; 
    const ctx = offscreenCanvas.getContext('2d');

    if (!ctx) {
        console.error("Failed to get 2D context for offscreen canvas in generatePolearm.");
        return { type: 'polearm', name: 'Error Polearm', seed: Date.now(), itemData: { error: "Canvas context failed" }, imageDataUrl: createErrorDataURL("CTX Fail") };
    }
    ctx.imageSmoothingEnabled = false;
    ctx.clearRect(0, 0, CANVAS_WIDTH, CANVAS_HEIGHT);

    const shaftMaterials = ['WOOD', 'DARK_STEEL', 'BONE', 'IRON', 'BRONZE', 'ENCHANTED', 'RED_PAINT', 'BLACK_PAINT']; 
    const shaftMaterialName = getRandomElement(shaftMaterials);
    const shaftPalette = getPalette(shaftMaterialName);
    const shaftLogicalThickness = getRandomInt(1, 2); 
    const shaftDetailTypes = ['none', 'grain', 'rivets', 'wrapped', 'metal_bands'];
    let shaftDetailType = (shaftMaterialName === 'WOOD') ? 'grain' : 
                           (['IRON', 'STEEL', 'DARK_STEEL', 'BRONZE'].includes(shaftMaterialName)) ? getRandomElement(['none', 'rivets', 'wrapped', 'metal_bands']) :
                           'none';
    if (shaftDetailType === 'wrapped' && shaftMaterialName === 'WOOD' && Math.random() < 0.3) shaftDetailType = 'metal_bands'; 

    let wrapPalette = null;
    if (shaftDetailType === 'wrapped') {
        wrapPalette = getPalette(getRandomElement(['LEATHER', 'RED_PAINT', 'BLACK_PAINT']));
    } else if (shaftDetailType === 'metal_bands') {
        wrapPalette = getPalette(getRandomElement(['IRON', 'STEEL', 'BRONZE', 'GOLD']));
    }


    const hasButtCap = Math.random() < 0.6; 
    const buttCapMaterial = getRandomElement(['IRON', 'STEEL', 'BRONZE', 'DARK_STEEL']);

    let headType;
    const defaultHeadTypes = ['spear_point', 'trident_head', 'poleaxe_head', 'leaf_spear', 'barbed_spear', 'glaive_blade'];
    if (options.subType && defaultHeadTypes.includes(options.subType)) {
        headType = options.subType;
    } else {
        headType = getRandomElement(defaultHeadTypes);
        if (options.subType) console.warn(`Unknown polearm subType: ${options.subType}. Defaulting to random: ${headType}`);
    }
    
    const headMaterials = ['STEEL', 'IRON', 'BRONZE', 'OBSIDIAN', 'DARK_STEEL', 'SILVER', 'GOLD', 'ENCHANTED', 'BONE']; 
    const headMaterialName = getRandomElement(headMaterials);
    const headPalette = getPalette(headMaterialName);
    let secondaryHeadMaterialName = null;
    let secondaryPalette = null;
    let axeBladeShape = null; 
    let rearComponentType = null; 
    let rearComponentHeight = shaftLogicalThickness * 2; 
    let prongStyle = null, prongSplay = null; 
    let glaiveCurveStyle = null, glaiveCurveIntensity = null, glaiveTipStyle = null, glaiveBackStyle = null; 
    let hasReinforcedSocket = false;
    let socketPalette = null;


    if (headType === 'poleaxe_head') {
        if (Math.random() < 0.6) { 
            const availableSecondaryMaterials = headMaterials.filter(m => m !== headMaterialName);
            if (availableSecondaryMaterials.length > 0) {
                secondaryHeadMaterialName = getRandomElement(availableSecondaryMaterials);
                secondaryPalette = getPalette(secondaryHeadMaterialName);
            }
        }
        axeBladeShape = getRandomElement(['straight_edge', 'rounded_edge', 'bearded_edge', 'convex_edge']); 
        rearComponentType = getRandomElement(['rear_spike', 'rear_hammer', 'rear_hook', 'rear_axe_small']); 
        rearComponentHeight = getRandomInt(Math.max(1, shaftLogicalThickness +1), shaftLogicalThickness + 4); 
    } else if (headType === 'trident_head') {
        prongStyle = getRandomElement(['straight_taper', 'leaf_shaped', 'barbed_tip', 'curved_outward']);
        prongSplay = getRandomInRange(0.7, 1.8); 
        if (Math.random() < 0.4) { 
            secondaryHeadMaterialName = getRandomElement(headMaterials.filter(m => m !== headMaterialName));
            if (secondaryHeadMaterialName) secondaryPalette = getPalette(secondaryHeadMaterialName);
        }
    } else if (headType === 'glaive_blade') {
        glaiveCurveStyle = getRandomElement(['simple_convex', 'simple_concave', 's_curve', 'subtle_curve', 'heavy_chop']);
        glaiveCurveIntensity = getRandomInRange(0.3, 1.2);
        glaiveTipStyle = getRandomElement(['sharp_point', 'clipped_point', 'rounded_tip']);
        glaiveBackStyle = getRandomElement(['none', 'small_spike', 'notched_back']);
         if (Math.random() < 0.3) { 
            secondaryHeadMaterialName = getRandomElement(headMaterials.filter(m => m !== headMaterialName));
            if (secondaryHeadMaterialName) secondaryPalette = getPalette(secondaryHeadMaterialName); 
        }
    }

    if (headType.includes('spear') || headType === 'glaive_blade') {
        if (Math.random() < 0.5) {
            hasReinforcedSocket = true;
            socketPalette = getPalette(getRandomElement(['BRONZE', 'IRON', 'STEEL', (shaftMaterialName === 'WOOD' ? 'DARK_STEEL' : 'WOOD')]));
        }
    }


    let headLogicalSize; 
    let headHeight; 

    if (headType === 'spear_point' || headType === 'leaf_spear' || headType === 'barbed_spear') {
        headHeight = getRandomInt(10, 20); 
        headLogicalSize = headHeight; 
    } else if (headType === 'trident_head') {
        headHeight = getRandomInt(12, 22); 
        headLogicalSize = headHeight;
    } else if (headType === 'poleaxe_head') {
        headLogicalSize = getRandomInt(12, 22); // MODIFIED: Increased poleaxe head size range
        headHeight = headLogicalSize; 
    } else if (headType === 'glaive_blade') {
        headHeight = getRandomInt(18, 30); 
        headLogicalSize = headHeight;
    } else { 
        console.warn("Fallback head size calculation reached in generatePolearm.");
        headHeight = getRandomInt(10,20); 
        headLogicalSize = headHeight;
    }
    
    let shaftLogicalLength = getRandomInt(
        Math.max(MIN_SHAFT_LENGTH, LOGICAL_GRID_HEIGHT - headHeight - CANVAS_PADDING - (hasButtCap ? 3:0) - 5), 
        LOGICAL_GRID_HEIGHT - headHeight - CANVAS_PADDING - (hasButtCap ? 3:0) 
    ); 
    shaftLogicalLength = Math.max(MIN_SHAFT_LENGTH, shaftLogicalLength); 
    shaftLogicalLength = Math.min(shaftLogicalLength, LOGICAL_GRID_HEIGHT - headHeight - CANVAS_PADDING - (hasButtCap ? 3:0) );


    const polearmCenterX = Math.floor(LOGICAL_GRID_WIDTH / 2);
    const totalPolearmActualHeight = headHeight + shaftLogicalLength + (hasButtCap ? Math.max(1, Math.floor(shaftLogicalThickness * 1.2)) : 0);
    let startYOverall = Math.floor((LOGICAL_GRID_HEIGHT - totalPolearmActualHeight) /2);
    startYOverall = Math.max(CANVAS_PADDING, startYOverall); 
    const finalHeadTipY = startYOverall; 
    const finalHeadMountY = finalHeadTipY + headHeight; 


    const headDetails = {
        headType, logicalSize: headLogicalSize, palette: headPalette, secondaryPalette, shaftThickness: shaftLogicalThickness, 
        axeBladeShape, rearComponentType, rearComponentHeight,
        prongStyle, prongSplay, 
        glaiveCurveStyle, glaiveCurveIntensity, glaiveTipStyle, glaiveBackStyle,
        hasReinforcedSocket, socketPalette
    };
    drawHead(ctx, headDetails, polearmCenterX, finalHeadMountY); 
    
    const shaftDetails = {
        logicalLength: shaftLogicalLength, logicalThickness: shaftLogicalThickness, palette: shaftPalette, 
        detailType: shaftDetailType, materialName: shaftMaterialName, 
        hasButtCap, buttCapMaterial, wrapPalette
    };
    drawShaft(ctx, shaftDetails, polearmCenterX, finalHeadMountY); 


    let subTypeNameForDisplay = headType.replace(/_/g, ' ');
    subTypeNameForDisplay = subTypeNameForDisplay.split(' ').map(word => word.charAt(0).toUpperCase() + word.slice(1)).join(' ');
    let itemName = `${shaftMaterialName} ${shaftDetailType !== 'none' ? shaftDetailType + ' ' : ''}${subTypeNameForDisplay}`;

    if (headType === 'poleaxe_head') {
        itemName += ` (${axeBladeShape.replace('_', ' ')}, ${rearComponentType.replace('_', ' ')})`;
        if (secondaryHeadMaterialName) itemName += ` with ${secondaryHeadMaterialName} parts`;
    } else if (headType === 'trident_head' && prongStyle) {
        itemName += ` (${prongStyle.replace('_',' ')})`;
    } else if (headType === 'glaive_blade' && glaiveCurveStyle) {
        itemName += ` (${glaiveCurveStyle.replace('_',' ')}, ${glaiveTipStyle.replace('_',' ')})`;
    }
    if (hasReinforcedSocket && socketPalette) itemName += ` (Reinforced Socket)`;


    const itemSeed = options.seed || Date.now();

    const generatedItemData = {
        type: 'polearm',
        name: itemName,
        seed: itemSeed,
        itemData: {
            shaft: {
                material: shaftMaterialName.toLowerCase(), length: shaftLogicalLength, thickness: shaftLogicalThickness,
                detailType: shaftDetailType, wrapMaterial: wrapPalette ? wrapPalette.name.toLowerCase() : null,
                hasButtCap, buttCapMaterial: hasButtCap ? buttCapMaterial.toLowerCase() : null,
                colors: shaftPalette, wrapColors: wrapPalette
            },
            head: {
                type: headType, subType: options.subType || headType, material: headMaterialName.toLowerCase(),
                size: headLogicalSize, secondaryMaterial: secondaryHeadMaterialName ? secondaryHeadMaterialName.toLowerCase() : null,
                axeBladeShape: headType === 'poleaxe_head' ? axeBladeShape : null,
                rearComponentType: headType === 'poleaxe_head' ? rearComponentType : null,
                prongStyle: headType === 'trident_head' ? prongStyle : null,
                prongSplay: headType === 'trident_head' ? prongSplay : null,
                glaiveCurveStyle: headType === 'glaive_blade' ? glaiveCurveStyle : null,
                glaiveCurveIntensity: headType === 'glaive_blade' ? glaiveCurveIntensity : null,
                glaiveTipStyle: headType === 'glaive_blade' ? glaiveTipStyle : null,
                glaiveBackStyle: headType === 'glaive_blade' ? glaiveBackStyle : null,
                hasReinforcedSocket, socketMaterial: socketPalette ? socketPalette.name.toLowerCase() : null,
                colors: headPalette, secondaryColors: secondaryPalette, socketColors: socketPalette
            }
        },
        imageDataUrl: offscreenCanvas.toDataURL()
    };

    console.log("Polearm generated:", generatedItemData.name);
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

console.log("js/generators/polearm_generator.js loaded with head improvements.");
