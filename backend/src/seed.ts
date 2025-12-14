import prisma from './lib/prisma';

// Predefined categories as specified in requirements 3.4
const predefinedCategories = [
  {
    name: 'Compute',
    description: 'コンピューティングサービス - EC2、Lambda、ECS等',
    color: '#FF6B6B'
  },
  {
    name: 'Storage',
    description: 'ストレージサービス - S3、EBS、EFS等',
    color: '#4ECDC4'
  },
  {
    name: 'Network',
    description: 'ネットワークサービス - VPC、CloudFront、Route53等',
    color: '#45B7D1'
  },
  {
    name: 'Security',
    description: 'セキュリティサービス - IAM、KMS、WAF等',
    color: '#96CEB4'
  },
  {
    name: 'ML',
    description: '機械学習サービス - SageMaker、Rekognition、Comprehend等',
    color: '#FFEAA7'
  },
  {
    name: 'Database',
    description: 'データベースサービス - RDS、DynamoDB、ElastiCache等',
    color: '#DDA0DD'
  },
  {
    name: 'Analytics',
    description: '分析サービス - Redshift、Athena、QuickSight等',
    color: '#98D8C8'
  },
  {
    name: 'Developer Tools',
    description: '開発者ツール - CodeCommit、CodeBuild、CodeDeploy等',
    color: '#F7DC6F'
  },
  {
    name: 'Management',
    description: '管理・監視サービス - CloudWatch、CloudTrail、Config等',
    color: '#BB8FCE'
  },
  {
    name: 'Integration',
    description: '統合サービス - SQS、SNS、EventBridge等',
    color: '#85C1E9'
  }
];

// Default comparison attributes as specified in requirements 5.2
const defaultComparisonAttributes = [
  {
    name: '料金モデル',
    description: 'サービスの料金体系（従量課金、定額等）',
    dataType: 'TEXT',
    isDefault: true
  },
  {
    name: 'ユースケース',
    description: '主な利用シーン・用途',
    dataType: 'TEXT',
    isDefault: true
  },
  {
    name: '制限',
    description: 'サービスの制限事項・上限',
    dataType: 'TEXT',
    isDefault: true
  },
  {
    name: 'リージョン対応',
    description: '利用可能なAWSリージョン',
    dataType: 'TEXT',
    isDefault: true
  },
  {
    name: 'SLA',
    description: 'サービスレベル合意（可用性等）',
    dataType: 'TEXT',
    isDefault: true
  },
  {
    name: '最大スループット',
    description: '最大処理能力・スループット',
    dataType: 'TEXT',
    isDefault: true
  },
  {
    name: 'セキュリティ機能',
    description: '提供されるセキュリティ機能',
    dataType: 'TEXT',
    isDefault: true
  },
  {
    name: '統合サービス',
    description: '他のAWSサービスとの統合',
    dataType: 'TEXT',
    isDefault: true
  }
];

async function main() {
  console.log('🌱 Starting database seeding...');

  try {
    // Check if categories already exist
    const existingCategories = await prisma.category.count();
    const existingAttributes = await prisma.comparisonAttribute.count();
    
    if (existingCategories > 0 && existingAttributes > 0) {
      console.log(`📊 Database already contains ${existingCategories} categories and ${existingAttributes} comparison attributes. Skipping seed.`);
      return;
    }

    // Create predefined categories
    if (existingCategories === 0) {
      console.log('📝 Creating predefined categories...');
      
      for (const category of predefinedCategories) {
        await prisma.category.create({
          data: category
        });
        console.log(`✅ Created category: ${category.name}`);
      }
    }

    // Create default comparison attributes
    if (existingAttributes === 0) {
      console.log('📝 Creating default comparison attributes...');
      
      for (const attribute of defaultComparisonAttributes) {
        await prisma.comparisonAttribute.create({
          data: attribute
        });
        console.log(`✅ Created comparison attribute: ${attribute.name}`);
      }
    }

    console.log('🎉 Database seeding completed successfully!');
    console.log(`📊 Created ${predefinedCategories.length} categories and ${defaultComparisonAttributes.length} comparison attributes`);

  } catch (error) {
    console.error('❌ Error during database seeding:', error);
    throw error;
  }
}

// Run the seed function
main()
  .catch((error) => {
    console.error('❌ Seed script failed:', error);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });