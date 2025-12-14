import { Router, Request, Response } from 'express';
import prisma from '../lib/prisma';
import { asyncHandler } from '../middleware/validation';

const router = Router();

// GET /api/search?q=:query - 全文検索
router.get('/', asyncHandler(async (req: Request, res: Response) => {
  const { q: query, category, sort = 'relevance' } = req.query;
  
  if (!query || typeof query !== 'string') {
    res.status(400).json({
      error: {
        code: 'MISSING_QUERY',
        message: '検索クエリが必要です。',
        details: { parameter: 'q' }
      },
      timestamp: new Date().toISOString(),
      path: req.path
    });
    return;
  }
  
  const searchTerm = query.trim();
  if (!searchTerm) {
    res.status(400).json({
      error: {
        code: 'EMPTY_QUERY',
        message: '検索クエリが空です。',
        details: { query }
      },
      timestamp: new Date().toISOString(),
      path: req.path
    });
    return;
  }
  
  try {
    // Build where clause for comprehensive search
    const where: any = {
      OR: [
        // Search in service name
        { name: { contains: searchTerm } },
        // Search in service description
        { description: { contains: searchTerm } },
        // Search in memo content
        {
          memos: {
            some: {
              OR: [
                { content: { contains: searchTerm } },
                { title: { contains: searchTerm } }
              ]
            }
          }
        }
      ]
    };
    
    // Add category filter if specified
    if (category && typeof category === 'string') {
      where.categoryId = category;
    }
    
    // Build orderBy clause based on sort parameter
    let orderBy: any;
    switch (sort) {
      case 'name':
      case 'alphabetical':
        orderBy = { name: 'asc' };
        break;
      case 'updated':
        orderBy = { updatedAt: 'desc' };
        break;
      case 'created':
        orderBy = { createdAt: 'desc' };
        break;
      case 'relevance':
      default:
        // For relevance, we'll order by name match first, then updated date
        // This is a simplified relevance scoring
        orderBy = [
          { name: 'asc' },
          { updatedAt: 'desc' }
        ];
        break;
    }
    
    const services = await prisma.service.findMany({
      where,
      orderBy,
      include: {
        category: {
          select: {
            id: true,
            name: true,
            color: true
          }
        },
        memos: {
          where: {
            OR: [
              { content: { contains: searchTerm } },
              { title: { contains: searchTerm } }
            ]
          },
          select: {
            id: true,
            type: true,
            content: true,
            title: true,
            createdAt: true
          },
          orderBy: { createdAt: 'desc' },
          take: 3 // Limit memo results per service for performance
        },
        _count: {
          select: {
            memos: true,
            fromRelations: true,
            toRelations: true
          }
        }
      }
    });
    
    // If no results found, suggest alternatives or popular services
    if (services.length === 0) {
      // Get popular services (most memos or relations)
      const popularServices = await prisma.service.findMany({
        include: {
          category: {
            select: {
              id: true,
              name: true,
              color: true
            }
          },
          _count: {
            select: {
              memos: true,
              fromRelations: true,
              toRelations: true
            }
          }
        },
        orderBy: [
          { memos: { _count: 'desc' } },
          { updatedAt: 'desc' }
        ],
        take: 5
      });
      
      res.json({
        data: [],
        count: 0,
        query: searchTerm,
        sort,
        ...(category && { categoryFilter: category }),
        suggestions: {
          message: '検索結果が見つかりませんでした。以下の人気サービスをご確認ください。',
          popularServices: popularServices.map(service => ({
            id: service.id,
            name: service.name,
            description: service.description,
            category: service.category,
            memoCount: service._count.memos,
            relationCount: service._count.fromRelations + service._count.toRelations
          })),
          alternativeSearchTerms: generateAlternativeSearchTerms(searchTerm)
        },
        timestamp: new Date().toISOString()
      });
      return;
    }
    
    // Add relevance scoring and highlighting information
    const resultsWithHighlights = services.map(service => {
      const highlights: string[] = [];
      
      // Check what matched
      if (service.name.toLowerCase().includes(searchTerm.toLowerCase())) {
        highlights.push('name');
      }
      if (service.description && service.description.toLowerCase().includes(searchTerm.toLowerCase())) {
        highlights.push('description');
      }
      if (service.memos.length > 0) {
        highlights.push('memos');
      }
      
      return {
        ...service,
        searchHighlights: highlights,
        relevanceScore: calculateRelevanceScore(service, searchTerm)
      };
    });
    
    // Sort by relevance if requested
    if (sort === 'relevance') {
      resultsWithHighlights.sort((a, b) => b.relevanceScore - a.relevanceScore);
    }
    
    res.json({
      data: resultsWithHighlights,
      count: resultsWithHighlights.length,
      query: searchTerm,
      sort,
      ...(category && { categoryFilter: category }),
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    console.error('Error performing search:', error);
    throw new Error('検索の実行に失敗しました。');
  }
}));

// Helper function to calculate relevance score
function calculateRelevanceScore(service: any, searchTerm: string): number {
  let score = 0;
  const term = searchTerm.toLowerCase();
  
  // Exact name match gets highest score
  if (service.name.toLowerCase() === term) {
    score += 100;
  } else if (service.name.toLowerCase().includes(term)) {
    // Partial name match
    score += 50;
    // Bonus for name starting with search term
    if (service.name.toLowerCase().startsWith(term)) {
      score += 25;
    }
  }
  
  // Description match
  if (service.description && service.description.toLowerCase().includes(term)) {
    score += 20;
  }
  
  // Memo matches
  score += service.memos.length * 10;
  
  // Bonus for recently updated services
  const daysSinceUpdate = Math.floor((Date.now() - new Date(service.updatedAt).getTime()) / (1000 * 60 * 60 * 24));
  if (daysSinceUpdate < 7) {
    score += 15;
  } else if (daysSinceUpdate < 30) {
    score += 5;
  }
  
  return score;
}

// Helper function to generate alternative search terms
function generateAlternativeSearchTerms(query: string): string[] {
  const alternatives: string[] = [];
  const term = query.toLowerCase().trim();
  
  // Common AWS service abbreviations and alternatives
  const awsTermMap: { [key: string]: string[] } = {
    'ec2': ['elastic compute cloud', 'compute', 'virtual machine', 'vm'],
    's3': ['simple storage service', 'storage', 'bucket'],
    'rds': ['relational database service', 'database', 'db'],
    'lambda': ['serverless', 'function', 'compute'],
    'vpc': ['virtual private cloud', 'network', 'networking'],
    'iam': ['identity access management', 'security', 'permissions'],
    'cloudfront': ['cdn', 'content delivery network'],
    'route53': ['dns', 'domain name system'],
    'elb': ['elastic load balancer', 'load balancer', 'balancer'],
    'cloudwatch': ['monitoring', 'logs', 'metrics']
  };
  
  // Check if query matches any AWS service abbreviation
  if (awsTermMap[term]) {
    alternatives.push(...awsTermMap[term]);
  }
  
  // Check reverse mapping
  for (const [abbrev, terms] of Object.entries(awsTermMap)) {
    if (terms.some(t => t.includes(term) || term.includes(t))) {
      alternatives.push(abbrev);
      alternatives.push(...terms.filter(t => t !== term));
    }
  }
  
  // Remove duplicates and limit results
  return [...new Set(alternatives)].slice(0, 5);
}

export default router;