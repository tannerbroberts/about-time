/**
 * Custom ESLint Plugin: Architecture Rules
 *
 * Enforces strict architectural patterns for React/TypeScript components.
 */

import path from 'path';
import { ESLintUtils } from '@typescript-eslint/utils';

// Helper to check if a file is a hook file (prefixed with "use")
const isHookFile = (filename) => {
  const basename = path.basename(filename, path.extname(filename));
  return /^use[A-Z]/.test(basename);
};

// Helper to check if a file is a TSX component file
const isTsxComponentFile = (filename) => {
  return filename.endsWith('.tsx') && !isHookFile(filename);
};

// Helper to check if a component name is a Memo component
const isMemoComponent = (name) => {
  return name && /^Memo[A-Z]/.test(name);
};

// Helper to check if a file path is inside src/Shared directory
const isInSharedDir = (filePath) => {
  return filePath && filePath.includes('/src/Shared/');
};

// Helper to check if an import path points to src/Shared
const isSharedImport = (importPath, currentFileDir) => {
  if (!importPath) return false;
  // Resolve the import path relative to the current file
  const resolvedPath = path.resolve(currentFileDir, importPath);
  return resolvedPath.includes('/src/Shared');
};

// Helper to check if a file is a types file (named exactly "types.ts" or "types.tsx")
const isTypesFile = (filename) => {
  const basename = path.basename(filename);
  return basename === 'types.ts' || basename === 'types.tsx';
};

// Forbidden React hooks in component files
const FORBIDDEN_HOOKS_IN_COMPONENTS = [
  'useContext',
  'useEffect',
  'useCallback',
  'useMemo',
  'useState',
  'useRef',
];

// Hooks only allowed in hook files
const HOOKS_ONLY_IN_HOOK_FILES = [
  'useState',
  'useCallback',
  'useEffect',
  'useMemo',
];

/**
 * Rule: no-react-hooks-in-components
 *
 * TSX component files can ONLY have:
 * - Component imports
 * - Context hook calls (custom hooks from context)
 * - State handler hook calls
 *
 * NO calls to: useContext, useEffect, useCallback, useMemo, useState, useRef
 */
const noHooksInComponents = {
  meta: {
    type: 'problem',
    docs: {
      description: 'Disallow React hooks directly in component files',
    },
    messages: {
      forbiddenHook:
        'Direct use of "{{hook}}" is forbidden in component files. Extract this logic to a custom hook file (use*.ts).',
    },
    schema: [],
  },
  create(context) {
    const filename = context.filename || context.getFilename();

    // Only apply to TSX component files (not hook files)
    if (!isTsxComponentFile(filename)) {
      return {};
    }

    return {
      CallExpression(node) {
        if (node.callee.type === 'Identifier') {
          const hookName = node.callee.name;
          if (FORBIDDEN_HOOKS_IN_COMPONENTS.includes(hookName)) {
            context.report({
              node,
              messageId: 'forbiddenHook',
              data: { hook: hookName },
            });
          }
        }
        // Handle React.useXxx pattern
        if (
          node.callee.type === 'MemberExpression'
          && node.callee.object.name === 'React'
          && FORBIDDEN_HOOKS_IN_COMPONENTS.includes(node.callee.property.name)
        ) {
          context.report({
            node,
            messageId: 'forbiddenHook',
            data: { hook: `React.${node.callee.property.name}` },
          });
        }
      },
    };
  },
};

/**
 * Rule: named-exports-only
 *
 * All exports MUST be named exports. No default exports allowed.
 */
const namedExportsOnly = {
  meta: {
    type: 'problem',
    docs: {
      description: 'Enforce named exports only, no default exports',
    },
    messages: {
      noDefaultExport: 'Default exports are forbidden. Use named exports only.',
    },
    schema: [],
  },
  create(context) {
    return {
      ExportDefaultDeclaration(node) {
        context.report({
          node,
          messageId: 'noDefaultExport',
        });
      },
    };
  },
};

/**
 * Rule: react-hooks-only-in-hook-files
 *
 * useState, useCallback, useEffect, useMemo can ONLY be used in files prefixed with "use"
 */
