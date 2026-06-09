'use strict';

module.exports = {
  async up(queryInterface, Sequelize) {
    const transaction = await queryInterface.sequelize.transaction();

    try {
      const tables = await queryInterface.showAllTables();

      // Menu Items
      if (!tables.includes('menu_items')) {
        await queryInterface.createTable(
          'menu_items',
          {
            id: {
              type: Sequelize.INTEGER,
              primaryKey: true,
              autoIncrement: true
            },

            parent_id: {
              type: Sequelize.INTEGER,
              defaultValue: null
            },

            label: {
              type: Sequelize.STRING(100),
              allowNull: false
            },

            label_hi: {
              type: Sequelize.STRING(100)
            },

            icon: {
              type: Sequelize.STRING(50),
              defaultValue: 'bi-circle'
            },

            route: {
              type: Sequelize.STRING(200)
            },

            menu_type: {
              type: Sequelize.ENUM(
                'admin',
                'website',
                'both'
              ),
              defaultValue: 'admin'
            },

            sort_order: {
              type: Sequelize.INTEGER,
              defaultValue: 0
            },

            is_active: {
              type: Sequelize.BOOLEAN,
              defaultValue: true
            },

            badge: {
              type: Sequelize.STRING(30)
            },

            badge_color: {
              type: Sequelize.STRING(20),
              defaultValue: 'success'
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

        // Indexes
        try {
          await queryInterface.addIndex(
            'menu_items',
            ['parent_id'],
            {
              name: 'menu_items_parent_id_idx',
              transaction
            }
          );
        } catch (e) {}

        try {
          await queryInterface.addIndex(
            'menu_items',
            ['menu_type'],
            {
              name: 'menu_items_menu_type_idx',
              transaction
            }
          );
        } catch (e) {}

        try {
          await queryInterface.addIndex(
            'menu_items',
            ['sort_order'],
            {
              name: 'menu_items_sort_order_idx',
              transaction
            }
          );
        } catch (e) {}
      } else {
        console.log('⚠️ menu_items table already exists. Skipping.');
      }

      // Role Menu Permissions
      if (!tables.includes('role_menu_permissions')) {
        await queryInterface.createTable(
          'role_menu_permissions',
          {
            id: {
              type: Sequelize.INTEGER,
              primaryKey: true,
              autoIncrement: true
            },

            role_id: {
              type: Sequelize.INTEGER,
              allowNull: false,
              references: {
                model: 'roles',
                key: 'id'
              },
              onDelete: 'CASCADE',
              onUpdate: 'CASCADE'
            },

            menu_item_id: {
              type: Sequelize.INTEGER,
              allowNull: false,
              references: {
                model: 'menu_items',
                key: 'id'
              },
              onDelete: 'CASCADE',
              onUpdate: 'CASCADE'
            },

            can_view: {
              type: Sequelize.BOOLEAN,
              defaultValue: true
            },

            can_create: {
              type: Sequelize.BOOLEAN,
              defaultValue: false
            },

            can_edit: {
              type: Sequelize.BOOLEAN,
              defaultValue: false
            },

            can_delete: {
              type: Sequelize.BOOLEAN,
              defaultValue: false
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

        // Unique Role + Menu Permission
        try {
          await queryInterface.addIndex(
            'role_menu_permissions',
            ['role_id', 'menu_item_id'],
            {
              unique: true,
              name: 'role_menu_permission_unique',
              transaction
            }
          );
        } catch (e) {}

        try {
          await queryInterface.addIndex(
            'role_menu_permissions',
            ['role_id'],
            {
              name: 'role_menu_role_idx',
              transaction
            }
          );
        } catch (e) {}

        try {
          await queryInterface.addIndex(
            'role_menu_permissions',
            ['menu_item_id'],
            {
              name: 'role_menu_item_idx',
              transaction
            }
          );
        } catch (e) {}
      } else {
        console.log('⚠️ role_menu_permissions table already exists. Skipping.');
      }

      await transaction.commit();

      console.log('✅ Menu & Permission migration completed successfully.');
    } catch (error) {
      await transaction.rollback();

      console.error('❌ Menu & Permission migration failed');
      console.error(error);

      throw error;
    }
  },

  async down(queryInterface) {
    const transaction = await queryInterface.sequelize.transaction();

    try {
      // Remove indexes safely
      const indexes = [
        ['role_menu_permissions', 'role_menu_permission_unique'],
        ['role_menu_permissions', 'role_menu_role_idx'],
        ['role_menu_permissions', 'role_menu_item_idx'],
        ['menu_items', 'menu_items_parent_id_idx'],
        ['menu_items', 'menu_items_menu_type_idx'],
        ['menu_items', 'menu_items_sort_order_idx']
      ];

      for (const [table, index] of indexes) {
        try {
          await queryInterface.removeIndex(table, index, { transaction });
        } catch (e) {}
      }

      await queryInterface
        .dropTable('role_menu_permissions', { transaction })
        .catch(() => {});

      await queryInterface
        .dropTable('menu_items', { transaction })
        .catch(() => {});

      await transaction.commit();
    } catch (error) {
      await transaction.rollback();
      throw error;
    }
  }
};