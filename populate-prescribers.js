// Populate Prescriber table with unique prescribers
// Run: node populate-prescribers.js

import { DynamoDBClient, ScanCommand } from '@aws-sdk/client-dynamodb';
import { DynamoDBDocumentClient, BatchWriteCommand } from '@aws-sdk/lib-dynamodb';

const client = DynamoDBDocumentClient.from(new DynamoDBClient({}));
const PRESCRIPTION_TABLE = 'Prescription-2tozfkjj5ragdb5gqxn2kk2ugu-NONE';
const PRESCRIBER_TABLE = 'Prescriber-2tozfkjj5ragdb5gqxn2kk2ugu-NONE'; // Update after deploying

async function populatePrescribers() {
  const uniquePrescribers = new Map();
  let lastEvaluatedKey = undefined;
  let scanned = 0;

  console.log('Scanning Prescription table...');
  
  do {
    const result = await client.send(new ScanCommand({
      TableName: PRESCRIPTION_TABLE,
      Limit: 1000,
      ExclusiveStartKey: lastEvaluatedKey
    }));

    if (result.Items) {
      result.Items.forEach(item => {
        const npi = item.npi?.S;
        if (npi && !uniquePrescribers.has(npi)) {
          uniquePrescribers.set(npi, {
            npi: npi,
            prescriberName: item.prescriberName?.S || '',
            prescriberNameLower: (item.prescriberName?.S || '').toLowerCase(),
            city: item.city?.S || '',
            state: item.state?.S || '',
            prescriberType: item.prescriberType?.S || '',
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString(),
            __typename: 'Prescriber'
          });
        }
      });
      scanned += result.Items.length;
      console.log(`Scanned ${scanned} records, found ${uniquePrescribers.size} unique prescribers`);
    }

    lastEvaluatedKey = result.LastEvaluatedKey;
  } while (lastEvaluatedKey);

  console.log(`Writing ${uniquePrescribers.size} prescribers to Prescriber table...`);
  
  const prescribers = Array.from(uniquePrescribers.values());
  let written = 0;
  
  for (let i = 0; i < prescribers.length; i += 25) {
    const batch = prescribers.slice(i, i + 25).map(p => ({
      PutRequest: { Item: p }
    }));
    
    await client.send(new BatchWriteCommand({
      RequestItems: { [PRESCRIBER_TABLE]: batch }
    }));
    
    written += batch.length;
    console.log(`Written ${written} prescribers`);
  }

  console.log('Complete!');
}

populatePrescribers().catch(console.error);
