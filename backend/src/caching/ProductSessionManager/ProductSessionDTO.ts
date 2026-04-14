import { IsArray, IsObject, IsString } from 'class-validator';

export class ProductSessionDTO {
    @IsString()
    readonly productId: string;
    @IsString()
    readonly isInternal: boolean;
    @IsObject()
    readonly launchConfiguration: ProductSessionLaunchConfigDTO;
}

export class ProductSessionLaunchConfigDTO {
    @IsArray()
    readonly arguments: Array<string>;
    @IsString()
    readonly executable: string;
    @IsString()
    readonly locale: string;
    @IsString()
    readonly workingDirectory: string;
}
