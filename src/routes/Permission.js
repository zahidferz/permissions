import { filterPermissions } from './PermissionUtil';
import { filterNewPermissions } from './newPermissionsUtil';

import { PermissionValidator } from '../util/permissionValidator';

import { errors, ErrorsNum, getFormattedError } from '../util/errors';
import cacheManager from '../util/cacheManager';

import _, { merge } from 'lodash';
//const merge = require('lodash.merge');
const lg = require('debug')('permissions');

async function getPermissionsByUserNumber(_this, res, user, body, isOwnUser) {
  const existsProfile = await _this.PermissionProfileModel.findPermissionProfile(
    user
  );
  let permissions = null;
  if (existsProfile.length > 0) {
    //console.log("El perfil-permiso ya existe");
    const profile = existsProfile[0];
    let user = null;
    if (profile.profile === 'custom') {
      //console.log("El perfil-permiso es custom");
      permissions = await _this.PermissionModel.findPermission(profile);
      if (
        Object.keys(permissions[0].permissions).length === 0 &&
        permissions[0].permissions.constructor === Object
      ) {
        user = {
          permissions: permissions[0].permissions,
          profile,
        };
        return user;
      }
      user = {
        permissions,
        profile,
      };
      return user;
    }
    //console.log("El perfil-permiso NO es custom");
    permissions = await _this.ProfileModel.findProfile(profile);
    user = {
      permissions,
      profile,
    };
    return user;
  }
  //console.log("El perfil-permiso NO existe");
  if (!isOwnUser) {
    return permissions;
  }
  let newPermProf = {
    profile: 'custom',
    userNumber: body.userNumber,
    companyNumber: body.companyNumber,
  };
  if (body.branchNumber !== undefined) {
    newPermProf.branchNumber = body.branchNumber;
  }
  await _this.PermissionProfileModel.insertPermissionProfile(newPermProf);
  newPermProf.permissions = filterNewPermissions(
    body.permissions,
    body.branchNumber
  );
  permissions = await _this.PermissionModel.insertPermission(newPermProf);
  return res.send(permissions);
}
async function updatePermission(_this, updateUserPermissions, profile, body) {
  let newPermissions = filterNewPermissions(
    body.permissions,
    body.branchNumber
  );
  let updatePermissions = null;
  updatePermissions = updateUserPermissions[0];
  if (updatePermissions && updatePermissions.profile === 'custom') {
    //console.log("El perfil-permiso es custom");
    if (updatePermissions.permissions) {
      merge(updatePermissions.permissions, newPermissions);
      updatePermissions.userNumber = parseInt(body.userNumber);
      updatePermissions.companyNumber = parseInt(body.companyNumber);
      if (body.branchNumber !== undefined) {
        updatePermissions.branchNumber = parseInt(body.branchNumber);
      }
      updatePermissions = await _this.PermissionModel.updatePermission(
        updatePermissions
      );
      return updatePermissions;
    } else {
      //console.log("El usuario no tiene permisos");
      const bodyInsert = {
        userNumber: body.userNumber,
        companyNumber: body.companyNumber,
        permissions: newPermissions,
      };
      if (body.branchNumber !== undefined) {
        bodyInsert.branchNumber = body.branchNumber;
      }
      updatePermissions = await _this.PermissionModel.insertPermission(
        bodyInsert
      );
      return updatePermissions;
    }
  } else {
    if (profile) {
      updatePermissions = await _this.ProfileModel.findProfile(profile); // TODO: verificar que exista profile.profile
    }
    profile.profile = 'custom';
    await _this.PermissionProfileModel.updatePermissionProfile(profile);

    updatePermissions = filterPermissions(updatePermissions, body.branchNumber);
    updatePermissions = updatePermissions[0];
    merge(updatePermissions.permissions, newPermissions);
    updatePermissions.userNumber = parseInt(body.userNumber);
    updatePermissions.companyNumber = parseInt(body.companyNumber);
    if (body.branchNumber !== undefined) {
      updatePermissions.branchNumber = parseInt(body.branchNumber);
    }
    cacheManager.permissionProfile.delete(updatePermissions);
    updatePermissions.profile = 'custom';
    updatePermissions = await _this.PermissionModel.insertPermission(
      updatePermissions
    );
    return updatePermissions;
  }
}
async function updateUserPermissionsRules(
  _this,
  res,
  tokenPermissions,
  updatePermissions,
  body,
  profile
) {
  // BR: Para poder definir permisos a nivel sucursal se requiere
  // el permiso: "config.users.definebranchesPermissions"
  let updatingPerm = null;
  if (body.branchNumber) {
    if (updatePermissions !== undefined) {
      updatePermissions = filterPermissions(
        updatePermissions,
        body.branchNumber
      );
    }
    if (
      tokenPermissions[0].profile === 'administrator' ||
      tokenPermissions[0].permissions[
        'config.users.defineBranchesPermissions'
      ] === true
    ) {
      if (profile.profile === 'administrator') {
        // Valida cuantos administradores hay
        const numberOfAdmins = await _this.PermissionProfileModel.findHowManyAdministratorProfiles(
          body
        );
        if (numberOfAdmins.length < 1) {
          const error = errors.filter(obj => {
            return obj.errorCode === ErrorsNum.CantUpdatePermissionRule;
          });

          const errorData = [{ ...error[0] }];
          return res.status(403).send({
            message: 'Forbidden Error',
            errors: errorData,
            microservice: 'gx-boa-ms-permissions',
          });
        }
      }
      updatingPerm = await updatePermission(
        _this,
        updatePermissions,
        profile,
        body
      );
      return updatingPerm;
    } else {
      const error = errors.filter(obj => {
        return obj.errorCode === ErrorsNum.InvalidUserProfile;
      });
      const errorData = [{ ...error[0] }];
      return res.status(403).send({
        message: 'Forbidden Error',
        errors: errorData,
        microservice: 'gx-boa-ms-permissions',
      });
    }
  }
  // BR: Para poder definir permisos a nivel compañía se requiere
  // el permiso: "config.users.defineCompanyPermissions"
  if (
    tokenPermissions[0].permissions['config.users.defineCompanyPermissions'] ===
      true ||
    tokenPermissions[0].profile === 'administrator'
  ) {
    if (profile.profile === 'administrator') {
      //FIXME: Error if profile is null
      // Valida cuantos administradores hay
      const numberOfAdmins = await _this.PermissionProfileModel.findHowManyAdministratorProfiles(
        body
      );
      if (numberOfAdmins.length < 1 && profile.profile !== body.profile) {
        const error = errors.filter(obj => {
          return obj.errorCode === ErrorsNum.CantUpdatePermissionRule;
        });
        const errorData = [{ ...error[0] }];
        return res.status(403).send({
          message: 'Forbidden Error',
          errors: errorData,
          microservice: 'gx-boa-ms-permissions',
        });
      }
    }
    if (updatePermissions !== undefined) {
      updatePermissions = filterPermissions(
        updatePermissions,
        body.branchNumber
      );
    }
    updatingPerm = await updatePermission(
      _this,
      updatePermissions,
      profile,
      body
    );
    return updatingPerm;
  } else {
    const error = errors.filter(obj => {
      return obj.errorCode === ErrorsNum.InvalidUserProfile;
    });
    const errorData = [{ ...error[0] }];
    return res.status(403).send({
      message: 'Forbidden Error',
      errors: errorData,
      microservice: 'gx-boa-ms-permissions',
    });
  }
}

