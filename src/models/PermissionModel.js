const CosmosClient = require('@azure/cosmos').CosmosClient;
const redis = require('redis');
const config = require('../config');
const cacheManager = require('../util/cacheManager');

class PermissionModel {
  /**
   * Manages reading, adding, and updating permissions in Cosmos DB
   * @param {CosmosClient} cosmosClient
   * @param {string} databaseId
   * @param {string} containerId
   */
  constructor(cosmosClient, databaseId, containerId) {
    this.client = cosmosClient;
    this.databaseId = databaseId;
    this.collectionId = containerId;
    this.database = null;
    this.container = null;
  }

  async init() {
    const databaseOptions = {
      offerThroughput: 400,
    };
    const containerOptions = {
      offerThroughput: 100,
    };
    const partitionKey = { kind: 'Hash', paths: ['/companyNumber'] };
    const dbResponse = await this.client.databases.createIfNotExists(
      {
        id: this.databaseId,
      },
      databaseOptions
    );
    this.database = dbResponse.database;
    const coResponse = await this.database.containers.createIfNotExists({
      id: this.collectionId,
      partitionKey,
      options: containerOptions,
    });
    this.container = coResponse.container;
  }

  async findPermission(body) {
    if (!this.container) {
      throw new Error('Collection is not initialized.');
    }
    const userNumber = body.userNumber;
    const companyNumber = body.companyNumber;
    const branchNumber = body.branchNumber;

    const cacheHit = cacheManager.permission.get(body);
    if (!cacheHit) {
      //console.log("PermissionModel.findPermission", userNumber, companyNumber, branchNumber);
      const query =
        'SELECT c.id, c.profile, c.userNumber, c.companyNumber, c.branchNumber, c.permissions, c.restricted ' +
        'FROM c WHERE c.userNumber=@userNumber AND c.companyNumber=@companyNumber' +
        (branchNumber !== undefined
          ? ' AND c.branchNumber=@branchNumber'
          : ' AND (c.branchNumber ?? 0) = 0');
      //console.log("PermissionModel.findPermission.query", query);
      const querySpec = {
        query: query,
        parameters: [
          { name: '@userNumber', value: userNumber },
          { name: '@companyNumber', value: companyNumber },
          { name: '@branchNumber', value: branchNumber },
        ],
      };
      const options = {
        enableCrossPartitionQuery: true,
      };
      const { result: result } = await this.container.items
        .query(querySpec, options)
        .toArray();
      //console.log('PermissionModel.findPermission result: ' + JSON.stringify(result));
      // Save it on cache after db lookup
      const cacheSaveSuccess = cacheManager.permission.set(body, result);
      if (!cacheSaveSuccess)
        throw new Error(
          'Cant save newly requested permission profile to local memory cache'
        );
      return result;
    }
    return cacheHit;
  }

  async insertPermission(body) {
    delete body.id;
    // console.log("PermissionModel.insertPermission.body", JSON.stringify(body));
    /*this.updateRedisPermissions(body);*/
    const { body: reg } = await this.container.items.create(body);
    delete reg._rid;
    delete reg._self;
    delete reg._etag;
    delete reg._attachments;
    delete reg._ts;
    return reg;
  }

  async updatePermission(body) {
    const { body: reg } = await this.container.item(body.id).replace(body);
    cacheManager.permission.delete(body);
    delete reg._rid;
    delete reg._self;
    delete reg._etag;
    delete reg._attachments;
    delete reg._ts;
    /*this.updateRedisPermissions(body);*/
    return reg;
  }

  async deletePermission(body) {
    await this.container.item(body.id).delete(body);
    // this.updateRedisPermissions(body);
    return true;
  }

  /*
  async updateRedisPermissions(body) {
    const redisClient = redis.createClient(
      process.env.REDIS_CACHE_PORT,
      process.env.REDIS_CACHE_HOSTNAME,
      config.redis_config
    );
    redisClient.on("error", err => {
      console.error(err.stack);
      throw err;
    });
    const permissions = body.permissions;
    Object.keys(permissions).forEach(function(key) {
      let _k = `${body.userNumber}.${body.companyNumber}.${
        body.branchNumber
      }.${key}`;
      //console.log(_k);
      redisClient.set(_k, permissions[key]);
    });
    redisClient.quit();
  }*/
}

module.exports = PermissionModel;
