import { DynamoDBClient } from '@aws-sdk/client-dynamodb';
import { DynamoDBDocumentClient, BatchWriteCommand } from '@aws-sdk/lib-dynamodb';

const dynamoClient = DynamoDBDocumentClient.from(new DynamoDBClient({}));

export const handler = async (event: any) => {
  const tableName = process.env.TABLE_NAME!;
  const records = event.records || [];
  
  let batch: any[] = [];
  let count = 0;

  for (const record of records) {
    const item = {
      id: `${record.npi}#${record.brandName}`,
      npi: record.npi,
      prescriberName: record.prescriberName,
      city: record.city,
      state: record.state,
      prescriberType: record.prescriberType,
      brandName: record.brandName,
      genericName: record.genericName,
      totalClaims: record.totalClaims || 0,
      totalBeneficiaries: record.totalBeneficiaries || 0,
      totalDrugCost: record.totalDrugCost || 0,
      totalDaySupply: record.totalDaySupply || 0,
    };

    batch.push({ PutRequest: { Item: item } });

    if (batch.length === 25) {
      await dynamoClient.send(new BatchWriteCommand({
        RequestItems: { [tableName]: batch }
      }));
      count += batch.length;
      batch = [];
    }
  }

  if (batch.length > 0) {
    await dynamoClient.send(new BatchWriteCommand({
      RequestItems: { [tableName]: batch }
    }));
    count += batch.length;
  }

  return { statusCode: 200, body: `Imported ${count} records` };
};
