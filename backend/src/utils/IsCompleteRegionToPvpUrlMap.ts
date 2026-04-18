import {
    registerDecorator,
    ValidationOptions,
    ValidationArguments,
} from 'class-validator';
import { SupportedRegion } from '@/config/ConfigV1DTO';

export function IsCompleteRegionToPvpUrlMap(
    validationOptions?: ValidationOptions,
) {
    return function (object: Object, propertyName: string) {
        registerDecorator({
            name: 'IsCompleteRegionToPvpUrlMap',
            target: object.constructor,
            propertyName,
            options: validationOptions,
            validator: {
                validate(value: any, _args: ValidationArguments) {
                    if (typeof value !== 'object' || value === null || Array.isArray(value)) {
                        return false;
                    }

                    const regions = Object.values(SupportedRegion);

                    for (const region of regions) {
                        const urlValue = value[region];

                        if (typeof urlValue !== 'string') {
                            return false;
                        }

                        try {
                            const url = new URL(urlValue);

                            if (!url.hostname.endsWith('.pvp.net')) {
                                return false;
                            }
                        } catch {
                            return false;
                        }
                    }

                    return true;
                },

                defaultMessage(args: ValidationArguments) {
                    const regions = Object.values(SupportedRegion).join(', ');
                    return `${args.property} must contain all regions (${regions}) with valid .pvp.net URLs`;
                },
            },
        });
    };
}