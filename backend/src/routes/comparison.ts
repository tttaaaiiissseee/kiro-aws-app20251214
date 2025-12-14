import { Router, Request, Response } from 'express';
import prisma from '../lib/prisma';
import { validateRequired, asyncHandler } from '../middleware/validation';
import { stringify } from 'csv-stringify';
import puppeteer from 'puppeteer';
import path from 'path';
import fs from 'fs';

const router = Router();

// GET /api/comparison/attributes - 比較属性一覧取得
router.get('/attributes', asyncHandler(async (req: Request, res: Response) => {
  try {
    const attributes = await prisma.comparisonAttribute.findMany({
      orderBy: [
        { isDefault: 'desc' }, // デフォルト属性を先に表示
        { name: 'asc' }
      ],
      include: {
        _count: {
          select: {
            values: true
          }
        }
      }
    });
    
    res.json({
      data: attributes,
      count: attributes.length,
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    console.error('Error fetching comparison attributes:', error);
    throw new Error('比較属性一覧の取得に失敗しました。');
  }
}));

// POST /api/comparison/attributes - カスタム比較属性作成
router.post('/attributes',
  validateRequired(['name', 'dataType']),
  asyncHandler(async (req: Request, res: Response): Promise<void> => {
    const { name, description, dataType } = req.body;
    
    // Validate dataType
    const validDataTypes = ['TEXT', 'NUMBER', 'BOOLEAN', 'URL'];
    if (!validDataTypes.includes(dataType)) {
      res.status(400).json({
        error: {
          code: 'INVALID_DATA_TYPE',
          message: '無効なデータ型です。',
          details: { validTypes: validDataTypes, provided: dataType }
        },
        timestamp: new Date().toISOString(),
        path: req.path
      });
      return;
    }
    
    try {
      // Check for duplicate attribute name
      const existingAttribute = await prisma.comparisonAttribute.findUnique({
        where: { name }
      });
      
      if (existingAttribute) {
        res.status(409).json({
          error: {
            code: 'DUPLICATE_ATTRIBUTE_NAME',
            message: '同じ名前の比較属性が既に存在します。',
            details: { attributeName: name }
          },
          timestamp: new Date().toISOString(),
          path: req.path
        });
        return;
      }
      
      // Create attribute
      const attribute = await prisma.comparisonAttribute.create({
        data: {
          name,
          description: description || null,
          dataType,
          isDefault: false // カスタム属性
        }
      });
      
      res.status(201).json({
        data: attribute,
        message: 'カスタム比較属性が正常に作成されました。',
        timestamp: new Date().toISOString()
      });
    } catch (error) {
      console.error('Error creating comparison attribute:', error);
      throw new Error('比較属性の作成に失敗しました。');
    }
  })
);

// POST /api/comparison/services/:serviceId/attributes/:attributeId - サービス属性値設定
router.post('/services/:serviceId/attributes/:attributeId',
  validateRequired(['value']),
  asyncHandler(async (req: Request, res: Response): Promise<void> => {
    const { serviceId, attributeId } = req.params;
    const { value } = req.body;
    
    try {
      // Check if service exists
      const service = await prisma.service.findUnique({
        where: { id: serviceId }
      });
      
      if (!service) {
        res.status(404).json({
          error: {
            code: 'SERVICE_NOT_FOUND',
            message: '指定されたサービスが見つかりません。',
            details: { serviceId }
          },
          timestamp: new Date().toISOString(),
          path: req.path
        });
        return;
      }
      
      // Check if attribute exists
      const attribute = await prisma.comparisonAttribute.findUnique({
        where: { id: attributeId }
      });
      
      if (!attribute) {
        res.status(404).json({
          error: {
            code: 'ATTRIBUTE_NOT_FOUND',
            message: '指定された比較属性が見つかりません。',
            details: { attributeId }
          },
          timestamp: new Date().toISOString(),
          path: req.path
        });
        return;
      }
      
      // Validate value based on data type
      let validatedValue = value;
      try {
        switch (attribute.dataType) {
          case 'NUMBER':
            validatedValue = parseFloat(value);
            if (isNaN(validatedValue)) {
              throw new Error('Invalid number format');
            }
            break;
          case 'BOOLEAN':
            validatedValue = Boolean(value);
            break;
          case 'URL':
            new URL(value); // Validate URL format
            break;
          case 'TEXT':
          default:
            validatedValue = String(value);
            break;
        }
      } catch (error) {
        res.status(400).json({
          error: {
            code: 'INVALID_VALUE_FORMAT',
            message: `データ型 ${attribute.dataType} に対して無効な値です。`,
            details: { dataType: attribute.dataType, value }
          },
          timestamp: new Date().toISOString(),
          path: req.path
        });
        return;
      }
      
      // Upsert attribute value
      const attributeValue = await prisma.serviceAttributeValue.upsert({
        where: {
          serviceId_attributeId: {
            serviceId,
            attributeId
          }
        },
        update: {
          value: JSON.stringify(validatedValue)
        },
        create: {
          serviceId,
          attributeId,
          value: JSON.stringify(validatedValue)
        },
        include: {
          service: {
            select: {
              id: true,
              name: true
            }
          },
          attribute: {
            select: {
              id: true,
              name: true,
              dataType: true
            }
          }
        }
      });
      
      res.json({
        data: {
          ...attributeValue,
          value: JSON.parse(attributeValue.value)
        },
        message: 'サービス属性値が正常に設定されました。',
        timestamp: new Date().toISOString()
      });
    } catch (error) {
      console.error('Error setting service attribute value:', error);
      throw new Error('サービス属性値の設定に失敗しました。');
    }
  })
);

// POST /api/comparison/compare - サービス比較データ生成
router.post('/compare',
  validateRequired(['serviceIds']),
  asyncHandler(async (req: Request, res: Response): Promise<void> => {
    const { serviceIds, attributeIds } = req.body;
    
    // Validate service limit (max 5 services)
    if (!Array.isArray(serviceIds) || serviceIds.length === 0) {
      res.status(400).json({
        error: {
          code: 'INVALID_SERVICE_IDS',
          message: 'サービスIDの配列が必要です。',
          details: { provided: serviceIds }
        },
        timestamp: new Date().toISOString(),
        path: req.path
      });
      return;
    }
    
    if (serviceIds.length > 5) {
      res.status(400).json({
        error: {
          code: 'TOO_MANY_SERVICES',
          message: '比較できるサービスは最大5つまでです。',
          details: { provided: serviceIds.length, maximum: 5 }
        },
        timestamp: new Date().toISOString(),
        path: req.path
      });
      return;
    }
    
    try {
      // Get services with their basic information
      const services = await prisma.service.findMany({
        where: {
          id: { in: serviceIds }
        },
        include: {
          category: {
            select: {
              id: true,
              name: true,
              color: true
            }
          },
          attributeValues: {
            include: {
              attribute: true
            }
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
      
      if (services.length !== serviceIds.length) {
        const foundIds = services.map(s => s.id);
        const missingIds = serviceIds.filter(id => !foundIds.includes(id));
        res.status(404).json({
          error: {
            code: 'SERVICES_NOT_FOUND',
            message: '一部のサービスが見つかりません。',
            details: { missingServiceIds: missingIds }
          },
          timestamp: new Date().toISOString(),
          path: req.path
        });
        return;
      }
      
      // Get comparison attributes (default + requested custom attributes)
      let attributes;
      if (attributeIds && Array.isArray(attributeIds)) {
        attributes = await prisma.comparisonAttribute.findMany({
          where: {
            OR: [
              { isDefault: true },
              { id: { in: attributeIds } }
            ]
          },
          orderBy: [
            { isDefault: 'desc' },
            { name: 'asc' }
          ]
        });
      } else {
        // Get only default attributes
        attributes = await prisma.comparisonAttribute.findMany({
          where: { isDefault: true },
          orderBy: { name: 'asc' }
        });
      }
      
      // Build comparison data
      const comparisonData = {
        services: services.map(service => {
          const attributeValues: Record<string, any> = {};
          
          // Add basic service information
          attributeValues['name'] = service.name;
          attributeValues['description'] = service.description || '';
          attributeValues['category'] = service.category.name;
          attributeValues['memoCount'] = service._count.memos;
          attributeValues['relationCount'] = service._count.fromRelations + service._count.toRelations;
          
          // Add custom attribute values
          attributes.forEach(attr => {
            const value = service.attributeValues.find(av => av.attributeId === attr.id);
            if (value) {
              try {
                attributeValues[attr.name] = JSON.parse(value.value);
              } catch {
                attributeValues[attr.name] = value.value;
              }
            } else {
              attributeValues[attr.name] = null;
            }
          });
          
          return {
            id: service.id,
            name: service.name,
            description: service.description,
            category: service.category,
            attributes: attributeValues,
            createdAt: service.createdAt,
            updatedAt: service.updatedAt
          };
        }),
        attributes: [
          // Basic attributes
          { name: 'name', displayName: 'サービス名', dataType: 'TEXT', isDefault: true },
          { name: 'description', displayName: '説明', dataType: 'TEXT', isDefault: true },
          { name: 'category', displayName: 'カテゴリ', dataType: 'TEXT', isDefault: true },
          { name: 'memoCount', displayName: 'メモ数', dataType: 'NUMBER', isDefault: true },
          { name: 'relationCount', displayName: '関連数', dataType: 'NUMBER', isDefault: true },
          // Custom attributes
          ...attributes.map(attr => ({
            name: attr.name,
            displayName: attr.name,
            dataType: attr.dataType,
            isDefault: attr.isDefault,
            description: attr.description
          }))
        ],
        metadata: {
          serviceCount: services.length,
          attributeCount: attributes.length + 5, // 5 basic attributes
          generatedAt: new Date().toISOString()
        }
      };
      
      res.json({
        data: comparisonData,
        message: '比較データが正常に生成されました。',
        timestamp: new Date().toISOString()
      });
    } catch (error) {
      console.error('Error generating comparison data:', error);
      throw new Error('比較データの生成に失敗しました。');
    }
  })
);

// POST /api/comparison/export - 比較データエクスポート
router.post('/export',
  validateRequired(['serviceIds', 'format']),
  asyncHandler(async (req: Request, res: Response): Promise<void> => {
    const { serviceIds, attributeIds, format } = req.body;
    
    // Validate format
    if (!['csv', 'pdf'].includes(format.toLowerCase())) {
      res.status(400).json({
        error: {
          code: 'INVALID_FORMAT',
          message: '無効なエクスポート形式です。',
          details: { validFormats: ['csv', 'pdf'], provided: format }
        },
        timestamp: new Date().toISOString(),
        path: req.path
      });
      return;
    }
    
    try {
      // Generate comparison data (reuse the compare logic)
      const comparisonResponse = await generateComparisonData(serviceIds, attributeIds);
      
      if (format.toLowerCase() === 'csv') {
        // Generate CSV
        const csvData = await generateCSV(comparisonResponse.data);
        
        res.setHeader('Content-Type', 'text/csv');
        res.setHeader('Content-Disposition', `attachment; filename="aws-services-comparison-${Date.now()}.csv"`);
        res.send(csvData);
      } else if (format.toLowerCase() === 'pdf') {
        // Generate PDF
        const pdfBuffer = await generatePDF(comparisonResponse.data);
        
        res.setHeader('Content-Type', 'application/pdf');
        res.setHeader('Content-Disposition', `attachment; filename="aws-services-comparison-${Date.now()}.pdf"`);
        res.send(pdfBuffer);
      }
    } catch (error) {
      console.error('Error exporting comparison data:', error);
      throw new Error('比較データのエクスポートに失敗しました。');
    }
  })
);

// Helper function to generate comparison data (extracted from compare endpoint)
async function generateComparisonData(serviceIds: string[], attributeIds?: string[]) {
  // Validate service limit
  if (!Array.isArray(serviceIds) || serviceIds.length === 0 || serviceIds.length > 5) {
    throw new Error('Invalid service IDs');
  }
  
  // Get services with their basic information
  const services = await prisma.service.findMany({
    where: {
      id: { in: serviceIds }
    },
    include: {
      category: {
        select: {
          id: true,
          name: true,
          color: true
        }
      },
      attributeValues: {
        include: {
          attribute: true
        }
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
  
  if (services.length !== serviceIds.length) {
    throw new Error('Some services not found');
  }
  
  // Get comparison attributes
  let attributes;
  if (attributeIds && Array.isArray(attributeIds)) {
    attributes = await prisma.comparisonAttribute.findMany({
      where: {
        OR: [
          { isDefault: true },
          { id: { in: attributeIds } }
        ]
      },
      orderBy: [
        { isDefault: 'desc' },
        { name: 'asc' }
      ]
    });
  } else {
    attributes = await prisma.comparisonAttribute.findMany({
      where: { isDefault: true },
      orderBy: { name: 'asc' }
    });
  }
  
  // Build comparison data
  const comparisonData = {
    services: services.map(service => {
      const attributeValues: Record<string, any> = {};
      
      // Add basic service information
      attributeValues['name'] = service.name;
      attributeValues['description'] = service.description || '';
      attributeValues['category'] = service.category.name;
      attributeValues['memoCount'] = service._count.memos;
      attributeValues['relationCount'] = service._count.fromRelations + service._count.toRelations;
      
      // Add custom attribute values
      attributes.forEach(attr => {
        const value = service.attributeValues.find(av => av.attributeId === attr.id);
        if (value) {
          try {
            attributeValues[attr.name] = JSON.parse(value.value);
          } catch {
            attributeValues[attr.name] = value.value;
          }
        } else {
          attributeValues[attr.name] = null;
        }
      });
      
      return {
        id: service.id,
        name: service.name,
        description: service.description,
        category: service.category,
        attributes: attributeValues,
        createdAt: service.createdAt,
        updatedAt: service.updatedAt
      };
    }),
    attributes: [
      // Basic attributes
      { name: 'name', displayName: 'サービス名', dataType: 'TEXT', isDefault: true },
      { name: 'description', displayName: '説明', dataType: 'TEXT', isDefault: true },
      { name: 'category', displayName: 'カテゴリ', dataType: 'TEXT', isDefault: true },
      { name: 'memoCount', displayName: 'メモ数', dataType: 'NUMBER', isDefault: true },
      { name: 'relationCount', displayName: '関連数', dataType: 'NUMBER', isDefault: true },
      // Custom attributes
      ...attributes.map(attr => ({
        name: attr.name,
        displayName: attr.name,
        dataType: attr.dataType,
        isDefault: attr.isDefault,
        description: attr.description
      }))
    ],
    metadata: {
      serviceCount: services.length,
      attributeCount: attributes.length + 5,
      generatedAt: new Date().toISOString()
    }
  };
  
  return { data: comparisonData };
}

// Helper function to generate CSV
async function generateCSV(comparisonData: any): Promise<string> {
  return new Promise((resolve, reject) => {
    const records: any[] = [];
    
    // Header row
    const headers = comparisonData.attributes.map((attr: any) => attr.displayName);
    records.push(headers);
    
    // Data rows
    comparisonData.services.forEach((service: any) => {
      const row = comparisonData.attributes.map((attr: any) => {
        const value = service.attributes[attr.name];
        return value !== null && value !== undefined ? String(value) : '';
      });
      records.push(row);
    });
    
    stringify(records, {
      header: false,
      quoted: true
    }, (err, output) => {
      if (err) {
        reject(err);
      } else {
        resolve(output);
      }
    });
  });
}

// Helper function to generate PDF
async function generatePDF(comparisonData: any): Promise<Buffer> {
  const browser = await puppeteer.launch({
    headless: true,
    args: ['--no-sandbox', '--disable-setuid-sandbox']
  });
  
  try {
    const page = await browser.newPage();
    
    // Generate HTML content
    const htmlContent = generateComparisonHTML(comparisonData);
    
    await page.setContent(htmlContent, { waitUntil: 'networkidle0' });
    
    const pdfBuffer = await page.pdf({
      format: 'A4',
      landscape: true,
      margin: {
        top: '20px',
        right: '20px',
        bottom: '20px',
        left: '20px'
      }
    });
    
    return Buffer.from(pdfBuffer);
  } finally {
    await browser.close();
  }
}

// Helper function to generate HTML for PDF
function generateComparisonHTML(comparisonData: any): string {
  const services = comparisonData.services;
  const attributes = comparisonData.attributes;
  
  let tableRows = '';
  
  // Generate table rows
  attributes.forEach((attr: any) => {
    let row = `<tr><td class="attribute-name">${attr.displayName}</td>`;
    services.forEach((service: any) => {
      const value = service.attributes[attr.name];
      const displayValue = value !== null && value !== undefined ? String(value) : '-';
      row += `<td class="attribute-value">${displayValue}</td>`;
    });
    row += '</tr>';
    tableRows += row;
  });
  
  return `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="UTF-8">
      <title>AWS サービス比較</title>
      <style>
        body {
          font-family: 'Helvetica Neue', Arial, sans-serif;
          margin: 0;
          padding: 20px;
          font-size: 12px;
        }
        .header {
          text-align: center;
          margin-bottom: 30px;
        }
        .title {
          font-size: 24px;
          font-weight: bold;
          color: #333;
          margin-bottom: 10px;
        }
        .subtitle {
          font-size: 14px;
          color: #666;
        }
        .comparison-table {
          width: 100%;
          border-collapse: collapse;
          margin-top: 20px;
        }
        .comparison-table th,
        .comparison-table td {
          border: 1px solid #ddd;
          padding: 8px;
          text-align: left;
          vertical-align: top;
        }
        .comparison-table th {
          background-color: #f5f5f5;
          font-weight: bold;
          text-align: center;
        }
        .attribute-name {
          background-color: #f9f9f9;
          font-weight: bold;
          width: 150px;
        }
        .attribute-value {
          max-width: 200px;
          word-wrap: break-word;
        }
        .footer {
          margin-top: 30px;
          text-align: center;
          font-size: 10px;
          color: #999;
        }
      </style>
    </head>
    <body>
      <div class="header">
        <div class="title">AWS サービス比較</div>
        <div class="subtitle">生成日時: ${new Date(comparisonData.metadata.generatedAt).toLocaleString('ja-JP')}</div>
      </div>
      
      <table class="comparison-table">
        <thead>
          <tr>
            <th>属性</th>
            ${services.map((service: any) => `<th>${service.name}</th>`).join('')}
          </tr>
        </thead>
        <tbody>
          ${tableRows}
        </tbody>
      </table>
      
      <div class="footer">
        AWS学習アプリ - サービス比較レポート
      </div>
    </body>
    </html>
  `;
}

export default router;