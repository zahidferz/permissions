const ucbDS = require("./datastores/UserCompanyBranchDS");

export class UserCompanyBranchModel {
  constructor(sqlmanager) {
    this.sqlmanager = sqlmanager;
  }
  async validateExistence(userNumberRequest, data) {
    const connection = await this.sqlmanager.getConnection();
    try {
      data.userNumberRequest = userNumberRequest;
      const ucb = await ucbDS.userCompanyBranch(connection, data);
      return ucb;
    } catch (error) {
      console.log("UserCompanyBranchModel.validateExistence:", error);
      throw error;
    }
  }
}