function findRequestedPermission(permissions, requestedPermission) {
  const permissionMatchFound = Object.keys(permissions).find(
    permission => permission === requestedPermission
  );

  let permission;

  permissionMatchFound
    ? (permission = {
        [permissionMatchFound]: permissions[`${permissionMatchFound}`],
      })
    : null;

  return permission;
}

function evaluatePermissionValidity(bodyRequestPermission, permissionResult) {
  if (!permissionResult) {
    const formattedError = getFormattedError(
      bodyRequestPermission,
      null,
      ErrorsNum.UnexistentUserPermission,
      [{ requestedPermission: bodyRequestPermission }]
    );

    return {
      message: 'Forbidden Error',
      errors: [formattedError],
      microservice: 'gx-boa-ms-permissions',
    };
  } else if (
    Object.values(permissionResult)[0] === false &&
    Object.keys(permissionResult).length > 0
  ) {
    const formattedError = getFormattedError(
      bodyRequestPermission,
      null,
      ErrorsNum.MissingUserPrivileges,
      [{ requestedPermission: bodyRequestPermission }]
    );

    return {
      message: 'Forbidden Error',
      errors: [formattedError],
      microservice: 'gx-boa-ms-permissions',
    };
  }
  return true;
}

class Permission {
  constructor(PermissionModel, ProfileModel, PermissionProfileModel) {
    /** @type {import("../models/PermissionModel")} */
    this.PermissionModel = PermissionModel;
    /** @type {import("../models/ProfileModel")} */
    this.ProfileModel = ProfileModel;
    /** @type {import("../models/PermissionProfileModel")} */
    this.PermissionProfileModel = PermissionProfileModel;
  }
  /**
   * Gets all permissions for the userNumber and companyNumber/branchNumber combination
   * @param {*} req
   * @param {*} res
   * @param {*} userNumber
   */
  async getPermission(req, res, userNumber) {
    const body = req.body;
    const validator = new PermissionValidator();
    const error = validator.validateGetPermission(body);
    if (error) {
      console.log('Permission.getPermission', error);
      return res.status(400).send(error);
    }
    //Validate body info vs userRequest
    // const ucbModel = new UserCompanyBranchModel(res.locals.SqlManager);
    // TODO: Eliminar cuando se termine de hacer la integración de user y companies
    // const existsUcb = await ucbModel.validateExistence(userNumber, body);
    // let validExistsUcb = filterUsersCompanyBranch(existsUcb, userNumber, body);
    // if (userNumber === body.userNumber) {
    //   if (!validExistsUcb) {
    //     return res.status(400).send();
    //   }
    // } else {
    //   if (!validExistsUcb || validExistsUcb.length < 1) {
    //     return res.status(400).send();
    //   }
    // }
    const userToken = {
      userNumber: userNumber,
      companyNumber: body.companyNumber,
    };
    if (body.branchNumber !== undefined) {
      userToken.branchNumber = body.branchNumber;
    }
    const existsProfile = await this.PermissionProfileModel.findPermissionProfile(
      userToken
    );
    if (existsProfile.length > 0) {
      const profile = existsProfile[0];
      let permissions = null;
      if (profile.profile === 'custom') {
        permissions = await this.PermissionModel.findPermission(userToken);
      } else {
        permissions = await this.ProfileModel.findProfile(profile);
      }

      if (permissions && permissions.length > 0) {
        let restrictedProfile = null;
        if (profile.restricted) {
          lg('- Profile is restricted. Getting mask...');
          [restrictedProfile] = await this.ProfileModel.findProfile({
            profile: 'restricted',
          });

          if (!restrictedProfile) {
            //FIXME: Remover bloque una vez que esté el profile ya en la BD.
            lg(
              '- - Restricted profile not found in DB. Getting from default template...'
            );
            restrictedProfile = getRestrictedProfile();
          }
        }

        if (userNumber === body.userNumber) {
          //OJO: permissions es un array. No tienen sentido estas asignaciones.
          //FIXME: Inconsistencia rastreada al commit 699db0b4c8ec4866cdc2924666c91734bcb87299 del 05/May/2019
          permissions.userNumber = body.userNumber;
          permissions.companyNumber = body.companyNumber;
          if (body.branchNumber !== undefined) {
            permissions.branchNumber = body.branchNumber;
          }
          let getFilterPermList = filterPermissions(
            permissions,
            body.branchNumber
          );
          getFilterPermList = getFilterPermList[0];

          if (profile.restricted) {
            getFilterPermList = getMaskedPermissions({
              mask: restrictedProfile,
              original: getFilterPermList,
            });
          }

          let requestedPermissionFound;

          body.requestedPermission
            ? (requestedPermissionFound = findRequestedPermission(
                getFilterPermList.permissions,
                body.requestedPermission
              ))
            : (requestedPermissionFound = getFilterPermList);

          const isPermissionValid = evaluatePermissionValidity(
            body.requestedPermission,
            requestedPermissionFound
          );

          if (isPermissionValid === true) {
            res.send(requestedPermissionFound);
          } else {
            res.status(403).send(isPermissionValid);
          }
        } else {
          lg(
            '- User is different from the user whose permissions are being verified.'
          );

          //Es un usuario consultando permisos de otros usuarios
          //BR: Para poder ver los permisos de otros usuarios requiere que
          // el usuario logueado para esa compañía tenga el permiso: config.users.readAll
          permissions = permissions[0];
          if (!permissions.permissions['config.users.readAll']) {
            const error = errors.filter(obj => {
              return obj.errorCode === ErrorsNum.CantViewAnotherUserPermissions;
            });
            const errorData = [
              {
                field: 'userNumber',
                fieldValue: body.userNumber,
                ...error[0],
              },
            ];
            return res.status(403).send({
              message: 'Forbidden Error',
              errors: errorData,
              microservice: 'gx-boa-ms-permissions',
            });
          }
          // Get permissions for other user
          const userBody = {
            userNumber: body.userNumber,
            companyNumber: body.companyNumber,
          };
          if (body.branchNumber !== undefined) {
            userBody.branchNumber = body.branchNumber;
          }
          const existsProfileBody = await this.PermissionProfileModel.findPermissionProfile(
            userBody
          );
          if (existsProfileBody.length > 0) {
            const profileBody = existsProfileBody[0];
            let permissionsBody = null;
            if (profileBody.profile === 'custom') {
              permissionsBody = await this.PermissionModel.findPermission(body);
            } else {
              permissionsBody = await this.ProfileModel.findProfile(
                profileBody
              );
            }
            if (permissionsBody && permissionsBody.length > 0) {
              let permissionsBodyList = filterPermissions(
                permissionsBody,
                body.branchNumber
              );
              permissionsBodyList = permissionsBodyList[0];
              if (profileBody.restricted) {
                permissionsBodyList = getMaskedPermissions({
                  mask: restrictedProfile,
                  original: permissionsBodyList,
                });
              }

              let requestedPermissionFound;

              body.requestedPermission
                ? (requestedPermissionFound = findRequestedPermission(
                    permissionsBodyList.permissions,
                    body.requestedPermission
                  ))
                : (requestedPermissionFound = permissionsBodyList);

              const isPermissionValid = evaluatePermissionValidity(
                body.requestedPermission,
                requestedPermissionFound
              );

              if (isPermissionValid === true) {
                res.send(requestedPermissionFound);
              } else {
                res.status(403).send(isPermissionValid);
              }
            } else {
              return res.status(204).send();
            }
          } else {
            return res.status(204).send();
          }
          // ---
        }
      } else {
        const error = errors.filter(obj => {
          return obj.errorCode === ErrorsNum.UserDontHavePermissions;
        });
        const errorData = [
          {
            field: 'userNumber',
            fieldValue: userNumber,
            ...error[0],
          },
        ];
        return res.status(403).send({
          message: 'Forbidden Error',
          errors: errorData,
          microservice: 'gx-boa-ms-permissions',
        });
      }
    } else {
      const error = errors.filter(obj => {
        return obj.errorCode === ErrorsNum.InvalidUserProfile;
      });
      const errorData = [
        {
          field: 'userNumber',
          fieldValue: userNumber,
          ...error[0],
        },
      ];
      return res.status(403).send({
        message: 'Forbidden Error',
        errors: errorData,
        microservice: 'gx-boa-ms-permissions',
      });
    }
  }