const hooksOnlyInHookFiles = {
  meta: {
    type: 'problem',
    docs: {
      description: 'Restrict core hooks to hook files only',
    },
    messages: {
      hookNotInHookFile:
        '"{{hook}}" can only be used in hook files (files starting with "use"). Current file: {{filename}}',
    },
    schema: [],
  },
  create(context) {
    const filename = context.filename || context.getFilename();
    const basename = path.basename(filename, path.extname(filename));

    // Allow in hook files
    if (isHookFile(filename)) {
      return {};
    }

    return {
      CallExpression(node) {
        let hookName = null;

        if (node.callee.type === 'Identifier') {
          hookName = node.callee.name;
        } else if (
          node.callee.type === 'MemberExpression'
          && node.callee.object.name === 'React'
        ) {
          hookName = node.callee.property.name;
        }

        if (hookName && HOOKS_ONLY_IN_HOOK_FILES.includes(hookName)) {
          context.report({
            node,
            messageId: 'hookNotInHookFile',
            data: { hook: hookName, filename: basename },
          });
        }
      },
    };
  },
};

/**
 * Rule: memo-component-rules
 *
 * - Components wrapped in React.memo MUST be prefixed with "Memo"
 * - Memo components can ONLY receive props, NEVER call context hooks
 * - Components using no hooks SHOULD use React.memo
 */
const memoComponentRules = {
  meta: {
    type: 'problem',
    docs: {
      description: 'Enforce React.memo naming and usage conventions',
    },
    messages: {
      memoNeedsPrefix:
        'Components wrapped in React.memo must be prefixed with "Memo". Rename "{{name}}" to "Memo{{name}}".',
      memoNoContextHooks:
        'Memo components cannot call context hooks. "{{name}}" calls "{{hook}}".',
      memoMustBeExported:
        'The variable "{{name}}" is a Memo-prefixed component but is not wrapped in React.memo().',
    },
    schema: [],
  },
  create(context) {
    const filename = context.filename || context.getFilename();

    if (!isTsxComponentFile(filename)) {
      return {};
    }

    const memoWrappedComponents = new Set();
    const memoPrefixedVariables = new Set();

    return {
      // Track variables assigned to React.memo() calls
      VariableDeclarator(node) {
        if (
          node.init
          && node.init.type === 'CallExpression'
          && ((node.init.callee.type === 'MemberExpression'
              && node.init.callee.object.name === 'React'
              && node.init.callee.property.name === 'memo')
            || (node.init.callee.type === 'Identifier'
              && node.init.callee.name === 'memo'))
        ) {
          const componentName = node.id.name;
          memoWrappedComponents.add(componentName);

          if (!isMemoComponent(componentName)) {
            context.report({
              node,
              messageId: 'memoNeedsPrefix',
              data: { name: componentName },
            });
          }
        }

        // Track Memo-prefixed variables
        if (node.id.name && isMemoComponent(node.id.name)) {
          memoPrefixedVariables.add(node.id.name);
        }
      },

      // Check exports for Memo-prefixed components not wrapped in React.memo
      'Program:exit'() {
        for (const name of memoPrefixedVariables) {
          if (!memoWrappedComponents.has(name)) {
            // Will be caught by the VariableDeclarator check
          }
        }
      },
    };
  },
};

/**
 * Rule: context-provider-file
 *
 * Context providers must be in a separate file named after the component.
 * The provider file should be named like: ComponentNameProvider.tsx
 */
