import request from 'supertest';
import express from 'express';
import searchRouter from '../routes/search';
import { initializeDatabase } from '../lib/database';

// Create test app
const app = express();
app.use(express.json());
app.use('/api/search', searchRouter);

// Global error handler for tests
app.use((err: any, req: express.Request, res: express.Response, next: express.NextFunction) => {
  res.status(err.statusCode || 500).json({
    error: {
      code: err.code || 'INTERNAL_SERVER_ERROR',
      message: err.message || 'Internal server error',
      details: err.details
    },
    timestamp: new Date().toISOString(),
    path: req.path
  });
});

describe('Search API', () => {
  beforeAll(async () => {
    await initializeDatabase();
  });

  describe('GET /api/search', () => {
    it('should return 400 when query parameter is missing', async () => {
      const response = await request(app).get('/api/search');

      expect(response.status).toBe(400);
      expect(response.body.error.code).toBe('MISSING_QUERY');
      expect(response.body.error.message).toBe('検索クエリが必要です。');
    });

    it('should return 400 when query parameter is empty', async () => {
      const response = await request(app).get('/api/search?q=');

      expect(response.status).toBe(400);
      expect(response.body.error.code).toBe('MISSING_QUERY');
    });

    it('should return 400 when query parameter is only whitespace', async () => {
      const response = await request(app).get('/api/search?q=%20%20%20');

      expect(response.status).toBe(400);
      expect(response.body.error.code).toBe('EMPTY_QUERY');
      expect(response.body.error.message).toBe('検索クエリが空です。');
    });

    it('should return search results with proper structure', async () => {
      const response = await request(app).get('/api/search?q=test');

      expect(response.status).toBe(200);
      expect(response.body).toHaveProperty('data');
      expect(response.body).toHaveProperty('count');
      expect(response.body).toHaveProperty('query', 'test');
      expect(response.body).toHaveProperty('sort', 'relevance');
      expect(response.body).toHaveProperty('timestamp');
      expect(Array.isArray(response.body.data)).toBe(true);
    });

    it('should support category filtering', async () => {
      const response = await request(app).get('/api/search?q=test&category=some-category-id');

      expect(response.status).toBe(200);
      expect(response.body).toHaveProperty('categoryFilter', 'some-category-id');
      expect(response.body).toHaveProperty('query', 'test');
    });

    it('should support different sort options', async () => {
      const sortOptions = ['relevance', 'name', 'alphabetical', 'updated', 'created'];
      
      for (const sort of sortOptions) {
        const response = await request(app).get(`/api/search?q=test&sort=${sort}`);
        expect(response.status).toBe(200);
        expect(response.body.sort).toBe(sort);
      }
    });

    it('should provide suggestions when no results found', async () => {
      const response = await request(app).get('/api/search?q=nonexistentservice12345');

      expect(response.status).toBe(200);
      expect(response.body.count).toBe(0);
      expect(response.body.data).toEqual([]);
      expect(response.body).toHaveProperty('suggestions');
      expect(response.body.suggestions).toHaveProperty('message');
      expect(response.body.suggestions).toHaveProperty('popularServices');
      expect(response.body.suggestions).toHaveProperty('alternativeSearchTerms');
      expect(Array.isArray(response.body.suggestions.popularServices)).toBe(true);
      expect(Array.isArray(response.body.suggestions.alternativeSearchTerms)).toBe(true);
    });

    it('should include search highlights in results', async () => {
      const response = await request(app).get('/api/search?q=test');

      if (response.body.count > 0) {
        const firstResult = response.body.data[0];
        expect(firstResult).toHaveProperty('searchHighlights');
        expect(firstResult).toHaveProperty('relevanceScore');
        expect(Array.isArray(firstResult.searchHighlights)).toBe(true);
        expect(typeof firstResult.relevanceScore).toBe('number');
      }
    });

    it('should generate alternative search terms for AWS services', async () => {
      const response = await request(app).get('/api/search?q=ec2');

      if (response.body.count === 0 && response.body.suggestions) {
        const alternatives = response.body.suggestions.alternativeSearchTerms;
        expect(alternatives).toContain('elastic compute cloud');
        expect(alternatives).toContain('compute');
        expect(alternatives).toContain('virtual machine');
      }
    });
  });
});