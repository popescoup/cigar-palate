const express = require('express');
const { MeiliSearch } = require('meilisearch');
const router = express.Router();

// Initialize MeiliSearch client with both indices
const client = new MeiliSearch({
  host: process.env.MEILISEARCH_HOST || 'http://localhost:7700',
  apiKey: process.env.MEILISEARCH_SEARCH_KEY
});

// Define filterable attributes for each type
const FILTERABLE_ATTRIBUTES = {
    cigars: ['price_range'],
    forum: ['updated_at', 'tag_ids', 'vote_count', 'author_id', 'resultType', 'created_at', 'tags'],
    brands: ['averageRating', 'cigarCount']
};

// Define sortable attributes for each type
const SORTABLE_ATTRIBUTES = {
    cigars: ['averageRating', 'popularityScore', 'numberOfRatings', 'reviewCount'],
    forum: ['created_at', 'vote_count', 'replyCount', 'likes'],
    brands: ['averageRating', 'cigarCount']
};

// Get the appropriate index based on search type
function getIndex(type) {
  switch (type) {
    case 'forum':
      return client.index('forum_threads');
    case 'cigars':
      return client.index('cigars');
    case 'brands':
      return client.index('brands');
    default:
      return null;
  }
}

router.get('/search', async (req, res) => {
  console.log('Search request received:', {
    query: req.query,
    headers: req.headers,
    url: req.url
  });
  console.log('Search API request:', {
    url: req.url,
    query: req.query,
    host: req.headers.host,
    origin: req.headers.origin
  });

  try {
    const { 
      q = '',
      filters, 
      sort, 
      page = 1, 
      hitsPerPage = 20,
      type = 'all',
      tags,
      tag_ids,
      author_id
    } = req.query;

    const pageNum = parseInt(page);
    const limit = parseInt(hitsPerPage);
    
    console.log('Search request:', {
      type,
      query: q,
      filters,
      sort,
      tags,
      page: pageNum,
      limit
    });

    let searchParams = {
      limit,
      offset: (pageNum - 1) * limit,
    };

    // Combined search (all types)
    if (!type || type === 'all') {
      try {
        console.log('Starting combined search with query:', {
          rawQuery: q,
          encodedQuery: encodeURIComponent(q),
          length: q.length,
          charCodes: Array.from(q).map(c => c.charCodeAt(0))
        });
    
        // Get index stats before search
        const cigarStats = await client.index('cigars').getStats().catch(e => ({ numberOfDocuments: 'error' }));
        const forumStats = await client.index('forum_threads').getStats().catch(e => ({ numberOfDocuments: 'error' }));
        const brandStats = await client.index('brands').getStats().catch(e => ({ numberOfDocuments: 'error' }));
        
        console.log('Index stats before search:', {
          cigars: cigarStats.numberOfDocuments,
          forum: forumStats.numberOfDocuments,
          brands: brandStats.numberOfDocuments
        });
    
        // Search all indices with full limit
        const [cigarResults, forumResults, brandResults] = await Promise.all([
          client.index('cigars').search(q || '', { 
            ...searchParams,
            limit
          }),
          client.index('forum_threads').search(q || '', { 
            ...searchParams,
            limit
          }),
          client.index('brands').search(q || '', { 
            ...searchParams,
            limit
          })
        ]);
    
        // Log raw results for debugging
        if (forumResults.hits.length > 0) {
          console.log('Raw forum result sample:', JSON.stringify(forumResults.hits[0], null, 2));
        }
    
        console.log('Raw search results:', {
          cigars: {
            hits: cigarResults.hits.length,
            estimatedTotalHits: cigarResults.estimatedTotalHits
          },
          forum: {
            hits: forumResults.hits.length,
            estimatedTotalHits: forumResults.estimatedTotalHits
          },
          brands: {
            hits: brandResults.hits.length,
            estimatedTotalHits: brandResults.estimatedTotalHits
          }
        });
    
        // Process all results
        const typedCigarResults = cigarResults.hits.map(hit => ({
          ...hit,
          resultType: 'cigar'
        }));
        
        const typedForumResults = forumResults.hits.map(hit => ({
          ...hit,
          resultType: 'forum',
          tags: hit.tags || [],
          replyCount: hit.replyCount || 0,
          user: {
            id: hit.user_id,
            username: hit.user ? hit.user.username : hit.author || 'Anonymous',
            isAdmin: hit.user ? hit.user.isAdmin : false
          }
        }));

        const typedBrandResults = brandResults.hits.map(hit => ({
          ...hit,
          resultType: 'brand'
        }));
    
        // Combine and limit results
        const allResults = [...typedCigarResults, ...typedForumResults, ...typedBrandResults];
        
        // Sort combined results by relevance (you can modify this sorting if needed)
        allResults.sort((a, b) => {
          // Add your custom sorting logic here if needed
          return 0; // Default to maintaining original order
        });
    
        // Take only up to the limit
        const limitedResults = allResults.slice(0, limit);
    
        const totalHits = cigarResults.estimatedTotalHits + forumResults.estimatedTotalHits + brandResults.estimatedTotalHits;
        const totalPages = Math.ceil(totalHits / limit);
    
        const combinedResults = {
          hits: limitedResults,
          totalHits,
          page: pageNum,
          totalPages,
          hitsPerPage: limit,
          searchType: 'all',
          actualHits: limitedResults.length,
          cigarHits: typedCigarResults.length,
          forumHits: typedForumResults.length,
          brandHits: typedBrandResults.length
        };

        console.log('Combined results:', {
          totalHits: combinedResults.totalHits,
          hitCount: combinedResults.hits.length,
          totalPages: combinedResults.totalPages,
          actualHits: combinedResults.actualHits,
          cigarHits: combinedResults.cigarHits,
          forumHits: combinedResults.forumHits,
          brandHits: combinedResults.brandHits,
          types: combinedResults.hits.map(hit => hit.resultType)
        });
    
        return res.json(combinedResults);
      } catch (error) {
        console.error('Combined search error:', error);
        throw error;
      }
    }

    // Single type search
    const index = getIndex(type);
    if (!index) {
      throw new Error('Invalid search type');
    }

    // Handle filters and sort
    let filterConditions = [];
    let sortConditions = [];
    
    // Process filters
    if (filters) {
      const filterArray = Array.isArray(filters) ? filters : filters.split(',');
      const validAttributes = FILTERABLE_ATTRIBUTES[type] || [];
      
      // Group filters by their key/category, only keeping valid ones for this type
      const filterGroups = filterArray.reduce((groups, filter) => {
        // Skip sort-style filters (containing ':')
        if (filter.includes(':')) {
          const [sortField] = filter.split(':');
          if (SORTABLE_ATTRIBUTES[type]?.includes(sortField)) {
            sortConditions.push(filter);
          }
          return groups;
        }

        const [key, value] = filter.split('=');
        if (validAttributes.includes(key)) {
          if (!groups[key]) {
            groups[key] = [];
          }
          groups[key].push(value);
        }
        return groups;
      }, {});

      // Process each group of filters
      Object.entries(filterGroups).forEach(([key, values]) => {
        if (values.length === 1) {
          const value = values[0];
          if (key === 'handmade') {
            filterConditions.push(`${key} = ${value === 'true'}`);
          } else {
            filterConditions.push(`${key} = '${value}'`);
          }
        } else {
          if (key === 'handmade') {
            const condition = `(${values.map(value => 
              `${key} = ${value === 'true'}`
            ).join(' OR ')})`;
            filterConditions.push(condition);
          } else {
            const condition = `(${values.map(value => 
              `${key} = '${value}'`
            ).join(' OR ')})`;
            filterConditions.push(condition);
          }
        }
      });
    }

    // Handle forum-specific filters
    if (type === 'forum') {
      if (tags) {
        const tagArray = Array.isArray(tags) ? tags : [tags];
        filterConditions.push(`tags IN [${tagArray.map(tag => `'${tag}'`).join(', ')}]`);
      }

      if (tag_ids) {
        const tagIdArray = Array.isArray(tag_ids) ? tag_ids : [tag_ids];
        filterConditions.push(`tag_ids IN [${tagIdArray.join(', ')}]`);
      }

      if (author_id) {
        filterConditions.push(`author_id = ${author_id}`);
      }
    }

    // Combine all filter conditions
    if (filterConditions.length > 0) {
      searchParams.filter = filterConditions.join(' AND ');
    }

    // Handle sorting
    if (sort || sortConditions.length > 0) {
      const sortParam = sort || sortConditions[0];
      if (sortParam) {
        const [sortField, sortOrder] = sortParam.split(':');
        if (SORTABLE_ATTRIBUTES[type]?.includes(sortField)) {
          searchParams.sort = [`${sortField}:${sortOrder}`];
        }
      }
    }

    console.log('Final search parameters:', {
      type,
      query: q,
      searchParams,
      filterConditions,
      sortConditions
    });

    try {
      // Perform the search
      const results = await index.search(q, searchParams);
      
      // Add result type to each hit
      const typedResults = results.hits.map(hit => ({
        ...hit,
        resultType: type,
        ...(type === 'forum' ? {
          tags: hit.tags || [],
          replyCount: hit.replyCount || 0,
          user: {
            id: hit.user_id,
            username: hit.user ? hit.user.username : hit.author || 'Anonymous',
            isAdmin: hit.user ? hit.user.isAdmin : false
          }
        } : {})
      }));

      const totalPages = Math.ceil(results.estimatedTotalHits / limit);

      console.log('Search response:', {
        totalHits: results.estimatedTotalHits,
        hitCount: results.hits.length,
        totalPages,
        filterApplied: searchParams.filter,
        sortApplied: searchParams.sort
      });

      res.json({
        hits: typedResults,
        totalHits: results.estimatedTotalHits,
        page: pageNum,
        totalPages,
        hitsPerPage: limit,
        searchType: type,
        appliedFilters: filterConditions,
        appliedSort: searchParams.sort ? searchParams.sort[0] : null
      });
    } catch (error) {
      console.error(`Error searching ${type} index:`, error);
      throw error;
    }
  } catch (error) {
    console.error('Search error:', error);
    res.status(500).json({ 
      error: 'An error occurred during search',
      details: error.message,
      hits: [],
      totalHits: 0,
      page: parseInt(req.query.page || 1),
      hitsPerPage: parseInt(req.query.hitsPerPage || 20),
      totalPages: 0,
      searchType: req.query.type || 'all'
    });
  }
});

