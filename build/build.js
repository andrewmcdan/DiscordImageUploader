// Build script to find all require statements and replace them with import statements
// Also replaces module.exports with export default

const fs = require("fs");
const path = require("path");

let commonJSPath = path.join(__dirname, "..", "index.js");
let modulePath = path.join(__dirname, "..", "index.mjs");

let commonJS = fs.readFileSync(commonJSPath).toString();

let regex = /const [a-zA-Z]+ = require\((\"|\')[\_\-a-zA-Z0-9]+(\"|\')\);/g;

let matches = commonJS.match(regex);

matches.forEach((match) => {
    let req = match.substring(match.indexOf("(") + 2, match.lastIndexOf(")") - 1);
    let constant = match.substring(match.indexOf("const ") + 6, match.indexOf(" = require"));
    let replacement = `import ${constant} from \"${req}\";`;
    commonJS = commonJS.replace(match, replacement);
});

commonJS = commonJS.replace("module.exports =", "export default");

fs.writeFileSync(modulePath, commonJS);