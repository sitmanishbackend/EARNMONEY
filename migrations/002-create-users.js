'use strict';

module.exports = {
  async up(queryInterface, Sequelize) {
    const transaction = await queryInterface.sequelize.transaction();

    try {
      const tables = await queryInterface.showAllTables();

      if (!tables.includes('users')) {
        await queryInterface.createTable(
          'users',
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

            email: {
              type: Sequelize.STRING(150),
              allowNull: false,
              unique: true
            },

            phone: {
              type: Sequelize.STRING(20)
            },

            password: {
              type: Sequelize.STRING(255),
              allowNull: false
            },

            role_id: {
              type: Sequelize.INTEGER,
              references: {
                model: 'roles',
                key: 'id'
              },
              onDelete: 'SET NULL',
              onUpdate: 'CASCADE'
            },

            avatar: {
              type: Sequelize.STRING(255),
              defaultValue: null
            },

            is_active: {
              type: Sequelize.BOOLEAN,
              defaultValue: true
            },

            salary_type: {
              type: Sequelize.ENUM(
                'daily',
                'monthly',
                'hourly'
              ),
              defaultValue: 'daily'
            },

            salary_amount: {
              type: Sequelize.DECIMAL(10, 2),
              defaultValue: 0
            },

            joining_date: {
              type: Sequelize.DATEONLY
            },

            last_login: {
              type: Sequelize.DATE
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

        // Email Index
        try {
          await queryInterface.addIndex(
            'users',
            ['email'],
            {
              name: 'users_email_idx',
              unique: true,
              transaction
            }
          );
        } catch (e) {
          console.log('⚠️ users_email_idx already exists');
        }

        // Role Index
        try {
          await queryInterface.addIndex(
            'users',
            ['role_id'],
            {
              name: 'users_role_id_idx',
              transaction
            }
          );
        } catch (e) {
          console.log('⚠️ users_role_id_idx already exists');
        }
      } else {
        console.log('⚠️ users table already exists. Skipping.');
      }

      await transaction.commit();

      console.log('✅ Users migration completed successfully.');
    } catch (error) {
      await transaction.rollback();

      console.error('❌ Users migration failed');
      console.error(error);

      throw error;
    }
  },

  async down(queryInterface) {
    const transaction = await queryInterface.sequelize.transaction();

    try {
      try {
        await queryInterface.removeIndex(
          'users',
          'users_email_idx',
          { transaction }
        );
      } catch (e) {}

      try {
        await queryInterface.removeIndex(
          'users',
          'users_role_id_idx',
          { transaction }
        );
      } catch (e) {}

      await queryInterface
        .dropTable('users', { transaction })
        .catch(() => {});

      await transaction.commit();
    } catch (error) {
      await transaction.rollback();
      throw error;
    }
  }
};