/**
 * The one place the threat model feature imports data files. It validates them and
 * hands plain objects to the engine. Call it from page frontmatter so malformed
 * data throws during `npm run build`.
 */

import registrar from '@shared/qtara-registrar.json';
import atlas from '@shared/qif-brain-bci-atlas.json';
import cveMapping from '@shared/cve-technique-mapping.json';
import securityControls from '@shared/qif-security-controls.json';
import archetypes from '@shared/threat-model/archetypes.json';
import complianceUs from '@shared/threat-model/compliance-us.json';
import strideMap from '@shared/threat-model/stride-map.json';
import threatThemes from '@shared/threat-model/threat-themes.json';
import techniquePlacement from '@shared/threat-model/technique-placement.json';
import { buildEngineData } from '@/lib/threat-model/build-engine-data';
import type { EngineData } from '@/lib/threat-model/catalog-types';
import { parseArchetypes } from '@/lib/threat-model/parse-archetypes';
import { parseComplianceUs } from '@/lib/threat-model/parse-compliance';
import { parsePlacementRules, parseStrideMap, parseThreatThemes } from '@/lib/threat-model/parse-mappings';
import type { ReferenceData } from '@/lib/threat-model/reference-data-types';

export interface ThreatModelData {
  engineData: EngineData;
  referenceData: ReferenceData;
}

export function loadThreatModelData(): ThreatModelData {
  const { engineData, tacticIds } = buildEngineData({ registrar, atlas, cveMapping, securityControls });
  const regionIds = new Set(engineData.regions.map((region) => region.id));
  return {
    engineData,
    referenceData: {
      archetypes: parseArchetypes(archetypes, regionIds),
      placementRules: parsePlacementRules(techniquePlacement, engineData.techniques),
      strideMap: parseStrideMap(strideMap, tacticIds),
      themes: parseThreatThemes(threatThemes, engineData.techniques),
      compliance: parseComplianceUs(complianceUs),
    },
  };
}
