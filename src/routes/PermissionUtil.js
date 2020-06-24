export function filterPermissions(permissionsResult, branchNumber) {
  const permissions = permissionsResult[0].permissions;
  let propertyNames = null;

  if (branchNumber == undefined) {
    //Permisos a quitar a nivel Company o permisos a nivel Branch
    propertyNames = Object.keys(permissions).filter(prop => {
      return (
        prop.startsWith("spending.purchases") ||
        prop.startsWith("spending.purchaseOrders") ||
        prop.startsWith("spending.expenses") ||
        prop.startsWith("spending.payroll") ||
        prop.startsWith("spending.categories") ||
        prop.startsWith("spending.sentPayments") ||
        prop.startsWith("spending.expenses_MEX") ||
        prop.startsWith("inventory") ||
        prop.startsWith("income.sales") ||
        prop.startsWith("income.salesQuotes") ||
        prop.startsWith("income.salesOrders") ||
        prop.startsWith("income.otherIncome") ||
        prop.startsWith("income.receivedPayments") ||
        prop.startsWith("income.promotions") ||
        prop.startsWith("income.invoicing") ||
        prop.startsWith("income.categories") ||
        prop.startsWith("income.income_MEX.process") ||
        prop.startsWith("reports") ||
        prop.startsWith("pos")
      );
    });
  } else {
    //Permisos a quitar a nivel branch o permisos a nivel company
    propertyNames = Object.keys(permissions).filter(prop => {
      return (
        prop.startsWith("moneyAccounts") ||
        prop.startsWith("config") ||
        prop.startsWith("integrations") ||
        prop.startsWith("income.clients") ||
        prop.startsWith("spending.suppliers")
      );
    });
  }
  const _map = new Map(Object.entries(permissions));
  propertyNames.forEach(elem => {
    _map.delete(elem);
  });
  const obj = {};
  _map.forEach((v, k) => {
    obj[k] = v;
  });
  permissionsResult[0].permissions = obj;
  return permissionsResult;
}
