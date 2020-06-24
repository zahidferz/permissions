const jwt = require('jsonwebtoken');

const lg = require('debug')('login');

if (process.env.NODE_ENV !== 'production') {
  require('dotenv').config();
}

const processHeaders = async (req, res) => {
  const auth = req.headers.authorization;
  lg('req.headers.authorization', req.headers.authorization);
  try {
    let auth_type = auth.split(' ')[0];
    let auth_token = auth.split(' ')[1];
    if (auth_type !== 'Bearer') {
      lg('auth_type !== "Bearer"');
      return res.status(401).send();
    }
    if (auth_token === '') {
      lg('auth_token !== ""');
      return res.status(401).send();
    }
    return { auth_type, auth_token };
  } catch (error) {
    lg('Login.processHeaders.error', error);
    return res.status(401).send();
  }
};

export const getCredentials = async (req, res, next) => {
  try {
    const { auth_type, auth_token } = await processHeaders(req, res);
    // const oauth = new OAuthAPI();
    // const user = await oauth.introspect(auth_token);
    const user = jwt.decode(auth_token);
    lg('getCredentials.user', user);
    if (!user) {
      return res.status(401).send();
    }
    var unixTime = Math.round(+(new Date() / 1000));
    if (user.exp <= unixTime) {
      return res.status(401).send();
    }
    if (user.gty === 'client-credentials') {
      res.locals.auth = {
        user: user,
      };
      next();
    } else {
      if (user && user['https://user_metadata/']) {
        res.locals.auth = {
          userNumber: parseInt(user['https://user_metadata/'].userNumber),
        };
        next();
      } else {
        //NOTE: Needed for user not found or valid token
        return res.status(401).send();
      }
    }
  } catch (error) {
    lg('Login.getCredentials.error', error);
    return res.status(401).send();
  }
};
