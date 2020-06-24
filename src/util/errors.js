export const errors = [
  {
    errorCode: 1,
    errorType: 'error',
    errorMessage: '{field} is required',
  },
  {
    errorCode: 2,
    errorType: 'error',
    errorMessage: '{field} is not allowed',
  },
  {
    errorCode: 3,
    errorType: 'error',
    errorMessage: '{field} fails to match the required pattern',
  },
  {
    errorCode: 4,
    errorType: 'error',
    errorMessage: '{field} must be a {fieldType}',
  },
  {
    errorCode: 5,
    errorType: 'error',
    errorMessage:
      '{field} length must be less than or equal to {maxLength} characters long',
  },
  {
    errorCode: 6,
    errorType: 'error',
    errorMessage: '{field} length must be at least {minLength} characters long',
  },
  {
    errorCode: 7,
    errorType: 'error',
    errorMessage: '{field} must be larger than or equal to {minValue}',
  },
  {
    errorCode: 8,
    errorType: 'error',
    errorMessage: '{field} must be less than or equal to {maxValue}',
  },
  {
    errorCode: 9,
    errorType: 'error',
    errorMessage: '{field} is not allowed to be empty',
  },
  {
    errorCode: 10,
    errorType: 'error',
    errorMessage: `You don't have a valid user profile to this company`,
  },
  {
    errorCode: 11,
    errorType: 'error',
    errorMessage: `You don't have permissions to view another user's permissions `,
  },
  {
    errorCode: 12,
    errorType: 'error',
    errorMessage: `You don't have permissions to this company`,
  },
  {
    errorCode: 13,
    errorType: 'error',
    errorMessage: `You can't change this user's profile`,
  },
  {
    errorCode: 14,
    errorType: 'error',
    errorMessage: `You have an admin profile, you can't delete your own permissions`,
  },
  {
    errorCode: 15,
    errorType: 'error',
    errorMessage: `You can't update this permission`,
  },
  {
    errorCode: 16,
    errorType: 'error',
    errorMessage: `The requested permission {requestedPermission} does not exist`,
    tagTemplate: () => {
      return template`The requested permission  {${'requestedPermission'}} does not exist`;
    },
  },
  {
    errorCode: 17,
    errorType: 'error',
    errorMessage: `You dont have permission to access {requestedPermission}`,
    tagTemplate: () => {
      return template`You don't have permission to access {${'requestedPermission'}}`;
    },
  },
];

export const ErrorsNum = {
  InvalidUserProfile: 10,
  CantViewAnotherUserPermissions: 11,
  UserDontHavePermissions: 12,
  CantChangeUserProfile: 13,
  CantDeletePermission: 14,
  CantUpdatePermissionRule: 15,
  UnexistentUserPermission: 16,
  MissingUserPrivileges: 17,
};

function template(strings, ...keys) {
  return function(...values) {
    var dict = values[values.length - 1] || {};
    var result = [strings[0]];
    keys.forEach(function(key, i) {
      var value = Number.isInteger(key) ? values[key] : dict[key];
      result.push(value, strings[i + 1]);
    });
    return result.join('');
  };
}

export function getFormattedError(
  field = null,
  data = null,
  errorCode,
  tagStringsVariables = null
) {
  let error = errors.find(error => {
    return error.errorCode === errorCode;
  });

  let tagTemplateError;

  if (tagStringsVariables) {
    const stringOutputClosure = error.tagTemplate();
    const errorMessage = stringOutputClosure(...tagStringsVariables);

    tagTemplateError = Object.assign(
      {},
      {
        errorCode: error.errorCode,
        errorType: error.errorType,
        errorMessage,
      }
    );
    if (field) tagTemplateError.field = field;
    if (data) tagTemplateError.fieldValue = data;
  }

  if (!tagTemplateError) {
    let staticError = {
      ...error,
    };
    if (field) staticError.field = field;
    if (data) staticError.fieldValue = data;
    return staticError;
  }
  return tagTemplateError;
}
