import { getRandomInt, getRandomElement, drawScaledRect, getRandomInRange } from '../utils.js';
import { getPalette, MATERIAL_PALETTES } from '../palettes/material_palettes.js';

// --- Constants specific to bow generation or drawing ---
const LOGICAL_GRID_WIDTH = 64;
const LOGICAL_GRID_HEIGHT = 64;
const DISPLAY_SCALE = 4;
const CANVAS_WIDTH = LOGICAL_GRID_WIDTH * DISPLAY_SCALE;   // 256
const CANVAS_HEIGHT = LOGICAL_GRID_HEIGHT * DISPLAY_SCALE; // 256
const CANVAS_PADDING = 4;
const ARROW_OFFSET_X = 10; // How far to the right of the bow to draw the arrow

// --- Internal helper functions for drawing bow components ---

function drawBowLimbs(ctx, limbDetails, centerX, centerY, orientation = 'vertical') {
    const {
        type, // 'longbow', 'shortbow', 'recurve'
        logicalLength,
        maxCurve,
        limbThickness,
        palette,
        tipStyle // 'simple', 'nocked'
    } = limbDetails;

    const halfLength = Math.floor(logicalLength / 2);
    if (halfLength <= 0) return; 

    const limbBaseColor = palette.base;
    const limbHighlightColor = palette.highlight;
    const limbShadowColor = palette.shadow;

    // Loop for drawing the entire bow frame as one continuous D-shape or recurve
    for (let yCurrent = centerY - halfLength; yCurrent <= centerY + halfLength; yCurrent++) {
        const normalizedYDistFromCenter = Math.abs(yCurrent - centerY) / halfLength; 

        let curveFactor = Math.sqrt(1 - Math.pow(normalizedYDistFromCenter, 2)); // Base D-shape curve
        let xOffset = Math.floor(maxCurve * curveFactor);
        
        if (type === 'recurve') {
            const recurveStartProgress = 0.7; 
            if (normalizedYDistFromCenter > recurveStartProgress) {
                const recurveProgress = (normalizedYDistFromCenter - recurveStartProgress) / (1 - recurveStartProgress);
                xOffset -= Math.floor(maxCurve * 0.5 * Math.sin(recurveProgress * Math.PI)); // Increased recurve flick
            }
        }
        
        let currentThickness = limbThickness;
        if (type !== 'longbow_straight') { // Assuming 'longbow' might have a less tapered variant if 'longbow_straight' existed
             currentThickness = Math.max(1, Math.ceil(limbThickness * (1 - normalizedYDistFromCenter * 0.85))); // Stronger taper
        }

        // Ensure limbs connect to where the string will be (centerX) at their very tips
        if (normalizedYDistFromCenter > 0.95) { // For the very tips
            xOffset = Math.max(0, xOffset -1); // Pull tips slightly more towards center if recurved
            if (type !== 'recurve') { // For D-bows, ensure tips aim for string line
                 xOffset = Math.floor(currentThickness / 2); // This helps align the center of the tip with the string
            }
        }
        
        const startX = centerX - xOffset - Math.floor(currentThickness / 2);

        if (currentThickness === 1) {
            drawScaledRect(ctx, startX, yCurrent, 1, 1, limbBaseColor, DISPLAY_SCALE);
        } else { 
            drawScaledRect(ctx, startX, yCurrent, 1, 1, limbHighlightColor, DISPLAY_SCALE); 
            drawScaledRect(ctx, startX + currentThickness - 1, yCurrent, 1, 1, limbShadowColor, DISPLAY_SCALE); 
            if (currentThickness > 2) { 
                drawScaledRect(ctx, startX + 1, yCurrent, currentThickness - 2, 1, limbBaseColor, DISPLAY_SCALE);
            }
        }
    }
    
    // Draw decorative tips (nocks) - string will be at centerX
    const tipBaseThickness = Math.max(1, Math.ceil(limbThickness * (1 - 1.0 * 0.85))); 
    const tipVisualWidth = tipBaseThickness + (tipStyle === 'nocked' ? 2 : 1); // Nocked tips are wider
    const tipVisualHeight = tipStyle === 'nocked' ? 3 : 2; // Nocked tips are taller

    // Top Tip
    const topTipY = centerY - halfLength;
    const topTipDrawX = centerX - Math.floor(tipVisualWidth / 2); // Center tip around string line
    const topTipDrawY = topTipY - Math.floor(tipVisualHeight / 2);

    if (tipStyle === 'nocked') {
        drawScaledRect(ctx, topTipDrawX, topTipDrawY, 1, tipVisualHeight, palette.outline || limbShadowColor, DISPLAY_SCALE); 
        drawScaledRect(ctx, topTipDrawX + tipVisualWidth - 1, topTipDrawY, 1, tipVisualHeight, palette.outline || limbShadowColor, DISPLAY_SCALE); 
        if (tipVisualWidth > 2) { 
             drawScaledRect(ctx, topTipDrawX + 1, topTipDrawY, tipVisualWidth - 2, 1, palette.base, DISPLAY_SCALE); 
             drawScaledRect(ctx, topTipDrawX + 1, topTipDrawY + tipVisualHeight -1 , tipVisualWidth - 2, 1, palette.base, DISPLAY_SCALE); 
        }
    } else { 
        drawScaledRect(ctx, topTipDrawX, topTipDrawY, tipVisualWidth, tipVisualHeight, palette.shadow, DISPLAY_SCALE);
    }

    // Bottom Tip
    const bottomTipY = centerY + halfLength;
    const bottomTipDrawX = centerX - Math.floor(tipVisualWidth / 2);
    const bottomTipDrawY = bottomTipY - Math.floor(tipVisualHeight / 2) + (tipVisualHeight > 1 && tipStyle !== 'nocked' ? 1:0); 

    if (tipStyle === 'nocked') {
        drawScaledRect(ctx, bottomTipDrawX, bottomTipDrawY, 1, tipVisualHeight, palette.outline || limbShadowColor, DISPLAY_SCALE);
        drawScaledRect(ctx, bottomTipDrawX + tipVisualWidth - 1, bottomTipDrawY, 1, tipVisualHeight, palette.outline || limbShadowColor, DISPLAY_SCALE);
        if (tipVisualWidth > 2) {
            drawScaledRect(ctx, bottomTipDrawX + 1, bottomTipDrawY, tipVisualWidth - 2, 1, palette.base, DISPLAY_SCALE);
            drawScaledRect(ctx, bottomTipDrawX + 1, bottomTipDrawY + tipVisualHeight -1, tipVisualWidth - 2, 1, palette.base, DISPLAY_SCALE);
        }
    } else { 
        drawScaledRect(ctx, bottomTipDrawX, bottomTipDrawY, tipVisualWidth, tipVisualHeight, palette.shadow, DISPLAY_SCALE);
    }
}

