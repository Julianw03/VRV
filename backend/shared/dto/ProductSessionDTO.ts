export interface ProductSessionLaunchConfig {
    readonly arguments: Array<string>
    readonly executable: string
    readonly locale: string
    readonly workingDirectory: string
}

export interface ProductSession {
    readonly productId: string
    readonly isInternal: boolean
    readonly launchConfiguration: ProductSessionLaunchConfig
}