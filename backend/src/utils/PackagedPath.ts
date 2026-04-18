import path from 'path';

export const getPackageAwarePath = (...segments: string[]) => {
    return path.join(__dirname, '..', "..", ...segments);
}