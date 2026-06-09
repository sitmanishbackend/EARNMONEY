'use strict';
const express = require('express');
const router = express.Router();
const { BlogPost, BlogCategory, SeoIndex } = require('../models');

router.get('/sitemap.xml', async (req, res) => {
  try {
    const baseUrl = process.env.APP_URL || 'https://earnmoney.com';
    const [posts, categories, seoItems] = await Promise.all([
      BlogPost.findAll({ where: { status: 'published' }, attributes: ['slug', 'updatedAt'], order: [['published_at', 'DESC']] }),
      BlogCategory.findAll({ where: { is_active: true }, attributes: ['slug', 'updatedAt'] }),
      SeoIndex.findAll({ where: { status: 'indexed' } })
    ]);

    let xml = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
  <url><loc>${baseUrl}/</loc><changefreq>daily</changefreq><priority>1.0</priority></url>
  <url><loc>${baseUrl}/blog</loc><changefreq>daily</changefreq><priority>0.9</priority></url>`;

    posts.forEach(p => {
      xml += `\n  <url><loc>${baseUrl}/blog/${p.slug}</loc><lastmod>${p.updatedAt ? p.updatedAt.toISOString().split('T')[0] : ''}</lastmod><changefreq>weekly</changefreq><priority>0.8</priority></url>`;
    });

    categories.forEach(c => {
      xml += `\n  <url><loc>${baseUrl}/category/${c.slug}</loc><changefreq>daily</changefreq><priority>0.7</priority></url>`;
    });

    xml += '\n</urlset>';

    res.set('Content-Type', 'application/xml');
    res.send(xml);
  } catch (e) {
    res.status(500).send('<?xml version="1.0"?><urlset></urlset>');
  }
});

module.exports = router;