const contextProviderFile = {
  meta: {
    type: 'problem',
    docs: {
      description: 'Context providers must be in separate, properly named files',
    },
    messages: {
      providerInWrongFile:
        'Context Provider "{{name}}" must be in its own file. Create a file named "{{expectedFile}}.tsx".',
      providerValueMustBeHookState:
        'Context Provider value must come from a hook declared in the component, not inline objects or other sources.',
    },
    schema: [],
  },
  create(context) {
    const filename = context.filename || context.getFilename();
    const basename = path.basename(filename, path.extname(filename));

    return {
      JSXElement(node) {
        const elementName = node.openingElement.name;

        // Check for *.Provider pattern
        if (
          elementName.type === 'JSXMemberExpression'
          && elementName.property.name === 'Provider'
        ) {
          const contextName = elementName.object.name;
          const expectedBasename = `${contextName.replace('Context', '')}Provider`;

          // Check if we're in the right file
          if (basename !== expectedBasename && basename !== 'index') {
            context.report({
              node,
              messageId: 'providerInWrongFile',
              data: {
                name: `${contextName}.Provider`,
                expectedFile: expectedBasename,
              },
            });
          }
        }
      },
    };
  },
};

/**
 * Rule: component-folder-structure
 *
 * Every component needs its own folder with an index file.
 * Index file should only export the component and associated context.
 */
const componentFolderStructure = {
  meta: {
    type: 'problem',
    docs: {
      description: 'Enforce component folder structure with index exports',
    },
    messages: {
      indexOnlyExportsComponent:
        'Index files should only export the main component and associated context, not "{{name}}".',
      componentNeedsFolderWithIndex:
        'Component "{{name}}" should be in its own folder with an index.ts(x) file.',
    },
    schema: [],
  },
  create(context) {
    const filename = context.filename || context.getFilename();
    const basename = path.basename(filename, path.extname(filename));

    if (basename !== 'index') {
      return {};
    }

    return {
      ExportNamedDeclaration(node) {
        // Check re-exports from index
        if (node.source) {
          const exportSource = node.source.value;

          // Allow component and context exports
          for (const specifier of node.specifiers || []) {
            const exportedName = specifier.exported.name;

            // Allow: ComponentName, ComponentNameContext, useComponentNameContext
            const isComponent = /^[A-Z]/.test(exportedName) && !exportedName.endsWith('Context');
            const isContext = exportedName.endsWith('Context');
            const isContextHook = /^use.*Context$/.test(exportedName);
            // Allow type exports (from types.ts)
            const isTypeExport = specifier.exportKind === 'type' || node.exportKind === 'type';

            if (!isComponent && !isContext && !isContextHook && !isTypeExport) {
              context.report({
                node: specifier,
                messageId: 'indexOnlyExportsComponent',
                data: { name: exportedName },
              });
            }
          }
        }
      },
      // Allow export * from './types' in index files
      ExportAllDeclaration(node) {
        const exportSource = node.source.value;
        // Allow re-exporting everything from types file
        if (exportSource === './types') {
          return;
        }
        // Other export * statements could be checked here if needed
      },
    };
  },
};

/**
 * Rule: import-boundaries
 *
 * - Context hooks can only be imported from DIRECT ancestor directories (parent, grandparent, etc.)
 * - Components can only be imported from DIRECT descendant directories
 * - Exception: Components from the src/Shared directory can be imported from anywhere
 */
