const fs = require('fs');
const path = require('path');

const serverPath = path.join(__dirname, 'server.js');
let serverCode = fs.readFileSync(serverPath, 'utf8');

// The new apiController code
let apiControllerCode = `const { sql, poolPromise } = require('../config/db');
const { JWT_SECRET } = require('../middlewares/authMiddleware');
const jwt = require('jsonwebtoken');
const bcrypt = require('bcrypt');
const nodemailer = require('nodemailer');

const apiController = {
`;

// Find all app.get, app.post, app.delete, app.put
const regex = /app\.(get|post|delete|put)\('([^']+)',\s*(?:verifyToken,\s*)?async\s*\(req,\s*res\)\s*=>\s*\{([\s\S]*?\n\}\);\n)/g;
let match;
const routes = [];

while ((match = regex.exec(serverCode)) !== null) {
    const method = match[1];
    const route = match[2];
    const isProtected = match[0].includes('verifyToken');
    const body = match[3];
    
    // Convert route /api/login to login
    let funcName = route.replace('/api/', '').replace(/:/g, '').replace(/-/g, '_').replace(/\//g, '_');
    if (funcName === '') funcName = 'index';
    
    routes.push({ method, route: route.replace('/api', ''), isProtected, funcName });
    
    apiControllerCode += `    ${funcName}: async (req, res) => {${body.slice(0, -4)}    },\n\n`;
}

apiControllerCode += `};

module.exports = apiController;
`;

fs.writeFileSync(path.join(__dirname, 'backend', 'controllers', 'apiController.js'), apiControllerCode);

// The new apiRoutes code
let apiRoutesCode = `const express = require('express');
const router = express.Router();
const apiController = require('../controllers/apiController');
const { verifyToken } = require('../middlewares/authMiddleware');

`;

for (const r of routes) {
    const mw = r.isProtected ? 'verifyToken, ' : '';
    apiRoutesCode += `router.${r.method}('${r.route}', ${mw}apiController.${r.funcName});\n`;
}

apiRoutesCode += `\nmodule.exports = router;\n`;

fs.writeFileSync(path.join(__dirname, 'backend', 'routes', 'apiRoutes.js'), apiRoutesCode);

// The new server.js code
let newServerCode = `const express = require('express');
const cors = require('cors');
const path = require('path');
const cookieParser = require('cookie-parser');
require('dotenv').config();

const app = express();
app.use(cors({ origin: 'http://localhost:3000', credentials: true }));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(cookieParser());
app.use(express.static(path.join(__dirname, 'public')));

const apiRoutes = require('./backend/routes/apiRoutes');
app.use('/api', apiRoutes);

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => console.log(\`✅ Sunucu \${PORT} portunda çalışıyor.\`));
`;

fs.writeFileSync(path.join(__dirname, 'server.js'), newServerCode);

console.log('Backend refactoring completed!');
