# 🚀 Dreams Technology CMS

A full-stack CMS with Blog, Attendance, Finance, Ads Management, Theme Manager, SEO Tools, and Database Manager.

**Stack:** Node.js + Express + EJS + MySQL + Sequelize

---

## ⚡ Quick Start (One Command)

```bash
# 1. Extract zip, enter folder
cd dreams-cms

# 2. Install & setup everything
npm run setup
```

Then open: **http://localhost:3000**

---

## 🔧 Manual Setup

### Step 1: Install Dependencies
```bash
npm install
```

### Step 2: Create MySQL Database
```sql
CREATE DATABASE dreams_cms CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
```

### Step 3: Configure Environment
Edit `.env` file:
```
DB_HOST=localhost
DB_PORT=3306
DB_NAME=dreams_cms
DB_USER=root
DB_PASS=your_password
PORT=3000
```

### Step 4: Run Migrations
```bash
npm run migrate
# or manually:
npx sequelize-cli db:migrate
```

### Step 5: Seed Demo Data
```bash
npm run seed
# or manually:
npx sequelize-cli db:seed:all
```

### Step 6: Start Server
```bash
npm start
# Development (auto-restart):
npm run dev
```

---

## 🗃️ Database Commands

| Command | Description |
|---------|-------------|
| `npm run migrate` | Run all pending migrations |
| `npm run migrate:undo` | Rollback ALL migrations |
| `npm run seed` | Insert all demo data |
| `npm run seed:undo` | Remove all seeded data |
| `npm run fresh` | Full reset: undo + migrate + seed |

### Individual Migration Commands:
```bash
# Run specific migration
npx sequelize-cli db:migrate --to 001-create-roles.js

# Undo last migration
npx sequelize-cli db:migrate:undo

# Check migration status
npx sequelize-cli db:migrate:status

# Run specific seeder
npx sequelize-cli db:seed --seed 001-main-seed.js

# Undo specific seeder
npx sequelize-cli db:seed:undo --seed 001-main-seed.js
```

### Database Indexing Commands:
```bash
# Add index to blog_posts (slug for faster lookups)
npx sequelize-cli db:migrate --to 005-create-blog.js

# MySQL manual index creation
mysql -u root -p dreams_cms -e "
  CREATE INDEX idx_posts_slug ON blog_posts(slug);
  CREATE INDEX idx_posts_status ON blog_posts(status);
  CREATE INDEX idx_posts_category ON blog_posts(category_id);
  CREATE INDEX idx_attendance_user_date ON attendance_records(user_id, attendance_date);
  CREATE INDEX idx_transactions_date ON transactions(transaction_date);
  CREATE INDEX idx_transactions_type ON transactions(type);
"
```

---

## 🔐 Login Credentials

| Role | Email | Password |
|------|-------|----------|
| **Super Admin** | superadmin@dreams.com | Admin@123 |
| **Admin** | admin@dreams.com | Admin@123 |
| **Developer** | dev@dreams.com | Admin@123 |
| **User** | naresh@dreams.com | User@123 |

---

## 📁 Project Structure

```
dreams-cms/
├── server.js              # Entry point
├── .env                   # Environment config
├── config/
│   └── config.js          # Database config
├── migrations/            # DB schema migrations
│   ├── 001-create-roles.js
│   ├── 002-create-users.js
│   ├── 003-create-themes.js
│   ├── 004-create-menus.js
│   ├── 005-create-blog.js
│   ├── 006-create-ads.js
│   ├── 007-create-finance.js
│   ├── 008-create-attendance.js
│   └── 009-create-settings.js
├── seeders/
│   └── 001-main-seed.js   # Demo data
├── models/
│   └── index.js           # All Sequelize models
├── routes/
│   ├── admin.js           # Admin panel routes
│   ├── website.js         # Public website routes
│   ├── api.js             # REST API routes
│   └── sitemap.js         # XML sitemap
├── middleware/
│   └── auth.js            # Auth, session, theme injection
├── views/
│   ├── admin/
│   │   ├── partials/      # head, sidebar, topbar, flash, scripts
│   │   └── pages/         # dashboard, posts, users, attendance, finance...
│   └── website/
│       ├── partials/      # header, footer
│       └── pages/         # home, blog-list, single-post, category...
└── public/
    └── uploads/           # User uploaded files
```

---

## 🌐 URLs

### Website
- **Home:** http://localhost:3000
- **Blog:** http://localhost:3000/blog
- **Category:** http://localhost:3000/category/make-money-online
- **Search:** http://localhost:3000/search?q=freelancing
- **Sitemap:** http://localhost:3000/sitemap.xml

### Admin Panel
- **Login:** http://localhost:3000/admin/login
- **Dashboard:** http://localhost:3000/admin/dashboard
- **Posts:** http://localhost:3000/admin/posts
- **Attendance:** http://localhost:3000/admin/attendance
- **Finance:** http://localhost:3000/admin/finance
- **Ads:** http://localhost:3000/admin/ads
- **Themes:** http://localhost:3000/admin/themes
- **SEO/Blog Booster:** http://localhost:3000/admin/seo
- **Database:** http://localhost:3000/admin/database
- **Settings:** http://localhost:3000/admin/settings
- **Permissions:** http://localhost:3000/admin/permissions

---

## 🎨 Features

### ✅ Implemented
- **4 Roles:** Super Admin, Admin, Developer, User
- **Dynamic Sidebar** from DB with role-based permissions
- **5 Themes** with live desktop preview & one-click activation
- **Blog System** with Hindi+English bilingual support, custom fields, SEO
- **Ads Management** with zones (header, sidebar, footer, popup, between-posts), global/category/post scope
- **Finance Module** with bank accounts, income/expense tracking, charts
- **Attendance System** like the app screenshots: P, A, ½, P+½, P+P, OT, PA statuses
- **Database Manager** (phpMyAdmin style) - browse tables, run SQL, view structure
- **SEO/Blog Booster** - indexing queue, sitemap, meta overview, 3-month ranking strategy
- **Theme Manager** with live PC preview panel
- **Settings** - social links, scripts, SEO, newsletter

### 🔧 Stack
- Node.js + Express 4
- EJS templating
- MySQL + Sequelize ORM
- Session-based auth (bcrypt)
- Bootstrap Icons
- Chart.js for graphs

---

## 💡 3-Month AdSense Strategy (Built-in)

See **Admin → Blog Booster → Reports → "View Full Strategy"** button for the complete guide to:
- 100+ daily organic visitors in 60 days
- AdSense approval requirements
- Income targets: ₹1 Lakh+/month in 6 months

---

## 🔮 Upcoming Features (Planned)
- Test Series Module
- Competition Papers
- Online Tools (calculators, converters)
- Push Notifications
- AMP Pages
- PWA Support