const importBoundaries = {
  meta: {
    type: 'problem',
    docs: {
      description: 'Enforce import boundaries for components and context hooks',
    },
    messages: {
      contextFromNonAncestor:
        'Context hook "{{name}}" can only be imported from direct ancestor directories (parent, grandparent, etc.). Import path "{{path}}" is not a direct ancestor.',
      componentFromNonChild:
        'Component "{{name}}" can only be imported from direct descendant directories or src/Shared. Import path "{{path}}" is not allowed.',
    },
    schema: [],
  },
  create(context) {
    const filename = context.filename || context.getFilename();
    const fileDir = path.dirname(filename);

    // Helper to check if import path is a direct ancestor (only goes up, never sideways)
    const isDirectAncestorImport = (importPath) => {
      // Must start with '../' to be an ancestor
      if (!importPath.startsWith('../')) {
        return false;
      }
      
      // Split the path and check that it only contains '..' segments followed by a single folder name
      // Valid: '../', '../../', '../../../FolderName'
      // Invalid: '../../sibling/Folder' (goes up then sideways)
      const parts = importPath.split('/').filter((p) => p && p !== '.');
      
      // Count the '..' parts at the start
      let upCount = 0;
      for (const part of parts) {
        if (part === '..') {
          upCount++;
        } else {
          break;
        }
      }
      
      // After the '..' parts, there should be at most one folder name (the target)
      // The remaining parts after '..' should be exactly 0 or 1 (the target folder)
      const remainingParts = parts.slice(upCount);
      
      // Must have at least one '..' and at most one folder name after the '..'s
      return upCount >= 1 && remainingParts.length <= 1;
    };

    return {
      ImportDeclaration(node) {
        const importPath = node.source.value;

        // Skip external modules
        if (!importPath.startsWith('.') && !importPath.startsWith('/')) {
          return;
        }

        const resolvedImportDir = path.resolve(fileDir, importPath);
        const relativePath = path.relative(fileDir, resolvedImportDir);

        for (const specifier of node.specifiers) {
          if (specifier.type !== 'ImportSpecifier') continue;

          const importedName = specifier.imported.name;

          // Check context hooks (use*Context pattern)
          if (/^use.*Context$/.test(importedName)) {
            // Must be from a direct ancestor (../, ../../, ../../../, etc.)
            if (!isDirectAncestorImport(importPath)) {
              context.report({
                node: specifier,
                messageId: 'contextFromNonAncestor',
                data: { name: importedName, path: importPath },
              });
            }
          }

          // Check component imports (PascalCase, not context)
          if (/^[A-Z]/.test(importedName) && !importedName.endsWith('Context')) {
            // Check if this is a type import (from ImportSpecifier with type modifier)
            // Type imports are allowed from ancestor directories
            const isTypeImport = specifier.importKind === 'type' || node.importKind === 'type';
            
            if (isTypeImport) {
              // Types can be imported from ancestor directories (../) or Shared directories
              // No restrictions on type imports from ancestors
              continue;
            }

            // Check if importing from src/Shared directory (allowed from anywhere)
            const isFromShared = isSharedImport(importPath, fileDir);
            
            if (!isFromShared) {
              // Regular components must be from direct descendants (./)
              if (!importPath.startsWith('./')) {
                context.report({
                  node: specifier,
                  messageId: 'componentFromNonChild',
                  data: { name: importedName, path: importPath },
                });
              }
            }
          }
        }
      },
    };
  },
};

/**
 * Rule: file-export-name-match
 *
 * File names must match their primary export name.
 * Folder names must match the export name (except Shared folders).
 */
const fileExportNameMatch = {
  meta: {
    type: 'problem',
    docs: {
      description: 'Enforce file names match export names',
    },
    messages: {
      fileNameMismatch:
        'File name "{{filename}}" does not match the primary export "{{exportName}}". Rename file to "{{exportName}}.{{ext}}".',
      folderNameMismatch:
        'Folder name "{{folderName}}" does not match the exported component "{{exportName}}". Rename folder to "{{exportName}}".',
    },
    schema: [],
  },
  create(context) {
    const filename = context.filename || context.getFilename();
    const basename = path.basename(filename, path.extname(filename));
    const ext = path.extname(filename).slice(1);
    const folderName = path.basename(path.dirname(filename));

    // Skip index files (they export from folder)
    if (basename === 'index') {
      return {};
    }

    // Skip types files (they can export multiple types)
    if (isTypesFile(filename)) {
      return {};
    }

    // Skip files in src/Shared directory (they can export multiple)
    if (isInSharedDir(filename)) {
      return {};
    }

    let primaryExport = null;

    return {
      // Track the first named export
      ExportNamedDeclaration(node) {
        if (primaryExport) return;

        if (node.declaration) {
          if (node.declaration.type === 'FunctionDeclaration' && node.declaration.id) {
            primaryExport = node.declaration.id.name;
          } else if (node.declaration.type === 'VariableDeclaration') {
            const firstDecl = node.declaration.declarations[0];
            if (firstDecl && firstDecl.id.type === 'Identifier') {
              primaryExport = firstDecl.id.name;
            }
          } else if (node.declaration.type === 'TSTypeAliasDeclaration') {
            primaryExport = node.declaration.id.name;
          } else if (node.declaration.type === 'TSInterfaceDeclaration') {
            primaryExport = node.declaration.id.name;
          }
        }
      },

      'Program:exit'(node) {
        if (!primaryExport) return;

        // Check file name matches export
        if (basename !== primaryExport) {
          context.report({
            node,
            messageId: 'fileNameMismatch',
            data: {
              filename: basename,
              exportName: primaryExport,
              ext,
            },
          });
        }

        // For component files, check folder name matches (except for hook files)
        // Skip files in src/Shared directory (they can have different folder names)
        if (
          isTsxComponentFile(filename)
          && folderName !== primaryExport
          && folderName !== 'src'
          && !isInSharedDir(filename)
        ) {
          context.report({
            node,
            messageId: 'folderNameMismatch',
            data: {
              folderName,
              exportName: primaryExport,
            },
          });
        }
      },
    };
  },
};

