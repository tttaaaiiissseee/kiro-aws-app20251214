import request from 'supertest';
import express from 'express';
import comparisonRouter from '../routes/comparison';
import prisma from '../lib/prisma';

// Create test app
const app = express();
app.use(express.json());
app.use('/api/comparison', comparisonRouter);

// Global error handler for tests
app.use((err: any, req: express.Request, res: express.Response, next: express.NextFunction) => {
  res.status(500).json({ error: { message: err.message } });
});

describe('Comparison API', () => {
  let testCategoryId: string;
  let testServiceIds: string[] = [];
  let testAttributeId: string;

  beforeAll(async () => {
    // Create test category
    const category = await prisma.category.create({
      data: {
        name: 'Test Comparison Category',
        description: 'Category for comparison tests'
      }
    });
    testCategoryId = category.id;

    // Create test services
    const service1 = await prisma.service.create({
      data: {
        name: 'Test Service 1',
        description: 'First test service',
        categoryId: testCategoryId
      }
    });
    
    const service2 = await prisma.service.create({
      data: {
        name: 'Test Service 2',
        description: 'Second test service',
        categoryId: testCategoryId
      }
    });

    testServiceIds = [service1.id, service2.id];

    // Create test comparison attribute
    const attribute = await prisma.comparisonAttribute.create({
      data: {
        name: 'Test Attribute',
        description: 'Test comparison attribute',
        dataType: 'TEXT',
        isDefault: false
      }
    });
    testAttributeId = attribute.id;
  });

  afterAll(async () => {
    // Clean up test data
    await prisma.serviceAttributeValue.deleteMany({
      where: { serviceId: { in: testServiceIds } }
    });
    await prisma.service.deleteMany({
      where: { id: { in: testServiceIds } }
    });
    await prisma.comparisonAttribute.delete({
      where: { id: testAttributeId }
    });
    await prisma.category.delete({
      where: { id: testCategoryId }
    });
    await prisma.$disconnect();
  });

  describe('GET /api/comparison/attributes', () => {
    it('should return comparison attributes', async () => {
      const response = await request(app).get('/api/comparison/attributes');

      expect(response.status).toBe(200);
      expect(response.body.data).toBeInstanceOf(Array);
      expect(response.body.count).toBeGreaterThan(0);
      expect(response.body.timestamp).toBeDefined();
    });
  });

  describe('POST /api/comparison/attributes', () => {
    it('should create a custom comparison attribute', async () => {
      const attributeData = {
        name: 'Custom Test Attribute',
        description: 'Custom attribute for testing',
        dataType: 'NUMBER'
      };

      const response = await request(app)
        .post('/api/comparison/attributes')
        .send(attributeData);

      expect(response.status).toBe(201);
      expect(response.body.data.name).toBe(attributeData.name);
      expect(response.body.data.dataType).toBe(attributeData.dataType);
      expect(response.body.data.isDefault).toBe(false);
      expect(response.body.message).toBe('カスタム比較属性が正常に作成されました。');

      // Clean up
      await prisma.comparisonAttribute.delete({
        where: { id: response.body.data.id }
      });
    });

    it('should reject invalid data type', async () => {
      const attributeData = {
        name: 'Invalid Attribute',
        dataType: 'INVALID_TYPE'
      };

      const response = await request(app)
        .post('/api/comparison/attributes')
        .send(attributeData);

      expect(response.status).toBe(400);
      expect(response.body.error.code).toBe('INVALID_DATA_TYPE');
    });

    it('should reject duplicate attribute name', async () => {
      const attributeData = {
        name: 'Test Attribute', // Same as the one created in beforeAll
        dataType: 'TEXT'
      };

      const response = await request(app)
        .post('/api/comparison/attributes')
        .send(attributeData);

      expect(response.status).toBe(409);
      expect(response.body.error.code).toBe('DUPLICATE_ATTRIBUTE_NAME');
    });
  });

  describe('POST /api/comparison/services/:serviceId/attributes/:attributeId', () => {
    it('should set service attribute value', async () => {
      const value = 'Test value';

      const response = await request(app)
        .post(`/api/comparison/services/${testServiceIds[0]}/attributes/${testAttributeId}`)
        .send({ value });

      expect(response.status).toBe(200);
      expect(response.body.data.value).toBe(value);
      expect(response.body.message).toBe('サービス属性値が正常に設定されました。');
    });

    it('should return 404 for non-existent service', async () => {
      const response = await request(app)
        .post(`/api/comparison/services/non-existent-id/attributes/${testAttributeId}`)
        .send({ value: 'test' });

      expect(response.status).toBe(404);
      expect(response.body.error.code).toBe('SERVICE_NOT_FOUND');
    });

    it('should return 404 for non-existent attribute', async () => {
      const response = await request(app)
        .post(`/api/comparison/services/${testServiceIds[0]}/attributes/non-existent-id`)
        .send({ value: 'test' });

      expect(response.status).toBe(404);
      expect(response.body.error.code).toBe('ATTRIBUTE_NOT_FOUND');
    });
  });

  describe('POST /api/comparison/compare', () => {
    it('should generate comparison data for valid services', async () => {
      const response = await request(app)
        .post('/api/comparison/compare')
        .send({ serviceIds: testServiceIds });

      expect(response.status).toBe(200);
      expect(response.body.data.services).toHaveLength(2);
      expect(response.body.data.attributes).toBeInstanceOf(Array);
      expect(response.body.data.metadata.serviceCount).toBe(2);
      expect(response.body.message).toBe('比較データが正常に生成されました。');
    });

    it('should enforce 5-service limit', async () => {
      const sixServices = [...testServiceIds, ...testServiceIds, ...testServiceIds];

      const response = await request(app)
        .post('/api/comparison/compare')
        .send({ serviceIds: sixServices });

      expect(response.status).toBe(400);
      expect(response.body.error.code).toBe('TOO_MANY_SERVICES');
      expect(response.body.error.details.maximum).toBe(5);
    });

    it('should return error for empty service list', async () => {
      const response = await request(app)
        .post('/api/comparison/compare')
        .send({ serviceIds: [] });

      expect(response.status).toBe(400);
      expect(response.body.error.code).toBe('INVALID_SERVICE_IDS');
    });

    it('should return error for non-existent services', async () => {
      const response = await request(app)
        .post('/api/comparison/compare')
        .send({ serviceIds: ['non-existent-1', 'non-existent-2'] });

      expect(response.status).toBe(404);
      expect(response.body.error.code).toBe('SERVICES_NOT_FOUND');
    });
  });

  describe('POST /api/comparison/export', () => {
    it('should export comparison data as CSV', async () => {
      const response = await request(app)
        .post('/api/comparison/export')
        .send({ 
          serviceIds: testServiceIds,
          format: 'csv'
        });

      expect(response.status).toBe(200);
      expect(response.headers['content-type']).toBe('text/csv; charset=utf-8');
      expect(response.headers['content-disposition']).toMatch(/attachment; filename="aws-services-comparison-\d+\.csv"/);
      expect(response.text).toContain('サービス名');
      expect(response.text).toContain('Test Service 1');
      expect(response.text).toContain('Test Service 2');
    });

    it('should export comparison data as PDF', async () => {
      const response = await request(app)
        .post('/api/comparison/export')
        .send({ 
          serviceIds: testServiceIds,
          format: 'pdf'
        });

      expect(response.status).toBe(200);
      expect(response.headers['content-type']).toBe('application/pdf');
      expect(response.headers['content-disposition']).toMatch(/attachment; filename="aws-services-comparison-\d+\.pdf"/);
      expect(response.body).toBeInstanceOf(Buffer);
    }, 30000); // Increase timeout for PDF generation

    it('should reject invalid export format', async () => {
      const response = await request(app)
        .post('/api/comparison/export')
        .send({ 
          serviceIds: testServiceIds,
          format: 'invalid'
        });

      expect(response.status).toBe(400);
      expect(response.body.error.code).toBe('INVALID_FORMAT');
    });
  });
});