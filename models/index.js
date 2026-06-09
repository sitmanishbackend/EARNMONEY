'use strict';
const { Sequelize, DataTypes } = require('sequelize');
const config = require('../config/config.js')[process.env.NODE_ENV || 'development'];

const sequelize = new Sequelize(config.database, config.username, config.password, {
  host: config.host, port: config.port, dialect: config.dialect, logging: config.logging
});

// Models
const Role = sequelize.define('Role', {
  id: { type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true },
  name: DataTypes.STRING,
  slug: DataTypes.STRING,
  description: DataTypes.TEXT
}, { tableName: 'roles' });

const User = sequelize.define('User', {
  id: { type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true },
  name: DataTypes.STRING,
  email: DataTypes.STRING,
  phone: DataTypes.STRING,
  password: DataTypes.STRING,
  role_id: DataTypes.INTEGER,
  avatar: DataTypes.STRING,
  is_active: { type: DataTypes.BOOLEAN, defaultValue: true },
  salary_type: DataTypes.ENUM('daily','monthly','hourly'),
  salary_amount: DataTypes.DECIMAL(10,2),
  joining_date: DataTypes.DATEONLY,
  last_login: DataTypes.DATE
}, { tableName: 'users' });

const Theme = sequelize.define('Theme', {
  id: { type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true },
  name: DataTypes.STRING, slug: DataTypes.STRING,
  primary_color: DataTypes.STRING, secondary_color: DataTypes.STRING,
  accent_dark: DataTypes.STRING, accent_light: DataTypes.STRING,
  sidebar_bg: DataTypes.STRING, sidebar_text: DataTypes.STRING,
  nav_bg: DataTypes.STRING, btn_color: DataTypes.STRING,
  is_active: DataTypes.BOOLEAN, is_system: DataTypes.BOOLEAN, preview_img: DataTypes.STRING
}, { tableName: 'themes' });

const MenuItem = sequelize.define('MenuItem', {
  id: { type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true },
  parent_id: DataTypes.INTEGER, label: DataTypes.STRING, label_hi: DataTypes.STRING,
  icon: DataTypes.STRING, route: DataTypes.STRING, menu_type: DataTypes.STRING,
  sort_order: DataTypes.INTEGER, is_active: DataTypes.BOOLEAN,
  badge: DataTypes.STRING, badge_color: DataTypes.STRING
}, { tableName: 'menu_items' });

const RoleMenuPermission = sequelize.define('RoleMenuPermission', {
  id: { type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true },
  role_id: DataTypes.INTEGER, menu_item_id: DataTypes.INTEGER,
  can_view: DataTypes.BOOLEAN, can_create: DataTypes.BOOLEAN,
  can_edit: DataTypes.BOOLEAN, can_delete: DataTypes.BOOLEAN
}, { tableName: 'role_menu_permissions' });

const BlogCategory = sequelize.define('BlogCategory', {
  id: { type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true },
  name: DataTypes.STRING, name_hi: DataTypes.STRING, slug: DataTypes.STRING,
  description: DataTypes.TEXT, icon: DataTypes.STRING, color: DataTypes.STRING,
  parent_id: DataTypes.INTEGER, sort_order: DataTypes.INTEGER, is_active: DataTypes.BOOLEAN,
  meta_title: DataTypes.STRING, meta_desc: DataTypes.TEXT
}, { tableName: 'blog_categories' });

const BlogPost = sequelize.define('BlogPost', {
  id: { type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true },
  title: DataTypes.STRING, title_hi: DataTypes.STRING, slug: DataTypes.STRING,
  short_description: DataTypes.TEXT, short_description_hi: DataTypes.TEXT,
  content: DataTypes.TEXT('long'), content_hi: DataTypes.TEXT('long'),
  featured_image: DataTypes.STRING, category_id: DataTypes.INTEGER, author_id: DataTypes.INTEGER,
  status: DataTypes.STRING, language: DataTypes.STRING, tags: DataTypes.TEXT,
  views: { type: DataTypes.INTEGER, defaultValue: 0 },
  is_featured: DataTypes.BOOLEAN, is_breaking: DataTypes.BOOLEAN,
  meta_title: DataTypes.STRING, meta_desc: DataTypes.TEXT, meta_keywords: DataTypes.TEXT,
  published_at: DataTypes.DATE
}, { tableName: 'blog_posts' });

const PostCustomField = sequelize.define('PostCustomField', {
  id: { type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true },
  post_id: DataTypes.INTEGER, field_label: DataTypes.STRING,
  field_type: DataTypes.STRING, field_value: DataTypes.TEXT, sort_order: DataTypes.INTEGER
}, { tableName: 'post_custom_fields' });

const PostSuggestion = sequelize.define('PostSuggestion', {
  id: { type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true },
  post_id: DataTypes.INTEGER, suggested_post_id: DataTypes.INTEGER, sort_order: DataTypes.INTEGER
}, { tableName: 'post_suggestions' });

const AdZone = sequelize.define('AdZone', {
  id: { type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true },
  name: DataTypes.STRING, slug: DataTypes.STRING, description: DataTypes.TEXT,
  width: DataTypes.INTEGER, height: DataTypes.INTEGER, location: DataTypes.STRING,
  is_active: DataTypes.BOOLEAN
}, { tableName: 'ad_zones' });

const Advertisement = sequelize.define('Advertisement', {
  id: { type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true },
  title: DataTypes.STRING, ad_zone_id: DataTypes.INTEGER, ad_type: DataTypes.STRING,
  content: DataTypes.TEXT('long'), image_url: DataTypes.STRING, target_url: DataTypes.STRING,
  target_blank: DataTypes.BOOLEAN, scope: DataTypes.STRING, scope_ids: DataTypes.TEXT,
  device: DataTypes.STRING, start_date: DataTypes.DATEONLY, end_date: DataTypes.DATEONLY,
  impressions: DataTypes.INTEGER, clicks: DataTypes.INTEGER, is_active: DataTypes.BOOLEAN, priority: DataTypes.INTEGER
}, { tableName: 'advertisements' });

