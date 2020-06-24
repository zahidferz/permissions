const axios = require('axios');
import NodeCache from 'node-cache';
const debug = require('debug')('cache');

const ttlSeconds = 3600; // 1 hra.
const cache = new NodeCache({
  stdTTL: ttlSeconds,
  checkperiod: ttlSeconds * 0.2,
  useClones: false,
});

export async function slackSendMessage(error, req, res) {
  if (process.env.DOCKER_CUSTOM_IMAGE_NAME) {
    if (
      process.env.GX_ERRORS_500_CHAIN_WEBHOOK_URL &&
      process.env.GX_PROCESS_FUNCTIONS_URL
    ) {
      const value = cache.get(error.message);
      if (value) {
        // No envíar el mismo error sino hasta pasada 1 hra.
        return;
      }
      cache.set(error.message, error.stack);
      const url_webhook = process.env.GX_ERRORS_500_CHAIN_WEBHOOK_URL;
      const process_function_url = process.env.GX_PROCESS_FUNCTIONS_URL;
      const app_name = process.env.NEW_RELIC_APP_NAME;
      const request = axios.create({
        baseURL: process_function_url,
        timeout: 30000,
        headers: { 'Content-Type': 'application/json' },
      });
      let title = error.status || error.statusCode || 500;
      title = title.toString() + ' - ' + error.message;
      const body = {
        url_webhook: url_webhook,
        message: {
          text: app_name,
          attachments: [
            {
              title: title,
              text: error.stack,
              color: '#FF0000',
              thumb_url: '',
              fields: null,
              footer: '',
            }
          ],
        },
      };
      return request
        .post('', body)
        .then(function(response) {
          console.log('slackSendMessage.response.body', response.body);
        })
        .catch(function(error) {
          console.log('slackSendMessage.error', error);
        });
    }
  }
}
