/**
 * js/generators/book_generator.js
 * Contains the logic for procedurally generating books.
 */

import { getRandomInt, getRandomElement, drawScaledRect, getRandomInRange } from '../utils.js';
import { getPalette, MATERIAL_PALETTES } from '../palettes/material_palettes.js';

// --- Constants specific to book generation or drawing ---
const LOGICAL_GRID_WIDTH = 64;
const LOGICAL_GRID_HEIGHT = 64;
const DISPLAY_SCALE = 4;
const CANVAS_WIDTH = LOGICAL_GRID_WIDTH * DISPLAY_SCALE;   // 256
const CANVAS_HEIGHT = LOGICAL_GRID_HEIGHT * DISPLAY_SCALE; // 256
const CANVAS_PADDING = 4; // Logical padding

// --- Internal helper functions for drawing book components ---

/**
 * Draws the book cover (always closed).
 * @param {CanvasRenderingContext2D} ctx - The drawing context.
 * @param {object} coverDetails - Properties like width, height, palette, perspective.
 * @param {number} bookTopLeftX - Logical X for the top-left of the book's bounding box.
 * @param {number} bookTopLeftY - Logical Y for the top-left of the book's bounding box.
 */
function drawBookCover(ctx, coverDetails, bookTopLeftX, bookTopLeftY) {
    const {
        logicalWidth,
        logicalHeight,
        coverPalette,
        spinePalette,
        pagePalette,
        perspectiveAngle
    } = coverDetails;

    const spineActualWidth = perspectiveAngle > 0 ? Math.max(3, Math.floor(logicalWidth * 0.15)) : 0;
    const coverPanelActualWidth = logicalWidth - spineActualWidth;
    const frontCoverX = bookTopLeftX + spineActualWidth;

    // Draw Spine (if angled view)
    if (perspectiveAngle > 0 && spineActualWidth > 0) {
        drawScaledRect(ctx, bookTopLeftX, bookTopLeftY, spineActualWidth, logicalHeight, spinePalette.base, DISPLAY_SCALE);
        // Spine shading
        drawScaledRect(ctx, bookTopLeftX, bookTopLeftY, 1, logicalHeight, spinePalette.highlight, DISPLAY_SCALE);
        drawScaledRect(ctx, bookTopLeftX + spineActualWidth -1, bookTopLeftY, 1, logicalHeight, spinePalette.shadow, DISPLAY_SCALE);
    }

    // Draw Front Cover
    drawScaledRect(ctx, frontCoverX, bookTopLeftY, coverPanelActualWidth, logicalHeight, coverPalette.base, DISPLAY_SCALE);
    // Cover shading
    drawScaledRect(ctx, frontCoverX, bookTopLeftY, coverPanelActualWidth, 1, coverPalette.highlight, DISPLAY_SCALE); // Top edge
    drawScaledRect(ctx, frontCoverX, bookTopLeftY + logicalHeight - 1, coverPanelActualWidth, 1, coverPalette.shadow, DISPLAY_SCALE); // Bottom edge
    if (perspectiveAngle === 0) { // If flat, show left edge highlight of front cover
         drawScaledRect(ctx, frontCoverX, bookTopLeftY + 1, 1, logicalHeight - 2, coverPalette.highlight, DISPLAY_SCALE);
    }
    drawScaledRect(ctx, frontCoverX + coverPanelActualWidth - 1, bookTopLeftY + 1, 1, logicalHeight - 2, coverPalette.shadow, DISPLAY_SCALE); // Right edge


    // Draw Page Edges (visible side of closed book)
    const pageEdgeThickness = Math.max(2, Math.floor(spineActualWidth > 0 ? spineActualWidth * 0.8 : logicalWidth * 0.08));
    const pageEdgeX = frontCoverX + coverPanelActualWidth;
    const pageEdgeY = bookTopLeftY + 2;
    const pageEdgeHeight = logicalHeight - 4;

    if (pagePalette && pageEdgeHeight > 0 && pageEdgeThickness > 0) {
        for (let i = 0; i < pageEdgeThickness; i++) {
             let currentX = pageEdgeX + i;
             drawScaledRect(ctx, currentX, pageEdgeY, 1, pageEdgeHeight, pagePalette.base, DISPLAY_SCALE);
             if (i === 0) drawScaledRect(ctx, currentX, pageEdgeY, 1, pageEdgeHeight, pagePalette.highlight, DISPLAY_SCALE);
             if (i === pageEdgeThickness -1 && pageEdgeThickness > 1) drawScaledRect(ctx, currentX, pageEdgeY, 1, pageEdgeHeight, pagePalette.shadow, DISPLAY_SCALE);
        }
        for (let y = 0; y < pageEdgeHeight; y += getRandomInt(3,5)) {
            drawScaledRect(ctx, pageEdgeX , pageEdgeY + y, pageEdgeThickness, 1, pagePalette.shadow, DISPLAY_SCALE);
        }
    }
}

