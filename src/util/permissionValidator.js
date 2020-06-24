const Joi = require("joi");
import { ErrorCode } from './getErrorCode';

export class PermissionValidator {
  validateGetPermission(data) {
    const schema = Joi.object().keys({
      userNumber: Joi.number().required(),
      companyNumber: Joi.number().required(),
      branchNumber: Joi.number(),
      requestedPermission: Joi.string().allow(null, ''),
    });
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

  validateDeletePermission(data) {
    const schema = Joi.object().keys({
      userNumber: Joi.number().required(),
      companyNumber: Joi.number().required(),
      branchNumber: Joi.number(),
    });
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

  validateUpdatePermission(data) {
    const schema = Joi.object().keys({
      userNumber: Joi.number().required(),
      companyNumber: Joi.number().required(),
      branchNumber: Joi.number(),
      permissions: Joi.object({
        'spending.suppliers.readOwner': Joi.boolean().strict(),
        'spending.suppliers.readAll': Joi.boolean().strict(),
        'spending.suppliers.create': Joi.boolean().strict(),
        'spending.suppliers.update': Joi.boolean().strict(),
        'spending.suppliers.delete': Joi.boolean().strict(),
        'spending.suppliers.export': Joi.boolean().strict(),
        'spending.suppliers.search': Joi.boolean().strict(),
        'spending.suppliers.data.statement.read': Joi.boolean().strict(),
        'spending.suppliers.data.statement.export': Joi.boolean().strict(),
        'spending.suppliers.data.accountsPayable': Joi.boolean().strict(),
        'spending.suppliers.data.updateBankAccount': Joi.boolean().strict(),
        'spending.purchases.readOwner': Joi.boolean().strict(),
        'spending.purchases.readAll': Joi.boolean().strict(),
        'spending.purchases.create': Joi.boolean().strict(),
        'spending.purchases.update': Joi.boolean().strict(),
        'spending.purchases.cancel': Joi.boolean().strict(),
        'spending.purchases.delete': Joi.boolean().strict(),
        'spending.purchases.export': Joi.boolean().strict(),
        'spending.purchases.search': Joi.boolean().strict(),
        'spending.purchases.time.onlyShowLastDays': Joi.number()
          .integer()
          .strict(),
        'spending.purchases.process.processPartialReturns': Joi.boolean().strict(),
        'spending.purchases.process.receivePartialStock': Joi.boolean().strict(),
        'spending.purchaseOrders.readOwner': Joi.boolean().strict(),
        'spending.purchaseOrders.readAll': Joi.boolean().strict(),
        'spending.purchaseOrders.create': Joi.boolean().strict(),
        'spending.purchaseOrders.update': Joi.boolean().strict(),
        'spending.purchaseOrders.cancel': Joi.boolean().strict(),
        'spending.purchaseOrders.delete': Joi.boolean().strict(),
        'spending.purchaseOrders.export': Joi.boolean().strict(),
        'spending.purchaseOrders.search': Joi.boolean().strict(),
        'spending.purchaseOrders.time.onlyShowLastDays': Joi.number()
          .integer()
          .strict(),
        'spending.purchaseOrders.process.convertToPurchase': Joi.boolean().strict(),
        'spending.expenses.readOwner': Joi.boolean().strict(),
        'spending.expenses.readAll': Joi.boolean().strict(),
        'spending.expenses.create': Joi.boolean().strict(),
        'spending.expenses.update': Joi.boolean().strict(),
        'spending.expenses.cancel': Joi.boolean().strict(),
        'spending.expenses.delete': Joi.boolean().strict(),
        'spending.expenses.export': Joi.boolean().strict(),
        'spending.expenses.search': Joi.boolean().strict(),
        'spending.expenses.time.onlyShowLastDays': Joi.number()
          .integer()
          .strict(),
        'spending.payroll.readOwner': Joi.boolean().strict(),
        'spending.payroll.readAll': Joi.boolean().strict(),
        'spending.payroll.create': Joi.boolean().strict(),
        'spending.payroll.cancel': Joi.boolean().strict(),
        'spending.payroll.delete': Joi.boolean().strict(),
        'spending.payroll.export': Joi.boolean().strict(),
        'spending.payroll.search': Joi.boolean().strict(),
        'spending.payroll.time.onlyShowLastDays': Joi.number()
          .integer()
          .strict(),
        'spending.categories.read': Joi.boolean().strict(),
        'spending.categories.create': Joi.boolean().strict(),
        'spending.categories.update': Joi.boolean().strict(),
        'spending.categories.archive': Joi.boolean().strict(),
        'spending.categories.unarchive': Joi.boolean().strict(),
        'spending.categories.delete': Joi.boolean().strict(),
        'spending.sentPayments.readOwner': Joi.boolean().strict(),
        'spending.sentPayments.readAll': Joi.boolean().strict(),
        'spending.sentPayments.create': Joi.boolean().strict(),
        'spending.sentPayments.update': Joi.boolean().strict(),
        'spending.sentPayments.cancel': Joi.boolean().strict(),
        'spending.sentPayments.delete': Joi.boolean().strict(),
        'spending.sentPayments.export': Joi.boolean().strict(),
        'spending.sentPayments.search': Joi.boolean().strict(),
        'spending.sentPayments.time.onlyShowLastDays': Joi.number()
          .integer()
          .strict(),
        'spending.expenses_MEX.process.importarCFDIsDeEgresos': Joi.boolean().strict(),
        'inventory.products.read': Joi.boolean().strict(),
        'inventory.products.create': Joi.boolean().strict(),
        'inventory.products.update': Joi.boolean().strict(),
        'inventory.products.activate': Joi.boolean().strict(),
        'inventory.products.deactivate': Joi.boolean().strict(),
        'inventory.products.delete': Joi.boolean().strict(),
        'inventory.products.export': Joi.boolean().strict(),
        'inventory.products.search': Joi.boolean().strict(),
        'inventory.productDetails.data.updateStock': Joi.boolean().strict(),
        'inventory.productDetails.data.mmrp': Joi.boolean().strict(),
        'inventory.productDetails.data.readCost': Joi.boolean().strict(),
        'inventory.productDetails.data.updateCost': Joi.boolean().strict(),
        'inventory.productDetails.data.readPrice': Joi.boolean().strict(),
        'inventory.productDetails.data.updatePrice': Joi.boolean().strict(),
        'inventory.productDetails.data.readSuppliers': Joi.boolean().strict(),
        'inventory.productDetails.data.readStockMovements': Joi.boolean().strict(),
        'inventory.productDetails.time.stockMovementsOnlyShowLastDays': Joi.number()
          .integer()
          .strict(),
        'inventory.categories.read': Joi.boolean().strict(),
        'inventory.categories.create': Joi.boolean().strict(),
        'inventory.categories.update': Joi.boolean().strict(),
        'inventory.categories.archive': Joi.boolean().strict(),
        'inventory.categories.unarchive': Joi.boolean().strict(),
        'inventory.categories.delete': Joi.boolean().strict(),
        'inventory.transfers.readSentByMe': Joi.boolean().strict(),
        'inventory.transfers.readAllSent': Joi.boolean().strict(),
        'inventory.transfers.readReceivedPending': Joi.boolean().strict(),
        'inventory.transfers.readAllReceived': Joi.boolean().strict(),
        'inventory.transfers.send': Joi.boolean().strict(),
        'inventory.transfers.accept': Joi.boolean().strict(),
        'inventory.transfers.cancel': Joi.boolean().strict(),
        'inventory.transfers.delete': Joi.boolean().strict(),
        'inventory.transfers.export': Joi.boolean().strict(),
        'inventory.transfers.search': Joi.boolean().strict(),
        'inventory.transfers.time.onlyShowLastDays': Joi.number()
          .integer()
          .strict(),
        'inventory.transformations.readOwner': Joi.boolean().strict(),
        'inventory.transformations.readAll': Joi.boolean().strict(),
        'inventory.transformations.create': Joi.boolean().strict(),
        'inventory.transformations.update': Joi.boolean().strict(),
        'inventory.transformations.cancel': Joi.boolean().strict(),
        'inventory.transformations.delete': Joi.boolean().strict(),
        'inventory.transformations.export': Joi.boolean().strict(),
        'inventory.transformations.search': Joi.boolean().strict(),
        'inventory.transformations.time.onlyShowLastDays': Joi.number()
          .integer()
          .strict(),
        'inventory.recounts.readOwner': Joi.boolean().strict(),
        'inventory.recounts.readAll': Joi.boolean().strict(),
        'inventory.recounts.create': Joi.boolean().strict(),
        'inventory.recounts.data.viewStockInRecount': Joi.boolean().strict(),
        'inventory.recounts.process.updateStock': Joi.boolean().strict(),
        'inventory.recounts.cancel': Joi.boolean().strict(),
        'inventory.recounts.delete': Joi.boolean().strict(),
        'inventory.recounts.export': Joi.boolean().strict(),
        'inventory.recounts.search': Joi.boolean().strict(),
        'inventory.recounts.time.onlyShowLastDays': Joi.number()
          .integer()
          .strict(),
        'inventory.bulkActions.process.bulkImportProducts': Joi.boolean().strict(),
        'inventory.bulkActions.process.bulkCopyProducts': Joi.boolean().strict(),
        'inventory.bulkActions.process.bulkDeleteProducts': Joi.boolean().strict(),
        'inventory.bulkActions.process.bulkEditProductDetails': Joi.boolean().strict(),
        'inventory.bulkActions.process.bulkUpdateStock': Joi.boolean().strict(),
        'inventory.bulkActions.process.bulkUpdateProductCost': Joi.boolean().strict(),
        'inventory.bulkActions.process.bulkUpdateProductPrice': Joi.boolean().strict(),
        'income.clients.readOwner': Joi.boolean().strict(),
        'income.clients.readAll': Joi.boolean().strict(),
        'income.clients.create': Joi.boolean().strict(),
        'income.clients.update': Joi.boolean().strict(),
        'income.clients.delete': Joi.boolean().strict(),
        'income.clients.deactivate': Joi.boolean().strict(),
        'income.clients.reactivate': Joi.boolean().strict(),
        'income.clients.export': Joi.boolean().strict(),
        'income.clients.search': Joi.boolean().strict(),
        'income.clients.data.statement.read': Joi.boolean().strict(),
        'income.clients.data.statement.export': Joi.boolean().strict(),
        'income.clients.data.accountsReceivable': Joi.boolean().strict(),
        'income.clients.data.updateBankAccount': Joi.boolean().strict(),
        'income.clients.bulkActions.bulkImportClients': false,
        'income.clients.bulkActions.bulkDeleteClients': false,
        'income.sales.readOwner': Joi.boolean().strict(),
        'income.sales.readAll': Joi.boolean().strict(),
        'income.sales.create': Joi.boolean().strict(),
        'income.sales.update': Joi.boolean().strict(),
        'income.sales.cancel': Joi.boolean().strict(),
        'income.sales.delete': Joi.boolean().strict(),
        'income.sales.export': Joi.boolean().strict(),
        'income.sales.search': Joi.boolean().strict(),
        'income.sales.time.onlyShowLastDays': Joi.number()
          .integer()
          .strict(),
        'income.sales.process.processPartialReturns': Joi.boolean().strict(),
        'income.sales.process.sendPartialStock': Joi.boolean().strict(),
        'income.sales.special.canApplyProductDiscounts': Joi.boolean().strict(),
        'income.sales.special.canApplyGlobalDiscounts': Joi.boolean().strict(),
        'income.salesQuotes.readOwner': Joi.boolean().strict(),
        'income.salesQuotes.readAll': Joi.boolean().strict(),
        'income.salesQuotes.create': Joi.boolean().strict(),
        'income.salesQuotes.send': Joi.boolean().strict(),
        'income.salesQuotes.update': Joi.boolean().strict(),
        'income.salesQuotes.cancel': Joi.boolean().strict(),
        'income.salesQuotes.delete': Joi.boolean().strict(),
        'income.salesQuotes.export': Joi.boolean().strict(),
        'income.salesQuotes.search': Joi.boolean().strict(),
        'income.salesQuotes.time.onlyShowLastDays': Joi.number()
          .integer()
          .strict(),
        'income.salesQuotes.process.convertToSalesOrder': Joi.boolean().strict(),
        'income.salesQuotes.process.convertToSale': Joi.boolean().strict(),
        'income.salesOrders.readOwner': Joi.boolean().strict(),
        'income.salesOrders.readAll': Joi.boolean().strict(),
        'income.salesOrders.create': Joi.boolean().strict(),
        'income.salesOrders.send': Joi.boolean().strict(),
        'income.salesOrders.update': Joi.boolean().strict(),
        'income.salesOrders.cancel': Joi.boolean().strict(),
        'income.salesOrders.delete': Joi.boolean().strict(),
        'income.salesOrders.export': Joi.boolean().strict(),
        'income.salesOrders.search': Joi.boolean().strict(),
        'income.salesOrders.time.onlyShowLastDays': Joi.number()
          .integer()
          .strict(),
        'income.salesOrders.process.convertToSale': Joi.boolean().strict(),
        'income.otherIncome.readOwner': Joi.boolean().strict(),
        'income.otherIncome.readAll': Joi.boolean().strict(),
        'income.otherIncome.create': Joi.boolean().strict(),
        'income.otherIncome.update': Joi.boolean().strict(),
        'income.otherIncome.cancel': Joi.boolean().strict(),
        'income.otherIncome.delete': Joi.boolean().strict(),
        'income.otherIncome.export': Joi.boolean().strict(),
        'income.otherIncome.search': Joi.boolean().strict(),
        'income.otherIncome.time.onlyShowLastDays': Joi.number()
          .integer()
          .strict(),
        'income.receivedPayments.readOwner': Joi.boolean().strict(),
        'income.receivedPayments.readAll': Joi.boolean().strict(),
        'income.receivedPayments.create': Joi.boolean().strict(),
        'income.receivedPayments.update': Joi.boolean().strict(),
        'income.receivedPayments.cancel': Joi.boolean().strict(),
        'income.receivedPayments.delete': Joi.boolean().strict(),
        'income.receivedPayments.export': Joi.boolean().strict(),
        'income.receivedPayments.search': Joi.boolean().strict(),
        'income.receivedPayments.time.onlyShowLastDays': Joi.number()
          .integer()
          .strict(),
        'income.promotions.read': Joi.boolean().strict(),
        'income.promotions.create': Joi.boolean().strict(),
        'income.promotions.update': Joi.boolean().strict(),
        'income.promotions.activate': Joi.boolean().strict(),
        'income.promotions.deactivate': Joi.boolean().strict(),
        'income.promotions.close': Joi.boolean().strict(),
        'income.promotions.cancel': Joi.boolean().strict(),
        'income.promotions.delete': Joi.boolean().strict(),
        'income.promotions.export': Joi.boolean().strict(),
        'income.promotions.search': Joi.boolean().strict(),
        'income.promotions.time.onlyShowLastDays': Joi.number()
          .integer()
          .strict(),
        'income.invoicing.readOwner': Joi.boolean().strict(),
        'income.invoicing.readAll': Joi.boolean().strict(),
        'income.invoicing.createInvoice': Joi.boolean().strict(),
        'income.invoicing.createGroupedInvoice': Joi.boolean().strict(),
        'income.invoicing.createCreditNote': Joi.boolean().strict(),
        'income.invoicing.cancelInvoice': Joi.boolean().strict(),
        'income.invoicing.cancelCreditNote': Joi.boolean().strict(),
        'income.categories.read': Joi.boolean().strict(),
        'income.categories.create': Joi.boolean().strict(),
        'income.categories.update': Joi.boolean().strict(),
        'income.categories.archive': Joi.boolean().strict(),
        'income.categories.unarchive': Joi.boolean().strict(),
        'income.categories.delete': Joi.boolean().strict(),
        'income.income_MEX.process.importarCFDIsDeIngresos': Joi.boolean().strict(),
        'moneyAccounts.accounts.read': Joi.boolean().strict(),
        'moneyAccounts.accounts.create': Joi.boolean().strict(),
        'moneyAccounts.accounts.update': Joi.boolean().strict(),
        'moneyAccounts.accounts.activate': Joi.boolean().strict(),
        'moneyAccounts.accounts.deactivate': Joi.boolean().strict(),
        'moneyAccounts.accounts.delete': Joi.boolean().strict(),
        'moneyAccounts.accounts.export': Joi.boolean().strict(),
        'moneyAccounts.accounts.search': Joi.boolean().strict(),
        'moneyAccounts.accounts.data.accountBalance': Joi.boolean().strict(),
        'moneyAccounts.accounts.process.addUser': Joi.boolean().strict(),
        'moneyAccounts.accounts.process.removeUser': Joi.boolean().strict(),
        'moneyAccounts.transactions.data.readAccountBalance': Joi.boolean().strict(),
        'moneyAccounts.transactions.data.readAccountTransactions': Joi.boolean().strict(),
        'moneyAccounts.transactions.cancelTransaction': Joi.boolean().strict(),
        'moneyAccounts.transactions.deleteTransaction': Joi.boolean().strict(),
        'moneyAccounts.transactions.process.createAdjustTransaction': Joi.boolean().strict(),
        'moneyAccounts.transactions.process.createDepositTransaction': Joi.boolean().strict(),
        'moneyAccounts.transactions.process.createWithdrawalTransaction': Joi.boolean().strict(),
        'moneyAccounts.transactions.exportTransactions': Joi.boolean().strict(),
        'moneyAccounts.transactions.time.onlyShowLastDays': Joi.number()
          .integer()
          .strict(),
        'moneyAccounts.bankConnections.process.connectToBank': Joi.boolean().strict(),
        'moneyAccounts.bankConnections.process.disconnectFromBank': Joi.boolean().strict(),
        'moneyAccounts.bankConnections.read': Joi.boolean().strict(),
        'moneyAccounts.bankConnections.update': Joi.boolean().strict(),
        'moneyAccounts.bankConnections.time.onlyShowLastDays': Joi.number()
          .integer()
          .strict(),
        'reports.businessHealth.read': Joi.boolean().strict(),
        'reports.businessHealth.time.onlyShowLastDays': Joi.number()
          .integer()
          .strict(),
        'reports.expensesReports.read': Joi.boolean().strict(),
        'reports.expensesReports.time.onlyShowLastDays': Joi.number()
          .integer()
          .strict(),
        'reports.inventoryReports.read': Joi.boolean().strict(),
        'reports.inventoryReports.time.onlyShowLastDays': Joi.number()
          .integer()
          .strict(),
        'reports.salesReports.read': Joi.boolean().strict(),
        'reports.salesReports.time.onlyShowLastDays': Joi.number()
          .integer()
          .strict(),
        'pos.shift.readOwner': Joi.boolean().strict(),
        'pos.shift.readAll': Joi.boolean().strict(),
        'pos.shift.startShift': Joi.boolean().strict(),
        'pos.shift.finishShift': Joi.boolean().strict(),
        'pos.shift.process.depositCash': Joi.boolean().strict(),
        'pos.shift.process.withdrawCash': Joi.boolean().strict(),
        'pos.shift.special.reprintTicket': Joi.boolean().strict(),
        'config.users.readAll': Joi.boolean().strict(),
        'config.users.invite': Joi.boolean().strict(),
        'config.users.suspend': Joi.boolean().strict(),
        'config.users.reactivate': Joi.boolean().strict(),
        'config.users.delete': Joi.boolean().strict(),
        'config.users.defineBranchesPermissions': Joi.boolean().strict(),
        'config.users.defineCompanyPermissions': Joi.boolean().strict(),
        'config.users.GlobalPermissions': Joi.boolean().strict(),
        'config.branches.read': Joi.boolean().strict(),
        'config.branches.create': Joi.boolean().strict(),
        'config.branches.update': Joi.boolean().strict(),
        'config.branches.deactivate': Joi.boolean().strict(),
        'config.branches.reactivate': Joi.boolean().strict(),
        'config.branches.delete': Joi.boolean().strict(),
        'config.inventory.config': Joi.boolean().strict(),
        'config.pos.config': Joi.boolean().strict(),
        'config.income.config': Joi.boolean().strict(),
        'config.expenses.config': Joi.boolean().strict(),
        'config.payroll.config': Joi.boolean().strict(),
        'config.bankAccouns.config': Joi.boolean().strict(),
        'config.company.update.generalInfo': Joi.boolean().strict(),
        'config.company.update.taxInfo': Joi.boolean().strict(),
        'config.company.process.addCertificate': Joi.boolean().strict(),
        'config.company.process.changeSelectedCertificate': Joi.boolean().strict(),
        'config.company.process.removeCertificate': Joi.boolean().strict(),
        'config.company.suspend': Joi.boolean().strict(),
        'config.company.delete': Joi.boolean().strict(),
        'integrations.activatePersonal': Joi.boolean().strict(),
        'integrations.activateOnBehalf': Joi.boolean().strict(),
        'integrations.deactivateOnBehalf': Joi.boolean().strict(),
      }).required(),
    });
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
}
