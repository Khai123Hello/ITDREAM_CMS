const fs = require('fs');
const path = require('path');

const controllerDir = 'D:/Git/BE/KLTN_ITDream/source/user-base-auth/src/main/java/com/base/auth/controller';
const apiConfigPath = 'src/constants/apiConfig.js';
const cleanPath = (p) => p.replace(/^\/+/, '').replace(/\/+$/, '').toLowerCase();

// Parse BE
const beEndpoints = [];
const controllerFiles = fs.readdirSync(controllerDir).filter(f => f.endsWith('.java') && f !== 'ABasicController.java');
for (const file of controllerFiles) {
    const content = fs.readFileSync(path.join(controllerDir, file), 'utf8');
    const baseMappingMatch = content.match(/@RequestMapping\("([^"]+)"\)/);
    if (!baseMappingMatch) continue;
    const basePath = baseMappingMatch[1];
    
    const lines = content.split('\n');
    let currentMapping = null;
    let currentPreAuthorize = null;
    
    for (let i = 0; i < lines.length; i++) {
        const line = lines[i].trim();
        const mappingMatch = line.match(/@(Get|Post|Put|Delete)Mapping\(\s*(?:value\s*=\s*)?"([^"]*)"/);
        if (mappingMatch) {
            currentMapping = { type: mappingMatch[1].toUpperCase(), path: mappingMatch[2] };
            continue;
        }
        const preAuthMatch = line.match(/@PreAuthorize\("hasRole\('([^']+)'\)"\)/);
        if (preAuthMatch) {
            currentPreAuthorize = preAuthMatch[1];
            continue;
        }
        if (currentMapping && line.match(/public\s+/)) {
            beEndpoints.push({
                controller: file,
                method: currentMapping.type,
                path: (basePath + currentMapping.path).replace(/\/+/g, '/'),
                role: currentPreAuthorize
            });
            currentMapping = null;
            currentPreAuthorize = null;
        }
    }
}

// Parse Config
const configEndpoints = [];
const apiConfigLines = fs.readFileSync(apiConfigPath, 'utf8').split('\n');
let currentModule = null;
let currentEndpoint = null;
let currentBlock = null;

for (let i = 0; i < apiConfigLines.length; i++) {
    const line = apiConfigLines[i];
    const trimmed = line.trim();
    if (!trimmed) continue;
    const leadingSpaces = line.match(/^ */)[0].length;
    if (leadingSpaces === 4 && trimmed.endsWith('{')) {
        const match = trimmed.match(/^(\w+)\s*:/);
        if (match) currentModule = match[1];
    } else if (leadingSpaces === 8 && (trimmed.endsWith('{') || trimmed.endsWith('},'))) {
        if (trimmed.endsWith('{')) {
            const match = trimmed.match(/^(?:get\s+)?(\w+)/);
            if (match) {
                currentEndpoint = match[1];
                currentBlock = { module: currentModule, endpoint: currentEndpoint, path: null, method: null, permissionCode: null };
            }
        } else if (trimmed.startsWith('}') && currentBlock) {
            if (currentBlock.path) configEndpoints.push(currentBlock);
            currentBlock = null;
        }
    } else if (leadingSpaces === 12 && currentBlock) {
        if (trimmed.startsWith('baseURL:') || trimmed.startsWith('path:')) {
            const urlMatch = trimmed.match(/(?:baseURL|path)\s*:\s*[`'"](.*)[`'"]/);
            if (urlMatch) {
                let rawUrl = urlMatch[1].replace(/\\?\$\{\w+\}/g, '');
                currentBlock.path = rawUrl;
            }
        } else if (trimmed.startsWith('method:')) {
            const methodMatch = trimmed.match(/method\s*:\s*[`'"](\w+)[`'"]/);
            if (methodMatch) currentBlock.method = methodMatch[1].toUpperCase();
        }
    }
}

const matchDetails = [];
for (const config of configEndpoints) {
    const normConfig = cleanPath(config.path.replace(/\/:[a-zA-Z0-9_]+/g, '/{id}'));
    
    // Find matching by path only first
    const pathMatches = beEndpoints.filter(be => cleanPath(be.path.replace(/\{[a-zA-Z0-9_]+\}/g, '{id}')) === normConfig);
    const exactMatches = pathMatches.filter(be => be.method === config.method);
    
    matchDetails.push({
        module: config.module,
        endpoint: config.endpoint,
        configPath: config.path,
        normConfig,
        method: config.method,
        hasPathMatch: pathMatches.length > 0,
        hasExactMatch: exactMatches.length > 0,
        bePathsFound: pathMatches.map(be => be.path)
    });
}

fs.writeFileSync('scratch/match_details.json', JSON.stringify(matchDetails, null, 2), 'utf8');
console.log("Wrote match details to scratch/match_details.json");