/**
 * Draws decorations on the book cover or spine.
 */
function drawCoverDecoration(ctx, decorationDetails, areaX, areaY, areaW, areaH, isSpine = false) {
    const { type, palette, symbolShape, cornerStyle, claspStyle } = decorationDetails;
    const centerX = areaX + Math.floor(areaW / 2);
    const centerY = areaY + Math.floor(areaH / 2);

    if (type === 'central_symbol' && symbolShape && palette) {
        const symbolSizeBase = Math.min(areaW, areaH) * (isSpine ? 0.70 : 0.50); // Adjusted sizes
        const symbolSize = Math.max(6, Math.floor(symbolSizeBase)); // Ensure a minimum visible size

        if (symbolShape === 'circle') {
            const radius = Math.floor(symbolSize / 2);
            for (let dy = -radius; dy <= radius; dy++) {
                for (let dx = -radius; dx <= radius; dx++) {
                    if (dx * dx + dy * dy <= radius * radius) {
                        let color = palette.base;
                        if (dx*dx+dy*dy > (radius-1)*(radius-1)*0.6 && dx+dy < 0) color = palette.highlight;
                        else if (dx*dx+dy*dy > (radius-1)*(radius-1)*0.6) color = palette.shadow;
                        else if (dx*dx+dy*dy < (radius*0.3)*(radius*0.3) && radius > 3) color = palette.highlight;
                        drawScaledRect(ctx, centerX + dx, centerY + dy, 1, 1, color, DISPLAY_SCALE);
                    }
                }
            }
        } else if (symbolShape === 'diamond') {
            const halfH = Math.floor(symbolSize / 2);
            const halfW = Math.floor(symbolSize / (isSpine ? 1.7 : 1.4));
            for(let yR = -halfH; yR <= halfH; yR++) {
                const progY = Math.abs(yR) / (halfH||1);
                const cW = Math.max(1, Math.floor(halfW * 2 * (1-progY)));
                const sX = centerX - Math.floor(cW/2);
                for(let xR = 0; xR < cW; xR++) {
                    let color = palette.base;
                    if (yR < -halfH*0.25 && xR > cW*0.2 && xR < cW*0.8) color = palette.highlight;
                    else if (yR > halfH*0.25 && xR > cW*0.2 && xR < cW*0.8) color = palette.shadow;
                    else if (xR < cW*0.25 || (xR > cW*0.75 && cW >1)) color = palette.highlight;
                    drawScaledRect(ctx, sX + xR, centerY + yR, 1, 1, color, DISPLAY_SCALE);
                }
            }
        } else if (symbolShape === 'star') {
            const rOuter = Math.floor(symbolSize / 2);
            const rInner = Math.floor(rOuter * 0.4);
            const points = [];
            ctx.fillStyle = palette.base;
            ctx.beginPath();
            for (let i = 0; i < 5; i++) {
                // Outer point
                let xOuter = centerX + Math.round(rOuter * Math.cos(Math.PI/2.5 * i - Math.PI/2));
                let yOuter = centerY + Math.round(rOuter * Math.sin(Math.PI/2.5 * i - Math.PI/2));
                if (i === 0) ctx.moveTo(xOuter * DISPLAY_SCALE, yOuter * DISPLAY_SCALE);
                else ctx.lineTo(xOuter * DISPLAY_SCALE, yOuter * DISPLAY_SCALE);

                // Inner point
                let xInner = centerX + Math.round(rInner * Math.cos(Math.PI/2.5 * (i + 0.5) - Math.PI/2));
                let yInner = centerY + Math.round(rInner * Math.sin(Math.PI/2.5 * (i + 0.5) - Math.PI/2));
                ctx.lineTo(xInner * DISPLAY_SCALE, yInner * DISPLAY_SCALE);
            }
            ctx.closePath();
            ctx.fill();
            // Highlight top point
            let topPointX = centerX + Math.round(rOuter * Math.cos(-Math.PI/2));
            let topPointY = centerY + Math.round(rOuter * Math.sin(-Math.PI/2));
            drawScaledRect(ctx, topPointX, topPointY-1, 1, 2, palette.highlight, DISPLAY_SCALE);


        } else if (symbolShape === 'spiral') {
            let r = 0; let a = 0;
            const maxR = symbolSize / 1.8;
            const thickness = isSpine ? 1 : Math.max(1, Math.floor(symbolSize/10));
            for(let i=0; i< symbolSize * 3.5; i++){ // More iterations for a fuller spiral
                r = maxR * 0.05 * a; // Adjust growth rate
                const x = centerX + Math.round(r * Math.cos(a));
                const y = centerY + Math.round(r * Math.sin(a));
                if (r < maxR) {
                    drawScaledRect(ctx, x-Math.floor(thickness/2),y-Math.floor(thickness/2),thickness,thickness,palette.base,DISPLAY_SCALE);
                    if(i%8 < 2) drawScaledRect(ctx, x,y,1,1,palette.highlight,DISPLAY_SCALE);
                }
                a += 0.1; // Adjust angle step
            }
        } else if (symbolShape === 'eye') {
            const eyeW = Math.floor(symbolSize * 0.95);
            const eyeH = Math.floor(symbolSize * 0.6);
            for(let xRel = -Math.floor(eyeW/2); xRel <= Math.floor(eyeW/2); xRel++) {
                const yLimit = Math.floor(eyeH/2 * Math.sqrt(1 - (xRel*xRel) / ((eyeW/2)*(eyeW/2) || 1) ) );
                drawScaledRect(ctx, centerX + xRel, centerY - yLimit, 1, 1, palette.base, DISPLAY_SCALE);
                drawScaledRect(ctx, centerX + xRel, centerY + yLimit, 1, 1, palette.base, DISPLAY_SCALE);
                 if(xRel === -Math.floor(eyeW/2) || xRel === Math.floor(eyeW/2)) {
                    drawScaledRect(ctx, centerX + xRel, centerY, 1, 1, palette.highlight, DISPLAY_SCALE);
                 }
            }
            const pupilW = Math.floor(eyeW * 0.35);
            const pupilH = Math.floor(eyeH * 0.75);
            const pupilPalette = getPalette(getRandomElement(['OBSIDIAN', 'GEM_RED', 'GEM_BLUE', 'ENCHANTED', 'GEM_PURPLE']));
            for (let dy = -Math.floor(pupilH/2); dy <= Math.floor(pupilH/2); dy++) {
                for (let dx = -Math.floor(pupilW/2); dx <= Math.floor(pupilW/2); dx++) {
                     if ((dx * dx) / ((pupilW/2)*(pupilW/2)||1) + (dy*dy)/((pupilH/2)*(pupilH/2)||1) <=1)
                        drawScaledRect(ctx, centerX + dx, centerY + dy, 1, 1, pupilPalette.base, DISPLAY_SCALE);
                }
            }
             drawScaledRect(ctx, centerX, centerY - Math.floor(pupilH/2) +1, 1, 1, pupilPalette.highlight, DISPLAY_SCALE);
        } else if (symbolShape === 'single_rune') {
            const runeSize = Math.max(8, symbolSize);
            const rx = centerX - Math.floor(runeSize/2);
            const ry = centerY - Math.floor(runeSize/2);
            const runeType = getRandomInt(1,5);
            const runeThickness = isSpine ? 2 : 3; // Thicker runes
             if (runeType === 1) { /* F */ drawScaledRect(ctx, rx, ry, runeThickness, runeSize, palette.base, DISPLAY_SCALE); drawScaledRect(ctx, rx + runeThickness, ry, runeSize-runeThickness, runeThickness, palette.base, DISPLAY_SCALE); drawScaledRect(ctx, rx + runeThickness, ry + Math.floor(runeSize/2)-Math.floor(runeThickness/2), runeSize-(runeThickness*1.5), runeThickness, palette.base, DISPLAY_SCALE);}
             else if (runeType === 2) { /* P */ drawScaledRect(ctx, rx, ry, runeThickness, runeSize, palette.base, DISPLAY_SCALE); drawScaledRect(ctx, rx+runeThickness, ry, runeSize-runeThickness, Math.floor(runeSize/2), palette.base, DISPLAY_SCALE); drawScaledRect(ctx, rx+runeThickness, ry+Math.floor(runeSize/2)-runeThickness, runeSize-runeThickness, runeThickness, palette.base, DISPLAY_SCALE);}
             else if (runeType === 3) { /* Triangle */ for (let y = 0; y < runeSize; y+=runeThickness-1) { const cW = Math.max(runeThickness, Math.floor(runeSize * (y / (runeSize -1||1)) )); drawScaledRect(ctx, rx + Math.floor((runeSize - cW)/2) , ry + y, cW, runeThickness, palette.base, DISPLAY_SCALE);}}
             else if (runeType === 4) { /* X */ for (let k = 0; k < runeSize; k++) { drawScaledRect(ctx, rx + k, ry + k, runeThickness, runeThickness, palette.base, DISPLAY_SCALE); drawScaledRect(ctx, rx + k, ry + runeSize - runeThickness - k, runeThickness, runeThickness, palette.base, DISPLAY_SCALE);}}
             else { /* Z */ drawScaledRect(ctx, rx, ry, runeSize, runeThickness, palette.base, DISPLAY_SCALE); drawScaledRect(ctx, rx, ry + runeSize -runeThickness, runeSize, runeThickness, palette.base, DISPLAY_SCALE); for (let k = 0; k < runeSize-runeThickness+1; k++) { drawScaledRect(ctx, rx + k, ry + runeSize - runeThickness - k, runeThickness, runeThickness, palette.base, DISPLAY_SCALE);}}
        } else if (symbolShape === 'magic_circle_symbol') {
            const rOuter = Math.floor(symbolSize / 2);
            const rInner = Math.floor(rOuter * 0.6);
            const rCore = Math.floor(rInner * 0.5);
            const circleThickness = isSpine ? 1 : 2;
             for (let yR = -rOuter; yR <= rOuter; yR++) {
                for (let xR = -rOuter; xR <= rOuter; xR++) {
                    const distSq = xR * xR + yR * yR;
                    if ((distSq <= rOuter * rOuter && distSq > (rOuter - circleThickness) * (rOuter - circleThickness)) ||
                        (distSq <= rInner * rInner && distSq > (rInner - circleThickness) * (rInner - circleThickness)) ||
                        (rCore > 0 && distSq <= rCore * rCore && distSq > (rCore-1)*(rCore-1) )) { // Core is solid or a thick dot
                        drawScaledRect(ctx, centerX + xR, centerY + yR, 1, 1, palette.base, DISPLAY_SCALE);
                    }
                }
            }
            // Add small radiating ticks
            for(let i=0; i<8; i++){
                const angle = i * Math.PI / 4;
                const tickStartX = centerX + Math.round(rOuter * Math.cos(angle));
                const tickStartY = centerY + Math.round(rOuter * Math.sin(angle));
                const tickEndX = centerX + Math.round((rOuter + (isSpine?1:2)) * Math.cos(angle));
                const tickEndY = centerY + Math.round((rOuter + (isSpine?1:2)) * Math.sin(angle));
                // Simple line draw for tick
                drawScaledRect(ctx, tickStartX, tickStartY, tickEndX-tickStartX+1, tickEndY-tickStartY+1, palette.base, DISPLAY_SCALE);
            }
        } else if (symbolShape === 'runes_cluster_symbol') {
            const numRunes = getRandomInt(isSpine? 2:3, isSpine ? 3: 5); // More runes in cluster
            const individualRuneSize = Math.max(3,Math.floor(symbolSize / (isSpine ? 2.8 : 2.2)));
            for(let i=0; i<numRunes; i++){
                const angle = (i * 2 * Math.PI / numRunes) + getRandomInRange(-0.2, 0.2) + (isSpine ? Math.PI/2 : 0);
                const radiusOffset = individualRuneSize * (isSpine ? 0.5 : 0.7);
                const runeOffsetX = Math.round(radiusOffset * Math.cos(angle));
                const runeOffsetY = Math.round(radiusOffset * Math.sin(angle));
                const rx = centerX + runeOffsetX - Math.floor(individualRuneSize/2);
                const ry = centerY + runeOffsetY - Math.floor(individualRuneSize/2);
                const rt = getRandomInt(1,4); // Use more varied simple runes
                const rThick = isSpine ? 1: Math.max(1, Math.floor(individualRuneSize/4));
                if(rt === 1) {drawScaledRect(ctx,rx,ry,rThick,individualRuneSize,palette.base,DISPLAY_SCALE); drawScaledRect(ctx,rx+rThick,ry,individualRuneSize-rThick,rThick,palette.base,DISPLAY_SCALE);}
                else if(rt === 2) {for(let k=0; k<individualRuneSize; k+=rThick) drawScaledRect(ctx,rx+k,ry+k,rThick,rThick,palette.base,DISPLAY_SCALE);}
                else if(rt === 3) {drawScaledRect(ctx,rx,ry,individualRuneSize,rThick,palette.base,DISPLAY_SCALE); drawScaledRect(ctx,rx+Math.floor(individualRuneSize/2)-Math.floor(rThick/2),ry+rThick,rThick,individualRuneSize-rThick,palette.base,DISPLAY_SCALE);}
                else {drawScaledRect(ctx,rx,ry,rThick,rThick,palette.base,DISPLAY_SCALE); drawScaledRect(ctx,rx+individualRuneSize-rThick,ry,rThick,rThick,palette.base,DISPLAY_SCALE); drawScaledRect(ctx,rx,ry+individualRuneSize-rThick,rThick,rThick,palette.base,DISPLAY_SCALE); drawScaledRect(ctx,rx+individualRuneSize-rThick,ry+individualRuneSize-rThick,rThick,rThick,palette.base,DISPLAY_SCALE);}
            }
        } else if (symbolShape === 'arcane_scribbles_symbol') {
            const density = isSpine ? 4: 7; // Denser scribbles
            const scribbleAreaSize = symbolSize * 0.8;
            for(let i=0; i < symbolSize * density; i++) {
                const angle = getRandomInRange(0, 2*Math.PI);
                const radius = getRandomInRange(0, scribbleAreaSize/2);
                const x = centerX + Math.round(radius * Math.cos(angle));
                const y = centerY + Math.round(radius * Math.sin(angle));
                if (Math.abs(x-centerX) < areaW/2 && Math.abs(y-centerY) < areaH/2)
                    drawScaledRect(ctx, x,y,1,1,palette.shadow,DISPLAY_SCALE);
            }
        }


    } else if (type === 'corner_accents' && cornerStyle && palette && !isSpine) {
        const cornerSizeBase = Math.min(areaW, areaH) * 0.25;
        const cs = Math.max(4, Math.floor(cornerSizeBase));

        drawScaledRect(ctx, areaX, areaY, cs, cs, palette.base, DISPLAY_SCALE);
        drawScaledRect(ctx, areaX, areaY, cs, 1, palette.highlight, DISPLAY_SCALE);
        drawScaledRect(ctx, areaX, areaY, 1, cs, palette.highlight, DISPLAY_SCALE);
        drawScaledRect(ctx, areaX + areaW - cs, areaY, cs, cs, palette.base, DISPLAY_SCALE);
        drawScaledRect(ctx, areaX + areaW - cs, areaY, cs, 1, palette.highlight, DISPLAY_SCALE);
        drawScaledRect(ctx, areaX + areaW - 1, areaY, 1, cs, palette.shadow, DISPLAY_SCALE);
        drawScaledRect(ctx, areaX, areaY + areaH - cs, cs, cs, palette.base, DISPLAY_SCALE);
        drawScaledRect(ctx, areaX, areaY + areaH -cs, 1, cs, palette.highlight, DISPLAY_SCALE);
        drawScaledRect(ctx, areaX, areaY + areaH -1, cs, 1, palette.shadow, DISPLAY_SCALE);
        drawScaledRect(ctx, areaX + areaW - cs, areaY + areaH - cs, cs, cs, palette.base, DISPLAY_SCALE);
        drawScaledRect(ctx, areaX + areaW -cs, areaY + areaH -1, cs, 1, palette.shadow, DISPLAY_SCALE);
        drawScaledRect(ctx, areaX + areaW -1, areaY + areaH -cs, 1, cs, palette.shadow, DISPLAY_SCALE);

    } else if (type === 'border_frame' && palette && !isSpine) {
        const borderWidth = Math.max(3, Math.floor(Math.min(areaW, areaH) * 0.12));
        drawScaledRect(ctx, areaX, areaY, areaW, borderWidth, palette.base, DISPLAY_SCALE);
        drawScaledRect(ctx, areaX, areaY, areaW, 1, palette.highlight, DISPLAY_SCALE);
        drawScaledRect(ctx, areaX, areaY + areaH - borderWidth, areaW, borderWidth, palette.base, DISPLAY_SCALE);
        drawScaledRect(ctx, areaX, areaY + areaH -1, areaW, 1, palette.shadow, DISPLAY_SCALE);
        drawScaledRect(ctx, areaX, areaY + borderWidth, borderWidth, areaH - 2 * borderWidth, palette.base, DISPLAY_SCALE);
        drawScaledRect(ctx, areaX, areaY + borderWidth, 1, areaH - 2 * borderWidth, palette.highlight, DISPLAY_SCALE);
        drawScaledRect(ctx, areaX + areaW - borderWidth, areaY + borderWidth, borderWidth, areaH - 2 * borderWidth, palette.base, DISPLAY_SCALE);
        drawScaledRect(ctx, areaX + areaW -1, areaY + borderWidth, 1, areaH - 2 * borderWidth, palette.shadow, DISPLAY_SCALE);

    } else if (type === 'book_clasp' && claspStyle && palette && !isSpine) {
        const strapWidth = Math.max(4, Math.floor(areaH * 0.15));
        const strapY = centerY - Math.floor(strapWidth / 2) + getRandomInt(-Math.floor(areaH*0.1), Math.floor(areaH*0.1));
        const strapLength = Math.floor(areaW * 0.4);
        const strapStartX = areaX + areaW - strapLength - Math.floor(areaW*0.1);

        drawScaledRect(ctx, strapStartX, strapY, strapLength, strapWidth, palette.base, DISPLAY_SCALE);
        drawScaledRect(ctx, strapStartX, strapY, strapLength, 1, palette.highlight, DISPLAY_SCALE);
        drawScaledRect(ctx, strapStartX, strapY + strapWidth -1, strapLength, 1, palette.shadow, DISPLAY_SCALE);

        const claspSize = strapWidth + getRandomInt(3,5);
        const claspX = strapStartX - Math.floor(claspSize * 0.5);
        const claspY = strapY - Math.floor((claspSize - strapWidth)/2) ;

        drawScaledRect(ctx, claspX, claspY, claspSize, claspSize, palette.highlight, DISPLAY_SCALE);
        drawScaledRect(ctx, claspX+1, claspY+1, claspSize-2, claspSize-2, palette.base, DISPLAY_SCALE);
        drawScaledRect(ctx, claspX + Math.floor(claspSize/2)-1, claspY+1, Math.max(1,Math.floor(claspSize*0.2)), claspSize-2, palette.shadow, DISPLAY_SCALE);

    } else if (type === 'spine_details' && palette && isSpine) {
        const numBands = getRandomInt(3,6);
        const bandHeight = Math.max(2, Math.floor(areaH * 0.07));
        for(let i=0; i < numBands; i++) {
            const bandY = areaY + Math.floor(areaH * (0.05 + i * (0.9 / (numBands||1)) ) );
            drawScaledRect(ctx, areaX, bandY, areaW, bandHeight, palette.base, DISPLAY_SCALE);
            drawScaledRect(ctx, areaX, bandY, areaW, 1, palette.highlight, DISPLAY_SCALE);
            if(bandHeight > 1) drawScaledRect(ctx, areaX, bandY+bandHeight-1, areaW, 1, palette.shadow, DISPLAY_SCALE);
        }
        if (Math.random() < 0.7) {
            const plateHeight = Math.floor(areaH * getRandomInRange(0.2, 0.3));
            const plateWidth = Math.floor(areaW * getRandomInRange(0.65, 0.85));
            const plateX = centerX - Math.floor(plateWidth/2);
            const plateY = centerY - Math.floor(plateHeight/2) + getRandomInt(-Math.floor(areaH*0.15), Math.floor(areaH*0.15));
            const platePaletteName = getRandomElement(['LEATHER', 'DARK_STEEL', 'BRONZE', 'SILVER', 'GOLD']);
            const currentSpinePaletteName = palette ? palette.name : '';
            const finalPlatePalette = getPalette(platePaletteName === currentSpinePaletteName ? 'IRON' : platePaletteName);

            drawScaledRect(ctx, plateX, plateY, plateWidth, plateHeight, finalPlatePalette.base, DISPLAY_SCALE);
            drawScaledRect(ctx, plateX+1, plateY+1, plateWidth-2, plateHeight-2, finalPlatePalette.shadow, DISPLAY_SCALE);
            if (plateWidth > 4 && plateHeight > 3) {
                drawScaledRect(ctx, plateX+2, plateY + Math.floor(plateHeight/2), plateWidth-4, 1, finalPlatePalette.highlight, DISPLAY_SCALE);
            }
        }
    }
}


