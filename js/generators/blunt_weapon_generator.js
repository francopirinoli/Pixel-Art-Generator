/**
 * js/generators/blunt_weapon_generator.js
 * Contains the logic for procedurally generating blunt weapons
 * like maces, hammers, clubs, and morningstars.
 */

import { getRandomInt, getRandomElement, drawScaledRect, getRandomInRange } from '../utils.js';
import { getPalette, MATERIAL_PALETTES } from '../palettes/material_palettes.js';

// --- Constants specific to blunt weapon generation ---
const LOGICAL_GRID_WIDTH = 64;
const LOGICAL_GRID_HEIGHT = 64;
const DISPLAY_SCALE = 4;
const CANVAS_WIDTH = LOGICAL_GRID_WIDTH * DISPLAY_SCALE;   // 256
const CANVAS_HEIGHT = LOGICAL_GRID_HEIGHT * DISPLAY_SCALE; // 256
const CANVAS_PADDING = 4;
const MIN_HANDLE_LENGTH_NEW = 25;
const MAX_HANDLE_BASE_LENGTH = LOGICAL_GRID_HEIGHT - CANVAS_PADDING * 2 - 8;

// --- Internal helper functions ---

function drawBluntWeaponHandle(ctx, handleDetails, startX, startY) {
    const {
        logicalLength,
        logicalThickness,
        palette,
        materialName,
        hasPommel,
        pommelPalette,
        pommelShape,
        style, 
        gripPalette
    } = handleDetails;

    const handleDrawX = startX - Math.floor(logicalThickness / 2);

    for (let i = 0; i < logicalLength; i++) {
        const y = startY + i;
        let currentSegmentThickness = logicalThickness;
        let currentSegmentX = handleDrawX;

        if (style !== 'plain' && logicalLength > 10) {
            const taperProgress = i / (logicalLength -1 || 1);
            if (taperProgress > 0.7) { 
                 currentSegmentThickness = Math.max(2, logicalThickness -1);
                 currentSegmentX = startX - Math.floor(currentSegmentThickness / 2);
            }
        }

        drawScaledRect(ctx, currentSegmentX, y, currentSegmentThickness, 1, palette.base, DISPLAY_SCALE);
        if (currentSegmentThickness > 1) {
            drawScaledRect(ctx, currentSegmentX, y, 1, 1, palette.highlight, DISPLAY_SCALE);
            drawScaledRect(ctx, currentSegmentX + currentSegmentThickness - 1, y, 1, 1, palette.shadow, DISPLAY_SCALE);
        }
        if (materialName === 'WOOD' && i % getRandomInt(4, 7) === 0 && currentSegmentThickness > 0) {
            const grainX = currentSegmentX + getRandomInt(0, currentSegmentThickness - 1);
            drawScaledRect(ctx, grainX, y, 1, 1, palette.shadow, DISPLAY_SCALE);
        }
    }
    
    const handleBottomY = startY + logicalLength;

    if (hasPommel && pommelPalette && pommelShape) {
        let pommelHeight = Math.max(2, Math.floor(logicalThickness * 1.3));
        let pommelWidth = logicalThickness + getRandomInt(1,4);
        let pommelX = startX - Math.floor(pommelWidth / 2);
        const pommelY = handleBottomY;

        if (pommelShape === 'flared') {
            pommelHeight = getRandomInt(3,5);
            for(let i=0; i<pommelHeight; i++){
                const flareFactor = Math.sin((i / (pommelHeight -1 || 1)) * Math.PI * 0.5);
                const currentWidth = logicalThickness + Math.floor(flareFactor * 4);
                const currentX = startX - Math.floor(currentWidth/2);
                drawScaledRect(ctx, currentX, pommelY + i, currentWidth, 1, pommelPalette.base, DISPLAY_SCALE);
                if (i === 0) drawScaledRect(ctx, currentX, pommelY + i, currentWidth, 1, pommelPalette.highlight, DISPLAY_SCALE);
                else if (i > 0) drawScaledRect(ctx, currentX, pommelY + i, currentWidth, 1, pommelPalette.shadow, DISPLAY_SCALE);

            }
        } else { 
            drawScaledRect(ctx, pommelX, pommelY, pommelWidth, pommelHeight, pommelPalette.base, DISPLAY_SCALE);
            if (pommelHeight > 0) drawScaledRect(ctx, pommelX, pommelY, pommelWidth, 1, pommelPalette.highlight, DISPLAY_SCALE);
            if (pommelWidth > 1 && pommelHeight > 1) {
                 drawScaledRect(ctx, pommelX, pommelY + 1, 1, pommelHeight -1, pommelPalette.highlight, DISPLAY_SCALE);
                 drawScaledRect(ctx, pommelX + pommelWidth -1, pommelY + 1, 1, pommelHeight -1, pommelPalette.shadow, DISPLAY_SCALE);
            }
            if (pommelHeight > 1) drawScaledRect(ctx, pommelX, pommelY + pommelHeight -1, pommelWidth, 1, pommelPalette.shadow, DISPLAY_SCALE);
        }
    }
    return { bottomY: handleBottomY, actualThickness: logicalThickness };
}

