require('@babel/polyfill');
const https = require('https');

jest.setTimeout(50000);

require('dotenv').config();

const config = require('../../src/config');
const CosmosClient = require('@azure/cosmos').CosmosClient;
const ProfileModel = require('../../src/models/ProfileModel');
const PermissionModel = require('../../src/models/PermissionModel');
const PermissionProfileModel = require('../../src/models/PermissionProfileModel');
const cacheManager = require('../../src/util/cacheManager');

cacheManager.initCacheClient({ ttl: 3600, checkExpired: 120 });

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

const permissionProfileModel = new PermissionProfileModel(
  cosmosClient,
  config.database_name,
  config.container_permissions_profile_name
);

const permissionModel = new PermissionModel(
  cosmosClient,
  config.database_name,
  config.container_permissions_name
);

const testFindProfiles = async () => {
  const profiles = [
    'accountant',
    'administrator',
    'cashier',
    'operator',
    'restricted',
  ];
  for (const profile of profiles) {
    await profileModel
      .init(/* err => {
        console.error(err);
      } */)
      .catch(err => {
        throw err;
      });
    const body = {
      profile: profile,
    };
    const result = await profileModel.findProfile(body);
    expect(profileModel.container).not.toBeNull();
    expect(result).not.toBeNull();
    expect(result.length).toBeGreaterThan(0);
    expect(result[0].profile).toBe(profile);
  }
};

describe('Integration Test: COSMOS connection', () => {
  it(
    '(testFindProfiles) Find profiles for: "accountant", "administrator", "cashier", "operator", "restricted"',
    testFindProfiles
  );
});
