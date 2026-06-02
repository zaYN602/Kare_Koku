const fs = require('fs');

let serverCode = fs.readFileSync('server.js', 'utf8');

// 1. db.js
const dbStart = serverCode.indexOf('const sql = require(\'mssql/msnodesqlv8\');');
const dbEnd = serverCode.indexOf('// ==========================================');
const dbCode = serverCode.substring(dbStart, dbEnd);
fs.writeFileSync('backend/config/db.js', dbCode + '\nmodule.exports = { sql, poolPromise };\n');
serverCode = serverCode.replace(dbCode, 'const { poolPromise, sql } = require(\'./backend/config/db\');\n\n');

// 2. authMiddleware.js
const authStart = serverCode.indexOf('\nconst jwt = require(\'jsonwebtoken\');');
const authEndStr = '    });\n};\n';
const authEnd = serverCode.indexOf(authEndStr) + authEndStr.length;
const authCode = serverCode.substring(authStart, authEnd);
fs.writeFileSync('backend/middlewares/authMiddleware.js', authCode + '\nmodule.exports = { verifyToken, JWT_SECRET };\n');
serverCode = serverCode.replace(authCode, '\nconst { verifyToken, JWT_SECRET } = require(\'./backend/middlewares/authMiddleware\');\n');

// 3. apiRoutes.js
const routesStart = serverCode.indexOf('// 1. KULLANICI KAYDI');
const routesEndStr = 'const PORT = process.env.PORT';
const routesEnd = serverCode.indexOf(routesEndStr);
const routesCode = serverCode.substring(routesStart, routesEnd);

const apiRoutesCode = `module.exports = function(app, sql, poolPromise, bcrypt, jwt, JWT_SECRET, nodemailer, verifyToken) {\n${routesCode}};\n`;
fs.writeFileSync('backend/routes/apiRoutes.js', apiRoutesCode);

serverCode = serverCode.replace(routesCode, `require('./backend/routes/apiRoutes')(app, sql, poolPromise, bcrypt, jwt, JWT_SECRET, nodemailer, verifyToken);\n\n`);

fs.writeFileSync('server.js', serverCode);
console.log('Flawless MVC separation completed!');