function drawHammerHead(ctx, headDetails, attachX, attachY) {
    const { headWidth, headHeight, faceStyle, peenStyle, palette } = headDetails;
    const headTopY = attachY - Math.floor(headHeight / 2);
    const mainBlockX = attachX - Math.floor(headWidth / 2);

    drawScaledRect(ctx, mainBlockX, headTopY, headWidth, headHeight, palette.base, DISPLAY_SCALE);

    if (headHeight > 1) {
        drawScaledRect(ctx, mainBlockX, headTopY, headWidth, 1, palette.highlight, DISPLAY_SCALE);
        drawScaledRect(ctx, mainBlockX, headTopY + headHeight - 1, headWidth, 1, palette.shadow, DISPLAY_SCALE);
    }
    if (headWidth > 1 && headHeight > 2) {
        drawScaledRect(ctx, mainBlockX, headTopY + 1, 1, headHeight - 2, palette.highlight, DISPLAY_SCALE);
        drawScaledRect(ctx, mainBlockX + headWidth - 1, headTopY + 1, 1, headHeight - 2, palette.shadow, DISPLAY_SCALE);
    } else if (headWidth > 1) {
         drawScaledRect(ctx, mainBlockX, headTopY, 1, headHeight, palette.highlight, DISPLAY_SCALE);
         drawScaledRect(ctx, mainBlockX + headWidth - 1, headTopY, 1, headHeight, palette.shadow, DISPLAY_SCALE);
    }

    const faceExtension = getRandomInt(1,3);
    if (faceStyle === 'flat_wide') {
        drawScaledRect(ctx, mainBlockX - faceExtension, headTopY, faceExtension, headHeight, palette.base, DISPLAY_SCALE);
        drawScaledRect(ctx, mainBlockX - faceExtension, headTopY, 1, headHeight, palette.highlight, DISPLAY_SCALE);
        if (faceExtension > 0) {
             drawScaledRect(ctx, mainBlockX, headTopY, 1, headHeight, palette.shadow, DISPLAY_SCALE);
        }
    } else if (faceStyle === 'rounded_face') {
        const faceRadius = faceExtension + 1;
        for(let xOff = 0; xOff < faceRadius; xOff++) {
            const yLimit = Math.floor(headHeight * Math.sqrt(1 - (xOff*xOff) / (faceRadius*faceRadius || 1)) * 0.5 );
            for(let yOff = -yLimit; yOff <= yLimit; yOff++) {
                drawScaledRect(ctx, mainBlockX - 1 - xOff, attachY + yOff, 1, 1, palette.base, DISPLAY_SCALE);
                if (xOff === faceRadius -1) drawScaledRect(ctx, mainBlockX - 1 - xOff, attachY + yOff, 1, 1, palette.highlight, DISPLAY_SCALE);
            }
        }
         if (faceRadius > 0) drawScaledRect(ctx, mainBlockX, headTopY, 1, headHeight, palette.shadow, DISPLAY_SCALE); // Shadow at attachment
    } else if (faceStyle === 'double_face') {
        // Left face
        drawScaledRect(ctx, mainBlockX - faceExtension, headTopY, faceExtension, headHeight, palette.base, DISPLAY_SCALE);
        drawScaledRect(ctx, mainBlockX - faceExtension, headTopY, 1, headHeight, palette.highlight, DISPLAY_SCALE);
        if (faceExtension > 0) drawScaledRect(ctx, mainBlockX, headTopY, 1, headHeight, palette.shadow, DISPLAY_SCALE);
        // Right face
        drawScaledRect(ctx, mainBlockX + headWidth, headTopY, faceExtension, headHeight, palette.base, DISPLAY_SCALE);
        drawScaledRect(ctx, mainBlockX + headWidth + faceExtension -1, headTopY, 1, headHeight, palette.shadow, DISPLAY_SCALE);
         if (faceExtension > 0) drawScaledRect(ctx, mainBlockX + headWidth -1, headTopY, 1, headHeight, palette.highlight, DISPLAY_SCALE);
    }

    if (faceStyle !== 'double_face') {
        if (peenStyle === 'pick') {
            const peenLength = getRandomInt(Math.floor(headWidth*0.5), headWidth);
            const peenBaseHeight = Math.max(1, Math.floor(headHeight * 0.4));
            for(let i=0; i < peenLength; i++) {
                const currentHeight = Math.max(1, Math.ceil(peenBaseHeight * (1 - i / (peenLength -1 || 1) * 0.95)));
                const currentY = attachY - Math.floor(currentHeight/2);
                drawScaledRect(ctx, mainBlockX + headWidth + i, currentY, 1, currentHeight, palette.base, DISPLAY_SCALE);
                if (i === peenLength -1) drawScaledRect(ctx, mainBlockX + headWidth + i, currentY, 1, currentHeight, palette.highlight, DISPLAY_SCALE);
                else if (i === 0) drawScaledRect(ctx, mainBlockX + headWidth + i, currentY, 1, currentHeight, palette.shadow, DISPLAY_SCALE);
            }
        } else if (peenStyle === 'rounded_peen' || peenStyle === 'spherical_peen') {
            const peenRadius = Math.max(1,Math.floor(headHeight / (peenStyle === 'spherical_peen' ? 2.2 : 3)));
            const peenCenterX = mainBlockX + headWidth + peenRadius -1;
            const peenCenterY = attachY;
            for (let dy = -peenRadius; dy <= peenRadius; dy++) {
                for (let dx = 0; dx <= peenRadius; dx++) { 
                    if (dx * dx + dy * dy <= peenRadius * peenRadius) {
                         drawScaledRect(ctx, peenCenterX + dx - peenRadius, peenCenterY + dy, 1, 1, palette.base, DISPLAY_SCALE);
                         if (dx === peenRadius || (dx*dx + dy*dy >= (peenRadius-1)*(peenRadius-1) && dx > 0 ) ) {
                            drawScaledRect(ctx, peenCenterX + dx - peenRadius, peenCenterY + dy, 1, 1, palette.highlight, DISPLAY_SCALE);
                         }
                    }
                }
            }
        } else if (peenStyle === 'flat_peen') {
            const peenLength = getRandomInt(Math.floor(headWidth*0.2), Math.floor(headWidth*0.4));
            const peenHeight = Math.floor(headHeight * 0.8);
            const peenY = attachY - Math.floor(peenHeight/2);
            drawScaledRect(ctx, mainBlockX + headWidth, peenY, peenLength, peenHeight, palette.base, DISPLAY_SCALE);
            drawScaledRect(ctx, mainBlockX + headWidth + peenLength -1, peenY, 1, peenHeight, palette.shadow, DISPLAY_SCALE);
            if (peenLength > 0) drawScaledRect(ctx, mainBlockX + headWidth, peenY, 1, peenHeight, palette.shadow, DISPLAY_SCALE);
        } else if (peenStyle === 'claw_peen') {
            const clawLength = getRandomInt(Math.floor(headWidth*0.4), Math.floor(headWidth*0.7));
            const clawThickness = Math.max(1, Math.floor(headHeight * 0.2));
            const numClaws = 2;
            const clawSpacing = Math.floor(headHeight * 0.3);

            for (let c = 0; c < numClaws; c++) {
                const clawCenterY = attachY + (c === 0 ? -Math.floor(clawSpacing/2) : Math.floor(clawSpacing/2));
                for(let i=0; i < clawLength; i++) {
                    const curveFactor = Math.sin((i / (clawLength -1 || 1)) * Math.PI * 0.4); // Slight downward curve
                    const currentYOffset = Math.floor(curveFactor * clawThickness * 1.5);
                    const currentX = mainBlockX + headWidth + i;
                    drawScaledRect(ctx, currentX, clawCenterY + currentYOffset - Math.floor(clawThickness/2), 1, clawThickness, palette.base, DISPLAY_SCALE);
                    if (i === clawLength -1) drawScaledRect(ctx, currentX, clawCenterY + currentYOffset - Math.floor(clawThickness/2), 1, clawThickness, palette.highlight, DISPLAY_SCALE);
                }
            }
        }
    }
}

function drawMaceHead(ctx, headDetails, attachX, attachY) {
    const { headShape, headWidth, headHeight, palette, hasStuds, studPalette, numFlanges } = headDetails;
    const headTopY = attachY - Math.floor(headHeight / 2);
    const headDrawX = attachX - Math.floor(headWidth / 2);

    if (headShape === 'round_mace' || headShape === 'oval_mace') {
        const radiusX = Math.floor(headWidth / 2);
        const radiusY = Math.floor(headHeight / 2);
        for (let dy = -radiusY; dy <= radiusY; dy++) {
            for (let dx = -radiusX; dx <= radiusX; dx++) {
                if ((dx * dx) / (radiusX * radiusX || 1) + (dy * dy) / (radiusY * radiusY || 1) <= 1.05) {
                    let color = palette.base;
                    const distSq = (dx * dx) / (radiusX * radiusX || 1) + (dy * dy) / (radiusY * radiusY || 1);
                    if (distSq > 0.7) {
                        if (dx < 0 && dy < 0) color = palette.highlight;
                        else if (dx > 0 && dy > 0) color = palette.shadow;
                    }
                    drawScaledRect(ctx, attachX + dx, attachY + dy, 1, 1, color, DISPLAY_SCALE);
                }
            }
        }
    } else if (headShape === 'diamond_flanged_mace' || headShape === 'bladed_flanged_mace' || headShape === 'star_flanged_mace') {
        const coreRadius = Math.max(2, Math.floor(Math.min(headWidth, headHeight) * 0.25)); // Central core
        for (let dy = -coreRadius; dy <= coreRadius; dy++) {
            for (let dx = -coreRadius; dx <= coreRadius; dx++) {
                if (dx * dx + dy * dy <= coreRadius * coreRadius) {
                    drawScaledRect(ctx, attachX + dx, attachY + dy, 1, 1, palette.base, DISPLAY_SCALE);
                }
            }
        }
        const flangeLength = Math.floor((Math.min(headWidth, headHeight) - coreRadius * 2) / 2.2);
        const flangeThickness = Math.max(1, Math.floor(coreRadius * 0.8));

        for (let i = 0; i < numFlanges; i++) {
            const angle = (i / numFlanges) * 2 * Math.PI;
            for (let l = 0; l < flangeLength; l++) {
                const r = coreRadius + l;
                const currentX = attachX + Math.round(r * Math.cos(angle));
                const currentY = attachY + Math.round(r * Math.sin(angle));
                let flangeSegmentWidth = flangeThickness;
                let flangeSegmentHeight = flangeThickness;

                if (headShape === 'diamond_flanged_mace') {
                    const progress = l / (flangeLength -1 || 1);
                    const diamondFactor = progress < 0.5 ? progress * 2 : (1 - progress) * 2;
                    flangeSegmentWidth = Math.max(1, Math.round(flangeThickness * diamondFactor));
                    flangeSegmentHeight = Math.max(1, Math.round(flangeThickness * diamondFactor));
                } else if (headShape === 'bladed_flanged_mace') {
                    flangeSegmentWidth = Math.max(1, Math.round(flangeThickness * (1 - l / (flangeLength || 1) * 0.7))); // Tapered blade
                } else if (headShape === 'star_flanged_mace') {
                     const progress = l / (flangeLength -1 || 1);
                     flangeSegmentWidth = Math.max(1, Math.round(flangeThickness * (1 - progress))); // Simple taper for star point
                }


                // Draw rotated segment (simplified for pixel art by drawing at calculated x,y)
                const drawPtX = currentX - Math.floor(flangeSegmentWidth/2 * Math.abs(Math.cos(angle + Math.PI/2))); // Crude rotation
                const drawPtY = currentY - Math.floor(flangeSegmentHeight/2 * Math.abs(Math.sin(angle + Math.PI/2)));

                drawScaledRect(ctx, drawPtX, drawPtY, flangeSegmentWidth, flangeSegmentHeight, palette.base, DISPLAY_SCALE);
                if (l === flangeLength -1) drawScaledRect(ctx, drawPtX, drawPtY, flangeSegmentWidth, flangeSegmentHeight, palette.highlight, DISPLAY_SCALE);
            }
        }

    } else { // blocky_mace
        drawScaledRect(ctx, headDrawX, headTopY, headWidth, headHeight, palette.base, DISPLAY_SCALE);
        if (headHeight > 1) {
            drawScaledRect(ctx, headDrawX, headTopY, headWidth, 1, palette.highlight, DISPLAY_SCALE);
            drawScaledRect(ctx, headDrawX, headTopY + headHeight - 1, headWidth, 1, palette.shadow, DISPLAY_SCALE);
        }
        if (headWidth > 1 && headHeight > 2) {
            drawScaledRect(ctx, headDrawX, headTopY + 1, 1, headHeight - 2, palette.highlight, DISPLAY_SCALE);
            drawScaledRect(ctx, headDrawX + headWidth - 1, headTopY + 1, 1, headHeight - 2, palette.shadow, DISPLAY_SCALE);
        } else if (headWidth > 1) {
            drawScaledRect(ctx, headDrawX, headTopY, 1, headHeight, palette.highlight, DISPLAY_SCALE);
            drawScaledRect(ctx, headDrawX + headWidth-1, headTopY, 1, headHeight, palette.shadow, DISPLAY_SCALE);
        }
    }

    if (hasStuds && studPalette && headShape !== 'diamond_flanged_mace' && headShape !== 'bladed_flanged_mace' && headShape !== 'star_flanged_mace') {
        const numStuds = getRandomInt(6, 12);
        for (let i = 0; i < numStuds; i++) {
            const angle = getRandomInRange(0, 2 * Math.PI);
            let studX, studY;
            if (headShape === 'round_mace' || headShape === 'oval_mace') {
                const rX = headWidth/2 * getRandomInRange(0.7, 0.95);
                const rY = headHeight/2 * getRandomInRange(0.7, 0.95);
                studX = attachX + Math.round(Math.cos(angle) * rX);
                studY = attachY + Math.round(Math.sin(angle) * rY);
            } else { // blocky
                if (Math.random() < 0.5) {
                    studX = headDrawX + getRandomInt(0, headWidth-1);
                    studY = (Math.random() < 0.5) ? headTopY : headTopY + headHeight -1;
                } else {
                    studX = (Math.random() < 0.5) ? headDrawX : headDrawX + headWidth -1;
                    studY = headTopY + getRandomInt(0, headHeight-1);
                }
            }
            const studSize = 1;
            drawScaledRect(ctx, studX, studY, studSize, studSize, studPalette.highlight, DISPLAY_SCALE);
        }
    }
}

