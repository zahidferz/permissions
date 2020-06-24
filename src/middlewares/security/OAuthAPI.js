const fetch = require("node-fetch");

export class OAuthAPI {

  constructor() {
    this.baseURL = process.env.OAUTH_URL;
  }

  async introspect(token) {
    const body = `{"id_token":"${token}"}`;
    const headers = {
      "content-type": "application/json"
    };
    const url = this.baseURL + '/introspect/';
    const options = {
      method: "POST",
      headers,
      body,
    };
    const data = await fetch(url, options)
      .then(function (response) {
        if(response.status !== 401){
          return response.json();
        }
        return null;
      }).then(function (data) {
        return data;
      });
    //console.log('OAuthAPI.introspect.data', data);
    return data;
  }
}
