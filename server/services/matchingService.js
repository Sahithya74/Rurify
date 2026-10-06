const { haversineKm } = require('../utils/haversine');

/**
 * Transparent, rule-based supplier match score (0-100). Every sub-score is
 * normalized 0-100 and combined with fixed, documented weights so the score
 * can be explained to a retailer or a vendor — this is NOT machine learning.
 */
const WEIGHTS = {
  distance: 0.25,
  price: 0.2,
  availability: 0.15,
  moq: 0.1,
  freshness: 0.1,
  delivery: 0.1,
  reliability: 0.1,
};

const FRESHNESS_SCORE = { FRESH: 100, GOOD: 75, AVERAGE: 50 };

function clamp(n, min = 0, max = 100) {
  return Math.max(min, Math.min(max, n));
}

function scoreCandidate(inventoryRow, { distanceKm, cheapestPrice, requestedQty }) {
  const distanceScore = clamp(100 - distanceKm * 2);
  const priceScore = clamp(100 * (cheapestPrice / inventoryRow.price));

  const qtyNeeded = requestedQty || 1;
  const availabilityScore =
    inventoryRow.quantity >= qtyNeeded ? 100 : clamp((inventoryRow.quantity / qtyNeeded) * 100);

  const moqScore = requestedQty
    ? requestedQty >= inventoryRow.moq
      ? 100
      : clamp((requestedQty / inventoryRow.moq) * 100)
    : clamp(100 - (inventoryRow.moq - 1) * 5);

  const freshnessScore = FRESHNESS_SCORE[inventoryRow.freshness] ?? 50;
  const deliveryScore = inventoryRow.deliveryAvailable ? 100 : 50;
  const reliabilityScore = clamp(inventoryRow.Vendor?.reliabilityScore ?? 75);

  const breakdown = {
    distance: Math.round(distanceScore),
    price: Math.round(priceScore),
    availability: Math.round(availabilityScore),
    moq: Math.round(moqScore),
    freshness: Math.round(freshnessScore),
    delivery: Math.round(deliveryScore),
    reliability: Math.round(reliabilityScore),
  };

  const matchScore = Math.round(
    breakdown.distance * WEIGHTS.distance +
      breakdown.price * WEIGHTS.price +
      breakdown.availability * WEIGHTS.availability +
      breakdown.moq * WEIGHTS.moq +
      breakdown.freshness * WEIGHTS.freshness +
      breakdown.delivery * WEIGHTS.delivery +
      breakdown.reliability * WEIGHTS.reliability
  );

  return { matchScore, breakdown, distanceKm: Math.round(distanceKm * 10) / 10 };
}

/**
 * Ranks active inventory rows for a product against a retailer's location.
 * @param {Array} inventoryRows - Inventory rows with their Vendor included.
 * @param {{lat:number, lng:number}} retailerLocation
 * @param {number} [requestedQty]
 */
function rankSuppliers(inventoryRows, retailerLocation, requestedQty) {
  const eligible = inventoryRows.filter((row) => row.isActive && row.Vendor);
  if (eligible.length === 0) return [];

  const cheapestPrice = Math.min(...eligible.map((row) => row.price));

  return eligible
    .map((row) => {
      const distanceKm = haversineKm(
        retailerLocation.lat,
        retailerLocation.lng,
        row.Vendor.lat,
        row.Vendor.lng
      );
      const { matchScore, breakdown } = scoreCandidate(row, {
        distanceKm,
        cheapestPrice,
        requestedQty,
      });
      return {
        inventory: row,
        matchScore,
        breakdown,
        distanceKm: Math.round(distanceKm * 10) / 10,
      };
    })
    .sort((a, b) => b.matchScore - a.matchScore);
}

module.exports = { rankSuppliers, WEIGHTS };