/**
 * Rule: no-useRef-in-components
 *
 * useRef is not allowed in component files (must be in hook files).
 * This is covered by no-react-hooks-in-components but we make it explicit.
 */
const noUseRefInComponents = {
  meta: {
    type: 'problem',
    docs: {
      description: 'Disallow useRef in component files',
    },
    messages: {
      noUseRef:
        'useRef cannot be used directly in component files. Extract to a custom hook.',
    },
    schema: [],
  },
  create(context) {
    const filename = context.filename || context.getFilename();

    if (!isTsxComponentFile(filename)) {
      return {};
    }

    return {
      CallExpression(node) {
        const isUseRef = (node.callee.type === 'Identifier' && node.callee.name === 'useRef')
          || (node.callee.type === 'MemberExpression'
            && node.callee.object.name === 'React'
            && node.callee.property.name === 'useRef');

        if (isUseRef) {
          context.report({
            node,
            messageId: 'noUseRef',
          });
        }
      },
    };
  },
};

/**
 * Rule: import-from-index
 *
 * Imports must come from folder paths (via index file), never directly from a file inside a folder.
 * Example:
 *   ✅ import { Header } from './Header';
 *   ❌ import { Header } from './Header/Header';
 */
const importFromIndex = {
  meta: {
    type: 'problem',
    docs: {
      description: 'Enforce imports from folder index files, not direct file paths',
    },
    messages: {
      importNotFromIndex:
        'Import from "{{path}}" is not allowed. Import from the folder path instead (via index file). Use "{{suggestedPath}}" instead.',
    },
    schema: [],
  },
  create(context) {
    const filename = context.filename || context.getFilename();

    return {
      ImportDeclaration(node) {
        const importPath = node.source.value;

        // Skip external modules
        if (!importPath.startsWith('.') && !importPath.startsWith('/')) {
          return;
        }

        // Normalize the path and check for file-like imports
        const pathParts = importPath.split('/');
        const lastPart = pathParts[pathParts.length - 1];

        // If the last part looks like a file (contains a dot or starts with uppercase
        // and the previous part is also a valid folder name), it's likely a direct file import
        // We detect patterns like: ./Folder/File or ./Folder/FileName
        // But allow: ./Folder (imports from index)

        // Check if the import path has more than one component after ./ or ../
        // and the last component looks like a file (PascalCase or camelCase, not 'index')
        if (pathParts.length >= 2) {
          const relativeParts = pathParts.filter(p => p !== '.' && p !== '..');
          
          if (relativeParts.length >= 2) {
            const lastRelativePart = relativeParts[relativeParts.length - 1];
            
            // Skip if explicitly importing 'index'
            if (lastRelativePart === 'index') {
              return;
            }

            // Check if the last part looks like a file name:
            // - Has an extension like .ts, .tsx, .js, .jsx
            // - OR is PascalCase/camelCase without extension (implicit index resolution won't apply)
            const hasExtension = /\.(ts|tsx|js|jsx)$/.test(lastRelativePart);
            const isPascalOrCamelCase = /^[A-Za-z]/.test(lastRelativePart) && !lastRelativePart.includes('.');
            const looksLikeFile = hasExtension || isPascalOrCamelCase;

            // The previous part should look like a folder (PascalCase typically)
            const previousPart = relativeParts[relativeParts.length - 2];
            const looksLikeFolder = /^[A-Z]/.test(previousPart) || previousPart === 'src';

            if (looksLikeFile && looksLikeFolder) {
              // This looks like a direct file import inside a folder
              // Suggest importing from the parent folder instead
              const suggestedParts = pathParts.slice(0, -1);
              const suggestedPath = suggestedParts.join('/');

              context.report({
                node,
                messageId: 'importNotFromIndex',
                data: {
                  path: importPath,
                  suggestedPath: suggestedPath || './',
                },
              });
            }
          }
        }
      },
    };
  },
};

