// Direct import script (alternative to Lambda)
// Run: node import-script.js

import { DynamoDBClient } from '@aws-sdk/client-dynamodb';
import { DynamoDBDocumentClient, BatchWriteCommand } from '@aws-sdk/lib-dynamodb';
import fs from 'fs';
import readline from 'readline';

const client = DynamoDBDocumentClient.from(new DynamoDBClient({}));
const TABLE_NAME = 'Prescription-2tozfkjj5ragdb5gqxn2kk2ugu-NONE'; // Get from amplify_outputs.json
const CSV_PATH = 'C:\\Users\\cpeck\\MUP_DPR_RY25_P04_V10_DY23_NPIBN.csv';

async function importData() {
  const fileStream = fs.createReadStream(CSV_PATH);
  const rl = readline.createInterface({ input: fileStream });
  
  let headers = [];
  let batch = [];
  let count = 0;
  let recordId = 1;
  let isFirstLine = true;

  for await (const line of rl) {
    if (isFirstLine) {
      headers = line.split(',');
      isFirstLine = false;
      continue;
    }

    const values = line.split(',');
    const row = {};
    headers.forEach((h, i) => row[h] = values[i]);

    const timestamp = new Date().toISOString();
    const item = {
      id: `${recordId}`,
      npi: row.Prscrbr_NPI,
      prescriberName: `${row.Prscrbr_First_Name} ${row.Prscrbr_Last_Org_Name}`.trim(),
      city: row.Prscrbr_City,
      state: row.Prscrbr_State_Abrvtn,
      prescriberType: row.Prscrbr_Type,
      brandName: row.Brnd_Name,
      genericName: row.Gnrc_Name,
      genericNameLower: (row.Gnrc_Name || '').toLowerCase(),
      totalClaims: parseInt(row.Tot_Clms) || 0,
      totalBeneficiaries: parseInt(row.Tot_Benes) || 0,
      totalDrugCost: parseFloat(row.Tot_Drug_Cst) || 0,
      totalDaySupply: parseInt(row.Tot_Day_Suply) || 0,
      createdAt: timestamp,
      updatedAt: timestamp,
      __typename: 'Prescription'
    };

    recordId++;
    batch.push({ PutRequest: { Item: item } });

    if (batch.length === 25) {
      await client.send(new BatchWriteCommand({
        RequestItems: { [TABLE_NAME]: batch }
      }));
      count += batch.length;
      console.log(`Imported ${count} records`);
      batch = [];
    }
  }

  if (batch.length > 0) {
    await client.send(new BatchWriteCommand({
      RequestItems: { [TABLE_NAME]: batch }
    }));
    count += batch.length;
  }

  console.log(`Complete! Total: ${count} records`);
}

importData().catch(console.error);
