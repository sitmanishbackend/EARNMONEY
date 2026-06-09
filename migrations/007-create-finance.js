'use strict';

module.exports = {
  async up(queryInterface, Sequelize) {
    const transaction = await queryInterface.sequelize.transaction();

    try {
      const tables = await queryInterface.showAllTables();

      // Bank Accounts
      if (!tables.includes('bank_accounts')) {
        await queryInterface.createTable(
          'bank_accounts',
          {
            id: {
              type: Sequelize.INTEGER,
              primaryKey: true,
              autoIncrement: true
            },

            user_id: {
              type: Sequelize.INTEGER,
              references: {
                model: 'users',
                key: 'id'
              },
              onDelete: 'SET NULL',
              onUpdate: 'CASCADE'
            },

            bank_name: {
              type: Sequelize.STRING(100),
              allowNull: false
            },

            account_name: {
              type: Sequelize.STRING(150)
            },

            account_number: {
              type: Sequelize.STRING(50)
            },

            ifsc_code: {
              type: Sequelize.STRING(20)
            },

            account_type: {
              type: Sequelize.ENUM(
                'savings',
                'current',
                'business',
                'upi',
                'cash'
              ),
              defaultValue: 'savings'
            },

            opening_balance: {
              type: Sequelize.DECIMAL(15, 2),
              defaultValue: 0
            },

            current_balance: {
              type: Sequelize.DECIMAL(15, 2),
              defaultValue: 0
            },

            color: {
              type: Sequelize.STRING(20),
              defaultValue: '#1a7a4a'
            },

            icon: {
              type: Sequelize.STRING(50),
              defaultValue: 'bi-bank'
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

      // Expense Categories
      if (!tables.includes('expense_categories')) {
        await queryInterface.createTable(
          'expense_categories',
          {
            id: {
              type: Sequelize.INTEGER,
              primaryKey: true,
              autoIncrement: true
            },

            name: {
              type: Sequelize.STRING(100)
            },

            type: {
              type: Sequelize.ENUM('income', 'expense'),
              defaultValue: 'expense'
            },

            icon: {
              type: Sequelize.STRING(50)
            },

            color: {
              type: Sequelize.STRING(20),
              defaultValue: '#e74c3c'
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

      // Transactions
      if (!tables.includes('transactions')) {
        await queryInterface.createTable(
          'transactions',
          {
            id: {
              type: Sequelize.INTEGER,
              primaryKey: true,
              autoIncrement: true
            },

            user_id: {
              type: Sequelize.INTEGER,
              references: {
                model: 'users',
                key: 'id'
              },
              onDelete: 'SET NULL',
              onUpdate: 'CASCADE'
            },

            bank_account_id: {
              type: Sequelize.INTEGER,
              references: {
                model: 'bank_accounts',
                key: 'id'
              },
              onDelete: 'SET NULL',
              onUpdate: 'CASCADE'
            },

            category_id: {
              type: Sequelize.INTEGER,
              references: {
                model: 'expense_categories',
                key: 'id'
              },
              onDelete: 'SET NULL',
              onUpdate: 'CASCADE'
            },

            type: {
              type: Sequelize.ENUM(
                'income',
                'expense',
                'transfer'
              ),
              allowNull: false
            },

            amount: {
              type: Sequelize.DECIMAL(15, 2),
              allowNull: false
            },

            description: {
              type: Sequelize.TEXT
            },

            reference: {
              type: Sequelize.STRING(100)
            },

            transaction_date: {
              type: Sequelize.DATEONLY,
              allowNull: false
            },

            payment_method: {
              type: Sequelize.ENUM(
                'cash',
                'upi',
                'neft',
                'imps',
                'cheque',
                'card',
                'other'
              ),
              defaultValue: 'cash'
            },

            transfer_to_account_id: {
              type: Sequelize.INTEGER
            },

            receipt_image: {
              type: Sequelize.STRING(255)
            },

            tags: {
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
      }

      await transaction.commit();
      console.log('✅ Finance migration completed successfully.');
    } catch (error) {
      await transaction.rollback();

      console.error('❌ Finance migration failed');
      console.error(error);

      throw error;
    }
  },

  async down(queryInterface) {
    const transaction = await queryInterface.sequelize.transaction();

    try {
      await queryInterface
        .dropTable('transactions', { transaction })
        .catch(() => {});

      await queryInterface
        .dropTable('expense_categories', { transaction })
        .catch(() => {});

      await queryInterface
        .dropTable('bank_accounts', { transaction })
        .catch(() => {});

      await transaction.commit();
    } catch (error) {
      await transaction.rollback();
      throw error;
    }
  }
};