function drawClubHead(ctx, headDetails, attachX, handleTopY, handleThickness) {
    const { headLength, maxThicknessAtTip, palette, style, spikePalette } = headDetails;
    
    for (let i = 0; i < headLength; i++) {
        const y = handleTopY - i -1;
        const progress = i / (headLength - 1 || 1);
        
        let currentThickness;
        if (i >= headLength - 3 && headLength > 3) {
            const tipProgress = (i - (headLength - 3)) / 2;
             currentThickness = maxThicknessAtTip - Math.floor( (maxThicknessAtTip - handleThickness -1) * Math.pow(tipProgress, 1.5) );
             currentThickness = Math.max(handleThickness +1, currentThickness);
        } else {
            currentThickness = handleThickness + Math.floor((maxThicknessAtTip - handleThickness) * Math.pow(progress, 0.6));
        }
        currentThickness = Math.max(handleThickness, currentThickness);
        
        const headDrawX = attachX - Math.floor(currentThickness / 2);
        drawScaledRect(ctx, headDrawX, y, currentThickness, 1, palette.base, DISPLAY_SCALE);
        if (currentThickness > 1) {
            drawScaledRect(ctx, headDrawX, y, 1, 1, palette.highlight, DISPLAY_SCALE);
            drawScaledRect(ctx, headDrawX + currentThickness - 1, y, 1, 1, palette.shadow, DISPLAY_SCALE);
        }

        if (style === 'spiked_club' && spikePalette && i > headLength * 0.1 && i < headLength * 0.9 && i % getRandomInt(3,5) === 0) {
            const spikeLength = getRandomInt(2,3);
            const spikeDrawY = y;
            drawScaledRect(ctx, headDrawX - spikeLength, spikeDrawY, spikeLength, 1, spikePalette.base, DISPLAY_SCALE);
            drawScaledRect(ctx, headDrawX -1, spikeDrawY, 1,1, spikePalette.highlight, DISPLAY_SCALE);
            drawScaledRect(ctx, headDrawX + currentThickness, spikeDrawY, spikeLength, 1, spikePalette.base, DISPLAY_SCALE);
            drawScaledRect(ctx, headDrawX + currentThickness -1, spikeDrawY, 1,1, spikePalette.highlight, DISPLAY_SCALE);
        }
    }
}

