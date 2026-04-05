// ═══════════════════════════════════════════════════════════════
// HWUTIL — Shared hardware brand/component detection utilities
// Used by moveset.js (gating) and signature.js (naming)
// ═══════════════════════════════════════════════════════════════

function getCpuBrand(specs) {
  const brand = (specs?.cpu?.brand || '').toLowerCase();
  const mfr = (specs?.cpu?.manufacturer || '').toLowerCase();
  if (brand.includes('ryzen') || brand.includes('threadripper') || mfr.includes('amd')) return 'amd';
  if (brand.includes('apple') || brand.includes('m1') || brand.includes('m2') || brand.includes('m3') || brand.includes('m4')) return 'apple';
  return 'intel';
}

function getGpuBrand(specs) {
  const model = (specs?.gpu?.model || '').toLowerCase();
  const vendor = (specs?.gpu?.vendor || '').toLowerCase();
  if (model.includes('nvidia') || model.includes('geforce') || model.includes('rtx') || model.includes('gtx') || vendor.includes('nvidia')) return 'nvidia';
  if (model.includes('radeon') || model.includes('rx ') || vendor.includes('amd')) return 'amd';
  if (model.includes('arc') || model.includes('intel')) return 'intel';
  return 'nvidia'; // default
}

function getStorageType(specs) {
  const type = (specs?.storage?.type || '').toLowerCase();
  if (type.includes('nvme')) return 'nvme';
  if (type.includes('ssd')) return 'ssd';
  return 'hdd';
}

function getRamTier(specs) {
  const totalGB = specs?.ram?.totalGB || 8;
  if (totalGB >= 32) return 'high';
  if (totalGB >= 16) return 'mid';
  return 'low';
}

module.exports = { getCpuBrand, getGpuBrand, getStorageType, getRamTier };
