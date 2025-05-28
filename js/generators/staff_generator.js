/**
 * js/generators/staff_generator.js
 * Contains the logic for procedurally generating staves, scepters, and wands.
 */

import { getRandomInt, getRandomElement, drawScaledRect, getRandomInRange } from '../utils.js';
import { getPalette, MATERIAL_PALETTES } from '../palettes/material_palettes.js';

// --- Constants ---
const LOGICAL_GRID_WIDTH = 64;
const LOGICAL_GRID_HEIGHT = 64;
const DISPLAY_SCALE = 4;
const CANVAS_WIDTH = LOGICAL_GRID_WIDTH * DISPLAY_SCALE;
const CANVAS_HEIGHT = LOGICAL_GRID_HEIGHT * DISPLAY_SCALE;
const CANVAS_PADDING = 4;

// --- Internal Helper Functions ---

/**
 * Draws the shaft of the staff/scepter/wand.
 */
function drawShaft(ctx, shaftDetails, startX, topY) {
    const {
        logicalLength,
        logicalThickness,
        palette,
        materialName,
        shape, // 'straight', 'slightly_curved', 'gnarled'
        decoration, // 'none', 'runes', 'bands', 'spiral_wrap'
        decorationPalette,
        hasGrip,
        gripLength,
        gripPalette
    } = shaftDetails;

    const shaftDrawX = startX - Math.floor(logicalThickness / 2);

    for (let i = 0; i < logicalLength; i++) {
        const y = topY + i;
        let currentX = shaftDrawX;
        let currentThickness = logicalThickness;

        if (shape === 'slightly_curved' || shape === 'gnarled') {
            const wiggleFactor = shape === 'gnarled' ? 1.5 : 1; 
            const curveFrequency = shape === 'gnarled' ? getRandomInRange(3, 5) : getRandomInRange(2,4);
            const curveOffset = Math.sin( (i / logicalLength) * Math.PI * curveFrequency ) * wiggleFactor;
            currentX = shaftDrawX + Math.round(curveOffset);
            
            if (shape === 'gnarled' && i % getRandomInt(4,8) === 0) { 
                currentThickness = Math.max(1, logicalThickness + getRandomInt(-1,1));
                currentX = startX - Math.floor(currentThickness / 2) + Math.round(curveOffset);
            }
        }
        currentX = Math.max(0, Math.min(LOGICAL_GRID_WIDTH - currentThickness, currentX));


        drawScaledRect(ctx, currentX, y, currentThickness, 1, palette.base, DISPLAY_SCALE);
        if (currentThickness > 1) {
            drawScaledRect(ctx, currentX, y, 1, 1, palette.highlight, DISPLAY_SCALE);
            drawScaledRect(ctx, currentX + currentThickness - 1, y, 1, 1, palette.shadow, DISPLAY_SCALE);
        }
        if (materialName === 'WOOD' && i % getRandomInt(5, 8) === 0 && currentThickness > 0) {
            const grainX = currentX + getRandomInt(0, currentThickness - 1);
            drawScaledRect(ctx, grainX, y, 1, 1, palette.shadow, DISPLAY_SCALE);
        }

        // Shaft Decorations
        if (decorationPalette) {
            if (decoration === 'bands' && i % getRandomInt(8, 15) < 2 && i > 5 && i < logicalLength - 5) { 
                drawScaledRect(ctx, currentX -1, y, currentThickness + 2, 1, decorationPalette.base, DISPLAY_SCALE);
                drawScaledRect(ctx, currentX -1, y, 1, 1, decorationPalette.highlight, DISPLAY_SCALE);
                drawScaledRect(ctx, currentX + currentThickness, y, 1, 1, decorationPalette.shadow, DISPLAY_SCALE);
            } else if (decoration === 'runes' && i % getRandomInt(7, 12) === 0 && currentThickness > 1 && i > 5 && i < logicalLength -5) {
                const runeX = currentX + Math.floor(currentThickness / 2) -1 + getRandomInt(-1,0);
                const runeY = y;
                drawScaledRect(ctx, runeX, runeY, 1, getRandomInt(2,3), decorationPalette.highlight, DISPLAY_SCALE); 
                if(Math.random() < 0.6) drawScaledRect(ctx, runeX + (Math.random() < 0.5 ? -1 : 1), runeY +1, 1, 1, decorationPalette.base, DISPLAY_SCALE);
            } else if (decoration === 'spiral_wrap' && currentThickness > 0) {
                const spiralOffset = Math.floor( ( (i * 0.5) % currentThickness) );
                let wrapX = currentX + spiralOffset;
                if (wrapX >= currentX + currentThickness) wrapX = currentX + currentThickness -1; // Clamp
                drawScaledRect(ctx, wrapX, y, 1, 1, decorationPalette.base, DISPLAY_SCALE);
                 if (i%2 === 0) drawScaledRect(ctx, wrapX, y, 1, 1, decorationPalette.highlight, DISPLAY_SCALE);

            }
        }
    }

    // Grip Area (drawn over the main shaft part)
    if (hasGrip && gripPalette && gripLength > 0) {
        const gripActualLength = Math.min(gripLength, logicalLength); 
        const gripStartY = topY + Math.floor((logicalLength - gripActualLength) * 0.7); 

        for (let i = 0; i < gripActualLength; i++) {
            const y = gripStartY + i;
            let originalShaftX = shaftDrawX;
             if (shape === 'slightly_curved' || shape === 'gnarled') {
                const wiggleFactor = shape === 'gnarled' ? 2 : 1;
                const curveFrequency = shape === 'gnarled' ? getRandomInRange(3, 5) : getRandomInRange(2,4);
                const shaftProgress = ( (y - topY) / logicalLength); 
                const curveOffset = Math.sin( shaftProgress * Math.PI * curveFrequency ) * wiggleFactor;
                originalShaftX = shaftDrawX + Math.round(curveOffset);
            }
            originalShaftX = Math.max(0, Math.min(LOGICAL_GRID_WIDTH - logicalThickness, originalShaftX));


            drawScaledRect(ctx, originalShaftX, y, logicalThickness, 1, gripPalette.base, DISPLAY_SCALE);
            if (i % 3 === 0 && logicalThickness > 1) { 
                drawScaledRect(ctx, originalShaftX, y, logicalThickness, 1, gripPalette.shadow, DISPLAY_SCALE);
            } else if (logicalThickness > 1) {
                 drawScaledRect(ctx, originalShaftX, y, 1, 1, gripPalette.highlight, DISPLAY_SCALE);
                 drawScaledRect(ctx, originalShaftX + logicalThickness -1, y, 1, 1, gripPalette.shadow, DISPLAY_SCALE);
            }
        }
    }


    return topY + logicalLength; 
}