function drawMorningstarHead(ctx, headDetails, attachX, attachY) {
    const { ballRadius, spikeLength, numSpikes, palette } = headDetails;

    for (let dy = -ballRadius; dy <= ballRadius; dy++) {
        for (let dx = -ballRadius; dx <= ballRadius; dx++) {
            if (dx * dx + dy * dy <= ballRadius * ballRadius) {
                let color = palette.base;
                if (dx*dx + dy*dy > (ballRadius-1)*(ballRadius-1) * 0.7 ) {
                    if (dx < Math.floor(ballRadius*0.2) && dy < Math.floor(ballRadius*0.2)) color = palette.highlight;
                    else if (dx > -Math.floor(ballRadius*0.2) && dy > -Math.floor(ballRadius*0.2)) color = palette.shadow;
                }
                drawScaledRect(ctx, attachX + dx, attachY + dy, 1, 1, color, DISPLAY_SCALE);
            }
        }
    }

    for (let i = 0; i < numSpikes; i++) {
        const angle = (i / numSpikes) * 2 * Math.PI;
        const spikeBaseRadius = ballRadius -1;

        for (let l = 0; l < spikeLength; l++) {
            const currentRadius = spikeBaseRadius + l;
            const spikeX = attachX + Math.round(currentRadius * Math.cos(angle));
            const spikeY = attachY + Math.round(currentRadius * Math.sin(angle));
            
            const spikeThickness = Math.max(1, Math.ceil(2 * (1 - l / (spikeLength -1 || 1) * 0.85 ) ) );
            const spikeDrawX = spikeX - Math.floor(spikeThickness/2);
            const spikeDrawY = spikeY - Math.floor(spikeThickness/2);

            drawScaledRect(ctx, spikeDrawX, spikeDrawY, spikeThickness, spikeThickness, palette.base, DISPLAY_SCALE);
            if (l === spikeLength -1) {
                 drawScaledRect(ctx, spikeDrawX, spikeDrawY, spikeThickness, spikeThickness, palette.highlight, DISPLAY_SCALE);
            } else if (l < 2 && spikeThickness > 1) {
                 drawScaledRect(ctx, spikeDrawX, spikeDrawY, 1, spikeThickness, palette.shadow, DISPLAY_SCALE);
            }
        }
    }
}