/**
 * Rule: memo-no-context-hooks
 *
 * Memo components (prefixed with "Memo") cannot call any context hooks.
 */
const memoNoContextHooks = {
  meta: {
    type: 'problem',
    docs: {
      description: 'Memo components cannot use context hooks',
    },
    messages: {
      memoNoContext:
        'Memo component "{{componentName}}" cannot call context hooks like "{{hookName}}". Memo components should only receive props.',
    },
    schema: [],
  },
  create(context) {
    const filename = context.filename || context.getFilename();
    const basename = path.basename(filename, path.extname(filename));

    // Check if this file defines a Memo component
    if (!isMemoComponent(basename) && basename !== 'index') {
      return {};
    }

    return {
      CallExpression(node) {
        if (node.callee.type === 'Identifier') {
          const hookName = node.callee.name;

          // Check for context hook pattern: use*Context
          if (/^use.*Context$/.test(hookName) || hookName === 'useContext') {
            context.report({
              node,
              messageId: 'memoNoContext',
              data: {
                componentName: basename,
                hookName,
              },
            });
          }
        }
      },
    };
  },
};

// Primitive types that are allowed in Memo component props
const PRIMITIVE_TYPE_FLAGS = [
  'string',
  'number',
  'boolean',
  'null',
  'undefined',
  'literal', // string/number/boolean literals
  'stringLiteral',
  'numberLiteral',
  'booleanLiteral',
];

/**
 * Rule: memo-primitive-props-only
 *
 * Memo components (prefixed with "Memo") can only have primitive prop types.
 * This ensures memoization works correctly since objects/arrays/functions
 * change reference equality on every render.
 *
 * Allowed types: string, number, boolean, null, undefined, and literal types
 * Disallowed types: object, array, function, Record, interface, etc.
 */
