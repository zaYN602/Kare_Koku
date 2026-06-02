const fs = require('fs');

const lines = fs.readFileSync('server.js', 'utf8').split('\n');

// 1. db.js (Lines 38 to 53)
const dbLines = lines.slice(38, 54).join('\n'); // 54 is not inclusive
fs.writeFileSync('backend/config/db.js', 'const sql = require(\'mssql/msnodesqlv8\');\n' + dbLines + '\nmodule.exports = { sql, poolPromise };\n');

// 2. authMiddleware.js (Lines 9 to 25)
const authLines = lines.slice(9, 26).join('\n'); // 26 is not inclusive
fs.writeFileSync('backend/middlewares/authMiddleware.js', authLines + '\nmodule.exports = { verifyToken, JWT_SECRET };\n');

// 3. apiRoutes.js (Lines 55 to 678)
const routeLines = lines.slice(55, 678).join('\n'); // 678 is not inclusive
const apiRoutesCode = 'module.exports = function(app, sql, poolPromise, bcrypt, jwt, JWT_SECRET, nodemailer, verifyToken) {\n' + routeLines + '\n};\n';
fs.writeFileSync('backend/routes/apiRoutes.js', apiRoutesCode);

// 4. Update server.js
const serverLines = [];
for (let i = 0; i < lines.length; i++) {
    if (i >= 9 && i < 26) {
        if (i === 9) serverLines.push('const { verifyToken, JWT_SECRET } = require(\'./backend/middlewares/authMiddleware\');');
        continue;
    }
    if (i >= 38 && i < 54) {
        if (i === 38) serverLines.push('const { poolPromise, sql } = require(\'./backend/config/db\');');
        continue;
    }
    if (i >= 55 && i < 678) {
        if (i === 55) serverLines.push('require(\'./backend/routes/apiRoutes\')(app, sql, poolPromise, bcrypt, jwt, JWT_SECRET, nodemailer, verifyToken);');
        continue;
    }
    serverLines.push(lines[i]);
}

// Remove the `const sql = require('mssql/msnodesqlv8');` at the top because it's imported from db.js now
let finalServerCode = serverLines.join('\n');
finalServerCode = finalServerCode.replace("const sql = require('mssql/msnodesqlv8');\n", "");

fs.writeFileSync('server.js', finalServerCode);
console.log('Exact modularization complete!');
