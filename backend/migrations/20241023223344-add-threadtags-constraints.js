// migrations/YYYYMMDDHHMMSS-add-threadtags-constraints.js
'use strict';

module.exports = {
  up: async (queryInterface, Sequelize) => {
    // First, drop existing foreign keys if they exist
    await queryInterface.sequelize.query(`
      ALTER TABLE "ThreadTags" 
      DROP CONSTRAINT IF EXISTS "ThreadTags_thread_id_fkey",
      DROP CONSTRAINT IF EXISTS "ThreadTags_tag_id_fkey"
    `);

    // Add new foreign keys with CASCADE behavior
    await queryInterface.sequelize.query(`
      ALTER TABLE "ThreadTags"
      ADD CONSTRAINT "ThreadTags_thread_id_fkey" 
      FOREIGN KEY ("thread_id") 
      REFERENCES "Threads"(id) 
      ON UPDATE CASCADE 
      ON DELETE CASCADE,
      
      ADD CONSTRAINT "ThreadTags_tag_id_fkey" 
      FOREIGN KEY ("tag_id") 
      REFERENCES "Tags"(id) 
      ON UPDATE CASCADE 
      ON DELETE CASCADE
    `);
  },

  down: async (queryInterface, Sequelize) => {
    // Remove CASCADE constraints and revert to default behavior
    await queryInterface.sequelize.query(`
      ALTER TABLE "ThreadTags" 
      DROP CONSTRAINT IF EXISTS "ThreadTags_thread_id_fkey",
      DROP CONSTRAINT IF EXISTS "ThreadTags_tag_id_fkey";

      ALTER TABLE "ThreadTags"
      ADD CONSTRAINT "ThreadTags_thread_id_fkey" 
      FOREIGN KEY ("thread_id") 
      REFERENCES "Threads"(id),
      
      ADD CONSTRAINT "ThreadTags_tag_id_fkey" 
      FOREIGN KEY ("tag_id") 
      REFERENCES "Tags"(id)
    `);
  }
};