const fs = require('fs');
const lines = fs.readFileSync('server.js', 'utf8').split('\n');

let dbStart = -1, dbEnd = -1;
let authStart = -1, authEnd = -1;
let routesStart = -1, routesEnd = -1;

for (let i = 0; i < lines.length; i++) {
    if (lines[i].includes('// SQL BAĞLANTISI')) dbStart = i;
    if (lines[i].includes('// ==========================================') && dbEnd === -1 && authEnd === -1) {
        if (dbStart !== -1 && dbEnd === -1) dbEnd = i - 1;
    }
    
    if (lines[i].includes('// 🚨 [GÜVENLİK] KAMERA SİSTEMİ')) authEnd = i - 1; 
    
    if (lines[i].includes('// 1. KULLANICI KAYDI')) routesStart = i - 1;
    if (lines[i].includes('const PORT = process.env.PORT')) routesEnd = i - 1;
}

// 1. DB
const dbLines = lines.slice(dbStart, dbEnd).join('\n');
fs.writeFileSync('backend/config/db.js', 'const sql = require(\'mssql/msnodesqlv8\');\n' + dbLines + '\nmodule.exports = { sql, poolPromise };\n');

// 2. Auth Middleware
for (let i = 0; i < lines.length; i++) {
    if (lines[i].includes("const jwt = require('jsonwebtoken');")) {
        authStart = i;
        break;
    }
}
let authLines = '';
for (let i = authStart; i < lines.length; i++) {
    authLines += lines[i] + '\n';
    if (lines[i] === '};' && lines[i-1] && lines[i-1].includes('    });')) {
        authEnd = i;
        break;
    }
}
fs.writeFileSync('backend/middlewares/authMiddleware.js', authLines + '\nmodule.exports = { verifyToken, JWT_SECRET };\n');

// 3. Routes
const routeLines = lines.slice(routesStart, routesEnd).join('\n');
const apiRoutesCode = 'module.exports = function(app, sql, poolPromise, bcrypt, jwt, JWT_SECRET, nodemailer, verifyToken) {\n' + routeLines + '\n};\n';
fs.writeFileSync('backend/routes/apiRoutes.js', apiRoutesCode);

// 4. Update server.js
let serverLines = [];
let skip = false;
for (let i = 0; i < lines.length; i++) {
    if (i === dbStart) {
        serverLines.push('const { poolPromise } = require(\'./backend/config/db\');');
        skip = true;
    }
    if (i === dbEnd) skip = false;
    
    if (i === authStart) {
        serverLines.push('const { verifyToken, JWT_SECRET } = require(\'./backend/middlewares/authMiddleware\');');
        skip = true;
    }
    if (i === authEnd) { skip = false; continue; }
    
    if (i === routesStart) {
        serverLines.push('require(\'./backend/routes/apiRoutes\')(app, sql, poolPromise, bcrypt, jwt, JWT_SECRET, nodemailer, verifyToken);');
        skip = true;
    }
    if (i === routesEnd) skip = false;
    
    if (!skip) serverLines.push(lines[i]);
}

fs.writeFileSync('server.js', serverLines.join('\n'));
console.log('Safe modularization complete!');
