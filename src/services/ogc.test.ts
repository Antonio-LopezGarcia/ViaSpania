// @vitest-environment jsdom
import { describe, expect, it } from 'vitest';
import { COPERNICUS_VHR_2021_LAYER, COPERNICUS_VHR_2021_WMS, parseCoverageIds } from './ogc';

describe('WCS GetCapabilities', () => {
  it('lee CoverageId con namespace WCS', () => {
    const xml = `<?xml version="1.0"?><wcs:Capabilities xmlns:wcs="http://www.opengis.net/wcs/2.0"><wcs:Contents><wcs:CoverageSummary><wcs:CoverageId>Elevacion4258_5</wcs:CoverageId></wcs:CoverageSummary></wcs:Contents></wcs:Capabilities>`;
    expect(parseCoverageIds(xml)).toEqual(['Elevacion4258_5']);
  });

  it('rechaza XML inválido', () => {
    expect(() => parseCoverageIds('<wcs:Capabilities>')).toThrow(/XML no válido/);
  });
});

describe('Copernicus VHR 2021', () => {
  it('usa el WMS paneuropeo oficial y su capa publicada', () => {
    expect(new URL(COPERNICUS_VHR_2021_WMS).hostname).toBe('copernicus.discomap.eea.europa.eu');
    expect(COPERNICUS_VHR_2021_LAYER).toBe('VHR_2021_LAEA');
  });
});
