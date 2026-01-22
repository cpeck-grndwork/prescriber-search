// Fix existing records by adding required timestamps
// Run: node fix-records.js

import { DynamoDBClient, ScanCommand } from '@aws-sdk/client-dynamodb';
import { DynamoDBDocumentClient, BatchWriteCommand } from '@aws-sdk/lib-dynamodb';

const client = DynamoDBDocumentClient.from(new DynamoDBClient({}));
const TABLE_NAME = 'Prescription-lebcbosvpzbe5pdktxdswnkqna-NONE';

async function fixRecords() {
  let lastEvaluatedKey = undefined;
  let totalFixed = 0;
  const timestamp = new Date().toISOString();

  do {
    const scanResult = await client.send(new ScanCommand({
      TableName: TABLE_NAME,
      Limit: 25,
      ExclusiveStartKey: lastEvaluatedKey
    }));

    if (scanResult.Items && scanResult.Items.length > 0) {
      const batch = scanResult.Items.map(item => ({
        PutRequest: {
          Item: {
            ...item,
            createdAt: item.createdAt || timestamp,
            updatedAt: item.updatedAt || timestamp,
            __typename: 'Prescription'
          }
        }
      }));

      await client.send(new BatchWriteCommand({
        RequestItems: { [TABLE_NAME]: batch }
      }));

      totalFixed += batch.length;
      console.log(`Fixed ${totalFixed} records`);
    }

    lastEvaluatedKey = scanResult.LastEvaluatedKey;
  } while (lastEvaluatedKey);

  console.log(`Complete! Fixed ${totalFixed} total records`);
}

fixRecords().catch(console.error);
