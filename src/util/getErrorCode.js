import { errors } from './errors';
export class ErrorCode {
  getErrorCode(data) {
    const type = data.type;
    if (type.includes('.regex.base')) {
      const error = errors.filter(obj => {
        return (
          obj.errorMessage &&
          obj.errorMessage.includes('fails to match the required pattern')
        );
      });
      // console.log(data)
      error[0].errorMessage = data.message;
      return error[0];
    } else {
      if (type.includes('string.max')) {
        const error = errors.filter(obj => {
          return obj.errorMessage && obj.errorMessage.includes('maxLength');
        });
        error[0].errorMessage = this.replaceDynamicsNumericFields(data.message);
        return error[0];
      }
      if (type.includes('string.min')) {
        const error = errors.filter(obj => {
          return obj.errorMessage && obj.errorMessage.includes('minLength');
        });
        error[0].errorMessage = this.replaceDynamicsNumericFields(data.message);
        return error[0];
      }
      if (type.includes('number.min')) {
        const error = errors.filter(obj => {
          return obj.errorMessage && obj.errorMessage.includes('minValue');
        });
        error[0].errorMessage = this.replaceLastDynamics(data.message);
        return error[0];
      }
      if (type.includes('number.max')) {
        const error = errors.filter(obj => {
          return obj.errorMessage && obj.errorMessage.includes('maxValue');
        });
        error[0].errorMessage = this.replaceLastDynamics(data.message);
        return error[0];
      }
      if (type.includes('.base')) {
        const error = errors.filter(obj => {
          return obj.errorMessage && obj.errorMessage.includes('must be a ');
        });
        error[0].errorMessage = this.replaceLastDynamics(data.message);
        return error[0];
      }
      if (type.includes('.allowUnknown')) {
        const error = errors.filter(obj => {
          return (
            obj.errorMessage && obj.errorMessage.includes('is not allowed')
          );
        });
        error[0].errorMessage = data.message;
        return error[0];
      }
      if (type.includes('any.empty')) {
        const error = errors.filter(obj => {
          return obj.errorMessage && obj.errorMessage.includes('empty');
        });
        error[0].errorMessage = data.message;
        return error[0];
      }
      if (type.includes('any.required')) {
        const error = errors.filter(obj => {
          return obj.errorMessage && obj.errorMessage.includes('required');
        });
        error[0].errorMessage = data.message;
        return error[0];
      }
    }
  }
  replaceDynamicsNumericFields(data) {
    const findNumber = data.match(/(\d+)/);
    const message = ` ${data.substring(
      0,
      findNumber.index - 1
    )} {${data.substring(
      findNumber.index,
      findNumber.index + data.substring(findNumber.index).indexOf(' ')
    )}} ${data.substring(
      findNumber.index + data.substring(findNumber.index).indexOf(' ') + 1
    )}`;
    return message;
  }
  replaceLastDynamics(data) {
    const replacedynamicType =
      data.substring(0, data.lastIndexOf(' ')) +
      ` {${data.substring(data.lastIndexOf(' ') + 1, data.length)}}`;
    return replacedynamicType;
  }
}
