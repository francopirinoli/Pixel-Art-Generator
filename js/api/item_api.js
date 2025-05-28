/**
 * js/api/item_api.js
 * Public API for the Pixel Art Item Generator.
 * This module re-exports generator functions from their respective files.
 */

export { generateSword } from '../generators/sword_generator.js';
export { generateShield } from '../generators/shield_generator.js';
export { generatePolearm } from '../generators/polearm_generator.js';
export { generateBoots } from '../generators/boots_generator.js';
export { generateArmor } from '../generators/armor_generator.js';
export { generateAxe } from '../generators/axe_generator.js';
export { generateBow } from '../generators/bow_generator.js';
export { generateBluntWeapon } from '../generators/blunt_weapon_generator.js';
export { generateStaff } from '../generators/staff_generator.js';
export { generateJewelry } from '../generators/jewelry_generator.js';
export { generateBook } from '../generators/book_generator.js';
export { generatePotion } from '../generators/potion_generator.js';
export { generateRobe } from '../generators/robe_generator.js';
export { generateGloves } from '../generators/glove_generator.js';
export { generateHat } from '../generators/hat_generator.js';


console.log("js/api/item_api.js loaded with Potion, Book and Jewelry generators.");
