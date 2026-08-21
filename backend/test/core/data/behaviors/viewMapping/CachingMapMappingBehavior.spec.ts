import { OuputMappingCachingMapBehavior } from '@/core/data/behaviors/viewMapping/OuputMappingCachingMapBehavior';
import { runMapMappingBehaviorSuite } from './shared/mapMappingBehaviorSuite';
import { describe } from 'vitest';

describe('CachingMapMappingBehavior', () => {
    runMapMappingBehaviorSuite(
        (inner, mappingFn) => new OuputMappingCachingMapBehavior(inner, mappingFn),
    );

});