  async updatePermission(req, res, userNumber) {
    const body = req.body;
    const validator = new PermissionValidator();
    const error = validator.validateUpdatePermission(body);
    if (error) {
      console.log('Permission.updatePermission', error);
      return res.status(400).send(error);
    }
    //Validate body info vs userRequest
    // const ucbModel = new UserCompanyBranchModel(res.locals.SqlManager);
    // TODO: Eliminar cuando se termine de hacer la integración de user y companies
    // const existsUcb = await ucbModel.validateExistence(userNumber, body);
    // let validExistsUcb = filterUsersCompanyBranch(existsUcb, userNumber, body);
    // if (userNumber === body.userNumber) {
    //   if (!validExistsUcb) {
    //     return res.status(400).send();
    //   }
    // } else {
    //   if (!validExistsUcb || validExistsUcb.length < 1) {
    //     return res.status(400).send();
    //   }
    // }
    const userLogged = {
      userNumber: userNumber,
      companyNumber: body.companyNumber,
    };
    if (body.branchNumber !== undefined) {
      userLogged.branchNumber = body.branchNumber;
    }
    if (userNumber === body.userNumber) {
      const _this = this;
      let user = await getPermissionsByUserNumber(
        _this,
        res,
        userLogged,
        body,
        0
      );
      if (user) {
        let loggedPermissions = user.permissions;
        let loggedProfile = user.profile;
        // Valida cuantos administradores hay
        const numberOfAdmins = await this.PermissionProfileModel.findHowManyAdministratorProfiles(
          body
        );
        if (numberOfAdmins.length <= 0) {
          const error = errors.filter(obj => {
            return obj.errorCode === ErrorsNum.CantUpdatePermissionRule;
          });
          const errorData = [
            {
              field: 'userNumber',
              fieldValue: userNumber,
              ...error[0],
            },
          ];
          return res.status(403).send({
            message: 'Forbidden Error',
            errors: errorData,
            microservice: 'gx-boa-ms-permissions',
          });
        }
        if (loggedPermissions.length > 0) {
          let updateLoggedpermissions = await updateUserPermissionsRules(
            _this,
            res,
            loggedPermissions,
            loggedPermissions,
            body,
            loggedProfile
          );
          return res.status(200).send(updateLoggedpermissions);
        } else {
          // console.log('Not able to change nothing');
          const error = errors.filter(obj => {
            return obj.errorCode === ErrorsNum.UserDontHavePermissions;
          });
          const errorData = [
            {
              field: 'userNumber',
              fieldValue: userNumber,
              ...error[0],
            },
          ];
          return res.status(403).send({
            message: 'Forbidden Error',
            errors: errorData,
            microservice: 'gx-boa-ms-permissions',
          });
        }
      } else {
        // console.log('Not able to change nothing');
        const error = errors.filter(obj => {
          return obj.errorCode === ErrorsNum.InvalidUserProfile;
        });
        const errorData = [
          {
            field: 'userNumber',
            fieldValue: userNumber,
            ...error[0],
          },
        ];
        return res.status(403).send({
          message: 'Forbidden Error',
          errors: errorData,
          microservice: 'gx-boa-ms-permissions',
        });
      }
    } else {
      const _this = this;
      const userBody = {
        userNumber: body.userNumber,
        companyNumber: body.companyNumber,
      };
      if (body.branchNumber !== undefined) {
        userBody.branchNumber = body.branchNumber;
      }
      let userWithToken = await getPermissionsByUserNumber(
        _this,
        res,
        userLogged,
        body,
        0
      );
      if (userWithToken) {
        let userLoggedPermissions = userWithToken.permissions;
        if (userLoggedPermissions.length > 0) {
          let userToUpdate = await getPermissionsByUserNumber(
            _this,
            res,
            userBody,
            body,
            1
          );
          let userBodyPermissions = userToUpdate.permissions;
          let userBodyProfile = userToUpdate.profile;
          let uptadeUserBodyPermissions = await updateUserPermissionsRules(
            _this,
            res,
            userLoggedPermissions,
            userBodyPermissions,
            body,
            userBodyProfile
          );
          return res.status(200).send(uptadeUserBodyPermissions);
        } else {
          // console.log('Not able to change nothing');
          const error = errors.filter(obj => {
            return obj.errorCode === ErrorsNum.UserDontHavePermissions;
          });
          const errorData = [
            {
              field: 'userNumber',
              fieldValue: userNumber,
              ...error[0],
            },
          ];
          return res.status(403).send({
            message: 'Forbidden Error',
            errors: errorData,
            microservice: 'gx-boa-ms-permissions',
          });
        }
      } else {
        const error = errors.filter(obj => {
          return obj.errorCode === ErrorsNum.InvalidUserProfile;
        });
        const errorData = [
          {
            field: 'userNumber',
            fieldValue: userNumber,
            ...error[0],
          },
        ];
        return res.status(403).send({
          message: 'Forbidden Error',
          errors: errorData,
          microservice: 'gx-boa-ms-permissions',
        });
      }
    }
  }

