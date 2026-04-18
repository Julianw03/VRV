import { registerDecorator, ValidationArguments, ValidationOptions } from 'class-validator';
import semverValid from 'semver/functions/parse';

export function IsSemver(
    validationOptions?: ValidationOptions,
) {
    return function(object: Object, propertyName: string) {
        registerDecorator({
            name: 'IsSemver',
            target: object.constructor,
            propertyName,
            options: validationOptions,
            validator: {
                validate(value: any, _args: ValidationArguments) {
                    if (typeof value !== 'string') {
                        return false;
                    }

                    return semverValid(value) !== null;
                },

                defaultMessage(args: ValidationArguments) {
                    return `${args.property} must be a valid semantic version string (e.g., "1.0.0", "2.1.3-beta")`;
                },
            },
        });
    };
}