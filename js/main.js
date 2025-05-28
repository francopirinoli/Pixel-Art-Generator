/**
 * js/main.js
 * Main script for the Pixel Art Item Generator web application.
 * Handles UI interactions, canvas setup, and orchestrates item generation.
 */

// --- DOM Element References ---
const itemTypeSelect = document.getElementById('item-type-select');
const generateButton = document.getElementById('generate-button');
const itemCanvas = document.getElementById('item-canvas');
let mainCanvasCtx = null;

// NEW: Sub-type DOM Element References
const subTypeControlsContainer = document.getElementById('sub-type-controls-container');
const itemSubTypeSelect = document.getElementById('item-sub-type-select');


// --- Constants ---
const MAIN_CANVAS_WIDTH = 256;
const MAIN_CANVAS_HEIGHT = 256;


// --- Application State ---
// MODIFIED: Data structure for item categories and their sub-types based on user request
const itemCategories = [
    { name: 'Sword', value: 'sword', subTypes: ['longsword', 'dagger', 'shortsword', 'rapier', 'katana'] },
    { name: 'Shield', value: 'shield', subTypes: ['kite', 'tower', 'round', 'heater'] }, // Values match shieldShape in generator
    { name: 'Polearm', value: 'polearm', subTypes: ['spear_point', 'leaf_spear', 'barbed_spear', 'trident_head', 'poleaxe_head', 'glaive_blade'] },
    { name: 'Armor', value: 'armor', subTypes: ['plate_armor', 'leather_armor'] }, // Generators will map these
    { name: 'Axe', value: 'axe', subTypes: ['hand_axe', 'battle_axe', 'double_axe'] }, // Generators will map these
    { name: 'Bow', value: 'bow', subTypes: ['longbow', 'shortbow', 'recurve'] }, // 'recurve' matches generator
    { name: 'Blunt Weapon', value: 'blunt_weapon', subTypes: ['hammer', 'mace', 'club', 'morningstar'] },
    { name: 'Staff', value: 'staff', subTypes: ['staff', 'scepter', 'wand'] }, // Main category 'Staff', value 'staff'
    { name: 'Jewelry', value: 'jewelry', subTypes: ['ring', 'pendant', 'amulet', 'earring_stud', 'earring_dangle', 'earring_hoop', 'circlet', 'collar'] },
    { name: 'Helmet', value: 'helmet', subTypes: ['simple_helmet', 'conical_helmet', 'knight_helm_visor', 'barbute_helm'] }, // Uses generateHat
    { name: 'Hat', value: 'hat', subTypes: ['wizard_hat', 'top_hat', 'beanie', 'wide_brim_fedora', 'cap', 'straw_hat'] }, // Uses generateHat
    { name: 'Book', value: 'book', subTypes: null },
    { name: 'Potion', value: 'potion', subTypes: null },
    { name: 'Robe', value: 'robe', subTypes: null },
    { name: 'Gloves', value: 'gloves', subTypes: null },
    { name: 'Boots', value: 'boots', subTypes: ['ankle_boot', 'calf_high', 'knee_high'] } // Added Boots back
];

/**
 * Initializes the application.
 */
function initializeApp() {
    console.log("Initializing Pixel Art Item Generator...");
    populateItemTypeDropdown();
    initializeCanvas();
    generateButton.addEventListener('click', handleGenerateButtonClick);
    // NEW: Add event listener for main item type change
    itemTypeSelect.addEventListener('change', handleItemTypeChange);

    if (mainCanvasCtx) {
        mainCanvasCtx.fillStyle = '#374151'; // Tailwind gray-700
        mainCanvasCtx.fillRect(0, 0, MAIN_CANVAS_WIDTH, MAIN_CANVAS_HEIGHT);
        mainCanvasCtx.fillStyle = '#9CA3AF'; // Tailwind gray-400
        mainCanvasCtx.font = '16px sans-serif';
        mainCanvasCtx.textAlign = 'center';
        mainCanvasCtx.fillText('Select an item type and click "Generate"', MAIN_CANVAS_WIDTH / 2, MAIN_CANVAS_HEIGHT / 2 -10);
        mainCanvasCtx.fillText('to create your pixel art!', MAIN_CANVAS_WIDTH / 2, MAIN_CANVAS_HEIGHT / 2 + 10);
    }
    console.log("Application Initialized.");
}

/**
 * Formats a value string (like 'some_value') into a display string (like 'Some Value').
 * @param {string} value - The string value to format.
 * @returns {string} The formatted display string.
 */
