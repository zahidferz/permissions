const cacheManager = require('../util/cacheManager');

class ProfileModel {
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
    const partitionKey = { kind: 'Hash', paths: ['/profile'] };
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

  async findProfile(body) {
    if (!this.container) {
      throw new Error('Collection is not initialized.');
    }

    const profile = body.profile;

    const cacheHit = cacheManager.profile.get(profile);

    if (!cacheHit) {
      // console.log("ProfileModel.findProfile.profile", profile);
      const query =
        'SELECT c.id, c.profile, c.permissions ' +
        'FROM c WHERE c.profile=@profile';
      //console.log("ProfileModel.findProfile.query", query);
      const querySpec = {
        query: query,
        parameters: [
          {
            name: '@profile',
            value: profile,
          },
        ],
      };
      const options = {
        enableCrossPartitionQuery: true,
      };
      const { result: results } = await this.container.items
        .query(querySpec, options)
        .toArray();
      // console.log('ProfileModel.findProfile result: ' + JSON.stringify(results));
      // Save it on cache after db lookup
      const cacheSaveSuccess = cacheManager.profile.set(profile, results);
      if (!cacheSaveSuccess)
        throw new Error(
          'Cant save newly requested profile to local memory cache'
        );
      return results;
    }
    return cacheHit;
  }

  //NOTE: Only for initialize_db
  async __insertProfile(body) {
    const { body: reg } = await this.container.items.create(body);
    return reg;
  }

  async __deleteProfile(body) {
    await this.container.item(body.id, `${body.profile}`).delete(body);
    return true;
  }
}

module.exports = ProfileModel;
