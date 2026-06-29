module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.addColumn('blog_posts', 'scheduled_at', {
      type: Sequelize.DATE
    });

    await queryInterface.addColumn('blog_posts', 'no_index', {
      type: Sequelize.BOOLEAN,
      defaultValue: false
    });

    await queryInterface.addColumn('blog_posts', 'allow_comments', {
      type: Sequelize.BOOLEAN,
      defaultValue: true
    });

    await queryInterface.addColumn('blog_posts', 'canonical_url', {
      type: Sequelize.STRING(500)
    });

    await queryInterface.addColumn('blog_posts', 'co_author', {
      type: Sequelize.STRING(200)
    });

    await queryInterface.addColumn('blog_posts', 'author', {
      type: Sequelize.STRING(200)
    });
  },

  async down(queryInterface) {
    await queryInterface.removeColumn('blog_posts', 'scheduled_at');
    await queryInterface.removeColumn('blog_posts', 'no_index');
    await queryInterface.removeColumn('blog_posts', 'allow_comments');
    await queryInterface.removeColumn('blog_posts', 'canonical_url');
    await queryInterface.removeColumn('blog_posts', 'co_author');
    await queryInterface.removeColumn('blog_posts', 'author');
  }
};