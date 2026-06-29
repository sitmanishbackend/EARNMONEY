'use strict';
const express = require('express');
const router = express.Router();
const bcrypt = require('bcryptjs');
const { Op } = require('sequelize');
const slugify = require('slugify');
const moment = require('moment');
const { requireAdmin, requireSuperAdmin, loadAdminMenu } = require('../middleware/auth');
const {
  User, Role, Theme, MenuItem, RoleMenuPermission, BlogPost, BlogCategory,
  PostCustomField, PostSuggestion, AdZone, Advertisement, BankAccount,
  ExpenseCategory, Transaction, AttendanceRecord, SalaryPayment,
  Setting, SeoIndex, Page, sequelize
} = require('../models');


router.use((req, res, next) => {
  console.log('PATH =>', req.path);
  console.log('SESSION =>', req.session.user);
  next();
});
// Apply middleware to all admin routes (except login)
router.use((req, res, next) => {
  if (['/login', '/logout'].includes(req.path)) {
    return next();
  }

  requireAdmin(req, res, next);
});
router.use(loadAdminMenu);

// ─── LOGIN ───────────────────────────────────────
router.get('/login', (req, res) => {
  if (req.session.user) return res.redirect('/admin/dashboard');
  res.render('admin/pages/login', { title: 'Admin Login', layout: false });
});

router.post('/login', async (req, res) => {
  const { email, password } = req.body;
  try {
    const user = await User.findOne({ where: { email }, include: [{ model: Role, as: 'role' }] });
    if (!user || !user.is_active) { req.session.flash_error = 'Invalid credentials'; return res.redirect('/admin/login'); }
    const valid = await bcrypt.compare(password, user.password);
    if (!valid) { req.session.flash_error = 'Invalid credentials'; return res.redirect('/admin/login'); }
    req.session.user = { id: user.id, name: user.name, email: user.email, role_id: user.role_id, role_slug: user.role ? user.role.slug : 'user', avatar: user.avatar };
    await user.update({ last_login: new Date() });
    req.session.flash_success = `Welcome back, ${user.name}!`;
    res.redirect('/admin/dashboard');
  } catch(e) { console.error(e); req.session.flash_error = 'Server error'; res.redirect('/admin/login'); }
});

router.get('/logout', (req, res) => {
  req.session.destroy(() => res.redirect('/admin/login'));
});

