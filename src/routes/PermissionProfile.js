import { PermissionProfileValidator } from '../util/permissionProfileValidator';
import { errors, ErrorsNum } from '../util/errors';

const debug = require('debug');
const lg = debug('permissions');

class PermissionProfile {
  constructor(permissionProfileModel, permissionModel, profileModel) {
    /** @type { import("../models/PermissionProfileModel")} */
    this.permissionProfileModel = permissionProfileModel;
    /** @type { import("../models/PermissionModel")} */
    this.permissionModel = permissionModel;
    /** @type {import("../models/ProfileModel")} */
    this.profileModel = profileModel;
  }
  async restrictPermissionsForCompanyUsers(req, res) {
    const { companyNumber } = req.params;
    const { excludedProfiles = [], excludedUsers = [] } = req.body;
    lg('Getting Company permission profiles...');
    let companyPermissionProfiles = await this.permissionProfileModel.permissionProfilesByCompany(
      { companyNumber: parseInt(companyNumber) }
    );
    lg('Restricting Company permission profiles...');
    await Promise.all(
      companyPermissionProfiles.map(permProfile => {
        const excludeProfile = excludedProfiles.some(
          excludedProfile => excludedProfile === permProfile.profile
        );
        return (
          !excludeProfile &&
          this.permissionProfileModel.updateExistentPermissionProfile({
            ...permProfile,
            restricted: true,
          })
        );
      })
    );
    lg('Updated Company permission profiles...');
    companyPermissionProfiles = await this.permissionProfileModel.permissionProfilesByCompany(
      { companyNumber: parseInt(companyNumber) }
    );
    return res.send(companyPermissionProfiles);
  }
  async unrestrictPermissionsForCompanyUsers(req, res) {
    const { companyNumber } = req.params;
    lg('Getting Company permission profiles...');
    let companyPermissionProfiles = await this.permissionProfileModel.permissionProfilesByCompany(
      { companyNumber: parseInt(companyNumber) }
    );
    lg('Unrestricting Company permission profiles...');
    await Promise.all(
      companyPermissionProfiles.map(permProfile => {
        return this.permissionProfileModel.updateExistentPermissionProfile({
          ...permProfile,
          restricted: false,
        });
      })
    );
    lg('Updated Company permission profiles...');
    companyPermissionProfiles = await this.permissionProfileModel.permissionProfilesByCompany(
      { companyNumber: parseInt(companyNumber) }
    );
    return res.send(companyPermissionProfiles);
  }
  async setPermissionProfile(req, res, userNumber) {
    const body = req.body;
    lg('PermissionProfile.setPermissionProfile.body', body);
    const validator = new PermissionProfileValidator();
    const error = validator.validateSetPermissionProfile(body);
    if (error) {
      console.log('PermissionProfile.setPermissionProfile.error', error);
      return res.status(400).send(error);
    }
    // Validar que el usuario que hace el req tenga permisos para hacer update
    // TODO: Eliminar cuando se termine de hacer la integración de user y companies
    // const ucbModel = new UserCompanyBranchModel(res.locals.SqlManager);
    // const existsUcb = await ucbModel.validateExistence(userNumber, body);
    // let validExistsUcb = filterUsersCompanyBranch(existsUcb, userNumber, body);
    // if (userNumber === body.userNumber) {
    //   if (!validExistsUcb) {
    //     console.log("PermissionProfile.setPermissionProfile.!validExistsUcb", !validExistsUcb);
    //     return res.status(400).send();
    //   }
    // } else {
    //   if (!validExistsUcb || validExistsUcb.length < 1) {
    //     console.log(userNumber, body, 'nn', validExistsUcb);
    //     console.log("PermissionProfile.setPermissionProfile.!validExistsUcb || validExistsUcb.length < 1", !validExistsUcb || validExistsUcb.length < 1);
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
    const existsProfile = await this.permissionProfileModel.findPermissionProfile(
      userLogged
    );
    let permissionsToken = null;
    if (existsProfile.length > 0) {
      //console.log("El perfil-permiso ya existe");
      const profile = existsProfile[0];
      if (profile.profile === 'custom') {
        //console.log("El perfil-permiso es custom");
        permissionsToken = await this.permissionModel.findPermission(profile);
        if (permissionsToken.length > 0) {
          permissionsToken = permissionsToken[0];
          if (!body.branchNumber) {
            // Nivel Company
            if (
              permissionsToken.permissions.length === 0 ||
              !permissionsToken.permissions[
                'config.users.defineCompanyPermissions'
              ]
            ) {
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
            const existsSetProfile = await this.permissionProfileModel.findPermissionProfile(
              body
            );
            let newPermProf = null;
            if (existsSetProfile.length === 0) {
              // Si el usuario no tiene ningun perfil/permiso, inserta uno nuevo
              newPermProf = await this.permissionProfileModel.insertPermissionProfile(
                body
              );
              return res.send(newPermProf);
            } else {
              // Valida cuantos administradores hay
              const numberOfAdmins = await this.permissionProfileModel.findHowManyAdministratorProfiles(
                body
              );
              lg(
                'PermissionProfile.setPermissionProfile.numberOfAdmins',
                numberOfAdmins
              );
              lg('PermissionProfile.setPermissionProfile.body', body);
              if (
                numberOfAdmins.length < 1 &&
                existsSetProfile[0].profile === 'administrator'
              ) {
                // Si se quiere cambiar el perfil admin a un usuario y solo existe ese admin, devuelve 403
                const error = errors.filter(obj => {
                  return obj.errorCode === ErrorsNum.CantChangeUserProfile;
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
              // El usuario del body era custom y se le asignará un perfil
              if (existsSetProfile[0].profile === 'custom') {
                const customTemp = await this.permissionModel.findPermission(
                  body
                );
                if (customTemp.length > 0) {
                  await this.permissionModel.deletePermission(customTemp[0]);
                }
              }
              newPermProf = existsSetProfile[0];
              body.id = newPermProf.id;
              newPermProf = await this.permissionProfileModel.updatePermissionProfile(
                body
              );
              return res.send(newPermProf);
            }
          }
          // Nivel Branch
          if (
            permissionsToken.permissions.length === 0 ||
            !permissionsToken.permissions[
              'config.users.defineBranchesPermissions'
            ]
          ) {
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
          const existsSetProfile = await this.permissionProfileModel.findPermissionProfile(
            body
          );
          let newPermProf = null;
          if (existsSetProfile.length === 0) {
            // Si el usuario no tiene ningun perfil/permiso, inserta uno nuevo
            newPermProf = await this.permissionProfileModel.insertPermissionProfile(
              body
            );
            return res.send(newPermProf);
          } else {
            // Valida cuantos administradores hay
            const numberOfAdmins = await this.permissionProfileModel.findHowManyAdministratorProfiles(
              body
            );
            if (
              numberOfAdmins.length < 1 &&
              existsSetProfile[0].profile === 'administrator'
            ) {
              // Si se quiere cambiar el perfil admin a un usuario y solo existe ese admin, devuelve 403
              const error = errors.filter(obj => {
                return obj.errorCode === ErrorsNum.CantChangeUserProfile;
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
            // El usuario del body era custom y se le asignará un perfil
            if (existsSetProfile[0].profile === 'custom') {
              const customTemp = await this.permissionModel.findPermission(
                body
              );
              if (customTemp.length > 0) {
                await this.permissionModel.deletePermission(customTemp[0]);
              }
            }
            newPermProf = existsSetProfile[0];
            body.id = newPermProf.id;
            newPermProf = await this.permissionProfileModel.updatePermissionProfile(
              body
            );
            return res.send(newPermProf);
          }
        }
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
      } else if (profile.profile === 'administrator') {
        // console.log("El perfil-permiso NO es custom");
        // Valida cuantos administradores hay
        //FIXME: Validar esta regla que este bien aplicada
        // const numberOfAdmins = await this.permissionProfileModel.findHowManyAdministratorProfiles(
        //   body
        // );
        // if (numberOfAdmins.length <= 0 && userNumber === body.userNumber) {
        //   return res.status(401).send();
        // }
        const existsSetProfile = await this.permissionProfileModel.findPermissionProfile(
          body
        );
        let newPermProf = null;
        if (existsSetProfile.length === 0) {
          newPermProf = await this.permissionProfileModel.insertPermissionProfile(
            body
          );
          return res.send(newPermProf);
        } else {
          if (existsSetProfile[0].profile === 'custom') {
            const customTemp = await this.permissionModel.findPermission(body);
            if (customTemp.length > 0) {
              await this.permissionModel.deletePermission(customTemp[0]);
            }
          }
          newPermProf = existsSetProfile[0];
          body.id = newPermProf.id;
          lg('+ + + Updating permission profile');
          newPermProf = await this.permissionProfileModel.updatePermissionProfile(
            body
          );
          return res.send(newPermProf);
        }
      } else if (profile.profile !== 'administrator' && profile.profile === body.profile) {
        const existsSetProfile = await this.permissionProfileModel.findPermissionProfile(
          body
        );
        let newPermProf = null;
        if (existsSetProfile.length === 0) {
          newPermProf = await this.permissionProfileModel.insertPermissionProfile(
            body
          );
          return res.send(newPermProf);
        } else {
          if (existsSetProfile[0].profile === 'custom') {
            const customTemp = await this.permissionModel.findPermission(body);
            if (customTemp.length > 0) {
              await this.permissionModel.deletePermission(customTemp[0]);
            }
          }
          newPermProf = existsSetProfile[0];
          body.id = newPermProf.id;
          lg('+ + + Updating permission profile');
          newPermProf = await this.permissionProfileModel.updatePermissionProfile(
            body
          );
          return res.send(newPermProf);
        }
      }
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
    if (body.profile === 'administrador' || userNumber === body.userNumber) {
      let newPermProfFotCompanyCreate = await this.permissionProfileModel.insertPermissionProfile(
        body
      );
      return res.send(newPermProfFotCompanyCreate);
    }
    const errorCode = errors.filter(obj => {
      return obj.errorCode === ErrorsNum.UserDontHavePermissions;
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

  async updatePermissionProfile(req, res) {
    const body = req.body;
    const permProf = await this.permissionProfileModel.updatePermissionProfile(
      body
    );
    return res.send(permProf);
  }

  async getUsersByCompany(req, res) {
    const body = {};
    body.companyNumber = parseInt(req.params.companyNumber);
    const validator = new PermissionProfileValidator();
    const error = validator.validateGetUsersByCompany(body);
    if (error) {
      console.log('Profile.getUsersByCompany', error);
      return res.status(400).send(error);
    }
    const users = await this.permissionProfileModel.profilesByCompany(body);
    if (users && users.length) {
      return res.send(users);
    }
    return res.send([]);
  }
}

module.exports = PermissionProfile;
