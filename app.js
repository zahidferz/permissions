if (process.env.NODE_ENV !== 'production') {
  require('dotenv').config();
}
require('newrelic');
const config = require('./src/config');
if (process.env.APPINSIGHTS_INSTRUMENTATIONKEY) {
  const appInsights = require('applicationinsights');
  appInsights
    .setup(process.env.APPINSIGHTS_INSTRUMENTATIONKEY)
    .setSendLiveMetrics(true);

  appInsights.defaultClient.context.tags['ai.cloud.role'] =
    'gx-boa-ms-permissions';
  appInsights.defaultClient.context.tags['ai.cloud.roleInstance'] =
    'gx-boa-ms-permissions';

  appInsights.start();
}
require('@babel/polyfill');
const swaggerUi = require('swagger-ui-express');
const YAML = require('yamljs');

const CosmosClient = require('@azure/cosmos').CosmosClient;
const Profile = require('./src/routes/Profile');
const ProfileModel = require('./src/models/ProfileModel');

const Permission = require('./src/routes/Permission');
const PermissionModel = require('./src/models/PermissionModel');

const PermissionProfile = require('./src/routes/PermissionProfile');
const PermissionProfileModel = require('./src/models/PermissionProfileModel');

const express = require('express');
const bodyParser = require('body-parser');
// const cors = require("cors");
const lg = require('debug')('permissions');
const Sentry = require('@sentry/node');

const { getCredentials } = require('./src/middlewares/security/Login');
const cacheManager = require('./src/util/cacheManager');
const unless = require('express-unless');
const app = express();

const winston = require('winston');
const winstonOptions = {
  format: winston.format.json(),
  transports: [
    new winston.transports.Console(),
    new winston.transports.File({ filename: 'errors.log' }),
  ],
};
const logger = new winston.createLogger(winstonOptions);

// Start the node-cache instance
cacheManager.initCacheClient({ ttl: 3600, checkExpired: 120 });
// Sentry logger
Sentry.init({ dsn: process.env.SENTRY_DSN });
app.use(Sentry.Handlers.requestHandler());

app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));
const swaggerDocument = YAML.load('./swagger.yaml');

app.use('/docs', swaggerUi.serve, swaggerUi.setup(swaggerDocument));

//index.htm page
app.get('/', (req, res, next) =>
  res.send({
    name: process.env.NAMET,
    version: process.env.VERSIONT,
    commit: process.env.COMMITT,
    date: process.env.DATET,
  })
);

lg('config', config);
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

const profile = new Profile(profileModel);
profileModel.init().catch((err) => {
  throw err;
});

const permissionProfile = new PermissionProfile(
  permissionProfileModel,
  permissionModel,
  profileModel
);
permissionProfileModel.init().catch((err) => {
  throw err;
});

const permission = new Permission(
  permissionModel,
  profileModel,
  permissionProfileModel
);
permissionModel.init().catch((err) => {
  throw err;
});
let _getCredentials = getCredentials;
// @ts-ignore
_getCredentials.unless = unless;
// Middlewares
// app.use(getCredentials);
app.use(
  //No validar credenciales para las regex paths siguientes
  //OJO: unless no acepta la notacion de tokens de express para paths. Por eso se usa regex
  // @ts-ignore
  _getCredentials.unless({
    path: [
      /^\/company\/[0-9]+\/restrict_users_permissions/i,
      /^\/company\/[0-9]+\/unrestrict_users_permissions/i,
    ],
  })
);

app.post('/profiles', getCredentials, (req, res, next) => {
  lg('/profiles');
  profile.getProfile(req, res).catch(next);
});

app.post('/set_user_profile', getCredentials, (req, res, next) => {
  const userNumber = res.locals.auth.userNumber;
  permissionProfile.setPermissionProfile(req, res, userNumber).catch(next);
});

app.post(
  '/company/:companyNumber/restrict_users_permissions',
  (req, res, next) => {
    permissionProfile.restrictPermissionsForCompanyUsers(req, res).catch(next);
  }
);

app.post(
  '/company/:companyNumber/unrestrict_users_permissions',
  (req, res, next) => {
    permissionProfile
      .unrestrictPermissionsForCompanyUsers(req, res)
      .catch(next);
  }
);

app.get('/company/:companyNumber/users/', getCredentials, (req, res, next) => {
  permissionProfile.getUsersByCompany(req, res).catch(next);
});

app.delete('/permissions', getCredentials, (req, res, next) => {
  const userNumber = res.locals.auth.userNumber;
  permission.deletePermission(req, res, userNumber).catch(next);
});

app.post('/permissions', getCredentials, (req, res, next) => {
  const userNumber = res.locals.auth.userNumber;
  permission.getPermission(req, res, userNumber).catch(next);
});

app.patch('/permissions', getCredentials, (req, res, next) => {
  const userNumber = res.locals.auth.userNumber;
  permission.updatePermission(req, res, userNumber).catch(next);
});

// catch 404 and forward to error handler
app.use(function (req, res, next) {
  const err = new Error('Not Found');
  // @ts-ignore
  err.status = 404;
  return res.status(err.status).send(err);
});

// error handler
app.use(Sentry.Handlers.errorHandler());

// Validación de envs
const processEnvs = [
  'PORT',
  'DATABASE_HOST',
  'DATABASE_AUTH_KEY',
  'DATABASE_NAME',
  'CONTAINER_PROFILE_NAME',
  'CONTAINER_PERMISSIONS_NAME',
  'CONTAINER_PERMISSIONS_PROFILE_NAME',
  'OAUTH_URL',
];
let envNulls = [];
for (let env of processEnvs) {
  // console.log(env, process.env[env]);
  if (!process.env[env] || process.env[env] === '') {
    envNulls.push(env);
  }
}
if (envNulls.length) {
  throw new Error(
    'The following enviroment variables are missing:\n' + envNulls
  );
}

const port = process.env.PORT || '80';
app.listen(port, function () {
  console.log(`Listening on http://localhost:${port}`);
});

module.exports = app;
