const CosmosClient = require('@azure/cosmos').CosmosClient;
const lg = require('debug')('permissions');
const cacheManager = require('../util/cacheManager');

class PermissionProfileModel {
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

  async findPermissionProfile(body) {
    if (!this.container) {
      throw new Error('Collection is not initialized.');
    }
    const userNumber = body.userNumber;
    const companyNumber = body.companyNumber;
    const branchNumber = body.branchNumber;
    lg('PermissionProfile to look for');
    lg(JSON.stringify(body, null, 2));
    // Lookup for permision profile on cache
    const cacheHit = cacheManager.permissionProfile.get(body);
    lg('PermissionProfile found in cache');
    lg(JSON.stringify(cacheHit, null, 2));

    try {
      if (!cacheHit) {
        // console.log("PermissionProfileModel.findPermissionProfile", userNumber, companyNumber, branchNumber);
        const query =
          'SELECT c.id, c.userNumber, c.companyNumber, c.branchNumber, c.profile, c.restricted' +
          ' FROM c WHERE c.userNumber=@userNumber AND c.companyNumber=@companyNumber' +
          (branchNumber !== undefined
            ? ' AND c.branchNumber=@branchNumber'
            : ' AND (c.branchNumber ?? 0) = 0');
        //console.log("PermissionProfileModel.findPermissionProfile.query", query);
        const querySpec = {
          query: query,
          parameters: [
            {
              name: '@userNumber',
              value: userNumber,
            },
            {
              name: '@companyNumber',
              value: companyNumber,
            },
            {
              name: '@branchNumber',
              value: branchNumber,
            },
          ],
        };
        const options = {
          enableCrossPartitionQuery: true,
        };
        const { result: result } = await this.container.items
          .query(querySpec, options)
          .toArray();
        // console.log('PermissionProfileModel.findPermissionProfile result: ' + JSON.stringify(result));

        // Save it on cache after db lookup

        if (Array.isArray(result) && result.length > 0) {
          const cacheSaveSuccess = cacheManager.permissionProfile.set(
            body,
            result
          );
          if (!cacheSaveSuccess)
            throw new Error(
              'Cant save newly requested permission profile to local memory cache'
            );
        }
        return result;
      }
      return cacheHit;
    } catch (error) {
      throw error;
    }
  }
  /**
   * Gets all PermisionProfile records for the company given.
   * @param {*} param0
   */
  async permissionProfilesByCompany({ companyNumber }) {
    if (!this.container) {
      throw new Error('Collection is not initialized.');
    }
    //const companyNumber = body.companyNumber;
    lg(
      'PermissionProfile.permissionProfilesByCompany.companyNumber',
      companyNumber
    );
    const query =
      'SELECT c.id, c.companyNumber, c.branchNumber, c.userNumber, c.profile, c.restricted ' +
      'FROM c WHERE c.companyNumber=@companyNumber';
    lg('PermissionProfile.permissionProfilesByCompany.query', query);
    const querySpec = {
      query: query,
      parameters: [
        {
          name: '@companyNumber',
          value: companyNumber,
        },
      ],
    };
    const options = {
      enableCrossPartitionQuery: true,
    };
    const { result: results } = await this.container.items
      .query(querySpec, options)
      .toArray();
    lg(
      'PermissionProfile.profilesByCompany result: ' + JSON.stringify(results)
    );
    return results;
  }
  /**
   * Gets all users and their profile in a company.
   * @param {*} param0
   */
  async profilesByCompany({ companyNumber }) {
    if (!this.container) {
      throw new Error('Collection is not initialized.');
    }
    //const companyNumber = body.companyNumber;
    lg('PermissionProfile.profilesByCompany.companyNumber', companyNumber);
    const query =
      'SELECT DISTINCT c.companyNumber, c.userNumber, c.profile ' +
      'FROM c WHERE c.companyNumber=@companyNumber';
    lg('PermissionProfile.profilesByCompany.query', query);
    const querySpec = {
      query: query,
      parameters: [
        {
          name: '@companyNumber',
          value: companyNumber,
        },
      ],
    };
    const options = {
      enableCrossPartitionQuery: true,
    };
    const { result: results, ...rest } = await this.container.items
      .query(querySpec, options)
      .toArray();
    lg(
      'PermissionProfile.profilesByCompany result: ' + JSON.stringify(results)
    );
    return results;
  }

  async insertPermissionProfile(item) {
    const { body } = await this.container.items.create(item);
    const { _rid, _self, _etag, _attachments, _ts, ...reg } = body;
    // delete reg._rid;
    // delete reg._self;
    // delete reg._etag;
    // delete reg._attachments;
    // delete reg._ts;
    return reg;
  }

  async updateExistentPermissionProfile(body) {
    const { body: _body } = await this.container.item(body.id).replace(body);
    const { _rid, _self, _etag, _attachments, _ts, ...reg } = _body;
    cacheManager.permissionProfile.delete(body);

    return reg;
  }

  async updatePermissionProfile(body) {
    lg('updatePermissionProfile: Data for update');
    lg(body);
    const existsProfile = await this.findPermissionProfile(body);
    let permProf = null;
    if (existsProfile.length > 0) {
      permProf = existsProfile[0];
      body.id = permProf.id;
      lg(`Updating profile for user ${body.userNumber} with id ${body.id}`);
      const { body: _body } = await this.container.item(body.id).replace(body);
      const { _rid, _self, _etag, _attachments, _ts, ...reg } = _body;
      cacheManager.permissionProfile.delete(body);
      // delete reg._rid;
      // delete reg._self;
      // delete reg._etag;
      // delete reg._attachments;
      // delete reg._ts;
      return reg;
    } else {
      lg(`Inserting profile for user ${body.userNumber}`);
      return (permProf = await this.insertPermissionProfile(body));
    }
  }

  async deletePermissionProfile(item) {
    await this.container.item(item.id, item.companyNumber).delete(item);
    //FIXME: Remover de cache. Se necesita verificar que item contenga la info necesaria p identificarlo en cache.
    return true;
  }

  async findHowManyAdministratorProfiles(body) {
    if (!this.container) {
      throw new Error('Collection is not initialized.');
    }
    const profileName = 'administrator';
    const userNumber = body.userNumber;
    const companyNumber = body.companyNumber;
    const branchNumber = body.branchNumber;
    // console.log("PermissionProfileModel.findPermissionProfile", userNumber, companyNumber, branchNumber);
    const query =
      'SELECT c.id, c.userNumber, c.companyNumber, c.branchNumber, c.profile' +
      ' FROM c WHERE c.userNumber !=@userNumber AND c.profile=@profileName AND c.companyNumber=@companyNumber' +
      (branchNumber !== undefined
        ? ' AND c.branchNumber=@branchNumber'
        : ' AND (c.branchNumber ?? 0) = 0');
    //console.log("PermissionProfileModel.findPermissionProfile.query", query);
    const querySpec = {
      query: query,
      parameters: [
        {
          name: '@userNumber',
          value: userNumber,
        },
        {
          name: '@profileName',
          value: profileName,
        },
        {
          name: '@companyNumber',
          value: companyNumber,
        },
        {
          name: '@branchNumber',
          value: branchNumber,
        },
      ],
    };
    const options = {
      enableCrossPartitionQuery: true,
    };
    const { result: result } = await this.container.items
      .query(querySpec, options)
      .toArray();
    // console.log('PermissionProfileModel.findPermissionProfile result: ' + JSON.stringify(result));
    return result;
  }
}

module.exports = PermissionProfileModel;
