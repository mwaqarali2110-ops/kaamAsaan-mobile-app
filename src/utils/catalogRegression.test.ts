import { normalizeProductCategory } from './productCategory';
import { isCatalogProductVisible, isPackageGenerationProduct } from './productEligibility';

const assert = (condition: unknown, message: string) => {
  if (!condition) throw new Error(message);
};

export function runCatalogRegressionTests() {
  for (const category of ['battery', 'batteries', 'Battery', 'BATTERY', 'solar battery', 'lithium battery']) {
    assert(normalizeProductCategory({ category }) === 'battery', `Battery category was not normalized: ${category}`);
  }
  assert(normalizeProductCategory({ category: 'legacy', name: 'Lithium Battery 5kWh' }) === 'battery', 'Legacy battery name was not recognized.');
  assert(isCatalogProductVisible({ isActive: true, packageEligible: null }), 'Legacy null package flag incorrectly hid a catalog product.');
  assert(isCatalogProductVisible({ isActive: null, packageEligible: null }), 'Legacy null active flag incorrectly hid a catalog product.');
  assert(!isCatalogProductVisible({ isActive: false }), 'Explicitly inactive product remained catalog-visible.');
  assert(!isPackageGenerationProduct({ isActive: true, packageEligible: null, brandPackageGenerationEnabled: true }), 'Unconfigured legacy product entered final package generation.');
  assert(isPackageGenerationProduct({ isActive: true, packageEligible: true, brandPackageGenerationEnabled: true }), 'Fully configured product was rejected from package generation.');
  assert(normalizeProductCategory({ category: 'inverter' }) === 'inverter', 'Inverter normalization regressed.');
  assert(normalizeProductCategory({ category: 'solar_panel' }) === 'panel', 'Panel normalization regressed.');
  return 10;
}

runCatalogRegressionTests();
console.log('Catalog regression: 10 scenarios passed.');
