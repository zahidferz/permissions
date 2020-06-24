// let redisConfig = null;

//TODO: What value for NODE_TLS_REJECT_UNAUTHORIZED in production?
if (!process.env.NODE_ENV || process.env.NODE_ENV === "development") {
  require("dotenv").config();
  // redisConfig = {
  //   auth_pass: process.env.REDIS_CACHE_KEY
  // };
} else {
  // const https = require("https");
  // redisConfig = {
  //   auth_pass: process.env.REDIS_CACHE_KEY,
  //   agent: new https.Agent({ rejectUnauthorized: false }),
  //   tls: {
  //     servername: process.env.REDIS_CACHE_HOSTNAME
  //   }
  // };
}

const config = {
  database_host: process.env.DATABASE_HOST,
  database_auth_key: process.env.DATABASE_AUTH_KEY,
  database_name: process.env.DATABASE_NAME,
  container_profile_name: process.env.CONTAINER_PROFILE_NAME || "Profiles",
  container_permissions_name:
    process.env.CONTAINER_PERMISSIONS_NAME || "Permissions",
  container_permissions_profile_name:
    process.env.CONTAINER_PERMISSIONS_PROFILE_NAME || "PermissionsProfile"
  // "redis_cache_hostname": process.env.REDIS_CACHE_HOSTNAME,
  // "redis_cache_key": process.env.REDIS_CACHE_KEY,
  // "redis_cache_port": process.env.REDIS_CACHE_PORT,
  // "redis_config": redisConfig
};

module.exports = config;
