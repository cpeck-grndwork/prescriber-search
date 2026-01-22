// Check DynamoDB tables
import { DynamoDBClient, ListTablesCommand, DescribeTableCommand } from '@aws-sdk/client-dynamodb';

const client = new DynamoDBClient({});

async function checkTables() {
  const { TableNames } = await client.send(new ListTablesCommand({}));
  
  console.log('All tables:');
  for (const tableName of TableNames) {
    const { Table } = await client.send(new DescribeTableCommand({ TableName: tableName }));
    console.log(`- ${tableName}: ${Table.ItemCount} items`);
  }
}

checkTables().catch(console.error);
