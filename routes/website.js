'use strict';
const express = require('express');
const router = express.Router();
const { BlogPost, BlogCategory, Advertisement, AdZone, Setting, Page, sequelize } = require('../models');
const { Op } = require('sequelize');

// Helper: get ads for zone
async function getAdsForZone(zoneSlug) {
  try {
    const today = new Date().toISOString().split('T')[0];
    return await Advertisement.findAll({
      include: [{ model: AdZone, as: 'zone', where: { slug: zoneSlug }, required: true }],
      where: { is_active: true, [Op.or]: [{ start_date: null }, { start_date: { [Op.lte]: today } }], [Op.and]: [{ [Op.or]: [{ end_date: null }, { end_date: { [Op.gte]: today } }] }] },
      order: [['priority', 'DESC']], limit: 3
    });
  } catch(e) { return []; }
}

// HOME
router.get('/', async (req, res) => {
  try {
    const [featured, latest, breaking, categories, headerAds, sidebarAds] = await Promise.all([
      BlogPost.findAll({ where: { status: 'published', is_featured: true }, include: [{ model: BlogCategory, as: 'category' }], limit: 5, order: [['published_at', 'DESC']] }),
      BlogPost.findAll({ where: { status: 'published' }, include: [{ model: BlogCategory, as: 'category' }], limit: 12, order: [['published_at', 'DESC']] }),
      BlogPost.findAll({ where: { status: 'published', is_breaking: true }, limit: 8, order: [['published_at', 'DESC']] }),
      BlogCategory.findAll({ where: { is_active: true }, order: [['sort_order', 'ASC']] }),
      getAdsForZone('header-banner'),
      getAdsForZone('sidebar-top')
    ]);
    res.render('website/pages/home', { title: res.locals.siteName, featured, latest, breaking, categories, headerAds, sidebarAds, currentPage: 'home' });
  } catch(e) { console.error(e); res.render('website/pages/home', { title: 'Home', featured: [], latest: [], breaking: [], categories: [], headerAds: [], sidebarAds: [], currentPage: 'home' }); }
});

// BLOG LIST
router.get('/blog', async (req, res) => {
  const page = parseInt(req.query.page) || 1;
  const limit = 12;
  const offset = (page - 1) * limit;
  const { cat, tag, lang, q } = req.query;
  let where = { status: 'published' };
  if (cat) where.category_id = cat;
  if (lang) where.language = { [Op.in]: [lang, 'both'] };
  if (q) where[Op.or] = [{ title: { [Op.like]: `%${q}%` } }, { title_hi: { [Op.like]: `%${q}%` } }];
  if (tag) where.tags = { [Op.like]: `%${tag}%` };
  try {
    const { count, rows: posts } = await BlogPost.findAndCountAll({ where, include: [{ model: BlogCategory, as: 'category' }], limit, offset, order: [['published_at', 'DESC']], distinct: true });
    const categories = await BlogCategory.findAll({ where: { is_active: true } });
    const popular = await BlogPost.findAll({ where: { status: 'published' }, order: [['views', 'DESC']], limit: 5, include: [{ model: BlogCategory, as: 'category' }] });
    res.render('website/pages/blog-list', { title: 'Blog - ' + res.locals.siteName, posts, categories, popular, count, page, limit, cat, tag, lang, q: q || '' });
  } catch(e) { console.error(e); res.render('website/pages/blog-list', { title: 'Blog', posts: [], categories: [], popular: [], count: 0, page: 1, limit: 12, cat: null, tag: null, lang: null, q: '' }); }
});

// SINGLE POST
router.get('/blog/:slug', async (req, res) => {
  try {
    const post = await BlogPost.findOne({ where: { slug: req.params.slug, status: 'published' }, include: [{ model: BlogCategory, as: 'category' }, { model: BlogCategory, as: 'category' }] });
    if (!post) return res.status(404).render('website/pages/404', { title: '404' });
    await post.increment('views');
    const related = await BlogPost.findAll({ where: { status: 'published', category_id: post.category_id, id: { [Op.ne]: post.id } }, limit: 4, order: [['published_at', 'DESC']], include: [{ model: BlogCategory, as: 'category' }] });
    const sidebarAds = await getAdsForZone('sidebar-top');
    res.render('website/pages/single-post', { title: post.title + ' | ' + res.locals.siteName, post, related, sidebarAds });
  } catch(e) { console.error(e); res.status(500).render('website/pages/404', { title: 'Error' }); }
});

// CATEGORY PAGE
router.get('/category/:slug', async (req, res) => {
  try {
    const category = await BlogCategory.findOne({ where: { slug: req.params.slug, is_active: true } });
    if (!category) return res.status(404).render('website/pages/404', { title: '404' });
    const page = parseInt(req.query.page) || 1;
    const limit = 12;
    const { count, rows: posts } = await BlogPost.findAndCountAll({ where: { status: 'published', category_id: category.id }, include: [{ model: BlogCategory, as: 'category' }], limit, offset: (page - 1) * limit, order: [['published_at', 'DESC']], distinct: true });
    const categories = await BlogCategory.findAll({ where: { is_active: true } });
    res.render('website/pages/category', { title: category.name + ' | ' + res.locals.siteName, category, posts, categories, count, page, limit });
  } catch(e) { console.error(e); res.status(500).render('website/pages/404', { title: 'Error' }); }
});

// STATIC PAGES
router.get('/page/:slug', async (req, res) => {
  try {
    const page = await Page.findOne({ where: { slug: req.params.slug, is_active: true } });
    if (!page) return res.status(404).render('website/pages/404', { title: '404' });
    res.render('website/pages/static-page', { title: page.title + ' | ' + res.locals.siteName, page });
  } catch(e) { res.status(404).render('website/pages/404', { title: '404' }); }
});

// SEARCH
router.get('/search', async (req, res) => {
  const q = req.query.q || '';
  try {
    const posts = q ? await BlogPost.findAll({ where: { status: 'published', [Op.or]: [{ title: { [Op.like]: `%${q}%` } }, { title_hi: { [Op.like]: `%${q}%` } }, { tags: { [Op.like]: `%${q}%` } }] }, include: [{ model: BlogCategory, as: 'category' }], limit: 20, order: [['views', 'DESC']] }) : [];
    res.render('website/pages/search', { title: `Search: ${q} | ${res.locals.siteName}`, posts, q });
  } catch(e) { res.render('website/pages/search', { title: 'Search', posts: [], q }); }
});

// Ad click tracking
router.post('/ad-click/:id', async (req, res) => {
  try {
    await Advertisement.increment('clicks', { where: { id: req.params.id } });
    res.json({ ok: true });
  } catch(e) { res.json({ ok: false }); }
});

module.exports = router;
