'use strict';
require('dotenv').config();
const express = require('express');
const session = require('express-session');
const fileUpload = require('express-fileupload');
const methodOverride = require('method-override');
const path = require('path');
const { sequelize } = require('./models');
const { injectGlobals } = require('./middleware/auth');

const app = express();
const PORT = process.env.PORT || 8001;

// View engine
app.set('view engine', 'ejs');
app.set('views', path.join(__dirname, 'views'));

// Static files
app.use(express.static(path.join(__dirname, 'public')));

// Body parsing
app.use(express.urlencoded({ extended: true, limit: '50mb' }));
app.use(express.json({ limit: '50mb' }));
app.use(methodOverride('_method'));

// File upload
app.use(fileUpload({ createParentPath: true, useTempFiles: false }));

// Session
app.use(session({
  secret: process.env.SESSION_SECRET || 'dreams_secret',
  resave: false,
  saveUninitialized: false,
  cookie: { secure: false, maxAge: 24 * 60 * 60 * 1000 }
}));

// Global middleware
app.use(injectGlobals);

app.use((req, res, next) => {
    console.log('REQUEST =>', req.method, req.originalUrl);
    next();
});
// Routes
app.use('/', require('./routes/sitemap'));
app.use('/', require('./routes/website'));
app.use('/admin', require('./routes/admin'));
app.use('/api', require('./routes/api'));
const marketRouter = require('./routes/market');
app.use(require('./routes/myxosChat'));
app.use('/api', marketRouter);

// 404
app.use((req, res) => {
  res.status(404).render('website/pages/404', { title: '404 - Page Not Found' });
});

// Error handler
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).send('<h1>Server Error</h1><p>' + err.message + '</p>');
});

// Start
sequelize.authenticate()
  .then(() => {
    console.log('✅ Database connected');
    app.listen(PORT, () => {
      console.log(`🚀 Dreams CMS running on http://localhost:${PORT}`);
      console.log(`🔑 Admin: http://localhost:${PORT}/admin`);
    });
  })
  .catch(err => {
    console.error('❌ Database error:', err.message);
    console.log('💡 Run: npm run migrate && npm run seed');
    process.exit(1);
  });

module.exports = app;