'use strict';

module.exports = {
  async up(queryInterface, Sequelize) {
    const transaction = await queryInterface.sequelize.transaction();

    try {
      const tables = await queryInterface.showAllTables();

      // Attendance Records
      if (!tables.includes('attendance_records')) {
        await queryInterface.createTable(
          'attendance_records',
          {
            id: {
              type: Sequelize.INTEGER,
              primaryKey: true,
              autoIncrement: true
            },

            user_id: {
              type: Sequelize.INTEGER,
              allowNull: false,
              references: {
                model: 'users',
                key: 'id'
              },
              onDelete: 'CASCADE',
              onUpdate: 'CASCADE'
            },

            attendance_date: {
              type: Sequelize.DATEONLY,
              allowNull: false
            },

            status: {
              type: Sequelize.ENUM(
                'P',
                'A',
                'H',
                'P+H',
                'P+P',
                'OT',
                'PA'
              ),
              defaultValue: 'A'
            },

            overtime_hours: {
              type: Sequelize.DECIMAL(4, 2),
              defaultValue: 0
            },

            check_in: {
              type: Sequelize.TIME
            },

            check_out: {
              type: Sequelize.TIME
            },

            advance_amount: {
              type: Sequelize.DECIMAL(10, 2),
              defaultValue: 0
            },

            notes: {
              type: Sequelize.TEXT
            },

            marked_by: {
              type: Sequelize.INTEGER,
              references: {
                model: 'users',
                key: 'id'
              },
              onDelete: 'SET NULL',
              onUpdate: 'CASCADE'
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

        try {
          await queryInterface.addIndex(
            'attendance_records',
            ['user_id', 'attendance_date'],
            {
              unique: true,
              name: 'attendance_user_date_unique',
              transaction
            }
          );
        } catch (indexError) {
          console.log(
            '⚠️ Index attendance_user_date_unique already exists. Skipping.'
          );
        }
      }

      // Salary Payments
      if (!tables.includes('salary_payments')) {
        await queryInterface.createTable(
          'salary_payments',
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

            month: {
              type: Sequelize.INTEGER
            },

            year: {
              type: Sequelize.INTEGER
            },

            total_days: {
              type: Sequelize.INTEGER,
              defaultValue: 0
            },

            present_days: {
              type: Sequelize.DECIMAL(5, 2),
              defaultValue: 0
            },

            absent_days: {
              type: Sequelize.DECIMAL(5, 2),
              defaultValue: 0
            },

            overtime_days: {
              type: Sequelize.DECIMAL(5, 2),
              defaultValue: 0
            },

            gross_salary: {
              type: Sequelize.DECIMAL(10, 2),
              defaultValue: 0
            },

            advance_deduction: {
              type: Sequelize.DECIMAL(10, 2),
              defaultValue: 0
            },

            net_salary: {
              type: Sequelize.DECIMAL(10, 2),
              defaultValue: 0
            },

            payment_date: {
              type: Sequelize.DATEONLY
            },

            payment_method: {
              type: Sequelize.ENUM(
                'cash',
                'bank',
                'upi'
              ),
              defaultValue: 'cash'
            },

            status: {
              type: Sequelize.ENUM(
                'pending',
                'paid',
                'partial'
              ),
              defaultValue: 'pending'
            },

            notes: {
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
      console.log('✅ Attendance & Salary migration completed successfully.');
    } catch (error) {
      await transaction.rollback();

      console.error('❌ Attendance & Salary migration failed');
      console.error(error);

      throw error;
    }
  },

  async down(queryInterface) {
    const transaction = await queryInterface.sequelize.transaction();

    try {
      try {
        await queryInterface.removeIndex(
          'attendance_records',
          'attendance_user_date_unique',
          { transaction }
        );
      } catch (e) {}

      await queryInterface
        .dropTable('salary_payments', { transaction })
        .catch(() => {});

      await queryInterface
        .dropTable('attendance_records', { transaction })
        .catch(() => {});

      await transaction.commit();
    } catch (error) {
      await transaction.rollback();
      throw error;
    }
  }
};