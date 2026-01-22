// Add genericNameLower to existing records
// Run: node add-lowercase-field.js

import { DynamoDBClient, ScanCommand } from '@aws-sdk/client-dynamodb';
import { DynamoDBDocumentClient, UpdateCommand } from '@aws-sdk/lib-dynamodb';

const client = DynamoDBDocumentClient.from(new DynamoDBClient({}));
const TABLE_NAME = 'Prescription-uuvdrb2j3vgz3dzuh2jpib3hke-NONE';

async function addLowercaseField() {
  let lastEvaluatedKey = undefined;
  let updated = 0;
  let scanned = 0;

  do {
    const result = await client.send(new ScanCommand({
      TableName: TABLE_NAME,
      Limit: 100,
      ExclusiveStartKey: lastEvaluatedKey
    }));

    console.log('Scan result:', result.Items?.length || 0, 'items');

    if (result.Items) {
      for (const item of result.Items) {
        scanned++;
        console.log('Item:', JSON.stringify(item));
        
        const id = item.id?.S || item.id?.N;
        const genericName = item.genericName?.S;
        
        console.log('ID:', id, 'GenericName:', genericName);
        
        if (id && genericName) {
          await client.send(new UpdateCommand({
            TableName: TABLE_NAME,
            Key: { id },
            UpdateExpression: 'SET genericNameLower = :lower',
            ExpressionAttributeValues: {
              ':lower': genericName.toLowerCase()
            }
          }));
          updated++;
          console.log(`Updated ${updated} records`);
        }
      }
    }

    lastEvaluatedKey = result.LastEvaluatedKey;
  } while (lastEvaluatedKey);

  console.log(`Complete! Scanned ${scanned}, Updated ${updated} records`);
}

addLowercaseField().catch(console.error);
