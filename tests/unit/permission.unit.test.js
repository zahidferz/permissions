require('@babel/polyfill');
const { filterPermissions } = require('../../src/routes/PermissionUtil');

const testFilterPermissionsByCompany = () => {
  const dummyPermissions = [
    {
      profile: 'administrator',
      permissions: {
        'expenses.suppliers.readOwner': true,
        'bankAccounts.accounts.read': true,
      },
    },
  ];
  const branchNumber = undefined;
  const permFiltered = filterPermissions(dummyPermissions, branchNumber);
  expect(permFiltered).not.toBeNull();
  expect(permFiltered.length).toBeGreaterThan(0);
  expect(
    permFiltered[0].permissions['bankAccounts.accounts.read']
  ).toBeTruthy();
};

const testFilterPermissionsByBranch = () => {
  const dummyPermissions = [
    {
      profile: 'administrator',
      permissions: {
        'expenses.suppliers.readOwner': true,
        'bankAccounts.accounts.read': true,
      },
    },
  ];
  const branchNumber = 1; //dummy branch
  const permFiltered = filterPermissions(dummyPermissions, branchNumber);
  // console.log(permFiltered);
  expect(permFiltered).not.toBeNull();
  expect(permFiltered.length).toBeGreaterThan(0);
  expect(
    permFiltered[0].permissions['expenses.suppliers.readOwner']
  ).toBeTruthy();
};

describe('Test permissions', () => {
  it('testFilterPermissionsByCompany', testFilterPermissionsByCompany);
  it('testFilterPermissionsByBranch', testFilterPermissionsByBranch);
});
