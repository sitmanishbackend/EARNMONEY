'use strict';

module.exports = {
  async up(queryInterface, Sequelize) {
    const transaction = await queryInterface.sequelize.transaction();

    try {
      const tables = await queryInterface.showAllTables();

      if (!tables.includes('themes')) {
        await queryInterface.createTable(
          'themes',
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
              allowNull: false,
              unique: true
            },

            primary_color: {
              type: Sequelize.STRING(20),
              defaultValue: '#1a7a4a'
            },

            secondary_color: {
              type: Sequelize.STRING(20),
              defaultValue: '#e8a020'
            },

            accent_dark: {
              type: Sequelize.STRING(20),
              defaultValue: '#125c36'
            },

            accent_light: {
              type: Sequelize.STRING(20),
              defaultValue: '#e8f5ee'
            },

            sidebar_bg: {
              type: Sequelize.STRING(20),
              defaultValue: '#1a2332'
            },

            sidebar_text: {
              type: Sequelize.STRING(20),
              defaultValue: '#ffffff'
            },

            nav_bg: {
              type: Sequelize.STRING(20),
              defaultValue: '#ffffff'
            },

            btn_color: {
              type: Sequelize.STRING(20),
              defaultValue: '#1a7a4a'
            },

            is_active: {
              type: Sequelize.BOOLEAN,
              defaultValue: false
            },

            is_system: {
              type: Sequelize.BOOLEAN,
              defaultValue: false
            },

            preview_img: {
              type: Sequelize.STRING(255)
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

        // Slug Index
        try {
          await queryInterface.addIndex(
            'themes',
            ['slug'],
            {
              name: 'themes_slug_idx',
              unique: true,
              transaction
            }
          );
        } catch (e) {
          console.log('⚠️ themes_slug_idx already exists');
        }

        // Active Theme Index
        try {
          await queryInterface.addIndex(
            'themes',
            ['is_active'],
            {
              name: 'themes_active_idx',
              transaction
            }
          );
        } catch (e) {
          console.log('⚠️ themes_active_idx already exists');
        }
      } else {
        console.log('⚠️ themes table already exists. Skipping.');
      }

      await transaction.commit();

      console.log('✅ Themes migration completed successfully.');
    } catch (error) {
      await transaction.rollback();

      console.error('❌ Themes migration failed');
      console.error(error);

      throw error;
    }
  },

  async down(queryInterface) {
    const transaction = await queryInterface.sequelize.transaction();

    try {
      try {
        await queryInterface.removeIndex(
          'themes',
          'themes_slug_idx',
          { transaction }
        );
      } catch (e) {}

      try {
        await queryInterface.removeIndex(
          'themes',
          'themes_active_idx',
          { transaction }
        );
      } catch (e) {}

      await queryInterface
        .dropTable('themes', { transaction })
        .catch(() => {});

      await transaction.commit();
    } catch (error) {
      await transaction.rollback();
      throw error;
    }
  }
};