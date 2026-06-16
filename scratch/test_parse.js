const fs = require('fs');

const apiConfigPath = 'src/constants/apiConfig.js';
const content = fs.readFileSync(apiConfigPath, 'utf8');
const lines = content.split('\n');

const configEndpoints = [];
let currentModule = null;
let currentEndpoint = null;
let currentBlock = null;

for (let i = 0; i < lines.length; i++) {
    const line = lines[i];
    const trimmed = line.trim();
    if (!trimmed) continue;
    
    // Count leading spaces
    const leadingSpaces = line.match(/^ */)[0].length;
    
    if (leadingSpaces === 4 && trimmed.endsWith('{')) {
        // Module level
        const match = trimmed.match(/^(\w+)\s*:/);
        if (match) {
            currentModule = match[1];
        }
    } else if (leadingSpaces === 8 && (trimmed.endsWith('{') || trimmed.endsWith('},'))) {
        // Endpoint level
        if (trimmed.endsWith('{')) {
            const match = trimmed.match(/^(?:get\s+)?(\w+)/);
            if (match) {
                currentEndpoint = match[1];
                currentBlock = {
                    module: currentModule,
                    endpoint: currentEndpoint,
                    path: null,
                    method: null,
                    permissionCode: null
                };
            }
        } else if (trimmed.startsWith('}') && currentBlock) {
            // End of block
            if (currentBlock.path) {
                configEndpoints.push(currentBlock);
            }
            currentBlock = null;
        }
    } else if (leadingSpaces === 12 && currentBlock) {
        // Attributes
        if (trimmed.startsWith('baseURL:') || trimmed.startsWith('path:')) {
            const urlMatch = trimmed.match(/(?:baseURL|path)\s*:\s*[`'"](.*)[`'"]/);
            if (urlMatch) {
                let rawUrl = urlMatch[1];
                // Strip variables like ${apiUrl}, ${apiTenantUrl}, ${apiMediaUrl}
                rawUrl = rawUrl.replace(/\$\{\w+\}/g, '');
                currentBlock.path = rawUrl;
            }
        } else if (trimmed.startsWith('method:')) {
            const methodMatch = trimmed.match(/method\s*:\s*[`'"](\w+)[`'"]/);
            if (methodMatch) {
                currentBlock.method = methodMatch[1].toUpperCase();
            }
        } else if (trimmed.startsWith('permissionCode:')) {
            const permMatch = trimmed.match(/permissionCode\s*:\s*['"]([^'"]+)['"]/);
            if (permMatch) {
                currentBlock.permissionCode = permMatch[1];
            }
        }
    }
}

console.log(`Parsed ${configEndpoints.length} endpoints from apiConfig.js`);
console.log("Sample:", configEndpoints.slice(0, 5));
