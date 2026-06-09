'use strict';

module.exports = {
  async up(queryInterface, Sequelize) {
    const transaction = await queryInterface.sequelize.transaction();

    try {
      const tables = await queryInterface.showAllTables();

      // Ad Zones
      if (!tables.includes('ad_zones')) {
        await queryInterface.createTable(
          'ad_zones',
          {
            id: {
              type: Sequelize.INTEGER,
              primaryKey: true,
              autoIncrement: true
            },

            name: {
              type: Sequelize.STRING(100),
              allowNull: false
            },

            slug: {
              type: Sequelize.STRING(100),
              unique: true
            },

            description: {
              type: Sequelize.TEXT
            },

            width: {
              type: Sequelize.INTEGER
            },

            height: {
              type: Sequelize.INTEGER
            },

            location: {
              type: Sequelize.ENUM(
                'header',
                'footer',
                'sidebar',
                'between_posts',
                'popup',
                'after_content',
                'before_content',
                'floating'
              ),
              defaultValue: 'sidebar'
            },

            is_active: {
              type: Sequelize.BOOLEAN,
              defaultValue: true
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

      // Advertisements
      if (!tables.includes('advertisements')) {
        await queryInterface.createTable(
          'advertisements',
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

            ad_zone_id: {
              type: Sequelize.INTEGER,
              references: {
                model: 'ad_zones',
                key: 'id'
              },
              onDelete: 'SET NULL',
              onUpdate: 'CASCADE'
            },

            ad_type: {
              type: Sequelize.ENUM(
                'image',
                'html',
                'adsense',
                'video'
              ),
              defaultValue: 'image'
            },

            content: {
              type: Sequelize.TEXT('long')
            },

            image_url: {
              type: Sequelize.STRING(255)
            },

            target_url: {
              type: Sequelize.STRING(500)
            },

            target_blank: {
              type: Sequelize.BOOLEAN,
              defaultValue: true
            },

            scope: {
              type: Sequelize.ENUM(
                'global',
                'category',
                'post',
                'page'
              ),
              defaultValue: 'global'
            },

            scope_ids: {
              type: Sequelize.TEXT
            },

            device: {
              type: Sequelize.ENUM(
                'all',
                'desktop',
                'mobile',
                'tablet'
              ),
              defaultValue: 'all'
            },

            start_date: {
              type: Sequelize.DATEONLY
            },

            end_date: {
              type: Sequelize.DATEONLY
            },

            impressions: {
              type: Sequelize.INTEGER,
              defaultValue: 0
            },

            clicks: {
              type: Sequelize.INTEGER,
              defaultValue: 0
            },

            is_active: {
              type: Sequelize.BOOLEAN,
              defaultValue: true
            },

            priority: {
              type: Sequelize.INTEGER,
              defaultValue: 1
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
      console.log('✅ Advertisement migration completed successfully.');
    } catch (error) {
      await transaction.rollback();

      console.error('❌ Advertisement migration failed');
      console.error(error);

      throw error;
    }
  },

  async down(queryInterface) {
    const transaction = await queryInterface.sequelize.transaction();

    try {
      await queryInterface
        .dropTable('advertisements', { transaction })
        .catch(() => {});

      await queryInterface
        .dropTable('ad_zones', { transaction })
        .catch(() => {});

      await transaction.commit();
    } catch (error) {
      await transaction.rollback();
      throw error;
    }
  }
};