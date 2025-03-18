// fix-votes-constraint.js
const sequelize = require('./config');

async function fixConstraint() {
  try {
    await sequelize.query('ALTER TABLE "Votes" DROP CONSTRAINT IF EXISTS "Votes_voteable_id_fkey";');
    console.log('Successfully dropped foreign key constraint on Votes table');
  } catch (error) {
    console.error('Error dropping constraint:', error);
  } finally {
    await sequelize.close();
  }
}

fixConstraint();