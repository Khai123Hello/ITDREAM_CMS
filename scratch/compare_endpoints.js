const fs = require('fs');
const path = require('path');

const controllerDir = 'D:/Git/BE/KLTN_ITDream/source/user-base-auth/src/main/java/com/base/auth/controller';
const apiConfigPath = 'src/constants/apiConfig.js';

const cleanPath = (p) => p.replace(/^\/+/, '').replace(/\/+$/, '').toLowerCase();

const beEndpoints = [];

const controllerFiles = fs.readdirSync(controllerDir).filter(
    (f) => f.endsWith('.java') && f !== 'ABasicController.java'
);

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
            currentMapping = {
                type: mappingMatch[1].toUpperCase(),
                path: mappingMatch[2]
            };
            continue;
        }
        
        const preAuthMatch = line.match(/@PreAuthorize\("hasRole\('([^']+)'\)"\)/);
        if (preAuthMatch) {
            currentPreAuthorize = preAuthMatch[1];
            continue;
        }
        
        if (currentMapping && line.match(/public\s+/)) {
            const methodMatch = line.match(/public\s+\S+\s+(\w+)\(/);
            const methodName = methodMatch ? methodMatch[1] : 'unknown';
            
            beEndpoints.push({
                controller: file,
                method: currentMapping.type,
                path: (basePath + currentMapping.path).replace(/\/+/g, '/'),
                role: currentPreAuthorize,
                methodName
            });
            
            currentMapping = null;
            currentPreAuthorize = null;
        }
    }
}

// Parse apiConfig.js Endpoints
const configEndpoints = [];
const apiConfigContent = fs.readFileSync(apiConfigPath, 'utf8');
const apiConfigLines = apiConfigContent.split('\n');

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
        if (match) {
            currentModule = match[1];
        }
    } else if (leadingSpaces === 8 && (trimmed.endsWith('{') || trimmed.endsWith('},'))) {
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
            if (currentBlock.path) {
                configEndpoints.push(currentBlock);
            }
            currentBlock = null;
        }
    } else if (leadingSpaces === 12 && currentBlock) {
        if (trimmed.startsWith('baseURL:') || trimmed.startsWith('path:')) {
            const urlMatch = trimmed.match(/(?:baseURL|path)\s*:\s*[`'"](.*)[`'"]/);
            if (urlMatch) {
                let rawUrl = urlMatch[1];
                // Remove optional backslash + variable like \${apiUrl} or ${apiUrl}
                rawUrl = rawUrl.replace(/\\?\$\{\w+\}/g, '');
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

const report = [];
report.push(`Parsed ${beEndpoints.length} BE endpoints.`);
report.push(`Parsed ${configEndpoints.length} config endpoints from apiConfig.js.`);

const mismatches = [];

for (const config of configEndpoints) {
    const normalizedConfigPath = cleanPath(config.path.replace(/\/:[a-zA-Z0-9_]+/g, '/{id}'));
    
    const matches = beEndpoints.filter((be) => {
        const normalizedBePath = cleanPath(be.path.replace(/\{[a-zA-Z0-9_]+\}/g, '{id}'));
        return normalizedBePath === normalizedConfigPath && be.method === config.method;
    });
    
    if (matches.length === 0) {
        mismatches.push({
            type: 'PATH_NOT_FOUND',
            config,
            message: `❌ PATH NOT FOUND: [${config.module}.${config.endpoint}] CMS config has [${config.method}] ${config.path} - Not found on BE`
        });
    } else {
        const matchBe = matches[0];
        if (config.permissionCode && matchBe.role && config.permissionCode !== matchBe.role) {
            mismatches.push({
                type: 'ROLE_MISMATCH',
                config,
                be: matchBe,
                message: `⚠️ ROLE MISMATCH: [${config.module}.${config.endpoint}] [${config.method}] ${config.path} -> CMS has permissionCode '${config.permissionCode}', BE has hasRole('${matchBe.role}')`
            });
        }
    }
}

report.push("\n--- ROLE MISMATCHES (CRITICAL) ---");
const roleMismatches = mismatches.filter(m => m.type === 'ROLE_MISMATCH');
roleMismatches.forEach(m => report.push(m.message));

report.push("\n--- PATH NOT FOUND (LEGACY/UNUSED OR WRONG) ---");
const pathMismatches = mismatches.filter(m => m.type === 'PATH_NOT_FOUND');
pathMismatches.forEach(m => report.push(m.message));

report.push(`\nTotal issues found: ${mismatches.length}`);

fs.writeFileSync('scratch/compare_results_new.txt', report.join('\n'), 'utf8');
console.log("Wrote comparison report to scratch/compare_results_new.txt");
console.log(`Summary: Mismatches found: ${mismatches.length}`);
