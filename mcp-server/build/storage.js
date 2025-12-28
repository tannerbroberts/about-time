import { readFileSync, writeFileSync, existsSync, mkdirSync } from 'node:fs';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
const __dirname = dirname(fileURLToPath(import.meta.url));
// Point to the shared data file in the main app's src/data folder
const DATA_FILE = join(__dirname, '..', '..', 'src', 'data', 'templates.json');
function ensureDataFile() {
    if (!existsSync(DATA_FILE)) {
        const dataDir = dirname(DATA_FILE);
        if (!existsSync(dataDir)) {
            mkdirSync(dataDir, { recursive: true });
        }
        const initial = {
            version: '0.0.1',
            templates: [],
        };
        writeFileSync(DATA_FILE, JSON.stringify(initial, null, 2));
    }
}
export function loadLibrary() {
    ensureDataFile();
    const raw = readFileSync(DATA_FILE, 'utf-8');
    return JSON.parse(raw);
}
export function saveLibrary(library) {
    writeFileSync(DATA_FILE, JSON.stringify(library, null, 2));
}
export function getTemplates() {
    return loadLibrary().templates;
}
export function getTemplateById(id) {
    return getTemplates().find((t) => t.id === id);
}
export function addTemplate(template) {
    const library = loadLibrary();
    // Check for duplicate ID
    if (library.templates.some((t) => t.id === template.id)) {
        throw new Error(`Template with ID ${template.id} already exists`);
    }
    library.templates.push(template);
    saveLibrary(library);
}
/**
 * Convert the template array to a TemplateMap for use with the core library functions.
 */
export function getTemplateMap() {
    const templates = getTemplates();
    const map = {};
    for (const template of templates) {
        map[template.id] = template;
    }
    return map;
}
/**
 * Save a TemplateMap back to the library, converting it to an array.
 */
export function saveTemplateMap(templateMap) {
    const library = loadLibrary();
    library.templates = Object.values(templateMap);
    saveLibrary(library);
}
export function getVocabulary() {
    const templates = getTemplates();
    const variables = new Set();
    for (const template of templates) {
        if (template.templateType === 'busy') {
            const busy = template;
            for (const varName of Object.keys(busy.willConsume)) {
                variables.add(varName);
            }
            for (const varName of Object.keys(busy.willProduce)) {
                variables.add(varName);
            }
        }
    }
    return Array.from(variables).sort();
}
