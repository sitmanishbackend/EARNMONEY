'use strict';

module.exports = {
  async up(queryInterface, Sequelize) {
    const transaction = await queryInterface.sequelize.transaction();

    try {
      const tables = await queryInterface.showAllTables();

      if (!tables.includes('roles')) {
        await queryInterface.createTable(
          'roles',
          {
            id: {
              type: Sequelize.INTEGER,
              primaryKey: true,
              autoIncrement: true
            },

            name: {
              type: Sequelize.STRING(50),
              allowNull: false
            },

            slug: {
              type: Sequelize.STRING(50),
              allowNull: false,
              unique: true
            },

            description: {
              type: Sequelize.TEXT
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

        // Optional Index
        try {
          await queryInterface.addIndex(
            'roles',
            ['slug'],
            {
              name: 'roles_slug_idx',
              unique: true,
              transaction
            }
          );
        } catch (e) {
          console.log('⚠️ roles_slug_idx already exists');
        }
      } else {
        console.log('⚠️ roles table already exists. Skipping.');
      }

      await transaction.commit();

      console.log('✅ Roles migration completed successfully.');
    } catch (error) {
      await transaction.rollback();

      console.error('❌ Roles migration failed');
      console.error(error);

      throw error;
    }
  },

  async down(queryInterface) {
    const transaction = await queryInterface.sequelize.transaction();

    try {
      try {
        await queryInterface.removeIndex(
          'roles',
          'roles_slug_idx',
          { transaction }
        );
      } catch (e) {}

      await queryInterface
        .dropTable('roles', { transaction })
        .catch(() => {});

      await transaction.commit();
    } catch (error) {
      await transaction.rollback();
      throw error;
    }
  }
};