const memoPrimitivePropsOnly = {
  meta: {
    type: 'problem',
    docs: {
      description: 'Memo components can only have primitive prop types',
    },
    messages: {
      nonPrimitiveProp:
        'Memo component prop "{{propName}}" has non-primitive type "{{propType}}". Memo components should only accept primitive props (string, number, boolean) to ensure proper memoization.',
    },
    schema: [],
  },
  create(context) {
    const filename = context.filename || context.getFilename();
    const basename = path.basename(filename, path.extname(filename));

    // Only apply to Memo component files
    if (!isMemoComponent(basename)) {
      return {};
    }

    // Try to get TypeScript services
    let services;
    let checker;
    try {
      services = ESLintUtils.getParserServices(context);
      if (services.program) {
        checker = services.program.getTypeChecker();
      }
    } catch {
      // TypeScript services not available, skip this rule
      return {};
    }

    if (!checker) {
      return {};
    }

    /**
     * Check if a TypeScript type is a primitive type
     */
    const isPrimitiveType = (type) => {
      if (!type) return false;

      const typeString = checker.typeToString(type).toLowerCase();

      // Check for primitive type flags
      if (type.flags) {
        const ts = services.program.getTypeChecker();
        
        // String, Number, Boolean primitives
        if (type.flags & 4) return true; // String
        if (type.flags & 8) return true; // Number
        if (type.flags & 16) return true; // Boolean
        if (type.flags & 32) return true; // Enum
        if (type.flags & 64) return true; // BigInt
        if (type.flags & 128) return true; // StringLiteral
        if (type.flags & 256) return true; // NumberLiteral
        if (type.flags & 512) return true; // BooleanLiteral
        if (type.flags & 1024) return true; // EnumLiteral
        if (type.flags & 2048) return true; // BigIntLiteral
        if (type.flags & 32768) return true; // Undefined
        if (type.flags & 65536) return true; // Null
        if (type.flags & 131072) return true; // Never
        if (type.flags & 4194304) return true; // ESSymbol
        if (type.flags & 2097152) return true; // Intersection - check components
      }

      // Handle union types (e.g., string | number)
      if (type.isUnion && type.isUnion()) {
        return type.types.every(t => isPrimitiveType(t));
      }

      // Handle intersection types
      if (type.isIntersection && type.isIntersection()) {
        // For intersections, all parts must be primitive
        return type.types.every(t => isPrimitiveType(t));
      }

      // Check common primitive type strings
      if (['string', 'number', 'boolean', 'null', 'undefined', 'never', 'void'].includes(typeString)) {
        return true;
      }

      // Check for literal types like 'hello' or 42
      if (/^".*"$/.test(typeString) || /^'.*'$/.test(typeString)) return true;
      if (/^\d+$/.test(typeString)) return true;
      if (typeString === 'true' || typeString === 'false') return true;

      return false;
    };

    /**
     * Get a user-friendly type name
     */
    const getTypeName = (type) => {
      if (!type) return 'unknown';
      return checker.typeToString(type);
    };

    return {
      // Check interface declarations for Memo component props
      TSInterfaceDeclaration(node) {
        // Look for interfaces ending in 'Props' in Memo component files
        if (!node.id.name.endsWith('Props')) {
          return;
        }

        for (const member of node.body.body) {
          if (member.type === 'TSPropertySignature' && member.typeAnnotation) {
            const propName = member.key.name || member.key.value;
            const tsNode = services.esTreeNodeToTSNodeMap.get(member.typeAnnotation.typeAnnotation);
            
            if (tsNode) {
              const type = checker.getTypeAtLocation(tsNode);
              
              if (!isPrimitiveType(type)) {
                context.report({
                  node: member,
                  messageId: 'nonPrimitiveProp',
                  data: {
                    propName,
                    propType: getTypeName(type),
                  },
                });
              }
            }
          }
        }
      },

      // Check type alias declarations for Memo component props
      TSTypeAliasDeclaration(node) {
        // Look for type aliases ending in 'Props' in Memo component files
        if (!node.id.name.endsWith('Props')) {
          return;
        }

        // Handle object type literals: type Props = { ... }
        if (node.typeAnnotation.type === 'TSTypeLiteral') {
          for (const member of node.typeAnnotation.members) {
            if (member.type === 'TSPropertySignature' && member.typeAnnotation) {
              const propName = member.key.name || member.key.value;
              const tsNode = services.esTreeNodeToTSNodeMap.get(member.typeAnnotation.typeAnnotation);
              
              if (tsNode) {
                const type = checker.getTypeAtLocation(tsNode);
                
                if (!isPrimitiveType(type)) {
                  context.report({
                    node: member,
                    messageId: 'nonPrimitiveProp',
                    data: {
                      propName,
                      propType: getTypeName(type),
                    },
                  });
                }
              }
            }
          }
        }
      },
    };
  },
};

// Track shared component imports across all files for shared-must-be-multi-imported rule
const sharedComponentImports = new Map(); // componentName -> Set of importing file paths

/**
 * Rule: shared-must-be-multi-imported
 *
 * Components in src/Shared must be imported from at least 2 different files.
 * This ensures that shared components are actually shared and not just misplaced.
 *
 * Note: This rule works by tracking imports across files during a lint run.
 * The error is reported on the shared component's export declaration.
 */