function drawBowGrip(ctx, gripDetails, centerX, centerY) {
    const {
        logicalLength,
        logicalThickness,
        palette,
        hasWrapping,
        wrappingPalette
    } = gripDetails;

    const gripStartY = centerY - Math.floor(logicalLength / 2);
    const gripDrawX = centerX - Math.floor(logicalThickness / 2);

    for (let i = 0; i < logicalLength; i++) {
        const y = gripStartY + i;
        let mainColor = palette.base;
        let highColor = palette.highlight;
        let shadColor = palette.shadow;

        if (hasWrapping && wrappingPalette) {
            mainColor = wrappingPalette.base;
            highColor = wrappingPalette.highlight;
            shadColor = wrappingPalette.shadow;
        }

        drawScaledRect(ctx, gripDrawX, y, logicalThickness, 1, mainColor, DISPLAY_SCALE);
        if (hasWrapping && i % 2 === 0) {
            drawScaledRect(ctx, gripDrawX, y, logicalThickness, 1, shadColor, DISPLAY_SCALE);
        } else {
            if (logicalThickness > 1) {
                drawScaledRect(ctx, gripDrawX, y, 1, 1, highColor, DISPLAY_SCALE);
                drawScaledRect(ctx, gripDrawX + logicalThickness - 1, y, 1, 1, shadColor, DISPLAY_SCALE);
            } else {
                 drawScaledRect(ctx, gripDrawX, y, 1, 1, highColor, DISPLAY_SCALE);
            }
        }
    }
}

function drawBowString(ctx, stringDetails, bowCenterY, bowHalfLength, stringDrawX) {
    const { palette, thickness } = stringDetails;
    const stringColor = palette.base;

    const topStringY = bowCenterY - bowHalfLength;
    const bottomStringY = bowCenterY + bowHalfLength;

    for (let y = topStringY; y <= bottomStringY; y++) {
        drawScaledRect(ctx, stringDrawX - Math.floor(thickness / 2), y, thickness, 1, stringColor, DISPLAY_SCALE);
    }

    const nockingPointY = bowCenterY;
    const nockWidth = thickness + 2; 
    const nockX = stringDrawX - Math.floor(nockWidth / 2);
    drawScaledRect(ctx, nockX, nockingPointY - 1, nockWidth, 3, palette.shadow, DISPLAY_SCALE);
}

