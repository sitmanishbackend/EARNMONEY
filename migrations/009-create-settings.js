'use strict';

module.exports = {
  async up(queryInterface, Sequelize) {
    const transaction = await queryInterface.sequelize.transaction();

    try {
      const tables = await queryInterface.showAllTables();

      // Settings
      if (!tables.includes('settings')) {
        await queryInterface.createTable(
          'settings',
          {
            id: {
              type: Sequelize.INTEGER,
              primaryKey: true,
              autoIncrement: true
            },

            key: {
              type: Sequelize.STRING(100),
              allowNull: false,
              unique: true
            },

            value: {
              type: Sequelize.TEXT('long') // LONGTEXT replaced
            },

            group: {
              type: Sequelize.STRING(50),
              defaultValue: 'general'
            },

            type: {
              type: Sequelize.ENUM(
                'text',
                'textarea',
                'image',
                'boolean',
                'json',
                'number'
              ),
              defaultValue: 'text'
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

      // SEO Indexes
      if (!tables.includes('seo_indexes')) {
        await queryInterface.createTable(
          'seo_indexes',
          {
            id: {
              type: Sequelize.INTEGER,
              primaryKey: true,
              autoIncrement: true
            },

            url: {
              type: Sequelize.STRING(500),
              allowNull: false
            },

            post_id: {
              type: Sequelize.INTEGER
            },

            type: {
              type: Sequelize.ENUM(
                'post',
                'category',
                'page',
                'tag'
              ),
              defaultValue: 'post'
            },

            status: {
              type: Sequelize.ENUM(
                'pending',
                'indexed',
                'failed',
                'deactivated'
              ),
              defaultValue: 'pending'
            },

            indexed_at: {
              type: Sequelize.DATE
            },

            priority: {
              type: Sequelize.FLOAT,
              defaultValue: 0.5
            },

            change_freq: {
              type: Sequelize.ENUM(
                'always',
                'hourly',
                'daily',
                'weekly',
                'monthly',
                'yearly',
                'never'
              ),
              defaultValue: 'weekly'
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

        // URL Index
        try {
          await queryInterface.addIndex(
            'seo_indexes',
            ['url'],
            {
              name: 'seo_indexes_url_idx',
              transaction
            }
          );
        } catch (e) {
          console.log('⚠️ seo_indexes_url_idx already exists');
        }
      }

      // Pages
      if (!tables.includes('pages')) {
        await queryInterface.createTable(
          'pages',
          {
            id: {
              type: Sequelize.INTEGER,
              primaryKey: true,
              autoIncrement: true
            },

            title: {
              type: Sequelize.STRING(200),
              allowNull: false
            },

            slug: {
              type: Sequelize.STRING(250),
              unique: true
            },

            content: {
              type: Sequelize.TEXT('long') // LONGTEXT replaced
            },

            meta_title: {
              type: Sequelize.STRING(200)
            },

            meta_desc: {
              type: Sequelize.TEXT
            },

            is_active: {
              type: Sequelize.BOOLEAN,
              defaultValue: true
            },

            template: {
              type: Sequelize.STRING(50),
              defaultValue: 'default'
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

      console.log('✅ Settings, SEO & Pages migration completed successfully.');
    } catch (error) {
      await transaction.rollback();

      console.error('❌ Settings, SEO & Pages migration failed');
      console.error(error);

      throw error;
    }
  },

  async down(queryInterface) {
    const transaction = await queryInterface.sequelize.transaction();

    try {
      try {
        await queryInterface.removeIndex(
          'seo_indexes',
          'seo_indexes_url_idx',
          { transaction }
        );
      } catch (e) {}

      await queryInterface
        .dropTable('pages', { transaction })
        .catch(() => {});

      await queryInterface
        .dropTable('seo_indexes', { transaction })
        .catch(() => {});

      await queryInterface
        .dropTable('settings', { transaction })
        .catch(() => {});

      await transaction.commit();
    } catch (error) {
      await transaction.rollback();
      throw error;
    }
  }
};