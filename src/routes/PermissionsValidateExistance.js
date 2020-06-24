export function filterUsersCompanyBranch(existsUcb, userNumber, body) {
  let validUserCompBranch = [];
  for (let index = 0; index < existsUcb.length; index++) {
    let theComp = "19" + existsUcb[index].CompanyNumber;
    if (
      theComp == `${body.companyNumber}` &&
      (existsUcb[index].userNumber == userNumber ||
        existsUcb[index].userNumber == body.userNumber)
    ) {
      validUserCompBranch.push(existsUcb[index]);
    }
  }
  return validUserCompBranch;
}
