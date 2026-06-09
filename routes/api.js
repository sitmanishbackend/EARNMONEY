'use strict';
const express = require('express');
const router = express.Router();
const { BlogPost, BlogCategory, User, AttendanceRecord, Transaction, BankAccount, Theme, Setting } = require('../models');
const { Op } = require('sequelize');

// Search posts
router.get('/posts/search', async (req, res) => {
  const { q } = req.query;
  const posts = await BlogPost.findAll({ where: { title: { [Op.like]: `%${q}%` }, status: 'published' }, attributes: ['id', 'title', 'slug', 'featured_image'], limit: 10 });
  res.json(posts);
});

// Mark attendance (AJAX)
router.post('/attendance/mark', async (req, res) => {
  try {
    const { user_id, attendance_date, status, advance_amount, notes } = req.body;
    const [record, created] = await AttendanceRecord.upsert({ user_id, attendance_date, status, advance_amount: advance_amount || 0, notes: notes || '', marked_by: req.session.user ? req.session.user.id : 1 });
    res.json({ success: true, record });
  } catch(e) { res.json({ success: false, error: e.message }); }
});

// Finance chart data
router.get('/finance/chart', async (req, res) => {
  try {
    const { sequelize } = require('../models');
    const data = await Transaction.findAll({
      attributes: [[sequelize.fn('MONTH', sequelize.col('transaction_date')), 'month'], [sequelize.fn('YEAR', sequelize.col('transaction_date')), 'year'], 'type', [sequelize.fn('SUM', sequelize.col('amount')), 'total']],
      group: ['month', 'year', 'type'], order: [['year', 'ASC'], ['month', 'ASC']], raw: true
    });
    res.json(data);
  } catch(e) { res.json([]); }
});

// Theme preview data
router.get('/themes/:id', async (req, res) => {
  const theme = await Theme.findByPk(req.params.id);
  res.json(theme);
});

// Dashboard stats
router.get('/dashboard/stats', async (req, res) => {
  const [posts, users] = await Promise.all([
    BlogPost.count({ where: { status: 'published' } }),
    User.count({ where: { is_active: true } })
  ]);
  res.json({ posts, users });
});

module.exports = router;
