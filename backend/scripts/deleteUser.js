// scripts/deleteUser.js

// Import required modules
const User = require('../models/user.js');

// Check if an ID was provided as a command line argument
const userId = process.argv[2];

if (!userId) {
  console.error('Please provide a user ID as an argument');
  console.log('Example: node deleteUser.js 8');
  process.exit(1);
}

// Function to delete user by ID
async function deleteUserById(id) {
  try {
    console.log(`Attempting to delete user with ID: ${id}`);
    
    const deletedCount = await User.destroy({
      where: {
        id: parseInt(id, 10)
      }
    });
    
    if (deletedCount === 0) {
      console.log(`User with ID ${id} not found`);
      return false;
    } else {
      console.log(`User with ID ${id} successfully deleted`);
      return true;
    }
  } catch (error) {
    console.error('Error deleting user:', error);
    throw error;
  }
}

// Execute the script
deleteUserById(userId)
  .then(() => {
    console.log('Script execution completed');
    process.exit(0);
  })
  .catch(err => {
    console.error('Script failed:', err);
    process.exit(1);
  });