// ─── DASHBOARD ───────────────────────────────────────
// ─── DASHBOARD ───────────────────────────────────────────────────────────────
router.get('/dashboard', async (req, res) => {

  const roleSlug = req.session.user ? req.session.user.role_slug : 'user';
  const userId   = req.session.user ? req.session.user.id        : null;

  const isSuperAdmin = roleSlug === 'super_admin';
  const isAdmin      = roleSlug === 'admin';
  const isDeveloper  = roleSlug === 'developer';
  const isUser       = roleSlug === 'user';

  try {

    // ══════════════════════════════════
    //  DATA COMMON TO ALL ROLES
    // ══════════════════════════════════

    // Active theme name (for Developer card)
    const activeTheme = await Theme.findOne({ where: { is_active: true } });
    const activeThemeName = activeTheme ? activeTheme.name : 'Default';

    // ══════════════════════════════════
    //  SUPER ADMIN  — full platform view
    // ══════════════════════════════════
    if (isSuperAdmin) {

      const [
        totalPosts,
        totalUsers,
        totalCategories,
        totalIncome,
        totalExpense,
        totalViews,
        monthlyData,
        recentPosts,
        topPosts,
        recentTransactions,
        bankAccounts,
        roleDistribution,
      ] = await Promise.all([

        BlogPost.count({ where: { status: 'published' } }),

        User.count({ where: { is_active: true } }),

        BlogCategory.count({ where: { is_active: true } }),

        Transaction.sum('amount', { where: { type: 'income' } }),

        Transaction.sum('amount', { where: { type: 'expense' } }),

        // Sum all post views
        BlogPost.sum('views'),

        // Monthly income vs expense — last 12 months
        Transaction.findAll({
          attributes: [
            [sequelize.fn('MONTH', sequelize.col('transaction_date')), 'month'],
            [sequelize.fn('YEAR',  sequelize.col('transaction_date')), 'year'],
            'type',
            [sequelize.fn('SUM', sequelize.col('amount')), 'total']
          ],
          group: ['month', 'year', 'type'],
          order: [['year', 'ASC'], ['month', 'ASC']],
          raw: true
        }),

        // Recent posts with category name
        sequelize.query(`
          SELECT bp.*, bc.name AS category_name
          FROM blog_posts bp
          LEFT JOIN blog_categories bc ON bp.category_id = bc.id
          ORDER BY bp.createdAt DESC
          LIMIT 6
        `).then(([rows]) => rows),

        // Top posts by views
        sequelize.query(`
          SELECT bp.*, bc.name AS category_name
          FROM blog_posts bp
          LEFT JOIN blog_categories bc ON bp.category_id = bc.id
          ORDER BY bp.views DESC
          LIMIT 5
        `).then(([rows]) => rows),

        // Recent transactions
        Transaction.findAll({
          order: [['createdAt', 'DESC']],
          limit: 6,
          raw: true
        }),

        // Bank accounts with balances
        BankAccount.findAll({
          where: { is_active: true },
          order: [['id', 'ASC']],
          raw: true
        }),

        // Role distribution
        sequelize.query(`
          SELECT r.name, COUNT(u.id) AS total
          FROM roles r
          LEFT JOIN users u ON u.role_id = r.id AND u.is_active = 1
          GROUP BY r.id, r.name
        `).then(([rows]) => rows),
      ]);

      return res.render('admin/pages/dashboard', {
        title: 'Dashboard',
        // flags
        isSuperAdmin, isAdmin, isDeveloper, isUser,
        // data
        totalPosts,
        totalUsers,
        totalCategories,
        totalIncome:  totalIncome  || 0,
        totalExpense: totalExpense || 0,
        totalViews:   totalViews   || 0,
        monthlyData,
        recentPosts,
        topPosts,
        recentTransactions,
        bankAccounts,
        roleDistribution,
        activeThemeName,
        // placeholders for other roles (prevents EJS undefined errors)
        currentMonthIncome: 0,
        myAttendanceSummary: null,
        myAttendanceRecords: [],
        mySalary: null,
        mySalaryType: null,
      });
    }

    // ══════════════════════════════════
    //  ADMIN — editorial + finance view
    // ══════════════════════════════════
    if (isAdmin) {

      const now     = new Date();
      const month   = now.getMonth() + 1;
      const year    = now.getFullYear();
      const padM    = String(month).padStart(2, '0');
      const fromDate = `${year}-${padM}-01`;
      const toDate   = `${year}-${padM}-31`;

      const [
        totalPosts,
        totalUsers,
        totalViews,
        currentMonthIncome,
        monthlyData,
        recentPosts,
        recentTransactions,
      ] = await Promise.all([

        BlogPost.count({ where: { status: 'published' } }),

        User.count({ where: { is_active: true } }),

        BlogPost.sum('views'),

        Transaction.sum('amount', {
          where: {
            type: 'income',
            transaction_date: { [Op.between]: [fromDate, toDate] }
          }
        }),

        Transaction.findAll({
          attributes: [
            [sequelize.fn('MONTH', sequelize.col('transaction_date')), 'month'],
            [sequelize.fn('YEAR',  sequelize.col('transaction_date')), 'year'],
            'type',
            [sequelize.fn('SUM', sequelize.col('amount')), 'total']
          ],
          group: ['month', 'year', 'type'],
          order: [['year', 'ASC'], ['month', 'ASC']],
          raw: true
        }),

        sequelize.query(`
          SELECT bp.*, bc.name AS category_name
          FROM blog_posts bp
          LEFT JOIN blog_categories bc ON bp.category_id = bc.id
          ORDER BY bp.createdAt DESC
          LIMIT 5
        `).then(([rows]) => rows),

        Transaction.findAll({
          order: [['createdAt', 'DESC']],
          limit: 5,
          raw: true
        }),
      ]);

      return res.render('admin/pages/dashboard', {
        title: 'Dashboard',
        isSuperAdmin, isAdmin, isDeveloper, isUser,
        totalPosts,
        totalUsers,
        totalViews:          totalViews          || 0,
        currentMonthIncome:  currentMonthIncome  || 0,
        monthlyData,
        recentPosts,
        recentTransactions,
        activeThemeName,
        // unused for this role
        totalIncome: 0, totalExpense: 0,
        topPosts: [], bankAccounts: [], roleDistribution: [],
        myAttendanceSummary: null, myAttendanceRecords: [],
        mySalary: null, mySalaryType: null,
        totalCategories: 0,
      });
    }

    // ══════════════════════════════════
    //  DEVELOPER — content + tech view
    // ══════════════════════════════════
    if (isDeveloper) {

      const [
        totalPosts,
        totalCategories,
        totalViews,
        topPosts,
      ] = await Promise.all([

        BlogPost.count({ where: { status: 'published' } }),

        BlogCategory.count({ where: { is_active: true } }),

        BlogPost.sum('views'),

        sequelize.query(`
          SELECT bp.*, bc.name AS category_name
          FROM blog_posts bp
          LEFT JOIN blog_categories bc ON bp.category_id = bc.id
          ORDER BY bp.views DESC
          LIMIT 6
        `).then(([rows]) => rows),
      ]);

      return res.render('admin/pages/dashboard', {
        title: 'Dashboard',
        isSuperAdmin, isAdmin, isDeveloper, isUser,
        totalPosts,
        totalCategories,
        totalViews:  totalViews || 0,
        topPosts,
        activeThemeName,
        // unused
        totalUsers: 0, totalIncome: 0, totalExpense: 0,
        currentMonthIncome: 0, monthlyData: [],
        recentPosts: [], recentTransactions: [], bankAccounts: [], roleDistribution: [],
        myAttendanceSummary: null, myAttendanceRecords: [],
        mySalary: null, mySalaryType: null,
      });
    }

    // ══════════════════════════════════
    //  USER (Basic Staff) — personal view
    // ══════════════════════════════════

    const now   = new Date();
    const month = now.getMonth() + 1;
    const year  = now.getFullYear();
    const padM  = String(month).padStart(2, '0');
    const daysInMonth = new Date(year, month, 0).getDate();
    const fromDate = `${year}-${padM}-01`;
    const toDate   = `${year}-${padM}-${daysInMonth}`;

    // Get the current user's full record (salary info)
    const currentUser = await User.findByPk(userId, {
      attributes: ['id', 'name', 'email', 'salary_type', 'salary_amount'],
      raw: true
    });

    // Attendance records this month for this user
    const myAttendanceRecords = await AttendanceRecord.findAll({
      where: {
        user_id: userId,
        attendance_date: { [Op.between]: [fromDate, toDate] }
      },
      order: [['attendance_date', 'ASC']],
      raw: true
    });

    // Summarise attendance
    let presentCount = 0, absentCount = 0, totalAdvance = 0;
    myAttendanceRecords.forEach(r => {
      if (r.status === 'P')   presentCount += 1;
      if (r.status === 'P+H') presentCount += 1.5;
      if (r.status === 'P+P') presentCount += 2;
      if (r.status === 'OT')  presentCount += 1;
      if (r.status === 'PA')  presentCount += 0.5;
      if (r.status === 'A')   absentCount  += 1;
      totalAdvance += parseFloat(r.advance_amount) || 0;
    });

    const myAttendanceSummary = {
      present: presentCount,
      absent:  absentCount,
      advance: totalAdvance,
    };

    return res.render('admin/pages/dashboard', {
      title: 'Dashboard',
      isSuperAdmin, isAdmin, isDeveloper, isUser,
      myAttendanceSummary,
      myAttendanceRecords,
      mySalary:     currentUser ? currentUser.salary_amount : null,
      mySalaryType: currentUser ? currentUser.salary_type   : null,
      activeThemeName,
      // unused
      totalPosts: 0, totalUsers: 0, totalCategories: 0,
      totalIncome: 0, totalExpense: 0, totalViews: 0,
      currentMonthIncome: 0, monthlyData: [],
      recentPosts: [], topPosts: [], recentTransactions: [],
      bankAccounts: [], roleDistribution: [],
    });

  } catch (err) {
    console.error('Dashboard error:', err);

    // Safe fallback — never crash the dashboard
    return res.render('admin/pages/dashboard', {
      title: 'Dashboard',
      isSuperAdmin, isAdmin, isDeveloper, isUser,
      totalPosts: 0, totalUsers: 0, totalCategories: 0,
      totalIncome: 0, totalExpense: 0, totalViews: 0,
      currentMonthIncome: 0, monthlyData: [],
      recentPosts: [], topPosts: [], recentTransactions: [],
      bankAccounts: [], roleDistribution: [],
      myAttendanceSummary: null, myAttendanceRecords: [],
      mySalary: null, mySalaryType: null,
      activeThemeName: 'Default',
    });
  }
});
// ─── POSTS ───────────────────────────────────────
router.get('/posts', async (req, res) => {
  const { status, cat, q } = req.query;
  let where = {};
  if (status) where.status = status;
  if (cat) where.category_id = cat;
  if (q) where[Op.or] = [{ title: { [Op.like]: `%${q}%` } }, { title_hi: { [Op.like]: `%${q}%` } }];
  try {
    const [[posts], categories] = await Promise.all([
      sequelize.query(`
  SELECT bp.*, bc.name as category_name, bc.icon as category_icon
  FROM blog_posts bp
  LEFT JOIN blog_categories bc ON bp.category_id = bc.id
  WHERE 1=1
  ${status ? `AND bp.status = '${status}'` : ''}
  ${cat ? `AND bp.category_id = ${parseInt(cat)}` : ''}
  ${q ? `AND (bp.title LIKE '%${q.replace(/'/g,"\\'")}%' OR bp.title_hi LIKE '%${q.replace(/'/g,"\\'")}%')` : ''}
  ORDER BY bp.createdAt DESC
`),
      // BlogPost.findAll({ where, include: [{ model: BlogCategory, as: 'category' }], order: [['createdAt', 'DESC']] }),
      BlogCategory.findAll({ where: { is_active: true }, order: [['sort_order', 'ASC']] })
    ]);
    res.render('admin/pages/posts', { title: 'Blog Posts', posts, categories, status, cat, q: q || '' });
  } catch(e) { console.error(e); res.render('admin/pages/posts', { title: 'Blog Posts', posts: [], categories: [], status, cat, q: '' }); }
});

router.get('/posts/create', async (req, res) => {
  const [categories, allPosts] = await Promise.all([
    BlogCategory.findAll({ where: { is_active: true } }),
    BlogPost.findAll({ attributes: ['id', 'title', 'title_hi'], order: [['title', 'ASC']] })
  ]);
  res.render('admin/pages/post-form', { title: 'Create Post', post: null, categories, allPosts });
});

router.post('/posts', async (req, res) => {
  try {
    const { title, title_hi, short_description, short_description_hi, content, content_hi, category_id, status, language, tags, is_featured, is_breaking, meta_title, meta_desc, meta_keywords, custom_labels, custom_types, custom_values, suggested_posts } = req.body;
    console.log(req.body);
console.log(req.body.title);
    const slug = slugify(title, { lower: true, strict: true }) + '-' + Date.now();
    let featured_image = null;
    if (req.files && req.files.featured_image) {
      const f = req.files.featured_image;
      const fname = Date.now() + '-' + f.name.replace(/\s/g, '-');
      await f.mv(`./public/uploads/${fname}`);
      featured_image = `/uploads/${fname}`;
    }
    const post = await BlogPost.create({ title, title_hi, slug, short_description, short_description_hi, content, content_hi, featured_image, category_id, author_id: req.session.user.id, status, language, tags, is_featured: !!is_featured, is_breaking: !!is_breaking, meta_title, meta_desc, meta_keywords, published_at: status === 'published' ? new Date() : null });
    // Custom fields
    if (custom_labels && Array.isArray(custom_labels)) {
      for (let i = 0; i < custom_labels.length; i++) {
        if (custom_labels[i]) await PostCustomField.create({ post_id: post.id, field_label: custom_labels[i], field_type: custom_types[i] || 'text', field_value: custom_values[i] || '', sort_order: i });
      }
    }
    // Suggestions
    if (suggested_posts && Array.isArray(suggested_posts)) {
      for (let i = 0; i < suggested_posts.length; i++) {
        if (suggested_posts[i]) await PostSuggestion.create({ post_id: post.id, suggested_post_id: suggested_posts[i], sort_order: i });
      }
    }
    req.session.flash_success = 'Post created successfully!';
    res.redirect('/admin/posts');
  } catch(e) { console.error(e); req.session.flash_error = 'Error creating post: ' + e.message; res.redirect('/admin/posts/create'); }
});

router.get('/posts/:id/edit', async (req, res) => {
  try {
    const id = parseInt(req.params.id, 10);

    const [
      [posts],
      categories,
      allPosts
    ] = await Promise.all([
      sequelize.query(
        'SELECT * FROM blog_posts WHERE id = ?',
        {
          replacements: [id]
        }
      ),

      BlogCategory.findAll({
        where: { is_active: true }
      }),

      BlogPost.findAll({
        attributes: ['id', 'title', 'title_hi'],
        order: [['title', 'ASC']]
      })
    ]);

    const post = posts[0];

    if (!post) {
      req.session.flash_error = 'Post not found';
      return res.redirect('/admin/posts');
    }

    const [customFields] = await sequelize.query(
      `
      SELECT *
      FROM post_custom_fields
      WHERE post_id = ?
      ORDER BY sort_order ASC
      `,
      {
        replacements: [id]
      }
    );

    const [suggestions] = await sequelize.query(
      `
      SELECT *
      FROM post_suggestions
      WHERE post_id = ?
      ORDER BY sort_order ASC
      `,
      {
        replacements: [id]
      }
    );

    post.customFields = customFields;
    post.suggestions = suggestions;
console.log('POST DATA =>', post);
    res.render('admin/pages/post-form', {
      title: 'Edit Post',
      post,
      categories,
      allPosts
    });

  } catch (err) {
    console.error(err);
    req.session.flash_error = 'Failed to load post';
    res.redirect('/admin/posts');
  }
});

router.put('/posts/:id', async (req, res) => {
  try {
    const post = await BlogPost.findByPk(req.params.id);
    if (!post) { req.session.flash_error = 'Post not found'; return res.redirect('/admin/posts'); }
    const { title, title_hi, short_description, short_description_hi, content, content_hi, category_id, status, language, tags, is_featured, is_breaking, meta_title, meta_desc, meta_keywords, custom_labels, custom_types, custom_values, suggested_posts } = req.body;
    let featured_image = post.featured_image;
    if (req.files && req.files.featured_image) {
      const f = req.files.featured_image;
      const fname = Date.now() + '-' + f.name.replace(/\s/g, '-');
      await f.mv(`./public/uploads/${fname}`);
      featured_image = `/uploads/${fname}`;
    }
    await post.update({ title, title_hi, short_description, short_description_hi, content, content_hi, featured_image, category_id, status, language, tags, is_featured: !!is_featured, is_breaking: !!is_breaking, meta_title, meta_desc, meta_keywords, published_at: status === 'published' && !post.published_at ? new Date() : post.published_at });
    await PostCustomField.destroy({ where: { post_id: post.id } });
    if (custom_labels && Array.isArray(custom_labels)) {
      for (let i = 0; i < custom_labels.length; i++) {
        if (custom_labels[i]) await PostCustomField.create({ post_id: post.id, field_label: custom_labels[i], field_type: custom_types[i] || 'text', field_value: custom_values[i] || '', sort_order: i });
      }
    }
    await PostSuggestion.destroy({ where: { post_id: post.id } });
    if (suggested_posts && Array.isArray(suggested_posts)) {
      for (let i = 0; i < suggested_posts.length; i++) {
        if (suggested_posts[i]) await PostSuggestion.create({ post_id: post.id, suggested_post_id: suggested_posts[i], sort_order: i });
      }
    }
    req.session.flash_success = 'Post updated!';
    res.redirect('/admin/posts');
  } catch(e) { console.error(e); req.session.flash_error = 'Error: ' + e.message; res.redirect('/admin/posts/' + req.params.id + '/edit'); }
});

router.delete('/posts/:id', async (req, res) => {
  try {
    await BlogPost.destroy({ where: { id: req.params.id } });
    req.session.flash_success = 'Post deleted!';
  } catch(e) { req.session.flash_error = 'Error deleting post'; }
  res.redirect('/admin/posts');
});

// ─── CATEGORIES ───────────────────────────────────────
router.get('/categories', async (req, res) => {
  const categories = await BlogCategory.findAll({ order: [['sort_order', 'ASC']] });
  res.render('admin/pages/categories', { title: 'Categories', categories });
});

router.post('/categories', async (req, res) => {
  try {
    const { name, name_hi, description, icon, color, sort_order, meta_title, meta_desc } = req.body;
    const slug = slugify(name, { lower: true, strict: true });
    await BlogCategory.create({ name, name_hi, slug, description, icon, color, sort_order: sort_order || 0, meta_title, meta_desc });
    req.session.flash_success = 'Category created!';
  } catch(e) { req.session.flash_error = 'Error: ' + e.message; }
  res.redirect('/admin/categories');
});

router.put('/categories/:id', async (req, res) => {
  try {
    const { name, name_hi, description, icon, color, sort_order, is_active, meta_title, meta_desc } = req.body;
    await BlogCategory.update({ name, name_hi, description, icon, color, sort_order, is_active: !!is_active, meta_title, meta_desc }, { where: { id: req.params.id } });
    req.session.flash_success = 'Category updated!';
  } catch(e) { req.session.flash_error = 'Error: ' + e.message; }
  res.redirect('/admin/categories');
});

router.delete('/categories/:id', async (req, res) => {
  try {
    await BlogCategory.destroy({ where: { id: req.params.id } });
    req.session.flash_success = 'Category deleted!';
  } catch(e) { req.session.flash_error = 'Cannot delete - posts exist in this category'; }
  res.redirect('/admin/categories');
});

// ─── USERS ───────────────────────────────────────
router.get('/users', async (req, res) => {
  const users = await User.findAll({ include: [{ model: Role, as: 'role' }], order: [['createdAt', 'DESC']] });
  const roles = await Role.findAll();
  res.render('admin/pages/users', { title: 'Users', users, roles });
});

router.post('/users', async (req, res) => {
  try {
    const { name, email, phone, password, role_id, salary_type, salary_amount, joining_date } = req.body;
    const hash = await bcrypt.hash(password, 12);
    await User.create({ name, email, phone, password: hash, role_id, salary_type, salary_amount, joining_date });
    req.session.flash_success = 'User created!';
  } catch(e) { req.session.flash_error = 'Error: ' + e.message; }
  res.redirect('/admin/users');
});

router.put('/users/:id', async (req, res) => {
  try {
    const { name, email, phone, role_id, salary_type, salary_amount, joining_date, is_active, password } = req.body;
    const updateData = { name, email, phone, role_id, salary_type, salary_amount, joining_date, is_active: !!is_active };
    if (password) updateData.password = await bcrypt.hash(password, 12);
    await User.update(updateData, { where: { id: req.params.id } });
    req.session.flash_success = 'User updated!';
  } catch(e) { req.session.flash_error = 'Error: ' + e.message; }
  res.redirect('/admin/users');
});

router.delete('/users/:id', async (req, res) => {
  try {
    if (req.params.id == req.session.user.id) throw new Error('Cannot delete yourself');
    await User.destroy({ where: { id: req.params.id } });
    req.session.flash_success = 'User deleted!';
  } catch(e) { req.session.flash_error = 'Error: ' + e.message; }
  res.redirect('/admin/users');
});

// ─── ATTENDANCE ───────────────────────────────────────
router.get('/attendance', async (req, res) => {
  try {
    const month = parseInt(req.query.month) || new Date().getMonth() + 1;
    const year = parseInt(req.query.year) || new Date().getFullYear();
    const users = await User.findAll({ where: { is_active: true }, include: [{ model: Role, as: 'role' }], order: [['name', 'ASC']] });
    const daysInMonth = new Date(year, month, 0).getDate();
    const attendanceData = {};
    for (const user of users) {
      const records = await AttendanceRecord.findAll({
        where: {
          user_id: user.id,
          attendance_date: { [Op.between]: [`${year}-${String(month).padStart(2,'0')}-01`, `${year}-${String(month).padStart(2,'0')}-${daysInMonth}`] }
        }
      });
      const byDate = {};
      records.forEach(r => { byDate[r.attendance_date] = r; });
      const summary = { P: 0, A: 0, H: 0, OT: 0, PA: 0, advance: 0 };
      records.forEach(r => {
        summary[r.status] = (summary[r.status] || 0) + (r.status === 'P+H' ? 1.5 : r.status === 'P+P' ? 2 : 1);
        summary.advance += parseFloat(r.advance_amount) || 0;
      });
      attendanceData[user.id] = { records: byDate, summary };
    }
    res.render('admin/pages/attendance', { title: 'Attendance', users, attendanceData, month, year, daysInMonth });
  } catch(e) { console.error(e); res.render('admin/pages/attendance', { title: 'Attendance', users: [], attendanceData: {}, month: new Date().getMonth()+1, year: new Date().getFullYear(), daysInMonth: 30 }); }
});

router.get('/attendance/:userId', async (req, res) => {
  try {
    const month = parseInt(req.query.month) || new Date().getMonth() + 1;
    const year = parseInt(req.query.year) || new Date().getFullYear();
    const user = await User.findByPk(req.params.userId, { include: [{ model: Role, as: 'role' }] });
    if (!user) return res.redirect('/admin/attendance');
    const daysInMonth = new Date(year, month, 0).getDate();
    const records = await AttendanceRecord.findAll({
      where: { user_id: user.id, attendance_date: { [Op.between]: [`${year}-${String(month).padStart(2,'0')}-01`, `${year}-${String(month).padStart(2,'0')}-${daysInMonth}`] } },
      order: [['attendance_date', 'ASC']]
    });
    const byDate = {};
    let totalPresent = 0, totalAbsent = 0, totalOT = 0, totalAdvance = 0;
    records.forEach(r => {
      byDate[r.attendance_date] = r;
      const s = r.status;
      if (s === 'P') totalPresent += 1;
      else if (s === 'P+H') totalPresent += 1.5;
      else if (s === 'P+P') totalPresent += 2;
      else if (s === 'A') totalAbsent += 1;
      else if (s === 'OT') totalOT += 1;
      else if (s === 'PA') totalPresent += 1;
      totalAdvance += parseFloat(r.advance_amount) || 0;
    });
    res.render('admin/pages/attendance-user', { title: `Attendance - ${user.name}`, user, records, byDate, month, year, daysInMonth, totalPresent, totalAbsent, totalOT, totalAdvance });
  } catch(e) { console.error(e); res.redirect('/admin/attendance'); }
});

router.post('/attendance/mark', async (req, res) => {
  try {
    const { user_id, attendance_date, status, overtime_hours, advance_amount, notes } = req.body;
    await AttendanceRecord.upsert({ user_id, attendance_date, status, overtime_hours: overtime_hours || 0, advance_amount: advance_amount || 0, notes: notes || '', marked_by: req.session.user.id });
    res.json({ success: true });
  } catch(e) { res.json({ success: false, error: e.message }); }
});

// ─── FINANCE ───────────────────────────────────────
function canSeeAllFinance(req) {
  const roleSlug = req.session.user ? req.session.user.role_slug : null;
  return roleSlug === 'super_admin' || roleSlug === 'admin';
}
 
router.get('/finance', async (req, res) => {
  try {
    const { type, account, month, year } = req.query;
    const userId = req.session.user.id;
    const seeAll = canSeeAllFinance(req);
 
    // ── Transaction filter ──────────────────────────────
    let where = {};
    if (!seeAll) {
      where.user_id = userId; // restricted users only ever see their own rows
    }
    if (type) where.type = type;
    if (account) where.bank_account_id = account;
    if (month && year) {
      where.transaction_date = {
        [Op.between]: [`${year}-${String(month).padStart(2,'0')}-01`, `${year}-${String(month).padStart(2,'0')}-31`]
      };
    }
 
    // ── Bank account filter ─────────────────────────────
    // Accounts are owned by the user who created them (user_id column).
    let accountWhere = { is_active: true };
    if (!seeAll) {
      accountWhere.user_id = userId;
    }
 
    // ── Totals must respect the same scope ──────────────
    let incomeWhere = { type: 'income' };
    let expenseWhere = { type: 'expense' };
    if (!seeAll) {
      incomeWhere.user_id = userId;
      expenseWhere.user_id = userId;
    }
 
    // ── Monthly chart must also respect scope ───────────
    let chartWhere = {};
    if (!seeAll) {
      chartWhere.user_id = userId;
    }
 
    const [transactions, accounts, categories, totalIncome, totalExpense, monthlyChart] = await Promise.all([
      Transaction.findAll({
        where,
        include: [{ model: BankAccount, as: 'account' }, { model: ExpenseCategory, as: 'category' }],
        order: [['transaction_date', 'DESC']],
        limit: 100
      }),
      BankAccount.findAll({ where: accountWhere }),
      ExpenseCategory.findAll({ where: { is_active: true } }), // categories are shared/global, not user-owned
      Transaction.sum('amount', { where: incomeWhere }),
      Transaction.sum('amount', { where: expenseWhere }),
      Transaction.findAll({
        attributes: [
          [sequelize.fn('MONTH', sequelize.col('transaction_date')), 'month'],
          [sequelize.fn('YEAR', sequelize.col('transaction_date')), 'year'],
          'type',
          [sequelize.fn('SUM', sequelize.col('amount')), 'total']
        ],
        where: chartWhere,
        group: ['month', 'year', 'type'],
        order: [['year', 'ASC'], ['month', 'ASC']],
        raw: true
      })
    ]);
 
    res.render('admin/pages/finance', {
      title: 'Finance Management',
      transactions, accounts, categories,
      totalIncome: totalIncome || 0,
      totalExpense: totalExpense || 0,
      monthlyChart, type, account, month, year,
      canSeeAll: seeAll
    });
  } catch(e) {
    console.error(e);
    res.render('admin/pages/finance', {
      title: 'Finance', transactions: [], accounts: [], categories: [],
      totalIncome: 0, totalExpense: 0, monthlyChart: [],
      type: null, account: null, month: null, year: null,
      canSeeAll: false
    });
  }
});
 
router.post('/finance/transaction', async (req, res) => {
  try {
    const { bank_account_id, category_id, type, amount, description, transaction_date, payment_method, transfer_to_account_id, tags } = req.body;
    const userId = req.session.user.id;
    const seeAll = canSeeAllFinance(req);
 
    // ── Ownership check: a restricted user must own the account they're posting to ──
    const account = await BankAccount.findByPk(bank_account_id);
    if (!account) {
      req.session.flash_error = 'Bank account not found';
      return res.redirect('/admin/finance');
    }
    if (!seeAll && account.user_id !== userId) {
      req.session.flash_error = 'You can only add transactions to your own bank account';
      return res.redirect('/admin/finance');
    }
 
    let receipt_image = null;
    if (req.files && req.files.receipt_image) {
      const f = req.files.receipt_image;
      const fname = Date.now() + '-' + f.name.replace(/\s/g, '-');
      await f.mv(`./public/uploads/${fname}`);
      receipt_image = `/uploads/${fname}`;
    }
 
    await Transaction.create({
      user_id: userId, bank_account_id, category_id, type, amount, description,
      transaction_date, payment_method,
      transfer_to_account_id: transfer_to_account_id || null,
      receipt_image, tags
    });
 
    // Update account balance
    if (type === 'income') await account.update({ current_balance: parseFloat(account.current_balance) + parseFloat(amount) });
    else if (type === 'expense') await account.update({ current_balance: parseFloat(account.current_balance) - parseFloat(amount) });
 
    req.session.flash_success = 'Transaction added!';
  } catch(e) { req.session.flash_error = 'Error: ' + e.message; }
  res.redirect('/admin/finance');
});
 
router.post('/finance/account', async (req, res) => {
  try {
    const { bank_name, account_name, account_number, ifsc_code, account_type, opening_balance, color, icon } = req.body;
    await BankAccount.create({
      user_id: req.session.user.id, // owner = the creator; this already worked correctly
      bank_name, account_name, account_number, ifsc_code, account_type,
      opening_balance: opening_balance || 0,
      current_balance: opening_balance || 0,
      color, icon
    });
    req.session.flash_success = 'Bank account added!';
  } catch(e) { req.session.flash_error = 'Error: ' + e.message; }
  res.redirect('/admin/finance');
});
 
router.delete('/finance/transaction/:id', async (req, res) => {
  try {
    const userId = req.session.user.id;
    const seeAll = canSeeAllFinance(req);
 
    const txn = await Transaction.findByPk(req.params.id);
    if (!txn) {
      req.session.flash_error = 'Transaction not found';
      return res.redirect('/admin/finance');
    }
 
    // ── Ownership check before delete ──
    if (!seeAll && txn.user_id !== userId) {
      req.session.flash_error = 'You can only delete your own transactions';
      return res.redirect('/admin/finance');
    }
 
    const account = await BankAccount.findByPk(txn.bank_account_id);
    if (account) {
      if (txn.type === 'income') await account.update({ current_balance: parseFloat(account.current_balance) - parseFloat(txn.amount) });
      else if (txn.type === 'expense') await account.update({ current_balance: parseFloat(account.current_balance) + parseFloat(txn.amount) });
    }
    await txn.destroy();
 
    req.session.flash_success = 'Transaction deleted!';
  } catch(e) { req.session.flash_error = 'Error: ' + e.message; }
  res.redirect('/admin/finance');
});
 
// Optional but recommended: prevent deleting/editing bank accounts you don't own.
// (No delete route existed for accounts in the original file — add one safely if needed.)
router.delete('/finance/account/:id', async (req, res) => {
  try {
    const userId = req.session.user.id;
    const seeAll = canSeeAllFinance(req);
 
    const account = await BankAccount.findByPk(req.params.id);
    if (!account) {
      req.session.flash_error = 'Account not found';
      return res.redirect('/admin/finance');
    }
    if (!seeAll && account.user_id !== userId) {
      req.session.flash_error = 'You can only delete your own bank account';
      return res.redirect('/admin/finance');
    }
 
    const txnCount = await Transaction.count({ where: { bank_account_id: account.id } });
    if (txnCount > 0) {
      req.session.flash_error = 'Cannot delete account with existing transactions';
      return res.redirect('/admin/finance');
    }
 
    await account.destroy();
    req.session.flash_success = 'Bank account deleted!';
  } catch(e) { req.session.flash_error = 'Error: ' + e.message; }
  res.redirect('/admin/finance');
});

// ─── ADS ───────────────────────────────────────
router.get('/ads', async (req, res) => {
  const [ads, zones] = await Promise.all([
    Advertisement.findAll({ include: [{ model: AdZone, as: 'zone' }], order: [['createdAt', 'DESC']] }),
    AdZone.findAll({ order: [['location', 'ASC']] })
  ]);
  res.render('admin/pages/ads', { title: 'Advertisements', ads, zones });
});

router.post('/ads', async (req, res) => {
  try {
    const { title, ad_zone_id, ad_type, content, target_url, target_blank, scope, scope_ids, device, start_date, end_date, priority } = req.body;
    let image_url = null;
    if (req.files && req.files.ad_image) {
      const f = req.files.ad_image;
      const fname = Date.now() + '-' + f.name.replace(/\s/g, '-');
      await f.mv(`./public/uploads/${fname}`);
      image_url = `/uploads/${fname}`;
    }
    await Advertisement.create({ title, ad_zone_id, ad_type, content, image_url, target_url, target_blank: !!target_blank, scope, scope_ids, device, start_date: start_date || null, end_date: end_date || null, priority: priority || 1, is_active: true });
    req.session.flash_success = 'Ad created!';
  } catch(e) { req.session.flash_error = 'Error: ' + e.message; }
  res.redirect('/admin/ads');
});

router.put('/ads/:id/toggle', async (req, res) => {
  try {
    const ad = await Advertisement.findByPk(req.params.id);
    await ad.update({ is_active: !ad.is_active });
    req.session.flash_success = 'Ad status updated!';
  } catch(e) { req.session.flash_error = 'Error'; }
  res.redirect('/admin/ads');
});

router.delete('/ads/:id', async (req, res) => {
  try { await Advertisement.destroy({ where: { id: req.params.id } }); req.session.flash_success = 'Ad deleted!'; }
  catch(e) { req.session.flash_error = 'Error'; }
  res.redirect('/admin/ads');
});

// Ad Zones
router.post('/ads/zone', async (req, res) => {
  try {
    const { name, description, width, height, location } = req.body;
    const slug = slugify(name, { lower: true, strict: true });
    await AdZone.create({ name, slug, description, width, height, location });
    req.session.flash_success = 'Zone created!';
  } catch(e) { req.session.flash_error = 'Error: ' + e.message; }
  res.redirect('/admin/ads');
});

// ─── THEMES ───────────────────────────────────────
router.get('/themes', async (req, res) => {
  const themes = await Theme.findAll({ order: [['id', 'ASC']] });
  res.render('admin/pages/themes', { title: 'Theme Manager', themes });
});

router.post('/themes', async (req, res) => {
  try {
    const { name, primary_color, secondary_color, accent_dark, accent_light, sidebar_bg, sidebar_text, nav_bg, btn_color } = req.body;
    const slug = slugify(name, { lower: true, strict: true }) + '-' + Date.now();
    await Theme.create({ name, slug, primary_color, secondary_color, accent_dark, accent_light, sidebar_bg, sidebar_text, nav_bg, btn_color, is_active: false });
    req.session.flash_success = 'Theme created!';
  } catch(e) { req.session.flash_error = 'Error: ' + e.message; }
  res.redirect('/admin/themes');
});

router.post('/themes/:id/activate', async (req, res) => {
  try {
    await Theme.update({ is_active: false }, { where: {} });
    await Theme.update({ is_active: true }, { where: { id: req.params.id } });
    await Setting.upsert({ key: 'active_theme', value: req.params.id, group: 'theme', type: 'number' });
    req.session.flash_success = 'Theme activated! Changes applied to website and admin.';
  } catch(e) { req.session.flash_error = 'Error: ' + e.message; }
  res.redirect('/admin/themes');
});

router.delete('/themes/:id', async (req, res) => {
  try {
    const theme = await Theme.findByPk(req.params.id);
    if (theme && theme.is_system) throw new Error('Cannot delete system theme');
    if (theme && theme.is_active) throw new Error('Cannot delete active theme');
    await Theme.destroy({ where: { id: req.params.id } });
    req.session.flash_success = 'Theme deleted!';
  } catch(e) { req.session.flash_error = 'Error: ' + e.message; }
  res.redirect('/admin/themes');
});

// ─── SEO / BLOG BOOSTER ───────────────────────────────────────
router.get('/seo', async (req, res) => {
  const { activeTab } = req.query;
  const [seoItems, posts, categories] = await Promise.all([
    SeoIndex.findAll({ order: [['createdAt', 'DESC']] }),
    BlogPost.findAll({ attributes: ['id', 'title', 'slug', 'status', 'views', 'meta_title', 'meta_desc'], order: [['views', 'DESC']] }),
    BlogCategory.findAll({ where: { is_active: true } })
  ]);
  res.render('admin/pages/seo', { title: 'Blog Booster & SEO', seoItems, posts, categories, activeTab: activeTab || 'reports' });
});

router.post('/seo/index', async (req, res) => {
  try {
    const { url, post_id, type, priority, change_freq } = req.body;
    await SeoIndex.upsert({ url, post_id: post_id || null, type, priority, change_freq, status: 'pending', indexed_at: null });
    req.session.flash_success = 'URL added to indexing queue!';
  } catch(e) { req.session.flash_error = 'Error: ' + e.message; }
  res.redirect('/admin/seo?activeTab=indexing');
});

router.post('/seo/index/:id/run', async (req, res) => {
  try {
    await SeoIndex.update({ status: 'indexed', indexed_at: new Date() }, { where: { id: req.params.id } });
    req.session.flash_success = 'Indexed!';
  } catch(e) { req.session.flash_error = 'Error'; }
  res.redirect('/admin/seo?activeTab=indexing');
});

// ─── DATABASE MANAGER ───────────────────────────────────────
router.get('/database', async (req, res) => {
  try {
    const [tables] = await sequelize.query("SHOW TABLES");
    const tableList = tables.map(t => Object.values(t)[0]);
    const selectedTable = req.query.table;
    let tableData = [], columns = [], rowCount = 0;
    if (selectedTable && tableList.includes(selectedTable)) {
      const [cols] = await sequelize.query(`DESCRIBE \`${selectedTable}\``);
      columns = cols;
      const [[{ total }]] = await sequelize.query(`SELECT COUNT(*) as total FROM \`${selectedTable}\``);
      rowCount = total;
      const limit = 50;
      const offset = parseInt(req.query.offset) || 0;
      const [rows] = await sequelize.query(`SELECT * FROM \`${selectedTable}\` LIMIT ${limit} OFFSET ${offset}`);
      tableData = rows;
    }
    res.render('admin/pages/database', { title: 'Database Manager', tableList, selectedTable, tableData, columns, rowCount });
  } catch(e) { console.error(e); res.render('admin/pages/database', { title: 'Database', tableList: [], selectedTable: null, tableData: [], columns: [], rowCount: 0 }); }
});

router.post('/database/query', requireSuperAdmin, async (req, res) => {
  try {
    const { sql } = req.body;
    const [result] = await sequelize.query(sql);
    res.render('admin/pages/database', { title: 'Database Manager', queryResult: result, querySQL: sql, tableList: [], selectedTable: null, tableData: [], columns: [], rowCount: 0 });
  } catch(e) { req.session.flash_error = 'SQL Error: ' + e.message; res.redirect('/admin/database'); }
});

// ─── PAGES ───────────────────────────────────────
router.get('/pages', async (req, res) => {
  const pages = await Page.findAll({ order: [['createdAt', 'DESC']] });
  res.render('admin/pages/pages', { title: 'Pages', pages });
});

router.post('/pages', async (req, res) => {
  try {
    const { title, slug, content, meta_title, meta_desc, is_active, template } = req.body;
    const finalSlug = slug || slugify(title, { lower: true, strict: true });
    await Page.create({ title, slug: finalSlug, content, meta_title, meta_desc, is_active: !!is_active, template: template || 'default' });
    req.session.flash_success = 'Page created!';
  } catch(e) { req.session.flash_error = 'Error: ' + e.message; }
  res.redirect('/admin/pages');
});

router.put('/pages/:id', async (req, res) => {
  try {
    const { title, content, meta_title, meta_desc, is_active, template } = req.body;
    await Page.update({ title, content, meta_title, meta_desc, is_active: !!is_active, template }, { where: { id: req.params.id } });
    req.session.flash_success = 'Page updated!';
  } catch(e) { req.session.flash_error = 'Error'; }
  res.redirect('/admin/pages');
});

router.delete('/pages/:id', async (req, res) => {
  try { await Page.destroy({ where: { id: req.params.id } }); req.session.flash_success = 'Page deleted!'; }
  catch(e) { req.session.flash_error = 'Error'; }
  res.redirect('/admin/pages');
});

// ─── SETTINGS ───────────────────────────────────────
router.get('/settings', async (req, res) => {
  const settings = await Setting.findAll({ order: [['group', 'ASC'], ['key', 'ASC']] });
  const settingsMap = {};
  settings.forEach(s => settingsMap[s.key] = s.value);
  res.render('admin/pages/settings', { title: 'Settings', settings, settingsMap });
});

router.post('/settings', async (req, res) => {
  try {
    const entries = Object.entries(req.body);
    for (const [key, value] of entries) {
      await Setting.upsert({ key, value: String(value) });
    }
    req.session.flash_success = 'Settings saved!';
  } catch(e) { req.session.flash_error = 'Error: ' + e.message; }
  res.redirect('/admin/settings');
});

// ─── PERMISSIONS ───────────────────────────────────────
router.get('/permissions', requireSuperAdmin, async (req, res) => {
  const [roles, menuItems, permissions] = await Promise.all([
    Role.findAll(),
    MenuItem.findAll({ where: { is_active: true }, order: [['sort_order', 'ASC']] }),
    RoleMenuPermission.findAll()
  ]);
  const permMap = {};
  permissions.forEach(p => { permMap[`${p.role_id}_${p.menu_item_id}`] = p; });
  res.render('admin/pages/permissions', { title: 'Role Permissions', roles, menuItems, permMap });
});

router.post('/permissions', requireSuperAdmin, async (req, res) => {
  try {
    const { permissions } = req.body;
    if (permissions) {
      for (const [key, perms] of Object.entries(permissions)) {
        const [role_id, menu_item_id] = key.split('_');
        await RoleMenuPermission.upsert({
          role_id: parseInt(role_id),
          menu_item_id: parseInt(menu_item_id),
          can_view: !!perms.view,
          can_create: !!perms.create,
          can_edit: !!perms.edit,
          can_delete: !!perms.delete
        });
      }
    }
    req.session.flash_success = 'Permissions updated!';
  } catch(e) { req.session.flash_error = 'Error: ' + e.message; }
  res.redirect('/admin/permissions');
});

// ─── MENU MANAGEMENT ───────────────────────────────────────
router.get('/menus', requireSuperAdmin, async (req, res) => {
  const menuItems = await MenuItem.findAll({ order: [['sort_order', 'ASC']] });
  res.render('admin/pages/menus', { title: 'Menu Management', menuItems });
});

router.post('/menus', requireSuperAdmin, async (req, res) => {
  try {
    const { label, label_hi, icon, route, menu_type, sort_order, parent_id, badge, badge_color } = req.body;
    await MenuItem.create({ label, label_hi, icon, route, menu_type, sort_order: sort_order || 0, parent_id: parent_id || null, badge, badge_color: badge_color || 'success', is_active: true });
    req.session.flash_success = 'Menu item created!';
  } catch(e) { req.session.flash_error = 'Error: ' + e.message; }
  res.redirect('/admin/menus');
});

router.put('/menus/:id', requireSuperAdmin, async (req, res) => {
  try {
    const { label, label_hi, icon, route, sort_order, is_active } = req.body;
    await MenuItem.update({ label, label_hi, icon, route, sort_order, is_active: !!is_active }, { where: { id: req.params.id } });
    req.session.flash_success = 'Menu updated!';
  } catch(e) { req.session.flash_error = 'Error'; }
  res.redirect('/admin/menus');
});

router.delete('/menus/:id', requireSuperAdmin, async (req, res) => {
  try { await MenuItem.destroy({ where: { id: req.params.id } }); req.session.flash_success = 'Menu item deleted!'; }
  catch(e) { req.session.flash_error = 'Error'; }
  res.redirect('/admin/menus');
});

// Profile
router.get('/profile', (req, res) => {
  res.render('admin/pages/profile', { title: 'My Profile' });
});

router.post('/profile', async (req, res) => {
    try {
        const { name, phone, password } = req.body;

        const updateData = {
            name,
            phone
        };

        if (password && password.trim() !== '') {
            updateData.password = await bcrypt.hash(password, 12);
        }

        // Avatar Upload
        if (req.files && req.files.avatar) {
            const avatar = req.files.avatar;

            const fileName =
                Date.now() +
                '-' +
                avatar.name.replace(/\s+/g, '-');

            await avatar.mv(
                `./public/uploads/avatars/${fileName}`
            );

            updateData.avatar =
                `/uploads/avatars/${fileName}`;

            req.session.user.avatar =
                `/uploads/avatars/${fileName}`;
        }

        await User.update(updateData, {
            where: {
                id: req.session.user.id
            }
        });

        req.session.user.name = name;

        req.session.flash_success =
            'Profile updated successfully';

    } catch (e) {
        console.log(e);
        req.session.flash_error = e.message;
    }

    res.redirect('/admin/profile');
});



function timeAgo(date) {
  return moment(date).fromNow();
}



router.get('/notifications', async (req, res) => {
  try {
    const userId  = req.session.user.id;
    const page    = Math.max(1, parseInt(req.query.page) || 1);
    const perPage = 20;
    const offset  = (page - 1) * perPage;
 
    // Fetch notifications for this user OR broadcast (user_id = null)
    const { count: total, rows: rawNotifs } = await Notification.findAndCountAll({
      where: {
        [Op.or]: [
          { user_id: userId },
          { user_id: null }
        ]
      },
      order: [['createdAt', 'DESC']],
      limit: perPage,
      offset,
      raw: true
    });
 
    // Attach human-readable time
    const notifications = rawNotifs.map(n => ({
      ...n,
      time_ago: timeAgo(n.createdAt)
    }));
 
    // Unread count (all pages, not just current)
    const unreadCount = await Notification.count({
      where: {
        is_read: false,
        [Op.or]: [{ user_id: userId }, { user_id: null }]
      }
    });
 
    const totalPages  = Math.ceil(total / perPage);
 
    res.render('admin/pages/notification', {
      title: 'Notifications',
      notifications,
      unreadCount,
      total,
      currentPage: page,
      totalPages
    });
  } catch (e) {
    console.error(e);
    res.render('admin/pages/notification', {
      title: 'Notifications',
      notifications: [],
      unreadCount: 0,
      total: 0,
      currentPage: 1,
      totalPages: 1
    });
  }
});
 
// ─── PUT /admin/notifications/:id/read ── (AJAX) ──────────────
router.put('/notifications/:id/read', async (req, res) => {
  try {
    const userId = req.session.user.id;
    await Notification.update(
      { is_read: true },
      {
        where: {
          id: req.params.id,
          [Op.or]: [{ user_id: userId }, { user_id: null }]
        }
      }
    );
    res.json({ success: true });
  } catch (e) {
    res.json({ success: false, error: e.message });
  }
});
 
// ─── PUT /admin/notifications/mark-all-read ── (form submit) ──
router.put('/notifications/mark-all-read', async (req, res) => {
  try {
    const userId = req.session.user.id;
    await Notification.update(
      { is_read: true },
      {
        where: {
          is_read: false,
          [Op.or]: [{ user_id: userId }, { user_id: null }]
        }
      }
    );
    req.session.flash_success = 'All notifications marked as read!';
  } catch (e) {
    req.session.flash_error = 'Error: ' + e.message;
  }
  res.redirect('/admin/notifications');
});
 
// ─── DELETE /admin/notifications/:id ── (AJAX) ────────────────
router.delete('/notifications/:id', async (req, res) => {
  try {
    const userId = req.session.user.id;
    await Notification.destroy({
      where: {
        id: req.params.id,
        [Op.or]: [{ user_id: userId }, { user_id: null }]
      }
    });
    res.json({ success: true });
  } catch (e) {
    res.json({ success: false, error: e.message });
  }
});
 
// ─── DELETE /admin/notifications/delete-all ── (form submit) ──
router.delete('/notifications/delete-all', async (req, res) => {
  try {
    const userId = req.session.user.id;
    await Notification.destroy({
      where: {
        [Op.or]: [{ user_id: userId }, { user_id: null }]
      }
    });
    req.session.flash_success = 'All notifications cleared!';
  } catch (e) {
    req.session.flash_error = 'Error: ' + e.message;
  }
  res.redirect('/admin/notifications');
});
 
// ─── PUT /admin/notifications/bulk-read ── (AJAX) ─────────────
router.put('/notifications/bulk-read', async (req, res) => {
  try {
    const { ids } = req.body;   // array of id strings
    if (!ids || !ids.length) return res.json({ success: false, error: 'No IDs' });
    const userId = req.session.user.id;
    const count = await Notification.update(
      { is_read: true },
      {
        where: {
          id: { [Op.in]: ids.map(Number) },
          [Op.or]: [{ user_id: userId }, { user_id: null }]
        }
      }
    );
    res.json({ success: true, count: count[0] });
  } catch (e) {
    res.json({ success: false, error: e.message });
  }
});
 
// ─── DELETE /admin/notifications/bulk-delete ── (AJAX) ────────
router.delete('/notifications/bulk-delete', async (req, res) => {
  try {
    const { ids } = req.body;
    if (!ids || !ids.length) return res.json({ success: false, error: 'No IDs' });
    const userId = req.session.user.id;
    const count = await Notification.destroy({
      where: {
        id: { [Op.in]: ids.map(Number) },
        [Op.or]: [{ user_id: userId }, { user_id: null }]
      }
    });
    res.json({ success: true, count });
  } catch (e) {
    res.json({ success: false, error: e.message });
  }
});
 
// ─── GET /admin/notifications/unread-count ── (AJAX for topbar badge) ──
router.get('/notifications/unread-count', async (req, res) => {
  try {
    const userId = req.session.user.id;
    const count  = await Notification.count({
      where: {
        is_read: false,
        [Op.or]: [{ user_id: userId }, { user_id: null }]
      }
    });
    res.json({ count });
  } catch (e) {
    res.json({ count: 0 });
  }
});
module.exports = router;
