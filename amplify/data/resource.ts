import { type ClientSchema, a, defineData } from '@aws-amplify/backend';

const schema = a.schema({
  Drug: a.model({
    genericName: a.string().required(),
    genericNameLower: a.string().required(),
  })
  .identifier(['genericName'])
  .secondaryIndexes((index: any) => [
    index('genericNameLower'),
  ])
  .authorization((allow: any) => [allow.publicApiKey()]),

  Prescriber: a.model({
    npi: a.string().required(),
    prescriberName: a.string().required(),
    prescriberNameLower: a.string(),
    city: a.string(),
    state: a.string(),
    prescriberType: a.string(),
  })
  .identifier(['npi'])
  .secondaryIndexes((index) => [
    index('prescriberNameLower'),
  ])
  .authorization((allow) => [allow.publicApiKey()]),
  
  Prescription: a.model({
    npi: a.string().required(),
    prescriberName: a.string().required(),
    city: a.string(),
    state: a.string(),
    prescriberType: a.string(),
    brandName: a.string().required(),
    genericName: a.string().required(),
    genericNameLower: a.string(),
    totalClaims: a.integer(),
    totalBeneficiaries: a.integer(),
    totalDrugCost: a.float(),
    totalDaySupply: a.integer(),
  })
  .secondaryIndexes((index: any) => [
    index('npi'),
    index('genericNameLower').sortKeys(['totalClaims']),
    index('brandName').sortKeys(['totalClaims']),
  ])
  .authorization((allow: any) => [allow.publicApiKey()]),
});

export type Schema = ClientSchema<typeof schema>;
export const data = defineData({
  schema,
  authorizationModes: {
    defaultAuthorizationMode: 'apiKey',
    apiKeyAuthorizationMode: {
      expiresInDays: 30,
    },
  },
});