const BankAccount = sequelize.define('BankAccount', {
  id: { type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true },
  user_id: DataTypes.INTEGER, bank_name: DataTypes.STRING, account_name: DataTypes.STRING,
  account_number: DataTypes.STRING, ifsc_code: DataTypes.STRING, account_type: DataTypes.STRING,
  opening_balance: DataTypes.DECIMAL(15,2), current_balance: DataTypes.DECIMAL(15,2),
  color: DataTypes.STRING, icon: DataTypes.STRING, is_active: DataTypes.BOOLEAN
}, { tableName: 'bank_accounts' });

const ExpenseCategory = sequelize.define('ExpenseCategory', {
  id: { type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true },
  name: DataTypes.STRING, type: DataTypes.STRING, icon: DataTypes.STRING,
  color: DataTypes.STRING, is_active: DataTypes.BOOLEAN
}, { tableName: 'expense_categories' });

const Transaction = sequelize.define('Transaction', {
  id: { type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true },
  user_id: DataTypes.INTEGER, bank_account_id: DataTypes.INTEGER, category_id: DataTypes.INTEGER,
  type: DataTypes.STRING, amount: DataTypes.DECIMAL(15,2), description: DataTypes.TEXT,
  reference: DataTypes.STRING, transaction_date: DataTypes.DATEONLY, payment_method: DataTypes.STRING,
  transfer_to_account_id: DataTypes.INTEGER, receipt_image: DataTypes.STRING, tags: DataTypes.TEXT
}, { tableName: 'transactions' });

const AttendanceRecord = sequelize.define('AttendanceRecord', {
  id: { type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true },
  user_id: DataTypes.INTEGER, attendance_date: DataTypes.DATEONLY, status: DataTypes.STRING,
  overtime_hours: DataTypes.DECIMAL(4,2), check_in: DataTypes.STRING, check_out: DataTypes.STRING,
  advance_amount: DataTypes.DECIMAL(10,2), notes: DataTypes.TEXT, marked_by: DataTypes.INTEGER
}, { tableName: 'attendance_records' });

const SalaryPayment = sequelize.define('SalaryPayment', {
  id: { type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true },
  user_id: DataTypes.INTEGER, month: DataTypes.INTEGER, year: DataTypes.INTEGER,
  total_days: DataTypes.INTEGER, present_days: DataTypes.DECIMAL(5,2), absent_days: DataTypes.DECIMAL(5,2),
  overtime_days: DataTypes.DECIMAL(5,2), gross_salary: DataTypes.DECIMAL(10,2),
  advance_deduction: DataTypes.DECIMAL(10,2), net_salary: DataTypes.DECIMAL(10,2),
  payment_date: DataTypes.DATEONLY, payment_method: DataTypes.STRING, status: DataTypes.STRING, notes: DataTypes.TEXT
}, { tableName: 'salary_payments' });

const Setting = sequelize.define('Setting', {
  id: { type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true },
  key: DataTypes.STRING, value: DataTypes.TEXT('long'), group: DataTypes.STRING, type: DataTypes.STRING
}, { tableName: 'settings' });

const SeoIndex = sequelize.define('SeoIndex', {
  id: { type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true },
  url: DataTypes.STRING, post_id: DataTypes.INTEGER, type: DataTypes.STRING,
  status: DataTypes.STRING, indexed_at: DataTypes.DATE,
  priority: DataTypes.FLOAT, change_freq: DataTypes.STRING
}, { tableName: 'seo_indexes' });

const Page = sequelize.define('Page', {
  id: { type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true },
  title: DataTypes.STRING, slug: DataTypes.STRING, content: DataTypes.TEXT('long'),
  meta_title: DataTypes.STRING, meta_desc: DataTypes.TEXT,
  is_active: DataTypes.BOOLEAN, template: DataTypes.STRING
}, { tableName: 'pages' });

// ASSOCIATIONS
User.belongsTo(Role, { foreignKey: 'role_id', as: 'role' });
Role.hasMany(User, { foreignKey: 'role_id' });
BlogPost.belongsTo(BlogCategory, { foreignKey: 'category_id', as: 'category' });
BlogPost.belongsTo(User, { foreignKey: 'author_id', as: 'author' });
BlogPost.hasMany(PostCustomField, { foreignKey: 'post_id', as: 'customFields' });
BlogPost.hasMany(PostSuggestion, { foreignKey: 'post_id', as: 'suggestions' });
BlogCategory.hasMany(BlogPost, { foreignKey: 'category_id' });
Advertisement.belongsTo(AdZone, { foreignKey: 'ad_zone_id', as: 'zone' });
Transaction.belongsTo(BankAccount, { foreignKey: 'bank_account_id', as: 'account' });
Transaction.belongsTo(ExpenseCategory, { foreignKey: 'category_id', as: 'category' });
Transaction.belongsTo(User, { foreignKey: 'user_id', as: 'user' });
AttendanceRecord.belongsTo(User, { foreignKey: 'user_id', as: 'user' });
SalaryPayment.belongsTo(User, { foreignKey: 'user_id', as: 'user' });

module.exports = {
  sequelize, Role, User, Theme, MenuItem, RoleMenuPermission,
  BlogCategory, BlogPost, PostCustomField, PostSuggestion,
  AdZone, Advertisement, BankAccount, ExpenseCategory, Transaction,
  AttendanceRecord, SalaryPayment, Setting, SeoIndex, Page
};
