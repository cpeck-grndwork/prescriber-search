import { defineFunction } from '@aws-amplify/backend';

export const csvImporter = defineFunction({
  name: 'csv-importer',
  timeoutSeconds: 900,
  memoryMB: 3008,
});