/**
 * Draws the topper (gemstone, symbol, etc.) of the staff/scepter/wand.
 */
function drawTopper(ctx, topperDetails, attachX, attachY) {
    const {
        topperShape, 
        size, 
        palette, 
        gemPalette,
        hasInsetGem, 
        insetGemPalette 
    } = topperDetails;

    const topperCenterY = attachY - Math.floor(size/2) -1; 

    if (topperShape === 'orb_gem' && gemPalette) {
        const radius = Math.max(3, Math.floor(size * 0.8)); 
        const orbEffectiveCenterY = attachY - radius -1; 
        for (let dy = -radius; dy <= radius; dy++) {
            for (let dx = -radius; dx <= radius; dx++) {
                if (dx * dx + dy * dy <= radius * radius) {
                    let color = gemPalette.base;
                    const distFactor = (dx*dx + dy*dy) / (radius*radius || 1);
                    if (distFactor > 0.6) { 
                        if (dx + dy < 0) color = gemPalette.highlight; 
                        else color = gemPalette.shadow; 
                    } else if (distFactor < 0.15 && radius > 2) { 
                        color = gemPalette.highlight; 
                    }
                    drawScaledRect(ctx, attachX + dx, orbEffectiveCenterY + dy, 1, 1, color, DISPLAY_SCALE);
                }
            }
        }
    } else if (topperShape === 'crystal_shard' && gemPalette) { 
        const diamondHeight = Math.max(5, size +1);
        const diamondWidth = Math.max(3, Math.floor(size * 0.7));
        const diamondDrawTopY = attachY - diamondHeight;

        for (let i = 0; i < Math.ceil(diamondHeight / 2); i++) {
            const progress = i / (Math.ceil(diamondHeight / 2) - 1 || 1);
            const currentWidth = Math.max(1, Math.ceil(diamondWidth * progress));
            const currentX = attachX - Math.floor(currentWidth / 2);
            drawScaledRect(ctx, currentX, diamondDrawTopY + i, currentWidth, 1, gemPalette.base, DISPLAY_SCALE);
            if (i < 2 && currentWidth > 0) drawScaledRect(ctx, currentX, diamondDrawTopY + i, currentWidth, 1, gemPalette.highlight, DISPLAY_SCALE); 
        }
        for (let i = 0; i < Math.floor(diamondHeight / 2); i++) {
            const progress = i / (Math.floor(diamondHeight / 2) -1 || 1);
            const currentWidth = Math.max(1, Math.ceil(diamondWidth * (1 - progress)));
            const currentX = attachX - Math.floor(currentWidth / 2);
            const yPos = diamondDrawTopY + Math.ceil(diamondHeight / 2) + i;
            drawScaledRect(ctx, currentX, yPos, currentWidth, 1, gemPalette.base, DISPLAY_SCALE);
            if (i > Math.floor(diamondHeight / 2) - 3 && currentWidth > 0) drawScaledRect(ctx, currentX, yPos, currentWidth, 1, gemPalette.shadow, DISPLAY_SCALE); 
        }
        if (diamondWidth > 2) {
            drawScaledRect(ctx, attachX -1, diamondDrawTopY + Math.floor(diamondHeight/2) -1, 2, 2, gemPalette.highlight, DISPLAY_SCALE);
        }


    } else if (topperShape === 'crescent_moon' && palette) {
        const crescentOuterRadius = Math.max(4, Math.floor(size * 0.8));
        const crescentThickness = getRandomInt(2, 3); 
        const crescentInnerRadius = Math.max(1, crescentOuterRadius - crescentThickness);
        
        const connectorHeight = Math.max(1, Math.floor(crescentThickness * 0.6));
        const connectorWidth = Math.max(1, Math.floor(crescentThickness * 0.8));
        const connectorTopY = attachY - connectorHeight;
        drawScaledRect(ctx, attachX - Math.floor(connectorWidth/2), connectorTopY, connectorWidth, connectorHeight, palette.base, DISPLAY_SCALE);
        if (connectorHeight > 0) { 
            drawScaledRect(ctx, attachX - Math.floor(connectorWidth/2), connectorTopY, connectorWidth, 1, palette.highlight, DISPLAY_SCALE);
        }

        const crescentTopBendY = connectorTopY; 
        const circleCenterY = crescentTopBendY + crescentInnerRadius; 

        for (let yOffset = -crescentOuterRadius; yOffset <= crescentOuterRadius; yOffset++) {
            for (let xOffset = -crescentOuterRadius; xOffset <= crescentOuterRadius; xOffset++) {
                const distSq = xOffset * xOffset + yOffset * yOffset;
                if (distSq <= crescentOuterRadius * crescentOuterRadius && distSq > crescentInnerRadius * crescentInnerRadius) {
                    if (yOffset >= 0) { 
                        let color = palette.base;
                        if (distSq > (crescentOuterRadius -1)*(crescentOuterRadius-1)*0.9) { 
                            color = palette.highlight; 
                        } else if (distSq < (crescentInnerRadius+1)*(crescentInnerRadius+1)*1.1 && distSq > crescentInnerRadius*crescentInnerRadius) { 
                            color = palette.shadow;
                        }
                        drawScaledRect(ctx, attachX + xOffset, circleCenterY + yOffset, 1, 1, color, DISPLAY_SCALE);
                    }
                }
            }
        }
        if (hasInsetGem && insetGemPalette && crescentThickness > 1) {
            const gemSize = Math.max(1, crescentThickness -1);
            const gemX = attachX - Math.floor(gemSize/2);
            const gemY = connectorTopY - Math.floor(gemSize/2) -1; 
            drawScaledRect(ctx, gemX, gemY, gemSize, gemSize, insetGemPalette.base, DISPLAY_SCALE);
            if(gemSize > 0) drawScaledRect(ctx, gemX, gemY, 1,1, insetGemPalette.highlight, DISPLAY_SCALE);
        }


    } else if (topperShape === 'metal_finial' && palette) {
        const finialHeight = Math.max(5, size + 2); 
        const finialBaseWidth = Math.max(2, Math.floor(size * 0.5));
        const finialDrawTopY = attachY - finialHeight;
        for(let i=0; i<finialHeight; i++){
            const progress = i / (finialHeight -1 || 1);
            let currentWidth = finialBaseWidth;
            if (progress < 0.2) currentWidth = Math.max(1, Math.ceil(finialBaseWidth * (1 + progress * 0.5))); 
            else if (progress < 0.7) currentWidth = Math.max(1, Math.ceil(finialBaseWidth * (1.1 - (progress-0.2)*1.8) ) ); 
            else currentWidth = Math.max(1, Math.ceil(finialBaseWidth * 0.3 + ( (progress-0.7)*0.7 ) * finialBaseWidth *0.3 ) ); 
            
            const currentX = attachX - Math.floor(currentWidth/2);
            drawScaledRect(ctx, currentX, finialDrawTopY + i, currentWidth, 1, palette.base, DISPLAY_SCALE);
            if (currentWidth > 1) {
                drawScaledRect(ctx, currentX, finialDrawTopY + i, 1, 1, palette.highlight, DISPLAY_SCALE);
                drawScaledRect(ctx, currentX + currentWidth -1, finialDrawTopY + i, 1, 1, palette.shadow, DISPLAY_SCALE);
            }
        }
        if (hasInsetGem && insetGemPalette) {
            const gemSize = Math.max(2, Math.floor(finialBaseWidth * 0.6)); 
            const gemX = attachX - Math.floor(gemSize/2);
            const gemY = finialDrawTopY + Math.floor(finialHeight * 0.25); 
            drawScaledRect(ctx, gemX, gemY, gemSize, gemSize, insetGemPalette.base, DISPLAY_SCALE);
            if(gemSize > 1) {
                drawScaledRect(ctx, gemX, gemY, 1,1, insetGemPalette.highlight, DISPLAY_SCALE);
                drawScaledRect(ctx, gemX+gemSize-1, gemY+gemSize-1, 1,1, insetGemPalette.shadow, DISPLAY_SCALE);
            }
        }
    } else if (topperShape === 'twisted_wood' && palette) {
        const woodHeight = Math.max(6, size + 3);
        const woodBaseWidth = Math.max(2, Math.floor(size * 0.5));
        const woodDrawTopY = attachY - woodHeight;
        const numTwists = getRandomInt(2,3);

        for (let i = 0; i < woodHeight; i++) {
            const progress = i / (woodHeight -1 || 1);
            const currentOverallWidth = Math.max(1, woodBaseWidth - Math.floor(progress * woodBaseWidth * 0.75)); 
            
            for (let t = 0; t < numTwists; t++) {
                const strandThickness = Math.max(1, Math.floor(currentOverallWidth / numTwists));
                const angle = progress * Math.PI * 3 + (t * 2 * Math.PI / numTwists); 
                const strandOffset = Math.sin(angle) * (currentOverallWidth * 0.25 * (1-progress) ); 
                const strandX = attachX - Math.floor(currentOverallWidth/2) + Math.floor( (currentOverallWidth/numTwists) * t ) + Math.round(strandOffset);
                
                const actualStrandX = Math.max(attachX - Math.floor(currentOverallWidth/2), Math.min(strandX, attachX + Math.floor(currentOverallWidth/2) - strandThickness + (numTwists > 1 ? 1:0) ));

                drawScaledRect(ctx, actualStrandX, woodDrawTopY + i, strandThickness, 1, (t%2===0) ? palette.base : palette.shadow, DISPLAY_SCALE);
                if (strandThickness > 0 && Math.random() < 0.3) {
                     drawScaledRect(ctx, actualStrandX, woodDrawTopY + i, 1, 1, palette.highlight, DISPLAY_SCALE);
                }
            }
        }
    }
}

