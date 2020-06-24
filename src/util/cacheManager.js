const NodeCache = require('node-cache');
const lg = require('debug')('permissions');
let localCache;

/*
  Getters
*/

function getPermissionProfileFromCache(body) {
  let keyString = body.branchNumber
    ? `permission_profiles_${body.companyNumber}_${body.branchNumber}_${body.userNumber}`
    : `permission_profiles_${body.companyNumber}_${body.userNumber}`;

  return localCache.get(keyString);
}

function getProfileFromCache(profileName) {
  let keyString = `profiles_${profileName}`;
  return localCache.get(keyString);
}

function getPermissionFromCache(body) {
  let keyString = body.branchNumber
    ? `permission_${body.companyNumber}_${body.branchNumber}_${body.userNumber}`
    : `permission_${body.companyNumber}_${body.userNumber}`;
  return localCache.get(keyString);
}

/*
  Setters
*/

function setPermissionProfileOnCache(body, result) {
  let keyString = body.branchNumber
    ? `permission_profiles_${body.companyNumber}_${body.branchNumber}_${body.userNumber}`
    : `permission_profiles_${body.companyNumber}_${body.userNumber}`;

  return localCache.set(keyString, result);
}

function setProfileOnCache(profileName, payload) {
  let keyString = `profiles_${profileName}`;
  return localCache.set(keyString, payload);
}

function setPermissionOnCache(body, payload) {
  let keyString = body.branchNumber
    ? `permission_${body.companyNumber}_${body.branchNumber}_${body.userNumber}`
    : `permission_${body.companyNumber}_${body.userNumber}`;
  return localCache.get(keyString, payload);
}

/*
  Delete
*/

function deletePermissionProfileFromCache(user) {
  let keyString = user.branchNumber
    ? `permission_profiles_${user.companyNumber}_${user.branchNumber}_${user.userNumber}`
    : `permission_profiles_${user.companyNumber}_${user.userNumber}`;

  lg(`Deleting keyString '${keyString}'...`);
  lg(localCache.get(keyString));
  const deleted = localCache.del(keyString);
  lg('Deletion result');
  lg(deleted);
  lg('Validating if keyString has been deleted');
  lg(localCache.get(keyString));

  return deleted;
}
function deleteProfileFromCache() {}

function deletePermissionFromCache(body) {
  let keyString = body.branchNumber
    ? `permission_${body.companyNumber}_${body.branchNumber}_${body.userNumber}`
    : `permission_${body.companyNumber}_${body.userNumber}`;
  return localCache.del(keyString);
}

function initCacheClient({ ttl, checkExpired }) {
  localCache = new NodeCache({ stdTTL: ttl, checkperiod: checkExpired });
}

module.exports = {
  initCacheClient,
  permissionProfile: {
    get: getPermissionProfileFromCache,
    set: setPermissionProfileOnCache,
    delete: deletePermissionProfileFromCache,
  },
  profile: {
    get: getProfileFromCache,
    set: setProfileOnCache,
    delete: deleteProfileFromCache,
  },
  permission: {
    get: getPermissionFromCache,
    set: setPermissionOnCache,
    delete: deletePermissionFromCache,
  },
};
