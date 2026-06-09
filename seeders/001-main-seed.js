'use strict';
const bcrypt = require('bcryptjs');

module.exports = {
  up: async (queryInterface, Sequelize) => {
    const now = new Date();

    // ROLES
    await queryInterface.bulkInsert('roles', [
      { id: 1, name: 'Super Admin', slug: 'super_admin', description: 'Full system access', createdAt: now, updatedAt: now },
      { id: 2, name: 'Admin', slug: 'admin', description: 'Admin panel access', createdAt: now, updatedAt: now },
      { id: 3, name: 'Developer', slug: 'developer', description: 'Developer access', createdAt: now, updatedAt: now },
      { id: 4, name: 'User', slug: 'user', description: 'Basic user', createdAt: now, updatedAt: now }
    ]);

    // THEMES
    await queryInterface.bulkInsert('themes', [
      { id: 1, name: 'Forest Green', slug: 'forest-green', primary_color: '#1a7a4a', secondary_color: '#e8a020', accent_dark: '#125c36', accent_light: '#e8f5ee', sidebar_bg: '#1a2332', sidebar_text: '#ffffff', nav_bg: '#ffffff', btn_color: '#1a7a4a', is_active: true, is_system: true, createdAt: now, updatedAt: now },
      { id: 2, name: 'Royal Blue', slug: 'royal-blue', primary_color: '#2563eb', secondary_color: '#f59e0b', accent_dark: '#1d4ed8', accent_light: '#eff6ff', sidebar_bg: '#1e3a5f', sidebar_text: '#ffffff', nav_bg: '#ffffff', btn_color: '#2563eb', is_active: false, is_system: true, createdAt: now, updatedAt: now },
      { id: 3, name: 'Sunset Orange', slug: 'sunset-orange', primary_color: '#ea580c', secondary_color: '#7c3aed', accent_dark: '#c2410c', accent_light: '#fff7ed', sidebar_bg: '#431407', sidebar_text: '#ffffff', nav_bg: '#ffffff', btn_color: '#ea580c', is_active: false, is_system: true, createdAt: now, updatedAt: now },
      { id: 4, name: 'Purple Majesty', slug: 'purple-majesty', primary_color: '#7c3aed', secondary_color: '#ec4899', accent_dark: '#6d28d9', accent_light: '#f5f3ff', sidebar_bg: '#2e1065', sidebar_text: '#ffffff', nav_bg: '#ffffff', btn_color: '#7c3aed', is_active: false, is_system: true, createdAt: now, updatedAt: now },
      { id: 5, name: 'Dark Pro', slug: 'dark-pro', primary_color: '#10b981', secondary_color: '#f59e0b', accent_dark: '#059669', accent_light: '#ecfdf5', sidebar_bg: '#111827', sidebar_text: '#f9fafb', nav_bg: '#1f2937', btn_color: '#10b981', is_active: false, is_system: true, createdAt: now, updatedAt: now }
    ]);

    // USERS
    const hash = await bcrypt.hash('Admin@123', 12);
    const userHash = await bcrypt.hash('User@123', 12);
    await queryInterface.bulkInsert('users', [
      { id: 1, name: 'Rahul Sharma', email: 'superadmin@dreams.com', phone: '9876543210', password: hash, role_id: 1, is_active: true, salary_type: 'monthly', salary_amount: 50000, joining_date: '2023-01-01', createdAt: now, updatedAt: now },
      { id: 2, name: 'Priya Patel', email: 'admin@dreams.com', phone: '9876543211', password: hash, role_id: 2, is_active: true, salary_type: 'monthly', salary_amount: 35000, joining_date: '2023-03-15', createdAt: now, updatedAt: now },
      { id: 3, name: 'Amit Kumar', email: 'dev@dreams.com', phone: '9876543212', password: hash, role_id: 3, is_active: true, salary_type: 'monthly', salary_amount: 45000, joining_date: '2023-06-01', createdAt: now, updatedAt: now },
      { id: 4, name: 'Naresh Prajapati', email: 'naresh@dreams.com', phone: '9876543213', password: userHash, role_id: 4, is_active: true, salary_type: 'daily', salary_amount: 600, joining_date: '2024-01-01', createdAt: now, updatedAt: now },
      { id: 5, name: 'Sunita Devi', email: 'sunita@dreams.com', phone: '9876543214', password: userHash, role_id: 4, is_active: true, salary_type: 'daily', salary_amount: 500, joining_date: '2024-02-01', createdAt: now, updatedAt: now },
      { id: 6, name: 'Rajesh Verma', email: 'rajesh@dreams.com', phone: '9876543215', password: userHash, role_id: 4, is_active: true, salary_type: 'daily', salary_amount: 700, joining_date: '2023-11-01', createdAt: now, updatedAt: now }
    ]);

    // MENU ITEMS
    await queryInterface.bulkInsert('menu_items', [
      { id: 1, parent_id: null, label: 'Dashboard', label_hi: 'डैशबोर्ड', icon: 'bi-speedometer2', route: '/admin/dashboard', menu_type: 'admin', sort_order: 1, is_active: true, createdAt: now, updatedAt: now },
      { id: 2, parent_id: null, label: 'Blog Posts', label_hi: 'ब्लॉग पोस्ट', icon: 'bi-file-earmark-text', route: '/admin/posts', menu_type: 'admin', sort_order: 2, is_active: true, badge: 'New', badge_color: 'success', createdAt: now, updatedAt: now },
      { id: 3, parent_id: null, label: 'Categories', label_hi: 'श्रेणियां', icon: 'bi-grid', route: '/admin/categories', menu_type: 'admin', sort_order: 3, is_active: true, createdAt: now, updatedAt: now },
      { id: 4, parent_id: null, label: 'Users', label_hi: 'उपयोगकर्ता', icon: 'bi-people', route: '/admin/users', menu_type: 'admin', sort_order: 4, is_active: true, createdAt: now, updatedAt: now },
      { id: 5, parent_id: null, label: 'Attendance', label_hi: 'उपस्थिति', icon: 'bi-calendar-check', route: '/admin/attendance', menu_type: 'admin', sort_order: 5, is_active: true, createdAt: now, updatedAt: now },
      { id: 6, parent_id: null, label: 'Finance', label_hi: 'वित्त', icon: 'bi-wallet2', route: '/admin/finance', menu_type: 'admin', sort_order: 6, is_active: true, createdAt: now, updatedAt: now },
      { id: 7, parent_id: null, label: 'Advertisements', label_hi: 'विज्ञापन', icon: 'bi-megaphone', route: '/admin/ads', menu_type: 'admin', sort_order: 7, is_active: true, createdAt: now, updatedAt: now },
      { id: 8, parent_id: null, label: 'Theme Manager', label_hi: 'थीम प्रबंधन', icon: 'bi-palette', route: '/admin/themes', menu_type: 'admin', sort_order: 8, is_active: true, createdAt: now, updatedAt: now },
      { id: 9, parent_id: null, label: 'Blog Booster', label_hi: 'ब्लॉग बूस्टर', icon: 'bi-rocket', route: '/admin/seo', menu_type: 'admin', sort_order: 9, is_active: true, createdAt: now, updatedAt: now },
      { id: 10, parent_id: null, label: 'Database', label_hi: 'डेटाबेस', icon: 'bi-database', route: '/admin/database', menu_type: 'admin', sort_order: 10, is_active: true, createdAt: now, updatedAt: now },
      { id: 11, parent_id: null, label: 'Pages', label_hi: 'पेज', icon: 'bi-file-earmark', route: '/admin/pages', menu_type: 'admin', sort_order: 11, is_active: true, createdAt: now, updatedAt: now },
      { id: 12, parent_id: null, label: 'Settings', label_hi: 'सेटिंग्स', icon: 'bi-gear', route: '/admin/settings', menu_type: 'admin', sort_order: 12, is_active: true, createdAt: now, updatedAt: now },
      { id: 13, parent_id: null, label: 'Role Permissions', label_hi: 'भूमिका अनुमति', icon: 'bi-shield-check', route: '/admin/permissions', menu_type: 'admin', sort_order: 13, is_active: true, createdAt: now, updatedAt: now }
    ]);

    // ROLE MENU PERMISSIONS
    const permissions = [];
    for (let menuId = 1; menuId <= 13; menuId++) {
      // Super Admin - all access
      permissions.push({ role_id: 1, menu_item_id: menuId, can_view: true, can_create: true, can_edit: true, can_delete: true, createdAt: now, updatedAt: now });
      // Admin - most access
      permissions.push({ role_id: 2, menu_item_id: menuId, can_view: true, can_create: menuId !== 13, can_edit: menuId !== 13, can_delete: menuId > 3 ? false : true, createdAt: now, updatedAt: now });
      // Developer - limited
      permissions.push({ role_id: 3, menu_item_id: menuId, can_view: [1,2,3,8,9,10].includes(menuId), can_create: [2,3].includes(menuId), can_edit: [2,3,8].includes(menuId), can_delete: false, createdAt: now, updatedAt: now });
      // User - very limited
      permissions.push({ role_id: 4, menu_item_id: menuId, can_view: [1,5].includes(menuId), can_create: false, can_edit: false, can_delete: false, createdAt: now, updatedAt: now });
    }
    await queryInterface.bulkInsert('role_menu_permissions', permissions);

    // BLOG CATEGORIES
    await queryInterface.bulkInsert('blog_categories', [
      { id: 1, name: 'Make Money Online', name_hi: 'ऑनलाइन पैसे कमाएं', slug: 'make-money-online', description: 'Tips to earn money online', icon: '💰', color: '#1a7a4a', sort_order: 1, is_active: true, createdAt: now, updatedAt: now },
      { id: 2, name: 'Freelancing', name_hi: 'फ्रीलांसिंग', slug: 'freelancing', description: 'Freelance work guides', icon: '💻', color: '#2563eb', sort_order: 2, is_active: true, createdAt: now, updatedAt: now },
      { id: 3, name: 'Investment', name_hi: 'निवेश', slug: 'investment', description: 'Smart investment tips', icon: '📈', color: '#7c3aed', sort_order: 3, is_active: true, createdAt: now, updatedAt: now },
      { id: 4, name: 'Business Ideas', name_hi: 'व्यापार विचार', slug: 'business-ideas', description: 'Startup and business', icon: '🏢', color: '#ea580c', sort_order: 4, is_active: true, createdAt: now, updatedAt: now },
      { id: 5, name: 'Government Jobs', name_hi: 'सरकारी नौकरी', slug: 'government-jobs', description: 'Sarkari naukri updates', icon: '🏛️', color: '#dc2626', sort_order: 5, is_active: true, createdAt: now, updatedAt: now },
      { id: 6, name: 'Digital Marketing', name_hi: 'डिजिटल मार्केटिंग', slug: 'digital-marketing', description: 'SEO, Social Media, Ads', icon: '📱', color: '#0891b2', sort_order: 6, is_active: true, createdAt: now, updatedAt: now }
    ]);

    // BLOG POSTS
    await queryInterface.bulkInsert('blog_posts', [
      { id: 1, title: 'Top 10 Ways to Earn Money Online in 2024', title_hi: '2024 में ऑनलाइन पैसे कमाने के 10 बेहतरीन तरीके', slug: 'top-10-ways-earn-money-online-2024', short_description: 'Discover the best methods to earn money online in India this year.', short_description_hi: 'इस साल भारत में ऑनलाइन पैसे कमाने के सर्वोत्तम तरीके जानें।', content: '<h2>Introduction</h2><p>The internet has opened up numerous opportunities for Indians to earn money from home. Whether you are a student, housewife, or professional, there are ways for everyone.</p><h2>1. Blogging</h2><p>Start your own blog and monetize with AdSense. Consistent quality content can generate ₹50,000+ per month.</p><h2>2. YouTube</h2><p>Create video content in Hindi or your regional language. Many Indian creators earn lakhs per month.</p><h2>3. Freelancing</h2><p>Offer skills on platforms like Fiverr, Upwork. Web development, graphic design, and content writing are in high demand.</p>', category_id: 1, author_id: 1, status: 'published', language: 'both', tags: 'money,online,india,earn', views: 15420, is_featured: true, is_breaking: false, meta_title: 'Top 10 Ways to Earn Money Online 2024 | EarnMoney.com', meta_desc: 'Discover proven methods to earn money online in India 2024', published_at: new Date('2024-01-15'), createdAt: now, updatedAt: now },
      { id: 2, title: 'How to Start Freelancing Career in India', title_hi: 'भारत में फ्रीलांसिंग करियर कैसे शुरू करें', slug: 'start-freelancing-career-india', short_description: 'Complete guide to starting your freelancing journey in India.', short_description_hi: 'भारत में फ्रीलांसिंग यात्रा शुरू करने की पूरी गाइड।', content: '<h2>What is Freelancing?</h2><p>Freelancing means working independently for multiple clients. It offers flexibility, higher income potential, and the freedom to choose your projects.</p><h2>Top Freelancing Platforms</h2><ul><li>Fiverr - Best for beginners</li><li>Upwork - For experienced professionals</li><li>Freelancer.com - Wide variety of projects</li></ul>', category_id: 2, author_id: 2, status: 'published', language: 'both', tags: 'freelancing,career,india', views: 8750, is_featured: true, is_breaking: true, meta_title: 'Start Freelancing in India 2024 | Complete Guide', meta_desc: 'Learn how to start freelancing career in India', published_at: new Date('2024-01-20'), createdAt: now, updatedAt: now },
      { id: 3, title: 'Best Investment Options for Beginners in India', title_hi: 'भारत में शुरुआती लोगों के लिए सबसे अच्छे निवेश विकल्प', slug: 'best-investment-options-beginners-india', short_description: 'Learn where to invest your money smartly in India.', short_description_hi: 'जानें भारत में अपना पैसा कहाँ निवेश करें।', content: '<h2>Why Invest?</h2><p>Investing helps your money grow over time through compound interest and capital appreciation. Here are the best options for Indian beginners.</p><h2>1. Mutual Funds SIP</h2><p>Start with as little as ₹500 per month. ELSS funds offer tax benefits under Section 80C.</p>', category_id: 3, author_id: 1, status: 'published', language: 'both', tags: 'investment,mutual funds,stock market', views: 12300, is_featured: false, is_breaking: true, meta_title: 'Best Investment Options India 2024', meta_desc: 'Smart investment options for beginners in India', published_at: new Date('2024-02-01'), createdAt: now, updatedAt: now },
      { id: 4, title: 'Digital Marketing Career: Salary & Opportunities', title_hi: 'डिजिटल मार्केटिंग करियर: वेतन और अवसर', slug: 'digital-marketing-career-salary-opportunities', short_description: 'Complete overview of digital marketing career in India.', short_description_hi: 'भारत में डिजिटल मार्केटिंग करियर का पूरा अवलोकन।', content: '<h2>Digital Marketing Overview</h2><p>Digital marketing is one of the fastest growing career fields in India. With businesses going online, demand for digital marketers has skyrocketed.</p>', category_id: 6, author_id: 2, status: 'published', language: 'both', tags: 'digital marketing,SEO,career', views: 6500, is_featured: false, is_breaking: false, meta_title: 'Digital Marketing Career India 2024', meta_desc: 'Digital marketing salary and career opportunities in India', published_at: new Date('2024-02-10'), createdAt: now, updatedAt: now },
      { id: 5, title: 'Small Business Ideas with Low Investment', title_hi: 'कम निवेश में छोटे व्यापार के विचार', slug: 'small-business-ideas-low-investment', short_description: 'Start your own business with minimum investment.', short_description_hi: 'न्यूनतम निवेश के साथ अपना व्यवसाय शुरू करें।', content: '<h2>Why Start a Small Business?</h2><p>Small businesses are the backbone of Indian economy. With the right idea and execution, you can build a successful enterprise.</p>', category_id: 4, author_id: 3, status: 'published', language: 'both', tags: 'business,startup,entrepreneur', views: 9800, is_featured: true, is_breaking: false, meta_title: 'Small Business Ideas India 2024 | Low Investment', meta_desc: 'Best small business ideas with low investment in India', published_at: new Date('2024-02-15'), createdAt: now, updatedAt: now }
    ]);

    // BANK ACCOUNTS
    await queryInterface.bulkInsert('bank_accounts', [
      { id: 1, user_id: 1, bank_name: 'State Bank of India', account_name: 'Dreams Technology', account_number: '32145678901', ifsc_code: 'SBIN0001234', account_type: 'business', opening_balance: 500000, current_balance: 685000, color: '#1a7a4a', icon: 'bi-bank', is_active: true, createdAt: now, updatedAt: now },
      { id: 2, user_id: 1, bank_name: 'HDFC Bank', account_name: 'Rahul Sharma', account_number: '50100123456789', ifsc_code: 'HDFC0001234', account_type: 'savings', opening_balance: 200000, current_balance: 345000, color: '#dc2626', icon: 'bi-credit-card', is_active: true, createdAt: now, updatedAt: now },
      { id: 3, user_id: 1, bank_name: 'Cash in Hand', account_name: 'Office Cash', account_number: null, ifsc_code: null, account_type: 'cash', opening_balance: 50000, current_balance: 32000, color: '#ea580c', icon: 'bi-cash-stack', is_active: true, createdAt: now, updatedAt: now },
      { id: 4, user_id: 1, bank_name: 'PhonePe / UPI', account_name: 'Dreams UPI', account_number: 'dreams@phonepe', ifsc_code: null, account_type: 'upi', opening_balance: 10000, current_balance: 18500, color: '#7c3aed', icon: 'bi-phone', is_active: true, createdAt: now, updatedAt: now }
    ]);

    // EXPENSE CATEGORIES
    await queryInterface.bulkInsert('expense_categories', [
      { id: 1, name: 'Salary', type: 'expense', icon: 'bi-people', color: '#dc2626', is_active: true, createdAt: now, updatedAt: now },
      { id: 2, name: 'Office Rent', type: 'expense', icon: 'bi-building', color: '#ea580c', is_active: true, createdAt: now, updatedAt: now },
      { id: 3, name: 'Internet & Hosting', type: 'expense', icon: 'bi-wifi', color: '#7c3aed', is_active: true, createdAt: now, updatedAt: now },
      { id: 4, name: 'Marketing', type: 'expense', icon: 'bi-megaphone', color: '#0891b2', is_active: true, createdAt: now, updatedAt: now },
      { id: 5, name: 'AdSense Revenue', type: 'income', icon: 'bi-google', color: '#1a7a4a', is_active: true, createdAt: now, updatedAt: now },
      { id: 6, name: 'Freelance Income', type: 'income', icon: 'bi-laptop', color: '#2563eb', is_active: true, createdAt: now, updatedAt: now },
      { id: 7, name: 'Affiliate Income', type: 'income', icon: 'bi-link', color: '#059669', is_active: true, createdAt: now, updatedAt: now },
      { id: 8, name: 'Miscellaneous', type: 'expense', icon: 'bi-three-dots', color: '#6b7280', is_active: true, createdAt: now, updatedAt: now }
    ]);

    // TRANSACTIONS
    const transactions = [];
    const months = [1, 2, 3, 4, 5, 6];
    const incomeAmounts = [45000, 52000, 48000, 61000, 55000, 72000];
    const expAmounts = [28000, 31000, 29000, 33000, 30000, 35000];
    months.forEach((m, i) => {
      const d = `2024-0${m}-`;
      transactions.push({ user_id: 1, bank_account_id: 1, category_id: 5, type: 'income', amount: incomeAmounts[i], description: `AdSense Revenue ${m}/2024`, transaction_date: d + '05', payment_method: 'neft', createdAt: now, updatedAt: now });
      transactions.push({ user_id: 1, bank_account_id: 1, category_id: 1, type: 'expense', amount: expAmounts[i], description: `Staff Salaries ${m}/2024`, transaction_date: d + '01', payment_method: 'neft', createdAt: now, updatedAt: now });
      transactions.push({ user_id: 1, bank_account_id: 2, category_id: 6, type: 'income', amount: 15000 + i * 2000, description: `Freelance Project ${i + 1}`, transaction_date: d + '15', payment_method: 'upi', createdAt: now, updatedAt: now });
      transactions.push({ user_id: 1, bank_account_id: 1, category_id: 3, type: 'expense', amount: 8000, description: 'Hosting & Domain Renewal', transaction_date: d + '10', payment_method: 'card', createdAt: now, updatedAt: now });
    });
    await queryInterface.bulkInsert('transactions', transactions);

    // ATTENDANCE RECORDS for Naresh Prajapati (user_id: 4) - June 2026
    const attendance = [];
    const attStatuses = ['P', 'P', 'P+H', 'P', 'P', 'P', 'A', 'A', 'A', 'A', 'A', 'A', 'A', 'A', 'A', 'A'];
    for (let day = 1; day <= 7; day++) {
      const date = `2026-06-0${day}`;
      let status = day === 1 ? 'A' : day === 3 ? 'P+H' : day === 7 ? 'A' : 'P';
      attendance.push({ user_id: 4, attendance_date: date, status, overtime_hours: 0, advance_amount: day === 1 ? 5000 : day === 5 ? 3400 : 0, notes: '', marked_by: 2, createdAt: now, updatedAt: now });
    }
    for (let day = 8; day <= 15; day++) {
      attendance.push({ user_id: 4, attendance_date: `2026-06-${day}`, status: 'A', overtime_hours: 0, advance_amount: 0, notes: '', marked_by: 2, createdAt: now, updatedAt: now });
    }
    // Sunita attendance
    for (let day = 1; day <= 10; day++) {
      const d = day < 10 ? `2026-06-0${day}` : `2026-06-${day}`;
      attendance.push({ user_id: 5, attendance_date: d, status: day % 3 === 0 ? 'A' : 'P', overtime_hours: 0, advance_amount: 0, notes: '', marked_by: 2, createdAt: now, updatedAt: now });
    }
    await queryInterface.bulkInsert('attendance_records', attendance);

    // AD ZONES
    await queryInterface.bulkInsert('ad_zones', [
      { id: 1, name: 'Header Banner', slug: 'header-banner', description: '728x90 Leaderboard', width: 728, height: 90, location: 'header', is_active: true, createdAt: now, updatedAt: now },
      { id: 2, name: 'Sidebar Top', slug: 'sidebar-top', description: '300x250 Medium Rectangle', width: 300, height: 250, location: 'sidebar', is_active: true, createdAt: now, updatedAt: now },
      { id: 3, name: 'Between Posts', slug: 'between-posts', description: 'In-feed Native Ad', width: 728, height: 90, location: 'between_posts', is_active: true, createdAt: now, updatedAt: now },
      { id: 4, name: 'Footer Banner', slug: 'footer-banner', description: '970x90 Billboard', width: 970, height: 90, location: 'footer', is_active: true, createdAt: now, updatedAt: now },
      { id: 5, name: 'Popup Ad', slug: 'popup-ad', description: 'Exit intent popup', width: 500, height: 400, location: 'popup', is_active: false, createdAt: now, updatedAt: now }
    ]);

    await queryInterface.bulkInsert('advertisements', [
      { title: 'Google AdSense Header', ad_zone_id: 1, ad_type: 'adsense', content: '<ins class="adsbygoogle" style="display:block" data-ad-client="ca-pub-XXXXXXXX" data-ad-slot="XXXXXXXX" data-ad-format="auto"></ins>', scope: 'global', device: 'all', impressions: 45000, clicks: 890, is_active: true, priority: 1, createdAt: now, updatedAt: now },
      { title: 'Sidebar Promo Banner', ad_zone_id: 2, ad_type: 'html', content: '<div style="background:linear-gradient(135deg,#1a7a4a,#e8a020);padding:20px;border-radius:10px;text-align:center;color:#fff"><h3>Free Course!</h3><p>Learn Digital Marketing</p><a href="#" style="background:#fff;color:#1a7a4a;padding:8px 20px;border-radius:20px;font-weight:700;display:inline-block;margin-top:10px">Enroll Now</a></div>', scope: 'global', device: 'all', impressions: 32000, clicks: 1200, is_active: true, priority: 2, createdAt: now, updatedAt: now }
    ]);

    // SETTINGS
    await queryInterface.bulkInsert('settings', [
      { key: 'site_name', value: 'EarnMoney.com', group: 'general', type: 'text', createdAt: now, updatedAt: now },
      { key: 'site_tagline', value: 'पैसे कमाएं Online | Hindi & English Blog', group: 'general', type: 'text', createdAt: now, updatedAt: now },
      { key: 'site_description', value: 'India\'s #1 Hindi blog for making money online, freelancing, investment tips', group: 'general', type: 'textarea', createdAt: now, updatedAt: now },
      { key: 'site_email', value: 'contact@earnmoney.com', group: 'general', type: 'text', createdAt: now, updatedAt: now },
      { key: 'site_phone', value: '+91 98765 43210', group: 'general', type: 'text', createdAt: now, updatedAt: now },
      { key: 'posts_per_page', value: '12', group: 'blog', type: 'number', createdAt: now, updatedAt: now },
      { key: 'default_language', value: 'hi', group: 'blog', type: 'text', createdAt: now, updatedAt: now },
      { key: 'google_analytics', value: 'G-XXXXXXXXXX', group: 'seo', type: 'text', createdAt: now, updatedAt: now },
      { key: 'adsense_code', value: 'ca-pub-XXXXXXXXXX', group: 'ads', type: 'text', createdAt: now, updatedAt: now },
      { key: 'facebook_url', value: 'https://facebook.com/earnmoney', group: 'social', type: 'text', createdAt: now, updatedAt: now },
      { key: 'youtube_url', value: 'https://youtube.com/earnmoney', group: 'social', type: 'text', createdAt: now, updatedAt: now },
      { key: 'telegram_url', value: 'https://t.me/earnmoney', group: 'social', type: 'text', createdAt: now, updatedAt: now },
      { key: 'active_theme', value: '1', group: 'theme', type: 'number', createdAt: now, updatedAt: now }
    ]);

    // SEO INDEXES
    const seoItems = [
      { url: '/', post_id: null, type: 'page', status: 'indexed', priority: 1.0, change_freq: 'daily' },
      { url: '/blog/top-10-ways-earn-money-online-2024', post_id: 1, type: 'post', status: 'indexed', priority: 0.8, change_freq: 'weekly' },
      { url: '/blog/start-freelancing-career-india', post_id: 2, type: 'post', status: 'indexed', priority: 0.8, change_freq: 'weekly' },
      { url: '/category/make-money-online', post_id: null, type: 'category', status: 'indexed', priority: 0.7, change_freq: 'daily' }
    ];
    await queryInterface.bulkInsert('seo_indexes', seoItems.map(s => ({ ...s, indexed_at: now, createdAt: now, updatedAt: now })));

    // PAGES
    await queryInterface.bulkInsert('pages', [
      { title: 'About Us', slug: 'about-us', content: '<h1>About EarnMoney.com</h1><p>We are India\'s leading platform for online earning guidance. Our mission is to help every Indian achieve financial freedom through smart work and the right guidance.</p>', is_active: true, template: 'default', createdAt: now, updatedAt: now },
      { title: 'Contact Us', slug: 'contact-us', content: '<h1>Contact Us</h1><p>Reach us at contact@earnmoney.com or call +91 98765 43210</p>', is_active: true, template: 'contact', createdAt: now, updatedAt: now },
      { title: 'Privacy Policy', slug: 'privacy-policy', content: '<h1>Privacy Policy</h1><p>Your privacy is important to us...</p>', is_active: true, template: 'legal', createdAt: now, updatedAt: now },
      { title: 'Disclaimer', slug: 'disclaimer', content: '<h1>Disclaimer</h1><p>The content on this website is for informational purposes only...</p>', is_active: true, template: 'legal', createdAt: now, updatedAt: now }
    ]);
  },

  down: async (queryInterface) => {
    await queryInterface.bulkDelete('pages', null, {});
    await queryInterface.bulkDelete('seo_indexes', null, {});
    await queryInterface.bulkDelete('settings', null, {});
    await queryInterface.bulkDelete('advertisements', null, {});
    await queryInterface.bulkDelete('ad_zones', null, {});
    await queryInterface.bulkDelete('attendance_records', null, {});
    await queryInterface.bulkDelete('transactions', null, {});
    await queryInterface.bulkDelete('expense_categories', null, {});
    await queryInterface.bulkDelete('bank_accounts', null, {});
    await queryInterface.bulkDelete('blog_posts', null, {});
    await queryInterface.bulkDelete('blog_categories', null, {});
    await queryInterface.bulkDelete('role_menu_permissions', null, {});
    await queryInterface.bulkDelete('menu_items', null, {});
    await queryInterface.bulkDelete('users', null, {});
    await queryInterface.bulkDelete('themes', null, {});
    await queryInterface.bulkDelete('roles', null, {});
  }
};
