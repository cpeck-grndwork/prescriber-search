import { defineBackend } from '@aws-amplify/backend';
import { data } from './data/resource.js';
import { csvImporter } from './functions/csv-importer/resource.js';

export const backend = defineBackend({
  data,
  csvImporter,
});
