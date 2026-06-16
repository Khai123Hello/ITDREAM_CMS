const cleanPath = (p) => p.replace(/^\/+/, '').replace(/\/+$/, '').toLowerCase();

const bePath = "/v1/blog/educator-list";
const configPath = "v1/blog/educator-list";

const normBe = cleanPath(bePath.replace(/\{[a-zA-Z0-9_]+\}/g, '{id}'));
const normConfig = cleanPath(configPath.replace(/\/:[a-zA-Z0-9_]+/g, '/{id}'));

console.log("normBe:", JSON.stringify(normBe));
console.log("normConfig:", JSON.stringify(normConfig));
console.log("Equals?", normBe === normConfig);
console.log("Be length:", normBe.length, "Config length:", normConfig.length);

for (let i = 0; i < normBe.length; i++) {
    if (normBe[i] !== normConfig[i]) {
        console.log(`Mismatch at index ${i}: BE code ${normBe.charCodeAt(i)}, Config code ${normConfig.charCodeAt(i)}`);
    }
}