function formatForDisplay(value) {
    if (!value) return '';
    return value.split('_').map(word => word.charAt(0).toUpperCase() + word.slice(1)).join(' ');
}

/**
 * Populates the item type selection dropdown.
 */
function populateItemTypeDropdown() {
    if (!itemTypeSelect) {
        console.error("Item type select dropdown not found.");
        return;
    }
    itemTypeSelect.innerHTML = ''; // Clear existing options

    itemCategories.forEach(category => {
        const option = document.createElement('option');
        option.value = category.value;
        option.textContent = category.name;
        itemTypeSelect.appendChild(option);
    });

    if (itemCategories.length > 0) {
        itemTypeSelect.value = itemCategories[0].value; // Select the first item by default
        handleItemTypeChange(); // Populate sub-types for the initially selected item
    }
}

/**
 * Handles the change event for the main item type dropdown.
 * Populates the sub-type dropdown accordingly.
 */
function handleItemTypeChange() {
    if (!itemTypeSelect || !itemSubTypeSelect || !subTypeControlsContainer) {
        console.error("Dropdown elements not found for sub-type handling.");
        return;
    }

    const selectedCategoryValue = itemTypeSelect.value;
    const category = itemCategories.find(cat => cat.value === selectedCategoryValue);

    itemSubTypeSelect.innerHTML = ''; // Clear previous sub-type options

    if (category && category.subTypes && category.subTypes.length > 0) {
        category.subTypes.forEach(subType => {
            const option = document.createElement('option');
            option.value = subType;
            option.textContent = formatForDisplay(subType);
            itemSubTypeSelect.appendChild(option);
        });
        if (category.subTypes.length > 0) {
            itemSubTypeSelect.value = category.subTypes[0]; // Select first sub-type by default
        }
        subTypeControlsContainer.classList.remove('hidden');
    } else {
        subTypeControlsContainer.classList.add('hidden');
    }
}


/**
 * Initializes the main canvas for displaying items.
 */
function initializeCanvas() {
    if (!itemCanvas) {
        console.error("Item canvas element not found.");
        return;
    }
    itemCanvas.width = MAIN_CANVAS_WIDTH;
    itemCanvas.height = MAIN_CANVAS_HEIGHT;

    mainCanvasCtx = itemCanvas.getContext('2d');
    if (!mainCanvasCtx) {
        console.error("Failed to get 2D context from canvas.");
        return;
    }
    mainCanvasCtx.imageSmoothingEnabled = false;
    console.log("Main display canvas initialized.");
}

/**
 * Handles the click event for the "Generate New Item" button.
 */
