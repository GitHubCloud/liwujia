import {
  registerDecorator,
  ValidationOptions,
  ValidatorConstraint,
  ValidatorConstraintInterface,
  ValidationArguments,
} from 'class-validator';
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
