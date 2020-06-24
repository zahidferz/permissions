import { ErrorCode } from './getErrorCode';

const Joi = require('joi');
const debug = require('debug')('validator');

function Validate(data, schema) {
  const result = Joi.validate(data, schema, { abortEarly: false });
  const errors = [];
  if (result.error) {
    const errorCodeModel = new ErrorCode();
    const details = result.error.details;
    for (let i = 0; i < details.length; i++) {
      let errorMessage = null;
      let getError = errorCodeModel.getErrorCode(details[i]);
      if (details[i].type === 'string.regex.base') {
        errorMessage = result.error.details[0].message
          .split(':')[0]
          .replace(/\bwith value\b\s"([^\\"]|\\")*"\s/, '');
      } else {
        errorMessage = getError.errorMessage;
      }
      errorMessage = errorMessage.replace(/['"]+/, '{');
      errorMessage = errorMessage.replace(/['"]+/, '}');
      let error = {
        field: details[i].path[0],
        fieldValue: details[i].context.value,
        errorCode: getError.errorCode,
        errorType: 'error',
        errorMessage,
      };
      errors.push(error);
    }
    return {
      message: 'Validation error',
      errors: errors,
      microservice: 'gx-boa-ms-permissions',
    };
  }
  return null;
}

export class ProfileValidator {
  validateGetProfile(data) {
    const schema = Joi.object().keys({
      profile: Joi.string()
        .valid(
          'administrator',
          'operator',
          'cashier',
          'accountant',
          'restricted'
        )
        .required(),
    });
    return Validate(data, schema);
  }
}
