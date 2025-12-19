import { readFileSync, writeFileSync, existsSync, mkdirSync } from 'node:fs';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
import type { Template, TemplateLibrary, VariableName, BusyTemplate } from './types.js';

const __dirname = dirname(fileURLToPath(import.meta.url));
// Point to the shared data file in the main app's src/data folder
const DATA_FILE = join(__dirname, '..', '..', 'src', 'data', 'templates.json');

function ensureDataFile(): void {
  if (!existsSync(DATA_FILE)) {
    const dataDir = dirname(DATA_FILE);
    if (!existsSync(dataDir)) {
      mkdirSync(dataDir, { recursive: true });
    }
    const initial: TemplateLibrary = {
      version: '0.0.1',
      templates: [],
    };
    writeFileSync(DATA_FILE, JSON.stringify(initial, null, 2));
  }
}

export function loadLibrary(): TemplateLibrary {
  ensureDataFile();
  const raw = readFileSync(DATA_FILE, 'utf-8');
  return JSON.parse(raw) as TemplateLibrary;
}

export function saveLibrary(library: TemplateLibrary): void {
  writeFileSync(DATA_FILE, JSON.stringify(library, null, 2));
}

export function getTemplates(): Template[] {
  return loadLibrary().templates;
}

export function getTemplateById(id: string): Template | undefined {
  return getTemplates().find((t) => t.id === id);
}

export function addTemplate(template: Template): void {
  const library = loadLibrary();
  // Check for duplicate ID
  if (library.templates.some((t) => t.id === template.id)) {
    throw new Error(`Template with ID ${template.id} already exists`);
  }
  library.templates.push(template);
  saveLibrary(library);
}

export function getVocabulary(): VariableName[] {
  const templates = getTemplates();
  const variables = new Set<VariableName>();

  for (const template of templates) {
    if (template.templateType === 'busy') {
      const busy = template as BusyTemplate;
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