function drawArrow(ctx, arrowDetails, startX, startY) {
    const { shaftLength, shaftPalette, arrowheadShape, arrowheadPalette, fletchingStyle, fletchingPalette } = arrowDetails;
    const shaftThickness = 1;

    // Draw Shaft
    for (let i = 0; i < shaftLength; i++) {
        drawScaledRect(ctx, startX, startY + i, shaftThickness, 1, shaftPalette.base, DISPLAY_SCALE);
        if (i % 5 === 0) { 
             drawScaledRect(ctx, startX, startY + i, shaftThickness, 1, shaftPalette.highlight, DISPLAY_SCALE);
        }
    }

    // Draw Arrowhead at top (startY)
    const arrowheadLength = getRandomInt(3, 5);
    const arrowheadWidth = getRandomInt(2, 3); 
    const arrowheadBaseY = startY;

    if (arrowheadShape === 'triangle') {
        for (let i = 0; i < arrowheadLength; i++) {
            const currentWidth = Math.max(1, Math.ceil(arrowheadWidth * (1 - i / (arrowheadLength -1 || 1) ) ) );
            const currentX = startX + Math.floor(shaftThickness/2) - Math.floor(currentWidth / 2);
            drawScaledRect(ctx, currentX, arrowheadBaseY - arrowheadLength + i, currentWidth, 1, arrowheadPalette.base, DISPLAY_SCALE);
            if (i === 0 && currentWidth > 0) { 
                 drawScaledRect(ctx, currentX + Math.floor(currentWidth/2), arrowheadBaseY - arrowheadLength + i, 1, 1, arrowheadPalette.highlight, DISPLAY_SCALE);
            }
        }
    } else if (arrowheadShape === 'leaf') {
        for (let i = 0; i < arrowheadLength; i++) {
            const progress = i / (arrowheadLength -1 || 1);
            const currentWidth = Math.max(1, Math.ceil(arrowheadWidth * Math.sin(progress * Math.PI))); 
            const currentX = startX + Math.floor(shaftThickness/2) - Math.floor(currentWidth / 2);
            drawScaledRect(ctx, currentX, arrowheadBaseY - arrowheadLength + i, currentWidth, 1, arrowheadPalette.base, DISPLAY_SCALE);
             if (i < Math.floor(arrowheadLength/2) && currentWidth > 0) {
                 drawScaledRect(ctx, currentX, arrowheadBaseY - arrowheadLength + i, 1, 1, arrowheadPalette.highlight, DISPLAY_SCALE);
             }
        }
    } 

    // Draw Fletching at bottom
    const fletchingLength = getRandomInt(5, 8);
    const fletchingStartY = startY + shaftLength - fletchingLength;
    const fletchingWidthPerSide = getRandomInt(1, 2); 

    if (fletchingStyle === 'classic_angled') {
        for (let i = 0; i < fletchingLength; i++) {
            const angleOffset = Math.floor(i * 0.3); 
            drawScaledRect(ctx, startX - fletchingWidthPerSide + angleOffset, fletchingStartY + i, fletchingWidthPerSide, 1, fletchingPalette.base, DISPLAY_SCALE);
            drawScaledRect(ctx, startX + shaftThickness - angleOffset, fletchingStartY + i, fletchingWidthPerSide, 1, fletchingPalette.base, DISPLAY_SCALE);
        }
    } else { // straight fletching
         for (let i = 0; i < fletchingLength; i++) {
            drawScaledRect(ctx, startX - fletchingWidthPerSide, fletchingStartY + i, fletchingWidthPerSide, 1, fletchingPalette.base, DISPLAY_SCALE);
            drawScaledRect(ctx, startX + shaftThickness, fletchingStartY + i, fletchingWidthPerSide, 1, fletchingPalette.base, DISPLAY_SCALE);
        }
    }
}

/**
 * Generates a procedural bow.
 * @param {object} options - Options for generation, may include 'subType'.
 */