/**
 * Generates a procedural book.
 */
export function generateBook(options = {}) {
    console.log("generateBook called with options:", options);

    const offscreenCanvas = document.createElement('canvas');
    offscreenCanvas.width = CANVAS_WIDTH;
    offscreenCanvas.height = CANVAS_HEIGHT;
    const ctx = offscreenCanvas.getContext('2d');

    if (!ctx) {
        console.error("Failed to get 2D context for offscreen canvas in generateBook.");
        return { type: 'book', name: 'Error Book', seed: Date.now(), itemData: { error: "Canvas context failed" }, imageDataUrl: createErrorDataURL("CTX Fail") };
    }
    ctx.imageSmoothingEnabled = false;
    ctx.clearRect(0, 0, CANVAS_WIDTH, CANVAS_HEIGHT);

    const bookMaterials = ['LEATHER', 'WOOD', 'DARK_STEEL', 'OBSIDIAN', 'BONE', 'ENCHANTED', 'RED_PAINT', 'BLUE_PAINT', 'GREEN_PAINT', 'BLACK_PAINT', 'PURPLE_PAINT', 'IVORY'];
    const coverMaterialName = getRandomElement(bookMaterials);
    const coverPalette = getPalette(coverMaterialName);

    const spineMaterials = [coverMaterialName, 'LEATHER', 'DARK_STEEL', 'GOLD', 'SILVER', 'BRONZE'];
    const spineMaterialName = getRandomElement(spineMaterials);
    const spinePalette = getPalette(spineMaterialName);

    const pageColors = {
        'parchment': { name:'Parchment', base: '#F5EAAA', shadow: '#C1A978', highlight: '#FFF8DC' },
        'paper': { name:'Paper', base: '#FEFEFE', shadow: '#D8D8D8', highlight: '#FFFFFF' },
        'aged_paper': { name:'Aged Paper', base: '#FFFACD', shadow: '#E0D0A0', highlight: '#FFFFF0' },
    };
    const pageColorName = getRandomElement(Object.keys(pageColors));
    const pagePalette = pageColors[pageColorName];

    const perspectiveAngle = Math.random() < 0.75 ? getRandomInt(1,5) : 0;

    const bookLogicalHeight = getRandomInt(LOGICAL_GRID_HEIGHT * 0.7, LOGICAL_GRID_HEIGHT * 0.95);
    const bookLogicalWidth = getRandomInt(Math.floor(bookLogicalHeight * 0.55), Math.floor(bookLogicalHeight * 0.8));


    const decorationTypes = ['none', 'central_symbol', 'corner_accents', 'border_frame', 'book_clasp', 'spine_details'];
    let decorationType;
    // Increase chance of decoration
    if (Math.random() < 0.90) { // 90% chance to have some decoration
        decorationType = getRandomElement(decorationTypes.filter(d => d !== 'none'));
    } else {
        decorationType = 'none';
    }

    let secondaryDecorationType = 'none';

    if (perspectiveAngle > 0) {
        if (decorationType !== 'spine_details' && Math.random() < 0.7) { // Increased chance for secondary spine details
            secondaryDecorationType = 'spine_details';
        } else if (decorationType === 'none') {
            decorationType = 'spine_details';
        }
    } else {
        if (decorationType === 'spine_details') decorationType = 'none'; // No spine details if not angled
        if (secondaryDecorationType === 'spine_details') secondaryDecorationType = 'none'; // Also clear secondary if not angled
    }
    if (decorationType === 'book_clasp' && perspectiveAngle === 0 && Math.random() < 0.3) {
        // Reduce chance of clasp on flat books if another decor is present, or make it primary
        if(secondaryDecorationType !== 'none') decorationType = 'none';
    }


    let decorationPalette = null;
    let symbolShape = null;
    let cornerStyle = null;
    let claspStyle = null;
    let secondaryDecorationPalette = null;


    if (decorationType !== 'none') {
        const decorMaterials = ['GOLD', 'SILVER', 'BRONZE', 'OBSIDIAN', 'BONE', 'ENCHANTED', (coverMaterialName === 'LEATHER' ? 'STEEL' : 'LEATHER'), 'COPPER'];
        decorationPalette = getPalette(getRandomElement(decorMaterials));
        if (decorationType === 'central_symbol') {
            symbolShape = getRandomElement(['circle', 'diamond', 'star', 'spiral', 'eye', 'single_rune', 'magic_circle_symbol', 'runes_cluster_symbol', 'arcane_scribbles_symbol']);
        } else if (decorationType === 'corner_accents') {
            cornerStyle = getRandomElement(['metal_caps', 'flourish']);
        } else if (decorationType === 'book_clasp') {
            claspStyle = getRandomElement(['simple_strap', 'ornate_buckle']);
        }
    }
    if (secondaryDecorationType === 'spine_details') {
        const decorMaterialsSpine = ['GOLD', 'SILVER', 'BRONZE', (spineMaterialName === 'LEATHER' ? 'STEEL' : 'LEATHER')];
        secondaryDecorationPalette = getPalette(getRandomElement(decorMaterialsSpine));
    }


    const bookTopLeftX = CANVAS_PADDING + Math.floor((LOGICAL_GRID_WIDTH - bookLogicalWidth - CANVAS_PADDING*2) / 2);
    const bookTopLeftY = CANVAS_PADDING + Math.floor((LOGICAL_GRID_HEIGHT - bookLogicalHeight - CANVAS_PADDING*2) / 2);


    const coverDetails = {
        logicalWidth: bookLogicalWidth,
        logicalHeight: bookLogicalHeight,
        coverPalette,
        spinePalette,
        pagePalette,
        isClosed: true,
        perspectiveAngle,
        pageContentType: 'none'
    };
    drawBookCover(ctx, coverDetails, bookTopLeftX, bookTopLeftY);

    const spineActualWidth = perspectiveAngle > 0 ? Math.max(3, Math.floor(bookLogicalWidth * 0.15)) : 0;
    const coverDrawX = bookTopLeftX + spineActualWidth;
    const coverDrawWidth = bookLogicalWidth - spineActualWidth;

    if (decorationType !== 'none' && decorationType !== 'spine_details') {
         drawCoverDecoration(ctx, { type: decorationType, palette: decorationPalette, symbolShape, cornerStyle, claspStyle },
        coverDrawX, bookTopLeftY, coverDrawWidth, bookLogicalHeight, false);
    }
    if (perspectiveAngle > 0) {
        if (decorationType === 'spine_details') {
             drawCoverDecoration(ctx, { type: decorationType, palette: decorationPalette || spinePalette },
            bookTopLeftX, bookTopLeftY, spineActualWidth, bookLogicalHeight, true);
        } else if (secondaryDecorationType === 'spine_details') {
             drawCoverDecoration(ctx, { type: secondaryDecorationType, palette: secondaryDecorationPalette || spinePalette },
            bookTopLeftX, bookTopLeftY, spineActualWidth, bookLogicalHeight, true);
        }
    }


    let itemName = `Closed ${coverPalette.name} Book`;
    if (perspectiveAngle > 0 && spineMaterialName !== coverMaterialName) itemName += ` (Spine: ${spinePalette.name})`;

    let decorDescriptions = [];
    if (decorationType !== 'none' && decorationType !== 'spine_details' && decorationPalette) {
        let desc = `${decorationPalette.name} ${decorationType.replace('_', ' ')}`;
        if (symbolShape) desc += ` (${symbolShape.replace(/_symbol|_cluster|_scribbles/g, '')})`;
        decorDescriptions.push(desc);
    }

    const spineDecorPaletteToUse = (decorationType === 'spine_details') ? decorationPalette : secondaryDecorationPalette;
    const spineDecorText = (decorationType === 'spine_details' || secondaryDecorationType === 'spine_details') ?
                           `${(spineDecorPaletteToUse || spinePalette).name} Spine Details` : null;

    if (spineDecorText && !decorDescriptions.some(d => d.includes("Spine Details"))) { // Avoid duplicate "Spine Details"
        decorDescriptions.push(spineDecorText);
    }


    if(decorDescriptions.length > 0) {
        itemName += " with " + decorDescriptions.join(" and ");
    }


    const itemSeed = options.seed || Date.now();

    const generatedItemData = {
        type: 'book',
        name: itemName,
        seed: itemSeed,
        itemData: {
            coverMaterial: coverMaterialName.toLowerCase(),
            spineMaterial: spineMaterialName.toLowerCase(),
            pageColor: pageColorName,
            isClosed: true,
            perspectiveAngle,
            width: bookLogicalWidth,
            height: bookLogicalHeight,
            decoration: {
                type: decorationType,
                material: decorationPalette ? decorationPalette.name.toLowerCase() : null,
                symbol: symbolShape,
                cornerStyle: cornerStyle,
                claspStyle: claspStyle,
            },
            secondaryDecoration: secondaryDecorationType !== 'none' ? {
                type: secondaryDecorationType,
                material: secondaryDecorationPalette ? secondaryDecorationPalette.name.toLowerCase() : null,
            } : null,
            colors: {
                cover: coverPalette,
                spine: spinePalette,
                pages: pagePalette,
                decoration: decorationPalette,
                secondaryDecoration: secondaryDecorationPalette
            }
        },
        imageDataUrl: offscreenCanvas.toDataURL()
    };

    console.log("Book generated:", generatedItemData.name);
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

console.log("js/generators/book_generator.js loaded with more cover decorations and increased decoration likelihood.");