router.get('/search/tags', async (req, res) => {
  try {
    const { 
      q = '', 
      page = 1, 
      hitsPerPage = 20,
      minThreads
    } = req.query;

    const pageNum = parseInt(page);
    const limit = parseInt(hitsPerPage);

    let searchParams = {
      limit,
      offset: (pageNum - 1) * limit,
    };

    if (minThreads) {
      searchParams.filter = `threadCount >= ${parseInt(minThreads)}`;
    }

    const tagIndex = client.index('forum_tags');
    
    console.log('Tag search parameters:', {
      query: q,
      searchParams
    });

    const results = await tagIndex.search(q, searchParams);
    const totalPages = Math.ceil(results.estimatedTotalHits / limit);
    
    console.log('Tag search results:', {
      totalHits: results.estimatedTotalHits,
      hitCount: results.hits.length,
      totalPages
    });

    res.json({
      hits: results.hits,
      totalHits: results.estimatedTotalHits,
      page: pageNum,
      totalPages,
      hitsPerPage: limit
    });
  } catch (error) {
    console.error('Tag search error:', error);
    res.status(500).json({ 
      error: 'An error occurred during tag search',
      details: error.message,
      hits: [],
      totalHits: 0,
      page: 1,
      hitsPerPage: 20,
      totalPages: 0
    });
  }
});

module.exports = router;