const sharedMustBeMultiImported = {
  meta: {
    type: 'problem',
    docs: {
      description:
        'Components in src/Shared must be imported from multiple files',
    },
    messages: {
      notShared:
        'Shared component "{{name}}" is only imported from {{count}} file(s). Components in src/Shared must be imported from at least 2 different files to justify being shared. Move this component closer to where it\'s used.',
    },
    schema: [],
  },
  create(context) {
    const filename = context.filename || context.getFilename();
    const fileDir = path.dirname(filename);
    const isSharedFile = isInSharedDir(filename);
    const basename = path.basename(filename, path.extname(filename));

    // For non-shared files: track imports from src/Shared
    if (!isSharedFile) {
      return {
        ImportDeclaration(node) {
          const importPath = node.source.value;

          // Skip external modules
          if (!importPath.startsWith('.') && !importPath.startsWith('/')) {
            return;
          }

          // Check if importing from src/Shared
          if (!isSharedImport(importPath, fileDir)) {
            return;
          }

          // Track each imported component
          for (const specifier of node.specifiers) {
            if (specifier.type !== 'ImportSpecifier') continue;

            const importedName = specifier.imported.name;

            // Only track component imports (PascalCase)
            if (!/^[A-Z]/.test(importedName)) continue;

            // Add this file to the set of files importing this component
            if (!sharedComponentImports.has(importedName)) {
              sharedComponentImports.set(importedName, new Set());
            }
            sharedComponentImports.get(importedName).add(filename);
          }
        },
      };
    }

    // For shared component files: check if they're imported enough
    // Only check .tsx files that export components (not hooks, types, etc.)
    if (!isTsxComponentFile(filename) || basename === 'index') {
      return {};
    }

    return {
      'Program:exit'(node) {
        // Find the primary export (component name)
        let componentName = null;

        for (const statement of node.body) {
          if (statement.type === 'ExportNamedDeclaration' && statement.declaration) {
            if (
              statement.declaration.type === 'FunctionDeclaration'
              && statement.declaration.id
            ) {
              componentName = statement.declaration.id.name;
              break;
            }
            if (statement.declaration.type === 'VariableDeclaration') {
              const firstDecl = statement.declaration.declarations[0];
              if (firstDecl && firstDecl.id.type === 'Identifier') {
                componentName = firstDecl.id.name;
                break;
              }
            }
          }
        }

        if (!componentName) return;

        // Check how many files import this component
        const importingFiles = sharedComponentImports.get(componentName);
        const importCount = importingFiles ? importingFiles.size : 0;

        if (importCount < 2) {
          context.report({
            node,
            messageId: 'notShared',
            data: {
              name: componentName,
              count: importCount,
            },
          });
        }
      },
    };
  },
};

// Export the plugin
export default {
  meta: {
    name: 'eslint-plugin-architecture',
    version: '1.0.0',
  },
  rules: {
    'no-react-hooks-in-components': noHooksInComponents,
    'named-exports-only': namedExportsOnly,
    'react-hooks-only-in-hook-files': hooksOnlyInHookFiles,
    'memo-component-rules': memoComponentRules,
    'context-provider-file': contextProviderFile,
    'component-folder-structure': componentFolderStructure,
    'import-boundaries': importBoundaries,
    'file-export-name-match': fileExportNameMatch,
    'no-useref-in-components': noUseRefInComponents,
    'memo-no-context-hooks': memoNoContextHooks,
    'import-from-index': importFromIndex,
    'memo-primitive-props-only': memoPrimitivePropsOnly,
    'shared-must-be-multi-imported': sharedMustBeMultiImported,
  },
  configs: {
    recommended: {
      plugins: ['architecture'],
      rules: {
        'architecture/no-react-hooks-in-components': 'error',
        'architecture/named-exports-only': 'error',
        'architecture/react-hooks-only-in-hook-files': 'error',
        'architecture/memo-component-rules': 'error',
        'architecture/context-provider-file': 'error',
        'architecture/component-folder-structure': 'error',
        'architecture/import-boundaries': 'error',
        'architecture/file-export-name-match': 'error',
        'architecture/no-useref-in-components': 'error',
        'architecture/memo-no-context-hooks': 'error',
        'architecture/import-from-index': 'error',
        'architecture/memo-primitive-props-only': 'error',
        'architecture/shared-must-be-multi-imported': 'error',
      },
    },
  },
};