  async deletePermission(req, res, userNumber) {
    const body = req.body;
    const validator = new PermissionValidator();
    const error = validator.validateDeletePermission(body);
    if (error) {
      console.log('Permission.deletePermission', error);
      return res.status(400).send(error);
    }
    //Validate body info vs userRequest
    // const ucbModel = new UserCompanyBranchModel(res.locals.SqlManager);
    // TODO: Eliminar cuando se termine de hacer la integración de user y companies
    // const existsUcb = await ucbModel.validateExistence(userNumber, body);
    // let validExistsUcb = filterUsersCompanyBranch(existsUcb, userNumber, body);
    // if (userNumber === body.userNumber) {
    //   if (!validExistsUcb) {
    //     return res.status(400).send();
    //   }
    // } else {
    //   if (!validExistsUcb || validExistsUcb.length < 1) {
    //     return res.status(400).send();
    //   }
    // }
    const userToken = {
      userNumber: userNumber,
      companyNumber: body.companyNumber,
    };
    if (body.branchNumber !== undefined) {
      userToken.branchNumber = body.branchNumber;
    }
    const existsProfile = await this.PermissionProfileModel.findPermissionProfile(
      userToken
    );
    if (existsProfile.length > 0) {
      const profile = existsProfile[0];
      if (profile.profile === 'administrator') {
        // BR: Un usuario administrador no puede quitarse permisos de administrador
        // (aunque haya otro usuario administrador)
        if (userNumber === body.userNumber) {
          const error = errors.filter(obj => {
            return obj.errorCode === ErrorsNum.CantDeletePermission;
          });
          const errorData = [
            {
              field: 'userNumber',
              fieldValue: userNumber,
              ...error[0],
            },
          ];
          return res.status(403).send({
            message: 'Forbidden Error',
            errors: errorData,
            microservice: 'gx-boa-ms-permissions',
          });
        }
        const userToDelete = {
          userNumber: body.userNumber,
          companyNumber: body.companyNumber,
        };
        if (body.branchNumber !== undefined) {
          userToDelete.branchNumber = body.branchNumber;
        }
        const existsProfileToDelete = await this.PermissionProfileModel.findPermissionProfile(
          userToDelete
        );
        if (existsProfileToDelete.length > 0) {
          const profileToDelete = existsProfileToDelete[0];

          await this.PermissionProfileModel.deletePermissionProfile(
            profileToDelete
          );
          cacheManager.permissionProfile.delete(userToDelete);

          if (profileToDelete.profile === 'custom') {
            let customPermToDelete = await this.PermissionModel.findPermission(
              body
            );
            if (customPermToDelete.length > 0) {
              customPermToDelete = customPermToDelete[0];
              await this.PermissionModel.deletePermission(customPermToDelete);
              cacheManager.permission.delete(body);
            }
          }
          return res.status(200).send();
        } else {
          return res.status(204).send();
        }
      } else {
        const error = errors.filter(obj => {
          return obj.errorCode === ErrorsNum.UserDontHavePermissions;
        });
        const errorData = [
          {
            field: 'userNumber',
            fieldValue: userNumber,
            ...error[0],
          },
        ];
        return res.status(403).send({
          message: 'Forbidden Error',
          errors: errorData,
          microservice: 'gx-boa-ms-permissions',
        });
      }
    }
    const errorCode = errors.filter(obj => {
      return obj.errorCode === ErrorsNum.InvalidUserProfile;
    });
    const errorData = [
      {
        field: 'userNumber',
        fieldValue: userNumber,
        ...errorCode[0],
      },
    ];
    return res.status(403).send({
      message: 'Forbidden Error',
      errors: errorData,
      microservice: 'gx-boa-ms-permissions',
    });
  }
}

