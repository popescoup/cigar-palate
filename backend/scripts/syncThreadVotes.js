// syncThreadVotes.js
require('dotenv').config({ path: require('path').join(__dirname, '../.env') });
const sequelize = require('../config');
const { Thread, Vote } = require('../models');

const recalculateThreadVoteCounts = async () => {
  const transaction = await sequelize.transaction();
  console.log('Starting vote count recalculation...');
  
  try {
    // Get vote counts from Votes table
    const voteCounts = await Vote.findAll({
      where: {
        voteable_type: 'thread'
      },
      attributes: [
        'voteable_id',
        [
          sequelize.literal(`
            SUM(CASE 
              WHEN vote_type = 'like' THEN 1 
              WHEN vote_type = 'dislike' THEN -1 
              ELSE 0 
            END)
          `),
          'vote_count'
        ]
      ],
      group: ['voteable_id']
    });

    console.log(`Found ${voteCounts.length} threads with votes to process`);

    // Update threads with recalculated vote counts
    let updatedCount = 0;
    for (const voteCount of voteCounts) {
      const threadId = voteCount.voteable_id;
      const newVoteCount = parseInt(voteCount.get('vote_count'));
      
      const [updated] = await Thread.update(
        { vote_count: newVoteCount },
        { 
          where: { id: threadId },
          transaction
        }
      );

      if (updated) {
        updatedCount++;
        console.log(`Updated thread ${threadId} with vote count: ${newVoteCount}`);
      }
    }

    await transaction.commit();
    console.log(`Successfully updated ${updatedCount} threads`);
    
    // Exit successfully
    process.exit(0);
  } catch (error) {
    await transaction.rollback();
    console.error('Error during vote count recalculation:', error);
    // Exit with error
    process.exit(1);
  }
};

// Run the function
recalculateThreadVoteCounts();