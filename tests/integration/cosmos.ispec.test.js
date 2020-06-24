require('@babel/polyfill');
const https = require('https');

jest.setTimeout(50000);

require('dotenv').config();

const config = require('../../src/config');
const CosmosClient = require('@azure/cosmos').CosmosClient;
const ProfileModel = require('../../src/models/ProfileModel');

const cosmosClient = new CosmosClient({
  endpoint: config.database_host,
  auth: {
    masterKey: config.database_auth_key,
  },
  /* to avoid error: self signed certificate*/
  agent: new https.Agent({ rejectUnauthorized: false }),
});

const profileModel = new ProfileModel(
  cosmosClient,
  config.database_name,
  config.container_profile_name
);

const testCosmosConnection = async () => {
  await profileModel
    .init(err => {
      console.error(err);
    })
    .catch(err => {
      throw err;
    });
  expect(profileModel.container).not.toBeNull();
};

describe('Integration Test: COSMOS connection', () => {
  it('testCosmosConnection', testCosmosConnection);
});