export function generateBow(options = {}) {
    console.log("generateBow called with options:", options);

    const offscreenCanvas = document.createElement('canvas');
    offscreenCanvas.width = CANVAS_WIDTH;
    offscreenCanvas.height = CANVAS_HEIGHT;
    const ctx = offscreenCanvas.getContext('2d');

    if (!ctx) {
        console.error("Failed to get 2D context for offscreen canvas in generateBow.");
        return { type: 'bow', name: 'Error Bow', seed: Date.now(), itemData: { error: "Canvas context failed" }, imageDataUrl: createErrorDataURL("CTX Fail") };
    }
    ctx.imageSmoothingEnabled = false;
    ctx.clearRect(0, 0, CANVAS_WIDTH, CANVAS_HEIGHT);

    // MODIFIED: Determine bowType based on options.subType
    let bowType;
    const defaultBowTypes = ['longbow', 'shortbow', 'recurve'];
    if (options.subType && defaultBowTypes.includes(options.subType)) {
        bowType = options.subType;
    } else {
        bowType = getRandomElement(defaultBowTypes);
        if (options.subType) console.warn(`Unknown bow subType: ${options.subType}. Defaulting to random: ${bowType}`);
    }

    const bowFrameMaterials = ['WOOD', 'BONE', 'DARK_STEEL', 'OBSIDIAN', 'ENCHANTED', 'RED_PAINT', 'BLUE_PAINT'];
    const mainMaterialName = getRandomElement(bowFrameMaterials);
    const mainPalette = getPalette(mainMaterialName);

    let bowLogicalLength, limbMaxCurve, limbBaseThickness;
    if (bowType === 'longbow') {
        bowLogicalLength = getRandomInt(LOGICAL_GRID_HEIGHT * 0.7, LOGICAL_GRID_HEIGHT - CANVAS_PADDING * 2.5);
        limbMaxCurve = getRandomInt(5, 8); 
        limbBaseThickness = getRandomInt(2, 3);
    } else if (bowType === 'shortbow') {
        bowLogicalLength = getRandomInt(LOGICAL_GRID_HEIGHT * 0.45, LOGICAL_GRID_HEIGHT * 0.65);
        limbMaxCurve = getRandomInt(7, 11); 
        limbBaseThickness = getRandomInt(2, 4);
    } else { // recurve
        bowLogicalLength = getRandomInt(LOGICAL_GRID_HEIGHT * 0.55, LOGICAL_GRID_HEIGHT * 0.75);
        limbMaxCurve = getRandomInt(8, 13); 
        limbBaseThickness = getRandomInt(2, 3);
    }

    const gripLogicalLength = Math.floor(bowLogicalLength * getRandomInRange(0.15, 0.25));
    const gripLogicalThickness = limbBaseThickness + getRandomInt(1, 2);
    const hasWrapping = Math.random() < 0.6;
    
    let gripMaterialName = mainMaterialName;
    let gripPalette = mainPalette;
    let wrappingMaterialName = null;
    let wrappingPalette = null;

    if (hasWrapping) {
        const wrapMaterialOptions = ['LEATHER', 'ENCHANTED', 'IRON', 'STEEL'];
        wrappingMaterialName = getRandomElement(wrapMaterialOptions);
        wrappingPalette = getPalette(wrappingMaterialName);
        gripMaterialName = wrappingMaterialName; 
    } else {
        if (Math.random() < 0.3 && mainMaterialName !== 'DARK_STEEL' && mainMaterialName !== 'OBSIDIAN') {
            const reinforcedGripMaterials = ['IRON', 'STEEL', 'BRONZE'];
            gripMaterialName = getRandomElement(reinforcedGripMaterials);
            gripPalette = getPalette(gripMaterialName);
        }
    }
    
    const stringMaterialOptions = ['LEATHER', 'SILVER', 'IRON', 'BLACK_PAINT'];
    const stringMaterialName = getRandomElement(stringMaterialOptions);
    const stringPalette = getPalette(stringMaterialName);
    const stringThickness = 1;

    const tipStyles = ['simple', 'nocked'];
    const limbTipStyle = getRandomElement(tipStyles);


    const bowCenterX = Math.floor(LOGICAL_GRID_WIDTH / 3); 
    const bowCenterY = Math.floor(LOGICAL_GRID_HEIGHT / 2);
    const bowHalfLength = Math.floor(bowLogicalLength / 2);
    
    const limbDetails = {
        type: bowType,
        logicalLength: bowLogicalLength,
        maxCurve: limbMaxCurve,
        limbThickness: limbBaseThickness,
        palette: mainPalette,
        tipStyle: limbTipStyle
    };
    
    const stringDetails = {
        palette: stringPalette,
        thickness: stringThickness
    };
    drawBowString(ctx, stringDetails, bowCenterY, bowHalfLength, bowCenterX);

    drawBowLimbs(ctx, limbDetails, bowCenterX, bowCenterY, 'vertical');

    const gripDetails = {
        logicalLength: gripLogicalLength,
        logicalThickness: gripLogicalThickness,
        palette: gripPalette,
        hasWrapping,
        wrappingPalette
    };
    drawBowGrip(ctx, gripDetails, bowCenterX, bowCenterY);

    const hasArrow = true; 
    let arrowData = null;
    if (hasArrow) {
        const arrowShaftMaterialName = getRandomElement(['WOOD', 'BONE']);
        const arrowShaftPalette = getPalette(arrowShaftMaterialName); 
        const arrowheadMaterialName = getRandomElement(['IRON', 'STEEL', 'OBSIDIAN', 'BRONZE']);
        const arrowheadPalette = getPalette(arrowheadMaterialName);
        const arrowheadShapes = ['triangle', 'leaf']; 
        const arrowheadShape = getRandomElement(arrowheadShapes);
        
        const fletchingMaterials = ['WHITE_PAINT', 'RED_PAINT', 'BLUE_PAINT', 'GREEN_PAINT', 'LEATHER']; 
        const fletchingMaterialName = getRandomElement(fletchingMaterials); 
        const fletchingPalette = getPalette(fletchingMaterialName);
        const fletchingStyles = ['classic_angled', 'straight'];
        const fletchingStyle = getRandomElement(fletchingStyles);

        const arrowShaftLength = Math.floor(bowLogicalLength * getRandomInRange(0.65, 0.75));
        const arrowDrawX = bowCenterX + limbMaxCurve + ARROW_OFFSET_X; 
        const arrowDrawY = bowCenterY - Math.floor(arrowShaftLength / 2); 

        const arrowDetailsToDraw = {
            shaftLength: arrowShaftLength,
            shaftPalette: arrowShaftPalette, 
            arrowheadShape,
            arrowheadPalette,
            fletchingStyle,
            fletchingPalette
        };
        drawArrow(ctx, arrowDetailsToDraw, arrowDrawX, arrowDrawY);
        arrowData = {
            shaftMaterial: arrowShaftMaterialName.toLowerCase(),
            arrowheadMaterial: arrowheadMaterialName.toLowerCase(),
            arrowheadShape,
            fletchingMaterial: fletchingMaterialName.toLowerCase(), 
            fletchingStyle
        };
    }

    // MODIFIED: Item Naming to reflect sub-type
    let subTypeNameForDisplay = bowType.replace(/_/g, ' ');
    subTypeNameForDisplay = subTypeNameForDisplay.split(' ').map(word => word.charAt(0).toUpperCase() + word.slice(1)).join(' ');

    let itemName = `${mainMaterialName} ${subTypeNameForDisplay}`;
    if (limbTipStyle === 'nocked') itemName += ` (Nocked)`;
    if (hasWrapping && wrappingMaterialName) {
        itemName += ` with ${wrappingMaterialName.replace('_', ' ')} Grip`;
    } else if (gripMaterialName !== mainMaterialName) {
        itemName += ` with ${gripMaterialName.replace('_', ' ')} Grip`;
    }
    itemName += " & Arrow";
    
    const itemSeed = options.seed || Date.now();

    const generatedItemData = {
        type: 'bow',
        name: itemName,
        seed: itemSeed,
        itemData: {
            bowType, // Actual type used
            subType: options.subType || bowType, // Store selected subType
            material: mainMaterialName.toLowerCase(),
            length: bowLogicalLength,
            curve: limbMaxCurve,
            limbThickness: limbBaseThickness,
            tipStyle: limbTipStyle,
            colors: mainPalette,
            grip: {
                length: gripLogicalLength,
                thickness: gripLogicalThickness,
                material: gripMaterialName.toLowerCase(),
                colors: hasWrapping ? wrappingPalette : gripPalette,
            },
            string: {
                material: stringMaterialName.toLowerCase(),
                colors: stringPalette,
                thickness: stringThickness
            },
            arrow: arrowData 
        },
        imageDataUrl: offscreenCanvas.toDataURL()
    };

    console.log("Bow generated:", generatedItemData.name);
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

console.log("js/generators/bow_generator.js loaded with arrow generation and more variety.");
