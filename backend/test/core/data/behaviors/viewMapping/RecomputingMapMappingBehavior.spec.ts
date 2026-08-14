import { OutputMappingRecomputingMapBehavior } from '@/core/data/behaviors/viewMapping/OutputMappingRecomputingMapBehavior';
import { runMapMappingBehaviorSuite } from './shared/mapMappingBehaviorSuite';
import { describe } from 'vitest';

describe('RecomputingMapMappingBehavior', () => {
    runMapMappingBehaviorSuite(
        (inner, mappingFn) => new OutputMappingRecomputingMapBehavior(inner, mappingFn),
    );
});
