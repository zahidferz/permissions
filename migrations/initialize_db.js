const CosmosClient = require('@azure/cosmos').CosmosClient;

const config = require('../src/config');
const ProfileModel = require('../src/models/ProfileModel');
const PermissionModel = require('../src/models/PermissionModel');
const PermissionProfileModel = require('../src/models/PermissionProfileModel');
const cacheManager = require('../src/util/cacheManager');
const fs = require('fs');

const init = async () => {
  try {
    const cosmosClient = new CosmosClient({
      endpoint: config.database_host,
      auth: {
        masterKey: config.database_auth_key,
      },
    });
    const profileModel = new ProfileModel(
      cosmosClient,
      config.database_name,
      config.container_profile_name
    );
    cacheManager.initCacheClient({ ttl: 3600, checkExpired: 120 });
    await profileModel
      .init(/* err => {
        console.error(err);
      } */)
      .catch(err => {
        throw err;
      });
    const permissionProfileModel = new PermissionProfileModel(
      cosmosClient,
      config.database_name,
      config.container_permissions_profile_name
    );
    await permissionProfileModel
      .init(/* err => {
        console.error(err);
      } */)
      .catch(err => {
        throw err;
      });

    const permissionModel = new PermissionModel(
      cosmosClient,
      config.database_name,
      config.container_permissions_name
    );
    await permissionModel
      .init(/* err => {
        console.error(err);
      } */)
      .catch(err => {
        throw err;
      });
    const arr_profiles = [
      'administrator',
      'operator',
      'accountant',
      'cashier',
      'restricted',
    ];
    arr_profiles.forEach(function(elem_profile) {
      let file_json = fs.readFileSync(
        __dirname.concat(`/${elem_profile}.json`),
        'utf8'
      );
      let body = {
        profile: elem_profile,
      };
      profileModel.findProfile(body).then(existProfile => {
        //console.log('existProfile', existProfile);
        existProfile.forEach(async function(existProf) {
          try {
            profileModel.__deleteProfile(existProf).then(delProf => {
              console.log('Deleting profile: ', existProf.profile);
            });
          } catch (err) {}
        });
        console.log('Inserting profile', elem_profile);
        profileModel.__insertProfile(JSON.parse(file_json));
      });
    });
  } catch (error) {
    console.log(error);
  }
};

init();