export function generateBluntWeapon(options = {}) {
    console.log("generateBluntWeapon called with options:", options);

    const offscreenCanvas = document.createElement('canvas');
    offscreenCanvas.width = CANVAS_WIDTH;
    offscreenCanvas.height = CANVAS_HEIGHT;
    const ctx = offscreenCanvas.getContext('2d');

    if (!ctx) {
        console.error("Failed to get 2D context for offscreen canvas in generateBluntWeapon.");
        return { type: 'blunt_weapon', name: 'Error Blunt Weapon', seed: Date.now(), itemData: { error: "Canvas context failed" }, imageDataUrl: createErrorDataURL("CTX Fail") };
    }
    ctx.imageSmoothingEnabled = false;
    ctx.clearRect(0, 0, CANVAS_WIDTH, CANVAS_HEIGHT);

    let weaponType;
    const defaultWeaponTypes = ['hammer', 'mace', 'club', 'morningstar'];
    if (options.subType && defaultWeaponTypes.includes(options.subType)) {
        weaponType = options.subType;
    } else {
        weaponType = getRandomElement(defaultWeaponTypes);
        if(options.subType) console.warn(`Unknown blunt weapon subType: ${options.subType}. Defaulting to random: ${weaponType}`);
    }

    const handleMaterials = ['WOOD', 'IRON', 'STEEL', 'DARK_STEEL', 'BONE'];
    const handleMaterialName = getRandomElement(handleMaterials);
    const handlePalette = getPalette(handleMaterialName);
    const handleLogicalThickness = getRandomInt(2, 4);
    
    const hasPommel = Math.random() < 0.65;
    const pommelShapes = ['square', 'round', 'flared'];
    const pommelShape = hasPommel ? getRandomElement(pommelShapes) : null;
    const pommelPalette = hasPommel ? getPalette(getRandomElement(['IRON', 'STEEL', 'BRONZE', handleMaterialName])) : null;

    const headMaterials = ['IRON', 'STEEL', 'DARK_STEEL', 'BRONZE', 'OBSIDIAN', 'BONE', 'STONE'];
    let headMaterialName = (weaponType === 'club' && Math.random() < 0.7) ? handleMaterialName : getRandomElement(headMaterials.filter(m => m !== 'STONE' || weaponType === 'club' || weaponType === 'hammer'));
    if (weaponType === 'club' && handleMaterialName !== 'WOOD' && Math.random() < 0.5) headMaterialName = 'WOOD';
    const headPalette = getPalette(headMaterialName);

    let headDetails = {};
    let itemNamePrefix = "";
    let estimatedHeadHeight = 0;
    let estimatedHeadVerticalOffsetToCenter = 0;
    let pommelHeightEstimate = hasPommel ? Math.floor(handleLogicalThickness * 1.3) + 3 : 0;


    if (weaponType === 'hammer') {
        const hWidth = getRandomInt(10, 18);
        const hHeight = getRandomInt(5, 9);
        // MODIFIED: Added new face and peen styles
        const faceStyles = ['flat_wide', 'double_face', 'none', 'rounded_face'];
        const peenStyles = ['none', 'pick', 'rounded_peen', 'flat_peen', 'claw_peen', 'spherical_peen'];
        
        headDetails = {
            headWidth: hWidth,
            headHeight: hHeight,
            faceStyle: getRandomElement(faceStyles),
            peenStyle: getRandomElement(peenStyles),
            palette: headPalette,
        };
         // Ensure peenStyle is 'none' if faceStyle is 'double_face'
        if (headDetails.faceStyle === 'double_face') {
            headDetails.peenStyle = 'none';
        }

        itemNamePrefix = `${headMaterialName} Hammer`;
        if (headDetails.faceStyle !== 'none' && headDetails.faceStyle !== 'flat_wide') itemNamePrefix += ` (${headDetails.faceStyle.replace('_',' ')})`;
        if (headDetails.peenStyle !== 'none') itemNamePrefix += ` with ${headDetails.peenStyle.replace('_',' ')} Peen`;
        estimatedHeadHeight = hHeight;
        estimatedHeadVerticalOffsetToCenter = Math.floor(hHeight / 2);

    } else if (weaponType === 'mace') {
        // MODIFIED: Added new mace head shapes
        const maceShapes = ['round_mace', 'oval_mace', 'blocky_mace', 'diamond_flanged_mace', 'bladed_flanged_mace', 'star_flanged_mace'];
        const mShape = getRandomElement(maceShapes);
        const mWidth = getRandomInt(9, 16);
        const mHeight = (mShape === 'oval_mace') ? getRandomInt(11,18) : mWidth + getRandomInt(-1,1);
        const mHasStuds = Math.random() < 0.65 && !mShape.includes('flanged'); // Studs less likely on flanged
        const numFlanges = (mShape.includes('flanged')) ? getRandomInt(4, 8) : 0;

        headDetails = {
            headShape: mShape,
            headWidth: mWidth,
            headHeight: mHeight,
            palette: headPalette,
            hasStuds: mHasStuds,
            studPalette: mHasStuds ? getPalette(getRandomElement(['IRON','STEEL', 'OBSIDIAN', 'BONE', 'GOLD'])) : null,
            numFlanges: numFlanges
        };
        itemNamePrefix = `${headMaterialName} ${mShape.replace('_mace','').replace('_flanged',' Flanged')} Mace`;
        if (mHasStuds) itemNamePrefix += " (Studded)";
        estimatedHeadHeight = mHeight;
        estimatedHeadVerticalOffsetToCenter = Math.floor(mHeight / 2);

    } else if (weaponType === 'club') {
        const cHeadLength = getRandomInt(Math.floor(MAX_HANDLE_BASE_LENGTH * 0.40), Math.floor(MAX_HANDLE_BASE_LENGTH * 0.60));
        const clubStyles = ['baseball_bat', 'spiked_club'];
        const cStyle = getRandomElement(clubStyles);
        headDetails = {
            headLength: cHeadLength,
            maxThicknessAtTip: handleLogicalThickness + getRandomInt(5, 10),
            palette: headPalette,
            style: cStyle,
            spikePalette: (cStyle === 'spiked_club') ? getPalette(getRandomElement(['IRON', 'STEEL', 'BONE', 'OBSIDIAN'])) : null,
        };
        itemNamePrefix = `${headMaterialName} Club`;
        if (cStyle === 'spiked_club') itemNamePrefix += " (Spiked)";
        estimatedHeadHeight = cHeadLength;
        estimatedHeadVerticalOffsetToCenter = 0;
    } else if (weaponType === 'morningstar') {
        const ballR = getRandomInt(5, 9);
        headDetails = {
            ballRadius: ballR,
            spikeLength: getRandomInt(3, 5),
            numSpikes: getRandomInt(8, 16),
            palette: headPalette,
        };
        itemNamePrefix = `${headMaterialName} Morningstar`;
        estimatedHeadHeight = ballR * 2 + headDetails.spikeLength;
        estimatedHeadVerticalOffsetToCenter = ballR;
    }

    const minHandleActual = MIN_HANDLE_LENGTH_NEW + (weaponType === 'hammer' || weaponType === 'morningstar' ? 10 : 5);
    const maxHandlePossible = MAX_HANDLE_BASE_LENGTH - estimatedHeadHeight - pommelHeightEstimate - CANVAS_PADDING;
    const handleLogicalLength = getRandomInt(Math.max(minHandleActual, 20) , Math.max(minHandleActual + 15, maxHandlePossible));

    const totalWeaponHeight = estimatedHeadHeight + handleLogicalLength + pommelHeightEstimate;
    const weaponOverallTopY = Math.max(CANVAS_PADDING, Math.floor((LOGICAL_GRID_HEIGHT - totalWeaponHeight) / 2));
    
    const weaponCenterX = Math.floor(LOGICAL_GRID_WIDTH / 2);
    let headAttachY;
    let handleDrawStartY;

    if (weaponType === 'club') {
        handleDrawStartY = weaponOverallTopY + estimatedHeadHeight;
        headAttachY = handleDrawStartY;
    } else {
        headAttachY = weaponOverallTopY + estimatedHeadVerticalOffsetToCenter;
        handleDrawStartY = headAttachY;
    }

    const handleDetailsToDraw = {
        logicalLength: handleLogicalLength,
        logicalThickness: handleLogicalThickness,
        palette: handlePalette,
        materialName: handleMaterialName,
        hasPommel,
        pommelPalette,
        pommelShape,
        style: 'plain',
        gripPalette: null
    };
    drawBluntWeaponHandle(ctx, handleDetailsToDraw, weaponCenterX, handleDrawStartY);

    if (weaponType === 'hammer') {
        drawHammerHead(ctx, headDetails, weaponCenterX, headAttachY);
    } else if (weaponType === 'mace') {
        drawMaceHead(ctx, headDetails, weaponCenterX, headAttachY);
    } else if (weaponType === 'club') {
        drawClubHead(ctx, headDetails, weaponCenterX, headAttachY, handleLogicalThickness);
    } else if (weaponType === 'morningstar') {
        drawMorningstarHead(ctx, headDetails, weaponCenterX, headAttachY);
    }
    
    let finalItemName = itemNamePrefix;
    if (hasPommel && pommelShape) finalItemName += ` with ${pommelShape.replace('_',' ')} Pommel`;
    
    const itemSeed = options.seed || Date.now();
    const generatedItemData = {
        type: 'blunt_weapon',
        name: finalItemName,
        seed: itemSeed,
        itemData: {
            weaponType,
            subType: options.subType || weaponType,
            handle: {
                material: handleMaterialName.toLowerCase(),
                length: handleLogicalLength,
                thickness: handleLogicalThickness,
                hasPommel,
                pommelShape: pommelShape ? pommelShape.toLowerCase() : null,
                colors: handlePalette,
                pommelColors: pommelPalette,
            },
            head: {
                material: headMaterialName.toLowerCase(),
                details: headDetails,
                colors: headPalette
            }
        },
        imageDataUrl: offscreenCanvas.toDataURL()
    };

    console.log("Blunt Weapon generated:", generatedItemData.name);
    return generatedItemData;
}

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
    return "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAABAAAAAQCAYAAAAf8/9hAAAAAXNSR0IArs4c6QAAACNJREFUOI1jZGRgYPgPykCATQIKyMBKjEwM0AAGsAFJVMQvAgADqgH5kG3fXAAAAABJRU5ErkJggg==";
}

console.log("js/generators/blunt_weapon_generator.js loaded with further refinements and head variations.");
