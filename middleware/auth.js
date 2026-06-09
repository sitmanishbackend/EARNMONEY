'use strict';
const { MenuItem, RoleMenuPermission, Theme, Setting } = require('../models');

// Inject global template variables
const injectGlobals = async (req, res, next) => {
  try {
    // Active theme
    const activeTheme = await Theme.findOne({ where: { is_active: true } });
    res.locals.theme = activeTheme || { primary_color: '#1a7a4a', secondary_color: '#e8a020', accent_dark: '#125c36', accent_light: '#e8f5ee', sidebar_bg: '#1a2332', sidebar_text: '#ffffff', nav_bg: '#ffffff', btn_color: '#1a7a4a' };
    
    // Site settings
    const settings = await Setting.findAll();
    const siteSettings = {};
    settings.forEach(s => siteSettings[s.key] = s.value);
    res.locals.siteSettings = siteSettings;
    res.locals.siteName = siteSettings.site_name || 'Dreams Technology';
    
    // Auth user
    res.locals.authUser = req.session.user || null;
    res.locals.isLoggedIn = !!req.session.user;
    
    // Flash messages
    res.locals.flash = {
      success: req.session.flash_success || null,
      error: req.session.flash_error || null
    };
    delete req.session.flash_success;
    delete req.session.flash_error;
    
    next();
  } catch (e) {
    res.locals.theme = { primary_color: '#1a7a4a', secondary_color: '#e8a020', accent_dark: '#125c36', accent_light: '#e8f5ee', sidebar_bg: '#1a2332', sidebar_text: '#ffffff', nav_bg: '#ffffff', btn_color: '#1a7a4a' };
    res.locals.siteSettings = {};
    res.locals.siteName = 'Dreams Technology';
    res.locals.authUser = req.session.user || null;
    res.locals.isLoggedIn = !!req.session.user;
    res.locals.flash = { success: null, error: null };
    next();
  }
};

// Require admin login
const requireAdmin = (req, res, next) => {
  if (!req.session.user) {
    return res.redirect('/admin/login');
  }
  const allowed = ['super_admin', 'admin', 'developer', 'user'];
  if (!allowed.includes(req.session.user.role_slug)) {
    return res.redirect('/admin/login');
  }
  next();
};

// Require Super Admin or Admin
const requireSuperAdmin = (req, res, next) => {
  if (!req.session.user || !['super_admin'].includes(req.session.user.role_slug)) {
    req.session.flash_error = 'Access denied. Super Admin only.';
    return res.redirect('/admin/dashboard');
  }
  next();
};

// Load admin sidebar menu based on role
const loadAdminMenu = async (req, res, next) => {
  if (!req.session.user) return next();
  try {
    const perms = await RoleMenuPermission.findAll({
      where: { role_id: req.session.user.role_id, can_view: true },
      include: [{ model: MenuItem, as: 'menuItem', where: { is_active: true, menu_type: ['admin', 'both'] }, required: true }]
    });
    res.locals.adminMenu = perms
      .map(p => p.menuItem)
      .sort((a, b) => a.sort_order - b.sort_order);
  } catch (e) {
    res.locals.adminMenu = [];
  }
  next();
};

module.exports = { injectGlobals, requireAdmin, requireSuperAdmin, loadAdminMenu };
