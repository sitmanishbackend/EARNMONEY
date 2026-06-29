'use strict';

module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.createTable('notifications', {
      id: {
        type: Sequelize.INTEGER,
        primaryKey: true,
        autoIncrement: true
      },

      user_id: {
        type: Sequelize.INTEGER,
        allowNull: true
      },

      title: {
        type: Sequelize.STRING(200),
        allowNull: false
      },

      message: {
        type: Sequelize.TEXT,
        allowNull: true
      },

      type: {
        type: Sequelize.ENUM(
          'post',
          'user',
          'finance',
          'system',
          'warning',
          'danger',
          'comment'
        ),
        defaultValue: 'system'
      },

      link: {
        type: Sequelize.STRING(500),
        allowNull: true
      },

      is_read: {
        type: Sequelize.BOOLEAN,
        allowNull: false,
        defaultValue: false
      },

      createdAt: {
        type: Sequelize.DATE,
        allowNull: false,
        defaultValue: Sequelize.NOW
      },

      updatedAt: {
        type: Sequelize.DATE,
        allowNull: false,
        defaultValue: Sequelize.NOW
      }
    });

    await queryInterface.addIndex('notifications', ['user_id']);
    await queryInterface.addIndex('notifications', ['is_read']);
  },

  async down(queryInterface) {
    await queryInterface.dropTable('notifications');
  }
};