async function handleGenerateButtonClick() {
    if (!mainCanvasCtx || !itemTypeSelect) {
        console.error("Canvas context or item type select not available.");
        return;
    }

    const selectedCategoryValue = itemTypeSelect.value;
    const selectedCategory = itemCategories.find(cat => cat.value === selectedCategoryValue);

    if (!selectedCategory) {
        console.error(`Selected category ${selectedCategoryValue} not found.`);
        displayErrorOnCanvas(`Error: Category ${selectedCategoryValue} not found.`);
        return;
    }
    const selectedCategoryNameText = selectedCategory.name; // For display messages

    let selectedSubTypeValue = null;
    let subTypeDisplayText = '';
    if (!subTypeControlsContainer.classList.contains('hidden') && itemSubTypeSelect.options.length > 0) {
        selectedSubTypeValue = itemSubTypeSelect.value;
        if (selectedSubTypeValue) {
            subTypeDisplayText = ` (${formatForDisplay(selectedSubTypeValue)})`;
        }
    }
    
    console.log(`Generate button clicked. Selected type: ${selectedCategoryNameText}${subTypeDisplayText} (CategoryValue: ${selectedCategoryValue}, SubTypeValue: ${selectedSubTypeValue})`);

    mainCanvasCtx.clearRect(0, 0, MAIN_CANVAS_WIDTH, MAIN_CANVAS_HEIGHT);
    mainCanvasCtx.fillStyle = '#374151';
    mainCanvasCtx.fillRect(0, 0, MAIN_CANVAS_WIDTH, MAIN_CANVAS_HEIGHT);
    mainCanvasCtx.fillStyle = '#9CA3AF';
    mainCanvasCtx.font = '16px sans-serif';
    mainCanvasCtx.textAlign = 'center';
    mainCanvasCtx.fillText(`Generating ${selectedCategoryNameText}${subTypeDisplayText}...`, MAIN_CANVAS_WIDTH / 2, MAIN_CANVAS_HEIGHT / 2);

    try {
        let generatedItem = null;
        const itemApi = await import('./api/item_api.js');

        // Construct the generator function name from the selected category value
        let functionNameSuffix = selectedCategory.value.split('_').map(word => word.charAt(0).toUpperCase() + word.slice(1)).join('');
        
        // Special handling for generator function names
        if (selectedCategory.value === 'staff') { // Changed from staff_wand
            functionNameSuffix = 'Staff';
        } else if (selectedCategory.value === 'helmet' || selectedCategory.value === 'hat') {
            functionNameSuffix = 'Hat'; // Both Helmet and Hat categories use generateHat
        }
        // No need for blunt_weapon special case as it maps correctly by default.

        const generatorFunctionName = 'generate' + functionNameSuffix;

        if (itemApi[generatorFunctionName]) {
            const generationOptions = {};
            if (selectedSubTypeValue) {
                generationOptions.subType = selectedSubTypeValue;
            }
            // For Helmet/Hat, we also pass the main category value if needed by generator to distinguish
            if (selectedCategory.value === 'helmet' || selectedCategory.value === 'hat') {
                generationOptions.mainType = selectedCategory.value;
            }

            generatedItem = itemApi[generatorFunctionName](generationOptions);
        } else {
            console.error(`${generatorFunctionName} function not found in item_api.js for category: ${selectedCategoryValue}`);
            displayErrorOnCanvas(`Error: ${selectedCategoryNameText} generator not found.`);
            return;
        }

        if (generatedItem && generatedItem.imageDataUrl) {
            const img = new Image();
            img.onload = () => {
                mainCanvasCtx.clearRect(0, 0, MAIN_CANVAS_WIDTH, MAIN_CANVAS_HEIGHT);
                mainCanvasCtx.fillStyle = '#1F2937'; 
                mainCanvasCtx.fillRect(0, 0, MAIN_CANVAS_WIDTH, MAIN_CANVAS_HEIGHT);
                const xPos = (MAIN_CANVAS_WIDTH - img.width) / 2;
                const yPos = (MAIN_CANVAS_HEIGHT - img.height) / 2;
                mainCanvasCtx.drawImage(img, xPos, yPos);
                console.log(`${selectedCategoryNameText}${subTypeDisplayText} generated and drawn:`, generatedItem.name);
            };
            img.onerror = () => {
                console.error("Error loading generated image Data URL.");
                displayErrorOnCanvas('Error loading image.');
            };
            img.src = generatedItem.imageDataUrl;
        } else {
            console.error(`Generation failed for type: ${selectedCategoryNameText}${subTypeDisplayText}, or did not return an imageDataUrl.`);
            displayErrorOnCanvas(`Generation failed for ${selectedCategoryNameText}${subTypeDisplayText}.`);
        }
    } catch (error) {
        console.error("Error during item generation or drawing:", error);
        if (error.message.includes("Failed to fetch dynamically imported module") || error.message.includes("Cannot find module")) {
            displayErrorOnCanvas(`Error: Could not load './api/item_api.js'. Check path.`);
        } else {
            displayErrorOnCanvas(`An error occurred generating ${selectedCategoryNameText}${subTypeDisplayText}.`);
        }
    }
}

/**
 * Displays an error message on the canvas.
 */
function displayErrorOnCanvas(message) {
    if (!mainCanvasCtx) return;
    mainCanvasCtx.clearRect(0, 0, MAIN_CANVAS_WIDTH, MAIN_CANVAS_HEIGHT);
    mainCanvasCtx.fillStyle = '#374151'; 
    mainCanvasCtx.fillRect(0, 0, MAIN_CANVAS_WIDTH, MAIN_CANVAS_HEIGHT);
    mainCanvasCtx.fillStyle = '#F87171'; 
    mainCanvasCtx.font = 'bold 16px sans-serif';
    mainCanvasCtx.textAlign = 'center';
    mainCanvasCtx.fillText(message, MAIN_CANVAS_WIDTH / 2, MAIN_CANVAS_HEIGHT / 2 - 10);
    mainCanvasCtx.font = '14px sans-serif';
    mainCanvasCtx.fillText('Check console for details.', MAIN_CANVAS_WIDTH / 2, MAIN_CANVAS_HEIGHT / 2 + 10);
}

// --- Initialize the Application ---
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initializeApp);
} else {
    initializeApp();
}

console.log("js/main.js loaded with updated sub-type selection and item categories.");
