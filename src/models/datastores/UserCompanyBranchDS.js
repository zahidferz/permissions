export async function userCompanyBranch(connection, data) {
  try {
    const result = await connection
      .request()
      .input("userNumberRequest", data.userNumberRequest)
      .input("userNumber", data.userNumber)
      .input("companyNumber", data.companyNumber)
      .input("branchNumber", data.branchNumber)
      .execute("GetUserCompanyBranch");
    const obj = result.recordset;
    return obj;
  } catch (error) {
    console.log("userCompanyBranch", error);
    throw error;
  }
}
