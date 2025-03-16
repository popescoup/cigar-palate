// scripts/deleteCigar.js

// Import required modules
const Cigar = require('../models/cigar.js');

// Check if an ID was provided as a command line argument
const cigarId = process.argv[2];

if (!cigarId) {
  console.error('Please provide a cigar ID as an argument');
  console.log('Example: node deleteCigar.js 8');
  process.exit(1);
}

// Function to delete cigar by ID
async function deleteCigarById(id) {
  try {
    console.log(`Attempting to delete cigar with ID: ${id}`);
    
    const deletedCount = await Cigar.destroy({
      where: {
        id: parseInt(id, 10)
      }
    });
    
    if (deletedCount === 0) {
      console.log(`Cigar with ID ${id} not found`);
      return false;
    } else {
      console.log(`Cigar with ID ${id} successfully deleted`);
      return true;
    }
  } catch (error) {
    console.error('Error deleting cigar:', error);
    throw error;
  }
}

// Execute the script
deleteCigarById(cigarId)
  .then(() => {
    console.log('Script execution completed');
    process.exit(0);
  })
  .catch(err => {
    console.error('Script failed:', err);
    process.exit(1);
  });