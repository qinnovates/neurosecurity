/**
 * Test-only loader. It reads the same files as load-engine-data.ts, from disk,
 * because vitest runs without the site's `@shared` import alias.
 */

import fs from 'node:fs';
import path from 'node:path';
import { buildEngineData, type EngineDataBundle } from '../build-engine-data';
import { parseArchetypes } from '../parse-archetypes';
import { parseComplianceUs } from '../parse-compliance';
import { parsePlacementRules, parseStrideMap, parseThreatThemes } from '../parse-mappings';
import type { ReferenceData } from '../reference-data-types';

export function readDataFile(relativePath: string): unknown {
  return JSON.parse(fs.readFileSync(path.resolve('datalake', relativePath), 'utf-8')) as unknown;
}

export function loadEngineBundle(): EngineDataBundle {
  return buildEngineData({
    registrar: readDataFile('qtara-registrar.json'),
    atlas: readDataFile('qif-brain-bci-atlas.json'),
    cveMapping: readDataFile('cve-technique-mapping.json'),
    securityControls: readDataFile('qif-security-controls.json'),
  });
}

export function loadReferenceData(bundle: EngineDataBundle): ReferenceData {
  const regionIds = new Set(bundle.engineData.regions.map((region) => region.id));
  return {
    archetypes: parseArchetypes(readDataFile('threat-model/archetypes.json'), regionIds),
    placementRules: parsePlacementRules(readDataFile('threat-model/technique-placement.json'), bundle.engineData.techniques),
    strideMap: parseStrideMap(readDataFile('threat-model/stride-map.json'), bundle.tacticIds),
    themes: parseThreatThemes(readDataFile('threat-model/threat-themes.json'), bundle.engineData.techniques),
    compliance: parseComplianceUs(readDataFile('threat-model/compliance-us.json')),
  };
}
