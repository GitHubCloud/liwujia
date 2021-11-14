import {
  registerDecorator,
  ValidationOptions,
  ValidatorConstraint,
  ValidatorConstraintInterface,
  ValidationArguments,
} from 'class-validator';
import * as moment from 'moment';
import { getConnection } from 'typeorm';

@ValidatorConstraint({ async: true })
export class IsExistsInTableConstraint implements ValidatorConstraintInterface {
  async validate(val: any, args: ValidationArguments) {
    const table = args.constraints[0]?.table;
    const field = args.constraints[0]?.field;
    if (!table || !field) return false;

    const result = await getConnection().query(
      `SELECT COUNT(*) as count FROM \`${table}\` WHERE \`${field}\` = ?`,
      [val],
    );

    return !!Number(result[0]?.count);
  }

  defaultMessage(validationArguments?: ValidationArguments) {
    return `${validationArguments?.property} ${validationArguments?.value} doesn't exists`;
  }
}

export function IsExistsInTable(
  table: string,
  field = 'id',
  validationOptions?: ValidationOptions,
) {
  return function (object: any, propertyName: string) {
    registerDecorator({
      target: object.constructor,
      propertyName: propertyName,
      options: validationOptions,
      constraints: [{ table, field }],
      validator: IsExistsInTableConstraint,
    });
  };
}

@ValidatorConstraint({ async: true })
export class IsDateLikeConstraint implements ValidatorConstraintInterface {
  async validate(val: any, args: ValidationArguments) {
    try {
      return moment(val).isValid();
    } catch {
      return false;
    }
  }

  defaultMessage(validationArguments?: ValidationArguments) {
    return `${validationArguments?.value} is not valid Date`;
  }
}

export function IsDateLike(validationOptions?: ValidationOptions) {
  return function (object: any, propertyName: string) {
    registerDecorator({
      target: object.constructor,
      propertyName: propertyName,
      options: validationOptions,
      constraints: [],
      validator: IsDateLikeConstraint,
    });
  };
}

@ValidatorConstraint({ async: true })
export class DateCompareConstraint implements ValidatorConstraintInterface {
  async validate(val: any, args: ValidationArguments) {
    const compareTo = args.constraints[0]?.compareTo;
    const method = args.constraints[0]?.method;

    try {
      let flag = false;
      switch (method) {
        case 'after':
          flag = moment(val).isAfter(compareTo);
          break;
        case 'before':
          flag = moment(val).isBefore(compareTo);
          break;
        case 'same':
          flag = moment(val).isSame(compareTo);
          break;
      }
      return flag;
    } catch {
      return false;
    }
  }

  defaultMessage(validationArguments?: ValidationArguments) {
    return `${validationArguments?.value} is not valid Date`;
  }
}

export function DateCompare(
  method: 'after' | 'before' | 'same',
  compareTo?: any,
  validationOptions?: ValidationOptions,
) {
  return function (object: any, propertyName: string) {
    registerDecorator({
      target: object.constructor,
      propertyName: propertyName,
      options: validationOptions,
      constraints: [{ compareTo: compareTo || new Date(), method }],
      validator: DateCompareConstraint,
    });
  };
}