/**
 * Generates a procedural staff, scepter, or wand.
 * @param {object} options - Options for generation, may include 'subType'.
 */
export function generateStaff(options = {}) {
    console.log("generateStaff called with options:", options);

    const offscreenCanvas = document.createElement('canvas');
    offscreenCanvas.width = CANVAS_WIDTH;
    offscreenCanvas.height = CANVAS_HEIGHT;
    const ctx = offscreenCanvas.getContext('2d');

    if (!ctx) {
        console.error("Failed to get 2D context for offscreen canvas in generateStaff.");
        return { type: 'staff', name: 'Error Staff', seed: Date.now(), itemData: { error: "Canvas context failed" }, imageDataUrl: createErrorDataURL("CTX Fail") };
    }
    ctx.imageSmoothingEnabled = false;
    ctx.clearRect(0, 0, CANVAS_WIDTH, CANVAS_HEIGHT);

    // MODIFIED: Determine staffType based on options.subType
    let staffType;
    const defaultStaffTypes = ['wand', 'scepter', 'staff'];
    if (options.subType && defaultStaffTypes.includes(options.subType)) {
        staffType = options.subType;
    } else {
        staffType = getRandomElement(defaultStaffTypes);
        if (options.subType) console.warn(`Unknown staff subType: ${options.subType}. Defaulting to random: ${staffType}`);
    }

    const shaftMaterials = ['WOOD', 'BONE', 'DARK_STEEL', 'OBSIDIAN', 'SILVER', 'GOLD', 'ENCHANTED', 'GEM_RED', 'GEM_BLUE', 'PURPLE_PAINT', 'IVORY', 'GREEN_LEAF'];
    const shaftMaterialName = getRandomElement(shaftMaterials);
    const shaftPalette = getPalette(shaftMaterialName);
    
    let shaftLogicalLength, shaftLogicalThickness;
    let shaftShape = 'straight';
    const shaftDecorations = ['none', 'runes', 'bands', 'spiral_wrap']; 
    let shaftDecoration = 'none';
    let shaftDecorationPalette = null;
    let hasGrip = false;
    let gripLength = 0;
    let gripPalette = null;


    if (staffType === 'wand') {
        shaftLogicalLength = getRandomInt(LOGICAL_GRID_HEIGHT * 0.35, LOGICAL_GRID_HEIGHT * 0.6); 
        shaftLogicalThickness = getRandomInt(1, 2);
        if (shaftMaterialName === 'WOOD' || shaftMaterialName === 'BONE' || shaftMaterialName === 'IVORY' || shaftMaterialName === 'GREEN_LEAF') {
            shaftShape = getRandomElement(['straight', 'slightly_curved']);
            if(Math.random() < 0.4) shaftDecoration = getRandomElement(['runes', 'bands', 'spiral_wrap']);
        }
    } else if (staffType === 'scepter') {
        shaftLogicalLength = getRandomInt(LOGICAL_GRID_HEIGHT * 0.6, LOGICAL_GRID_HEIGHT * 0.8);
        shaftLogicalThickness = getRandomInt(2, 3);
        if (shaftMaterialName === 'WOOD' || shaftMaterialName === 'IVORY' || shaftMaterialName === 'GREEN_LEAF') shaftShape = getRandomElement(['straight', 'slightly_curved']);
        if(Math.random() < 0.6) shaftDecoration = getRandomElement(shaftDecorations);
        if(Math.random() < 0.5) hasGrip = true;
    } else { // staff
        shaftLogicalLength = getRandomInt(LOGICAL_GRID_HEIGHT * 0.8, LOGICAL_GRID_HEIGHT - CANVAS_PADDING * 2); 
        shaftLogicalThickness = getRandomInt(2, 4);
        if (shaftMaterialName === 'WOOD' || shaftMaterialName === 'BONE' || shaftMaterialName === 'IVORY' || shaftMaterialName === 'GREEN_LEAF') {
            shaftShape = getRandomElement(['straight', 'slightly_curved', 'gnarled']);
        }
        if(Math.random() < 0.7) shaftDecoration = getRandomElement(shaftDecorations);
        if(Math.random() < 0.7) hasGrip = true;
    }

    if (shaftDecoration !== 'none') {
        const decMats = ['GOLD', 'SILVER', 'ENCHANTED', (shaftMaterialName === 'WOOD' ? 'OBSIDIAN' : 'WOOD'), 'LEATHER', 'BRONZE'];
        shaftDecorationPalette = getPalette(getRandomElement(decMats));
    }
    if (hasGrip) {
        gripLength = Math.floor(shaftLogicalLength * getRandomInRange(0.2, 0.4));
        const gripMats = ['LEATHER', 'DARK_STEEL', 'IRON', (shaftMaterialName === 'WOOD' ? 'BONE' : 'WOOD')];
        gripPalette = getPalette(getRandomElement(gripMats));
    }


    const topperShapes = ['orb_gem', 'crystal_shard', 'crescent_moon', 'metal_finial', 'twisted_wood'];
    const topperShape = getRandomElement(topperShapes);
    
    let topperSize, topperPaletteName, topperPalette, gemPaletteName, gemPalette, hasInsetGem, insetGemPalette;
    topperSize = getRandomInt(6, 12); 
    if (staffType === 'wand') topperSize = getRandomInt(4,8);
    else if (staffType === 'scepter') topperSize = getRandomInt(8,14);


    if (topperShape === 'orb_gem' || topperShape === 'crystal_shard') {
        const gemColors = ['GEM_RED', 'GEM_BLUE', 'GEM_GREEN', 'GEM_PURPLE', 'GEM_YELLOW', 'GEM_CYAN', 'GEM_WHITE', 'ENCHANTED', 'OBSIDIAN'];
        gemPaletteName = getRandomElement(gemColors);
        gemPalette = getPalette(gemPaletteName);
        topperPalette = gemPalette; 
        topperPaletteName = gemPaletteName;
    } else { 
        const metalMaterials = ['GOLD', 'SILVER', 'BRONZE', 'STEEL', 'DARK_STEEL', 'OBSIDIAN', 'BONE', 'IVORY', 'GREEN_LEAF']; 
        topperPaletteName = (topperShape === 'twisted_wood' && Math.random() < 0.8) ? 'WOOD' : getRandomElement(metalMaterials);
        if (topperShape === 'twisted_wood' && !MATERIAL_PALETTES[topperPaletteName.toUpperCase()]) topperPaletteName = 'WOOD';
        if (topperShape === 'twisted_wood' && shaftMaterialName === 'GREEN_LEAF' && Math.random() < 0.7) topperPaletteName = 'GREEN_LEAF'; 
        
        topperPalette = getPalette(topperPaletteName);
        gemPalette = null; 
        gemPaletteName = null;
        if ((topperShape === 'metal_finial' || topperShape === 'crescent_moon' || topperShape === 'twisted_wood') && Math.random() < 0.5) {
            hasInsetGem = true;
            const insetGemColors = ['GEM_RED', 'GEM_BLUE', 'GEM_GREEN', 'GEM_PURPLE', 'GEM_YELLOW'];
            insetGemPalette = getPalette(getRandomElement(insetGemColors));
        }
    }

    let estimatedTopperHeight = topperSize + 4; 
    if (topperShape === 'crystal_shard') estimatedTopperHeight = Math.max(6, topperSize + 2) + 2;
    else if (topperShape === 'crescent_moon') estimatedTopperHeight = Math.max(5, Math.floor(topperSize * 0.8)) + 3; 
    else if (topperShape === 'twisted_wood') estimatedTopperHeight = Math.max(6, topperSize + 2) + 2;


    const totalApproxHeight = shaftLogicalLength + estimatedTopperHeight;
    const staffOverallTopY = Math.max(CANVAS_PADDING, Math.floor((LOGICAL_GRID_HEIGHT - totalApproxHeight) / 2));
    const weaponCenterX = Math.floor(LOGICAL_GRID_WIDTH / 2);
    
    const topperBaseY = staffOverallTopY + estimatedTopperHeight; 
    const shaftDrawTopY = topperBaseY; 


    const shaftDetailsToDraw = {
        logicalLength: shaftLogicalLength,
        logicalThickness: shaftLogicalThickness,
        palette: shaftPalette,
        materialName: shaftMaterialName,
        shape: shaftShape,
        decoration: shaftDecoration,
        decorationPalette: shaftDecorationPalette,
        hasGrip,
        gripLength,
        gripPalette
    };
    drawShaft(ctx, shaftDetailsToDraw, weaponCenterX, shaftDrawTopY);

    const topperDetailsToDraw = {
        topperShape,
        size: topperSize,
        palette: topperPalette,
        gemPalette,
        hasInsetGem,
        insetGemPalette
    };
    drawTopper(ctx, topperDetailsToDraw, weaponCenterX, shaftDrawTopY); 


    // MODIFIED: Item Naming
    let subTypeNameForDisplay = staffType.replace(/_/g, ' ');
    subTypeNameForDisplay = subTypeNameForDisplay.split(' ').map(word => word.charAt(0).toUpperCase() + word.slice(1)).join(' ');

    let itemName = `${shaftMaterialName} ${subTypeNameForDisplay}`;
    if (shaftDecoration !== 'none') itemName += ` (${shaftDecoration.replace('_',' ')})`;
    
    let topperDesc = `with ${topperPaletteName} ${topperShape.replace('_',' ')}`;
    if (topperShape === 'orb_gem' || topperShape === 'crystal_shard') {
        topperDesc = `with ${gemPaletteName.replace('GEM_', '')} ${topperShape.replace('_gem','').replace('_shard',' Shard')}`;
    }
    if (hasInsetGem && insetGemPalette) topperDesc += " (Inlaid)";
    itemName += " " + topperDesc;
    
    const itemSeed = options.seed || Date.now();

    const generatedItemData = {
        type: 'staff', 
        name: itemName,
        seed: itemSeed,
        itemData: {
            staffType, // Actual type used
            subType: options.subType || staffType, // Store selected subType
            shaft: {
                material: shaftMaterialName.toLowerCase(),
                length: shaftLogicalLength,
                thickness: shaftLogicalThickness,
                shape: shaftShape,
                decoration: shaftDecoration,
                hasGrip,
                gripLength,
                colors: shaftPalette,
                decorationColors: shaftDecorationPalette,
                gripColors: gripPalette
            },
            topper: {
                shape: topperShape,
                material: topperPaletteName ? topperPaletteName.toLowerCase() : null,
                gemMaterial: gemPaletteName ? gemPaletteName.toLowerCase().replace('gem_','') : null,
                size: topperSize,
                hasInsetGem,
                colors: topperPalette,
                gemColors: gemPalette,
                insetGemColors: insetGemPalette,
            }
        },
        imageDataUrl: offscreenCanvas.toDataURL()
    };

    console.log("Staff/Scepter/Wand generated:", generatedItemData.name);
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

console.log("js/generators/staff_generator.js loaded with enhanced variety.");
