require('@babel/polyfill');
jest.setTimeout(50000);
require('dotenv').config();

const processEnv = [
  'PORT',
  'DATABASE_HOST',
  'DATABASE_AUTH_KEY',
  'DATABASE_NAME',
  'CONTAINER_PROFILE_NAME',
  'CONTAINER_PERMISSIONS_NAME',
  'CONTAINER_PERMISSIONS_PROFILE_NAME',
  'OAUTH_URL',
];

const testNotEmptyEnvs = async () => {
  for (let index = 0; index < processEnv.length; index++) {
    let environmentVar = process.env[processEnv[index]];
    console.log(processEnv[index], environmentVar);
    expect(environmentVar).not.toBeNull();
    expect(environmentVar).not.toBeUndefined();
    expect(environmentVar.length).toBeGreaterThanOrEqual(1);
  }
};

describe('Integration Test: Process Env are not Empty', () => {
  it('Test Process Env are not empty?', testNotEmptyEnvs);
});