module.exports = Permission;

function getMaskedPermissions({ mask, original }) {
  let masked = {
    ...original,
    restricted: true,
    permissions: {},
  };
  // lg('- - - Original Permissions');
  // lg(original);
  // lg('- - - Restricted profile mask');
  // lg(mask);
  Object.keys(mask.permissions).forEach(permission => {
    masked.permissions[permission] =
      mask.permissions[permission] && original.permissions[permission];
  });
  // lg(`- - - Masked permissions`);
  // lg(masked);
  return masked;
}

function getRestrictedProfile() {
  return {
    profile: 'restricted',
    permissions: {
      'spending.suppliers.readOwner': true,
      'spending.suppliers.readAll': true,
      'spending.suppliers.create': false,
      'spending.suppliers.update': false,
      'spending.suppliers.delete': false,
      'spending.suppliers.export': true,
      'spending.suppliers.search': true,
      'spending.suppliers.data.statement.read': true,
      'spending.suppliers.data.statement.export': true,
      'spending.suppliers.data.accountsPayable': false,
      'spending.suppliers.data.updateBankAccount': false,
      'spending.purchases.readOwner': true,
      'spending.purchases.readAll': true,
      'spending.purchases.create': false,
      'spending.purchases.update': false,
      'spending.purchases.cancel': false,
      'spending.purchases.delete': false,
      'spending.purchases.export': true,
      'spending.purchases.search': true,
      'spending.purchases.time.onlyShowLastDays': 10,
      'spending.purchases.process.processPartialReturns': false,
      'spending.purchases.process.receivePartialStock': false,
      'spending.purchaseOrders.readOwner': true,
      'spending.purchaseOrders.readAll': true,
      'spending.purchaseOrders.create': false,
      'spending.purchaseOrders.update': false,
      'spending.purchaseOrders.cancel': false,
      'spending.purchaseOrders.delete': false,
      'spending.purchaseOrders.export': true,
      'spending.purchaseOrders.search': true,
      'spending.purchaseOrders.time.onlyShowLastDays': 10,
      'spending.purchaseOrders.process.convertToPurchase': false,
      'spending.expenses.readOwner': true,
      'spending.expenses.readAll': true,
      'spending.expenses.create': false,
      'spending.expenses.update': false,
      'spending.expenses.cancel': false,
      'spending.expenses.delete': false,
      'spending.expenses.export': true,
      'spending.expenses.search': true,
      'spending.expenses.time.onlyShowLastDays': 10,
      'spending.payroll.readOwner': true,
      'spending.payroll.readAll': true,
      'spending.payroll.create': false,
      'spending.payroll.cancel': false,
      'spending.payroll.delete': false,
      'spending.payroll.export': true,
      'spending.payroll.search': true,
      'spending.payroll.time.onlyShowLastDays': 10,
      'spending.categories.read': true,
      'spending.categories.create': false,
      'spending.categories.update': false,
      'spending.categories.archive': false,
      'spending.categories.unarchive': false,
      'spending.categories.delete': false,
      'spending.sentPayments.readOwner': true,
      'spending.sentPayments.readAll': true,
      'spending.sentPayments.create': false,
      'spending.sentPayments.update': false,
      'spending.sentPayments.cancel': false,
      'spending.sentPayments.delete': false,
      'spending.sentPayments.export': true,
      'spending.sentPayments.search': true,
      'spending.sentPayments.time.onlyShowLastDays': 10,
      'spending.expenses_MEX.process.importarCFDIsDeEgresos': false,
      'inventory.products.read': true,
      'inventory.products.create': false,
      'inventory.products.update': false,
      'inventory.products.activate': false,
      'inventory.products.deactivate': false,
      'inventory.products.delete': false,
      'inventory.products.export': true,
      'inventory.products.search': true,
      'inventory.productDetails.data.updateStock': false,
      'inventory.productDetails.data.mmrp': false,
      'inventory.productDetails.data.readCost': true,
      'inventory.productDetails.data.updateCost': false,
      'inventory.productDetails.data.readPrice': true,
      'inventory.productDetails.data.updatePrice': false,
      'inventory.productDetails.data.readSuppliers': true,
      'inventory.productDetails.data.readStockMovements': true,
      'inventory.productDetails.time.stockMovementsOnlyShowLastDays': 10,
      'inventory.categories.read': true,
      'inventory.categories.create': false,
      'inventory.categories.update': false,
      'inventory.categories.archive': false,
      'inventory.categories.unarchive': false,
      'inventory.categories.delete': false,
      'inventory.transfers.readSentByMe': true,
      'inventory.transfers.readAllSent': true,
      'inventory.transfers.readReceivedPending': true,
      'inventory.transfers.readAllReceived': true,
      'inventory.transfers.send': false,
      'inventory.transfers.accept': false,
      'inventory.transfers.cancel': false,
      'inventory.transfers.delete': false,
      'inventory.transfers.export': true,
      'inventory.transfers.search': true,
      'inventory.transfers.time.onlyShowLastDays': 10,
      'inventory.transformations.readOwner': true,
      'inventory.transformations.readAll': true,
      'inventory.transformations.create': false,
      'inventory.transformations.update': false,
      'inventory.transformations.cancel': false,
      'inventory.transformations.delete': false,
      'inventory.transformations.export': true,
      'inventory.transformations.search': true,
      'inventory.transformations.time.onlyShowLastDays': 10,
      'inventory.recounts.readOwner': true,
      'inventory.recounts.readAll': true,
      'inventory.recounts.create': false,
      'inventory.recounts.data.viewStockInRecount': true,
      'inventory.recounts.process.updateStock': false,
      'inventory.recounts.cancel': false,
      'inventory.recounts.delete': false,
      'inventory.recounts.export': true,
      'inventory.recounts.search': true,
      'inventory.recounts.time.onlyShowLastDays': 10,
      'inventory.bulkActions.process.bulkImportProducts': false,
      'inventory.bulkActions.process.bulkCopyProducts': false,
      'inventory.bulkActions.process.bulkDeleteProducts': false,
      'inventory.bulkActions.process.bulkEditProductDetails': false,
      'inventory.bulkActions.process.bulkUpdateStock': false,
      'inventory.bulkActions.process.bulkUpdateProductCost': false,
      'inventory.bulkActions.process.bulkUpdateProductPrice': false,
      'income.clients.readOwner': true,
      'income.clients.readAll': true,
      'income.clients.create': false,
      'income.clients.update': false,
      'income.clients.delete': false,
      'income.clients.deactivate': false,
      'income.clients.reactivate': false,
      'income.clients.export': true,
      'income.clients.search': true,
      'income.clients.data.statement.read': true,
      'income.clients.data.statement.export': true,
      'income.clients.data.accountsReceivable': false,
      'income.clients.data.updateBankAccount': false,
      'income.clients.bulkActions.bulkImportClients': false,
      'income.clients.bulkActions.bulkDeleteClients': false,
      'income.sales.readOwner': true,
      'income.sales.readAll': true,
      'income.sales.create': false,
      'income.sales.update': false,
      'income.sales.cancel': false,
      'income.sales.delete': false,
      'income.sales.export': true,
      'income.sales.search': true,
      'income.sales.time.onlyShowLastDays': 10,
      'income.sales.process.processPartialReturns': false,
      'income.sales.process.sendPartialStock': false,
      'income.sales.special.canApplyProductDiscounts': false,
      'income.sales.special.canApplyGlobalDiscounts': false,
      'income.salesQuotes.readOwner': true,
      'income.salesQuotes.readAll': true,
      'income.salesQuotes.create': false,
      'income.salesQuotes.send': false,
      'income.salesQuotes.update': false,
      'income.salesQuotes.cancel': false,
      'income.salesQuotes.delete': false,
      'income.salesQuotes.export': true,
      'income.salesQuotes.search': true,
      'income.salesQuotes.time.onlyShowLastDays': 10,
      'income.salesQuotes.process.convertToSalesOrder': false,
      'income.salesQuotes.process.convertToSale': false,
      'income.salesOrders.readOwner': true,
      'income.salesOrders.readAll': true,
      'income.salesOrders.create': false,
      'income.salesOrders.send': false,
      'income.salesOrders.update': false,
      'income.salesOrders.cancel': false,
      'income.salesOrders.delete': false,
      'income.salesOrders.export': true,
      'income.salesOrders.search': true,
      'income.salesOrders.time.onlyShowLastDays': 10,
      'income.salesOrders.process.convertToSale': false,
      'income.otherIncome.readOwner': true,
      'income.otherIncome.readAll': true,
      'income.otherIncome.create': false,
      'income.otherIncome.update': false,
      'income.otherIncome.cancel': false,
      'income.otherIncome.delete': false,
      'income.otherIncome.export': true,
      'income.otherIncome.search': true,
      'income.otherIncome.time.onlyShowLastDays': 10,
      'income.receivedPayments.readOwner': true,
      'income.receivedPayments.readAll': true,
      'income.receivedPayments.create': false,
      'income.receivedPayments.update': false,
      'income.receivedPayments.cancel': false,
      'income.receivedPayments.delete': false,
      'income.receivedPayments.export': true,
      'income.receivedPayments.search': true,
      'income.receivedPayments.time.onlyShowLastDays': 10,
      'income.promotions.read': true,
      'income.promotions.create': false,
      'income.promotions.update': false,
      'income.promotions.activate': false,
      'income.promotions.deactivate': false,
      'income.promotions.close': false,
      'income.promotions.cancel': false,
      'income.promotions.delete': false,
      'income.promotions.export': true,
      'income.promotions.search': true,
      'income.promotions.time.onlyShowLastDays': 10,
      'income.invoicing.readOwner': true,
      'income.invoicing.readAll': true,
      'income.invoicing.createInvoice': false,
      'income.invoicing.createGroupedInvoice': false,
      'income.invoicing.createCreditNote': false,
      'income.invoicing.cancelInvoice': false,
      'income.invoicing.cancelCreditNote': false,
      'income.categories.read': true,
      'income.categories.create': false,
      'income.categories.update': false,
      'income.categories.archive': false,
      'income.categories.unarchive': false,
      'income.categories.delete': false,
      'income.income_MEX.process.importarCFDIsDeIngresos': false,
      'moneyAccounts.accounts.read': true,
      'moneyAccounts.accounts.create': false,
      'moneyAccounts.accounts.update': false,
      'moneyAccounts.accounts.activate': false,
      'moneyAccounts.accounts.deactivate': false,
      'moneyAccounts.accounts.delete': false,
      'moneyAccounts.accounts.export': true,
      'moneyAccounts.accounts.search': true,
      'moneyAccounts.accounts.data.accountBalance': false,
      'moneyAccounts.accounts.process.addUser': false,
      'moneyAccounts.accounts.process.removeUser': false,
      'moneyAccounts.accounts.addStatement': false,
      'moneyAccounts.accounts.removeStatement': false,
      'moneyAccounts.transactions.data.readAccountBalance': true,
      'moneyAccounts.transactions.data.readAccountTransactions': true,
      'moneyAccounts.transactions.cancelTransaction': false,
      'moneyAccounts.transactions.deleteTransaction': false,
      'moneyAccounts.transactions.process.createAdjustTransaction': false,
      'moneyAccounts.transactions.process.createDepositTransaction': false,
      'moneyAccounts.transactions.process.createWithdrawalTransaction': false,
      'moneyAccounts.transactions.exportTransactions': true,
      'moneyAccounts.transactions.time.onlyShowLastDays': 10,
      'moneyAccounts.bankConnections.process.connectToBank': false,
      'moneyAccounts.bankConnections.process.disconnectFromBank': false,
      'moneyAccounts.bankConnections.read': true,
      'moneyAccounts.bankConnections.update': false,
      'moneyAccounts.bankConnections.time.onlyShowLastDays': 10,
      'reports.businessHealth.read': true,
      'reports.businessHealth.time.onlyShowLastDays': 10,
      'reports.expensesReports.read': true,
      'reports.expensesReports.time.onlyShowLastDays': 10,
      'reports.inventoryReports.read': true,
      'reports.inventoryReports.time.onlyShowLastDays': 10,
      'reports.salesReports.read': true,
      'reports.salesReports.time.onlyShowLastDays': 10,
      'pos.shift.readOwner': true,
      'pos.shift.readAll': true,
      'pos.shift.startShift': false,
      'pos.shift.finishShift': false,
      'pos.shift.process.depositCash': false,
      'pos.shift.process.withdrawCash': false,
      'pos.shift.special.reprintTicket': false,
      'config.users.readAll': true,
      'config.users.invite': false,
      'config.users.suspend': false,
      'config.users.reactivate': false,
      'config.users.delete': false,
      'config.users.defineBranchesPermissions': false,
      'config.users.defineCompanyPermissions': false,
      'config.users.GlobalPermissions': false,
      'config.branches.read': true,
      'config.branches.create': false,
      'config.branches.update': false,
      'config.branches.deactivate': false,
      'config.branches.reactivate': false,
      'config.branches.delete': false,
      'config.inventory.config': false,
      'config.pos.config': false,
      'config.income.config': false,
      'config.expenses.config': false,
      'config.payroll.config': false,
      'config.bankAccouns.config': false,
      'config.company.update.generalInfo': false,
      'config.company.update.taxInfo': false,
      'config.company.process.addCertificate': false,
      'config.company.process.changeSelectedCertificate': false,
      'config.company.process.removeCertificate': false,
      'config.company.suspend': false,
      'config.company.delete': false,
      'integrations.activatePersonal': false,
      'integrations.activateOnBehalf': false,
      'integrations.deactivateOnBehalf': false,
    },
  };
}
