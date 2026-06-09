'use strict';

module.exports = {
  async up(queryInterface, Sequelize) {
    const transaction = await queryInterface.sequelize.transaction();

    try {
      const tables = await queryInterface.showAllTables();

      // Blog Categories
      if (!tables.includes('blog_categories')) {
        await queryInterface.createTable(
          'blog_categories',
          {
            id: { type: Sequelize.INTEGER, primaryKey: true, autoIncrement: true },
            name: { type: Sequelize.STRING(100), allowNull: false },
            name_hi: { type: Sequelize.STRING(100) },
            slug: { type: Sequelize.STRING(120), unique: true },
            description: { type: Sequelize.TEXT },
            icon: { type: Sequelize.STRING(50) },
            color: { type: Sequelize.STRING(20), defaultValue: '#1a7a4a' },
            parent_id: { type: Sequelize.INTEGER, defaultValue: null },
            sort_order: { type: Sequelize.INTEGER, defaultValue: 0 },
            is_active: { type: Sequelize.BOOLEAN, defaultValue: true },
            meta_title: { type: Sequelize.STRING(200) },
            meta_desc: { type: Sequelize.TEXT },
            createdAt: { type: Sequelize.DATE, defaultValue: Sequelize.NOW },
            updatedAt: { type: Sequelize.DATE, defaultValue: Sequelize.NOW }
          },
          { transaction }
        );
      }

      // Blog Posts
      if (!tables.includes('blog_posts')) {
        await queryInterface.createTable(
          'blog_posts',
          {
            id: { type: Sequelize.INTEGER, primaryKey: true, autoIncrement: true },
            title: { type: Sequelize.STRING(300), allowNull: false },
            title_hi: { type: Sequelize.STRING(300) },
            slug: { type: Sequelize.STRING(350), unique: true },

            short_description: { type: Sequelize.TEXT },
            short_description_hi: { type: Sequelize.TEXT },

            content: { type: Sequelize.TEXT('long') },
            content_hi: { type: Sequelize.TEXT('long') },

            featured_image: { type: Sequelize.STRING(255) },

            category_id: {
              type: Sequelize.INTEGER,
              references: {
                model: 'blog_categories',
                key: 'id'
              },
              onDelete: 'SET NULL',
              onUpdate: 'CASCADE'
            },

            author_id: {
              type: Sequelize.INTEGER,
              references: {
                model: 'users',
                key: 'id'
              },
              onDelete: 'SET NULL',
              onUpdate: 'CASCADE'
            },

            status: {
              type: Sequelize.ENUM(
                'draft',
                'published',
                'scheduled',
                'archived'
              ),
              defaultValue: 'draft'
            },

            language: {
              type: Sequelize.ENUM(
                'en',
                'hi',
                'both'
              ),
              defaultValue: 'both'
            },

            tags: { type: Sequelize.TEXT },

            views: { type: Sequelize.INTEGER, defaultValue: 0 },

            is_featured: { type: Sequelize.BOOLEAN, defaultValue: false },

            is_breaking: { type: Sequelize.BOOLEAN, defaultValue: false },

            meta_title: { type: Sequelize.STRING(200) },

            meta_desc: { type: Sequelize.TEXT },

            meta_keywords: { type: Sequelize.TEXT },

            published_at: { type: Sequelize.DATE },

            createdAt: {
              type: Sequelize.DATE,
              defaultValue: Sequelize.NOW
            },

            updatedAt: {
              type: Sequelize.DATE,
              defaultValue: Sequelize.NOW
            }
          },
          { transaction }
        );
      }

      // Post Custom Fields
      if (!tables.includes('post_custom_fields')) {
        await queryInterface.createTable(
          'post_custom_fields',
          {
            id: {
              type: Sequelize.INTEGER,
              primaryKey: true,
              autoIncrement: true
            },

            post_id: {
              type: Sequelize.INTEGER,
              references: {
                model: 'blog_posts',
                key: 'id'
              },
              onDelete: 'CASCADE',
              onUpdate: 'CASCADE'
            },

            field_label: {
              type: Sequelize.STRING(100),
              allowNull: false
            },

            field_type: {
              type: Sequelize.ENUM(
                'text',
                'textarea',
                'number',
                'url',
                'image',
                'date'
              ),
              defaultValue: 'text'
            },

            field_value: { type: Sequelize.TEXT },

            sort_order: {
              type: Sequelize.INTEGER,
              defaultValue: 0
            },

            createdAt: {
              type: Sequelize.DATE,
              defaultValue: Sequelize.NOW
            },

            updatedAt: {
              type: Sequelize.DATE,
              defaultValue: Sequelize.NOW
            }
          },
          { transaction }
        );
      }

      // Post Suggestions
      if (!tables.includes('post_suggestions')) {
        await queryInterface.createTable(
          'post_suggestions',
          {
            id: {
              type: Sequelize.INTEGER,
              primaryKey: true,
              autoIncrement: true
            },

            post_id: {
              type: Sequelize.INTEGER,
              references: {
                model: 'blog_posts',
                key: 'id'
              },
              onDelete: 'CASCADE',
              onUpdate: 'CASCADE'
            },

            suggested_post_id: {
              type: Sequelize.INTEGER,
              references: {
                model: 'blog_posts',
                key: 'id'
              },
              onDelete: 'CASCADE',
              onUpdate: 'CASCADE'
            },

            sort_order: {
              type: Sequelize.INTEGER,
              defaultValue: 0
            },

            createdAt: {
              type: Sequelize.DATE,
              defaultValue: Sequelize.NOW
            },

            updatedAt: {
              type: Sequelize.DATE,
              defaultValue: Sequelize.NOW
            }
          },
          { transaction }
        );
      }

      await transaction.commit();
      console.log('✅ Blog migration completed successfully.');
    } catch (error) {
      await transaction.rollback();

      console.error('❌ Blog migration failed');
      console.error(error);

      throw error;
    }
  },

  async down(queryInterface) {
    const transaction = await queryInterface.sequelize.transaction();

    try {
      await queryInterface.dropTable('post_suggestions', { transaction }).catch(() => {});
      await queryInterface.dropTable('post_custom_fields', { transaction }).catch(() => {});
      await queryInterface.dropTable('blog_posts', { transaction }).catch(() => {});
      await queryInterface.dropTable('blog_categories', { transaction }).catch(() => {});

      await transaction.commit();
    } catch (error) {
      await transaction.rollback();
      throw error;
    }
  }
};