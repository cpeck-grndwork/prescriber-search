// Extract unique drugs and populate Drug table
// Run: node populate-drugs.js

import { DynamoDBClient, ScanCommand } from '@aws-sdk/client-dynamodb';
import { DynamoDBDocumentClient, BatchWriteCommand } from '@aws-sdk/lib-dynamodb';

const client = DynamoDBDocumentClient.from(new DynamoDBClient({}));
const PRESCRIPTION_TABLE = 'Prescription-2tozfkjj5ragdb5gqxn2kk2ugu-NONE';
const DRUG_TABLE = 'Drug-2tozfkjj5ragdb5gqxn2kk2ugu-NONE'; // Update after deploying

async function populateDrugs() {
  const uniqueDrugs = new Map();
  let lastEvaluatedKey = undefined;
  let scanned = 0;

  console.log('Scanning Prescription table for unique drugs...');
  
  do {
    const result = await client.send(new ScanCommand({
      TableName: PRESCRIPTION_TABLE,
      Limit: 1000,
      ExclusiveStartKey: lastEvaluatedKey,
      ProjectionExpression: 'genericName'
    }));

    if (result.Items) {
      result.Items.forEach(item => {
        const genericName = item.genericName?.S;
        if (genericName && !uniqueDrugs.has(genericName)) {
          uniqueDrugs.set(genericName, {
            genericName: genericName,
            genericNameLower: genericName.toLowerCase(),
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString(),
            __typename: 'Drug'
          });
        }
      });
      scanned += result.Items.length;
      console.log(`Scanned ${scanned} records, found ${uniqueDrugs.size} unique drugs`);
    }

    lastEvaluatedKey = result.LastEvaluatedKey;
  } while (lastEvaluatedKey);

  console.log(`Writing ${uniqueDrugs.size} drugs to Drug table...`);
  
  const drugs = Array.from(uniqueDrugs.values());
  let written = 0;
  
  for (let i = 0; i < drugs.length; i += 25) {
    const batch = drugs.slice(i, i + 25).map(d => ({
      PutRequest: { Item: d }
    }));
    
    await client.send(new BatchWriteCommand({
      RequestItems: { [DRUG_TABLE]: batch }
    }));
    
    written += batch.length;
    console.log(`Written ${written} drugs`);
  }

  console.log('Complete!');
}

populateDrugs().catch(console.error);
