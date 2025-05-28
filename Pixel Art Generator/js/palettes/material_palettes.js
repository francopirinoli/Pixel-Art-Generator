/**
 * js/palettes/material_palettes.js
 * Defines color palettes for different materials.
 */

export const MATERIAL_PALETTES = {
    IRON: {
        name: 'Iron',
        base: '#8A8A8A',    // A medium gray
        shadow: '#6B6B6B',  // Darker gray
        highlight: '#A9A9A9', // Lighter gray
        outline: '#4D4D4D'   // Very dark gray for outlines
    },
    WOOD: {
        name: 'Wood',
        base: '#8B4513',    // SaddleBrown
        shadow: '#5C2E0D',  // Darker brown
        highlight: '#A0522D', // Sienna (lighter brown)
        outline: '#3E1F09'   // Very dark brown
    },
    STEEL: {
        name: 'Steel',
        base: '#B0C4DE',    // LightSteelBlue
        shadow: '#778899',  // LightSlateGray
        highlight: '#E6E6FA', // Lavender (very light blue/gray)
        outline: '#46505A'   // Darker slate gray
    },
    DARK_STEEL: {
        name: 'Dark Steel',
        base: '#5A5A6A',    // Darker, slightly bluish steel
        shadow: '#3E3E48',  // Very dark slate
        highlight: '#7E7E8C', // Medium dark slate highlight
        outline: '#2C2C33'   // Almost black outline
    },
    GOLD: {
        name: 'Gold',
        base: '#FFD700',    // Gold
        shadow: '#B8860B',  // DarkGoldenrod
        highlight: '#FFFACD', // LemonChiffon (light yellow)
        outline: '#806000'   // Darker gold/brown
    },
    LEATHER: { // Default Brown Leather
        name: 'Leather',
        base: '#A0522D',    // Sienna
        shadow: '#5F341A',  // Darker sienna
        highlight: '#CD853F', // Peru (lighter, more orange brown)
        outline: '#4A2914'   // Very dark sienna
    },
    // NEW LEATHER VARIATIONS:
    BLACK_LEATHER: {
        name: 'Black Leather',
        base: '#3A3A3A',    // Dark Gray, almost black
        shadow: '#202020',  // Very Dark Gray
        highlight: '#555555', // Medium Gray highlight
        outline: '#101010'   // Near black outline
    },
    WHITE_LEATHER: {
        name: 'White Leather',
        base: '#F0EBE0',    // Off-white, slightly beige
        shadow: '#D4CCC0',  // Light grayish beige shadow
        highlight: '#FFFFFF', // Pure white highlight
        outline: '#B0A89F'   // Darker beige/gray outline
    },
    DARK_BROWN_LEATHER: {
        name: 'Dark Brown Leather',
        base: '#5D3A1A',    // Dark, rich brown
        shadow: '#3E1F09',  // Very dark brown
        highlight: '#7B4F2E', // Slightly lighter, desaturated brown highlight
        outline: '#2C1505'   // Almost black-brown outline
    },
    RED_LEATHER: {
        name: 'Red Leather',
        base: '#8B0000',    // DarkRed
        shadow: '#5E0000',  // Darker Red
        highlight: '#B22222', // Firebrick (as highlight)
        outline: '#400000'   // Very dark red outline
    },
    GREEN_LEATHER: {
        name: 'Green Leather',
        base: '#006400',    // DarkGreen
        shadow: '#004D00',  // Very Dark Green
        highlight: '#228B22', // ForestGreen (as highlight)
        outline: '#002A00'   // Extremely dark green outline
    },
    BLUE_LEATHER: {
        name: 'Blue Leather',
        base: '#00008B',    // DarkBlue
        shadow: '#00005E',  // Darker Blue
        highlight: '#4169E1', // RoyalBlue (as highlight)
        outline: '#000040'   // Very dark blue outline
    },
    BRONZE: {
        name: 'Bronze',
        base: '#CD7F32',    // Bronze
        shadow: '#8C5A23',  // Darker bronze
        highlight: '#D2A679', // Lighter, more desaturated bronze
        outline: '#5D3A1A'   // Dark brown for outline
    },
    SILVER: {
        name: 'Silver',
        base: '#C0C0C0',    // Silver
        shadow: '#A0A0A0',  // Darker silver
        highlight: '#E0E0E0', // Lighter silver
        outline: '#707070'   // Medium gray outline
    },
    OBSIDIAN: {
        name: 'Obsidian',
        base: '#201A23',    // Very dark purple/black
        shadow: '#0D0C0F',  // Almost black
        highlight: '#3A3042', // Dark purple highlight, suggesting sheen
        outline: '#000000'   // Black
    },
    BONE: {
        name: 'Bone',
        base: '#F5F5DC',    // Beige (bone white)
        shadow: '#D2B48C',  // Tan (for shadows/crevices)
        highlight: '#FFFFF0', // Ivory (brighter highlight for bone)
        outline: '#A08C78'   // Darker beige/brown outline
    },
    IVORY: {
        name: 'Ivory',
        base: '#FFFFF0',    // Ivory - a creamy, off-white
        shadow: '#E0E0D1',  // Slightly darker, desaturated ivory for shadow
        highlight: '#FFFFFF', // Pure white for highlight
        outline: '#B0B0A1'   // A soft gray/beige for outline
    },
    STONE: {
        name: 'Stone',
        base: '#808080',    // Medium Gray
        shadow: '#5A5A5A',  // Dark Gray
        highlight: '#A9A9A9', // Light Gray
        outline: '#404040'   // Very Dark Gray
    },
    COPPER: {
        name: 'Copper',
        base: '#B87333',    // Copper
        shadow: '#8C5828',  // Darker Copper
        highlight: '#D9904A', // Lighter Copper
        outline: '#5A3A1A'   // Dark Brownish Copper
    },
    GREEN_LEAF: {
        name: 'Green Leaf',
        base: '#2E8B57',    // SeaGreen
        shadow: '#1E5638',  // Darker SeaGreen
        highlight: '#3CB371', // MediumSeaGreen (lighter, vibrant)
        outline: '#143D24'   // Very Dark Green/Forest
    },
    PAPER: {
        name: 'Paper',
        base: '#FEFDF4',    // Very light off-white, almost paper white
        shadow: '#EAE8D8',  // Soft beige/gray shadow for paper texture
        highlight: '#FFFFFF', // Pure white highlight
        outline: '#C0B8A8'   // Slightly darker beige for subtle outline if needed
    },
    PARCHMENT: {
        name: 'Parchment',
        base: '#F5EAAA',    // A common parchment yellow/beige
        shadow: '#D2B48C',  // Tan, as used for bone shadows, works well
        highlight: '#FFF8DC', // Cornsilk, a light creamy yellow
        outline: '#A08C78'   // Darker beige/brown outline
    },
    RED_PAINT: {
        name: 'Red Paint',
        base: '#B22222',    // Firebrick Red
        shadow: '#800000',  // Maroon
        highlight: '#DC143C', // Crimson
        outline: '#500000'   // Darker Maroon
    },
    GREEN_PAINT: {
        name: 'Green Paint',
        base: '#228B22',    // ForestGreen
        shadow: '#006400',  // DarkGreen
        highlight: '#3CB371', // MediumSeaGreen
        outline: '#003300'   // Darker ForestGreen
    },
    BLUE_PAINT: {
        name: 'Blue Paint',
        base: '#4682B4',    // SteelBlue
        shadow: '#000080',  // Navy
        highlight: '#5F9EA0', // CadetBlue
        outline: '#000050'   // Darker Navy
    },
    BLACK_PAINT: {
        name: 'Black Paint',
        base: '#2F4F4F',    // DarkSlateGray (not pure black for shading)
        shadow: '#1C1C1C',  // Very Dark Gray
        highlight: '#556B2F', // DarkOliveGreen (as a dull highlight) or #696969 (DimGray)
        outline: '#000000'   // Black
    },
    WHITE_PAINT: {
        name: 'White Paint',
        base: '#F5F5F5',    // WhiteSmoke
        shadow: '#D3D3D3',  // LightGray
        highlight: '#FFFFFF', // White
        outline: '#A9A9A9'   // DarkGray
    },
    YELLOW_PAINT: {
        name: 'Yellow Paint',
        base: '#FFD700',    // Gold (can reuse for a vibrant yellow paint)
        shadow: '#DAA520',  // Goldenrod
        highlight: '#FFFFE0', // LightYellow
        outline: '#B8860B'   // DarkGoldenrod
    },
    PURPLE_PAINT: {
        name: 'Purple Paint',
        base: '#8A2BE2',    // BlueViolet
        shadow: '#4B0082',  // Indigo
        highlight: '#9932CC', // DarkOrchid
        outline: '#3A005A'   // Darker Indigo/Violet
    },
    GEM_RED: {
        name: 'Red Gem',
        base: '#FF0000',    // Red
        shadow: '#8B0000',  // DarkRed
        highlight: '#FFC0CB', // Pink (as a highlight)
        outline: '#4D0000'   // Very dark red
    },
    GEM_BLUE: {
        name: 'Blue Gem',
        base: '#0000FF',    // Blue
        shadow: '#00008B',  // DarkBlue
        highlight: '#ADD8E6', // LightBlue
        outline: '#00004D'   // Very dark blue
    },
    GEM_GREEN: {
        name: 'Green Gem',
        base: '#008000',    // Green
        shadow: '#006400',  // DarkGreen
        highlight: '#90EE90', // LightGreen
        outline: '#003300'   // Very dark green
    },
    GEM_PURPLE: {
        name: 'Purple Gem',
        base: '#800080',    // Purple
        shadow: '#4B0082',  // Indigo (darker purple)
        highlight: '#DA70D6', // Orchid (lighter purple)
        outline: '#300030'   // Very dark purple
    },
    GEM_YELLOW: {
        name: 'Yellow Gem',
        base: '#FFDB58',
        shadow: '#B8860B',
        highlight: '#FFFFE0',
        outline: '#A07400'
    },
    GEM_ORANGE: {
        name: 'Orange Gem',
        base: '#FFA500',    // Orange
        shadow: '#CC8400',  // Darker Orange
        highlight: '#FFDAB9', // PeachPuff (light orange highlight)
        outline: '#A66300'   // Dark orange/brown
    },
    GEM_CYAN: {
        name: 'Cyan Gem',
        base: '#00FFFF',    // Cyan/Aqua
        shadow: '#008B8B',  // DarkCyan
        highlight: '#E0FFFF', // LightCyan
        outline: '#006060'   // Darker Cyan
    },
    GEM_WHITE: { // Often used for Diamond/Clear
        name: 'White Gem',
        base: '#F0F8FF',    // AliceBlue (slightly off-white)
        shadow: '#B0C4DE',  // LightSteelBlue (for subtle shadow)
        highlight: '#FFFFFF', // White
        outline: '#778899'   // LightSlateGray
    },
    PEARL: {
        name: 'Pearl',
        base: '#FDF5E6', // OldLace (creamy white)
        shadow: '#E0D8C9',// Softer shadow
        highlight: '#FFFFFF',// Pure white highlight
        outline: '#C0B8AB' // Soft outline
    },
    OPAL: { // Opals are tricky due to play-of-color, this is a simplified base
        name: 'Opal',
        base: '#E6E6FA',    // Lavender (milky base)
        shadow: '#B0C4DE',  // LightSteelBlue (shadow)
        highlight: '#FFFFFF', // White highlight
        outline: '#A0A0C0'   // Soft lavender-gray outline
    },
    ENCHANTED: { // For magical items or glowing effects
        name: 'Enchanted',
        base: '#7B68EE',    // MediumSlateBlue
        shadow: '#483D8B',  // DarkSlateBlue
        highlight: '#AFEEEE', // PaleTurquoise (glowy highlight)
        outline: '#2F2074'   // Darker SlateBlue
    }
};

/**
 * Gets a specific palette by name.
 * @param {string} name - The name of the material (e.g., "IRON", "WOOD").
 * @returns {object | undefined} The palette object or undefined if not found.
 */
export function getPalette(name) {
    if (!name) {
        console.warn(`Palette name is undefined. Using IRON as default.`);
        return MATERIAL_PALETTES.IRON;
    }
    const upperName = name.toUpperCase();
    if (MATERIAL_PALETTES[upperName]) {
        return MATERIAL_PALETTES[upperName];
    }
    console.warn(`Palette "${name}" not found. Using IRON as default.`);
    return MATERIAL_PALETTES.IRON; // Default fallback
}

console.log("js/palettes/material_palettes.js loaded with new leather variations.");
