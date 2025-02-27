const calculateSimilarityScore = (baseCigar, comparisonCigar) => {
  let score = 0;
  
  // Parse flavors safely, prioritizing array handling
  const parseFlavorString = (flavors) => {
    if (!flavors) return new Set(); // Handle null/undefined

    // If it's already an array, return it as a Set
    if (Array.isArray(flavors)) {
      return new Set(flavors);
    }

    // If it's a string, try parsing as JSON first
    if (typeof flavors === 'string') {
      try {
        const parsed = JSON.parse(flavors);
        return new Set(Array.isArray(parsed) ? parsed : []);
      } catch (e) {
        // If JSON parsing fails, treat as comma-separated
        return new Set(flavors.split(',').map(f => f.trim()));
      }
    }

    // If we get here, return empty Set as fallback
    return new Set();
  };
  
  const baseFlavorSet = parseFlavorString(baseCigar.flavors);
  const comparisonFlavorSet = parseFlavorString(comparisonCigar.flavors);
  
  // Calculate flavor match score (weighted higher)
  const commonFlavors = [...baseFlavorSet].filter(flavor => 
    comparisonFlavorSet.has(flavor)
  );
  const flavorScore = (commonFlavors.length * 3); // Triple weight for flavors
  
  // Calculate physical characteristics score
  const physicalMatches = [
    baseCigar.shape === comparisonCigar.shape,
    baseCigar.size === comparisonCigar.size,
    baseCigar.color === comparisonCigar.color,
    baseCigar.wrap_type === comparisonCigar.wrap_type,
    baseCigar.filler === comparisonCigar.filler,
    baseCigar.country_of_origin === comparisonCigar.country_of_origin,
    baseCigar.price_range === comparisonCigar.price_range,
    baseCigar.binder === comparisonCigar.binder,
    baseCigar.strength === comparisonCigar.strength,
    baseCigar.dimensions === comparisonCigar.dimensions,
    baseCigar.made_by === comparisonCigar.made_by
  ].filter(Boolean).length;
  
  score = flavorScore + physicalMatches;
  
  return {
    score,
    commonFlavorCount: commonFlavors.length,
    physicalMatchCount: physicalMatches
  };
};

module.exports = {
  calculateSimilarityScore
};