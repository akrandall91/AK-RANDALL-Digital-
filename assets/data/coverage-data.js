/**
 * Public-safe coverage data.
 *
 * Pursuit and confirmed-project totals are anonymized aggregates from the 2024-2026 CRM
 * export. Region coordinates are centroids, not customer or project sites.
 * Dossiers are distilled from the procurement evidence register and omit
 * agency, employer, competitor, contact, pricing, and contract identifiers.
 * Field coordinates remain rounded and organization names are excluded.
 */
window.AKRD_COVERAGE = {
  meta: {
    updated: '2026-07-22',
    pursuitRecords: 351,
    locationResolvedPursuits: 342,
    locationUnresolvedPursuits: 9,
    regions: 39,
    usJurisdictions: 38,
    cityPairs: 206,
    recordedWins: 46,
    locationResolvedWins: 45,
    locationUnresolvedWins: 1,
    winRegions: 20,
    winCityPairs: 37,
    dossiers: 8,
    confirmedAwardsOrAgreements: 8,
    multiYearVehicles: 5,
    purchaseOrders: 2,
    mappedFieldRecords: 41,
    fieldJurisdictions: 18,
    fieldDocumented: 28
  },

  pursuitSummary: {
    2024: { pursuits: 173, regions: 32, cities: 118, outcomes: 27 },
    2025: { pursuits: 323, regions: 39, cities: 194, outcomes: 44 },
    2026: { pursuits: 351, regions: 39, cities: 206, outcomes: 46 }
  },

  pursuitRegions: [
    { region: 'AK', label: 'Alaska', lat: 64.2, lng: -152.0, cities: 1, pursuits: [0,1,0], wins: [0,0,0] },
    { region: 'AL', label: 'Alabama', lat: 32.8, lng: -86.8, cities: 3, pursuits: [2,0,1], wins: [0,0,0] },
    { region: 'AR', label: 'Arkansas', lat: 34.8, lng: -92.2, cities: 1, pursuits: [1,0,0], wins: [0,0,0] },
    { region: 'AZ', label: 'Arizona', lat: 34.3, lng: -111.8, cities: 7, pursuits: [4,4,0], wins: [0,0,0] },
    { region: 'CA', label: 'California', lat: 37.2, lng: -119.7, cities: 25, pursuits: [18,16,11], wins: [2,1,0] },
    { region: 'CO', label: 'Colorado', lat: 39.0, lng: -105.5, cities: 5, pursuits: [2,4,0], wins: [0,1,0] },
    { region: 'DC', label: 'District of Columbia', lat: 38.91, lng: -77.04, cities: 1, pursuits: [0,1,0], wins: [0,1,0] },
    { region: 'FL', label: 'Florida', lat: 28.1, lng: -82.1, cities: 20, pursuits: [32,28,3], wins: [5,4,0] },
    { region: 'GA', label: 'Georgia', lat: 32.7, lng: -83.3, cities: 3, pursuits: [2,4,0], wins: [0,0,0] },
    { region: 'HI', label: 'Hawaii', lat: 20.8, lng: -157.5, cities: 1, pursuits: [0,1,0], wins: [0,0,0] },
    { region: 'IA', label: 'Iowa', lat: 42.1, lng: -93.5, cities: 1, pursuits: [1,0,0], wins: [0,0,0] },
    { region: 'IL', label: 'Illinois', lat: 40.0, lng: -89.2, cities: 7, pursuits: [6,1,0], wins: [1,1,0] },
    { region: 'IN', label: 'Indiana', lat: 39.9, lng: -86.3, cities: 4, pursuits: [3,1,0], wins: [0,1,0] },
    { region: 'KS', label: 'Kansas', lat: 38.5, lng: -98.3, cities: 3, pursuits: [0,2,1], wins: [0,0,0] },
    { region: 'KY', label: 'Kentucky', lat: 37.8, lng: -85.8, cities: 1, pursuits: [0,1,0], wins: [0,0,0] },
    { region: 'LA', label: 'Louisiana', lat: 31.0, lng: -92.0, cities: 9, pursuits: [2,11,0], wins: [0,0,0] },
    { region: 'MD', label: 'Maryland', lat: 39.0, lng: -76.7, cities: 3, pursuits: [3,1,0], wins: [1,0,0] },
    { region: 'MI', label: 'Michigan', lat: 44.3, lng: -85.6, cities: 2, pursuits: [0,2,0], wins: [0,1,0] },
    { region: 'MN', label: 'Minnesota', lat: 46.4, lng: -94.6, cities: 15, pursuits: [14,6,0], wins: [2,1,0] },
    { region: 'MO', label: 'Missouri', lat: 38.5, lng: -92.5, cities: 3, pursuits: [4,1,2], wins: [1,0,0] },
    { region: 'MS', label: 'Mississippi', lat: 32.7, lng: -89.7, cities: 2, pursuits: [2,0,0], wins: [0,0,0] },
    { region: 'MT', label: 'Montana', lat: 47.0, lng: -109.5, cities: 2, pursuits: [2,0,0], wins: [0,0,0] },
    { region: 'NC', label: 'North Carolina', lat: 35.5, lng: -79.4, cities: 14, pursuits: [16,10,0], wins: [2,0,0] },
    { region: 'NJ', label: 'New Jersey', lat: 40.1, lng: -74.5, cities: 5, pursuits: [4,3,1], wins: [2,0,0] },
    { region: 'NM', label: 'New Mexico', lat: 34.5, lng: -106.0, cities: 1, pursuits: [0,1,0], wins: [0,0,0] },
    { region: 'NV', label: 'Nevada', lat: 39.0, lng: -116.6, cities: 1, pursuits: [1,1,0], wins: [0,0,0] },
    { region: 'NY', label: 'New York', lat: 42.9, lng: -75.4, cities: 11, pursuits: [11,10,0], wins: [4,1,0] },
    { region: 'OH', label: 'Ohio', lat: 40.4, lng: -82.8, cities: 6, pursuits: [4,4,1], wins: [1,0,0] },
    { region: 'PA', label: 'Pennsylvania', lat: 40.9, lng: -77.7, cities: 9, pursuits: [6,4,1], wins: [0,1,0] },
    { region: 'QC', label: 'Quebec', lat: 45.5, lng: -73.6, cities: 1, pursuits: [5,2,2], wins: [0,2,1] },
    { region: 'SC', label: 'South Carolina', lat: 33.8, lng: -80.9, cities: 6, pursuits: [4,6,1], wins: [1,0,0] },
    { region: 'SD', label: 'South Dakota', lat: 44.4, lng: -100.2, cities: 1, pursuits: [1,0,0], wins: [0,0,0] },
    { region: 'TN', label: 'Tennessee', lat: 35.8, lng: -86.4, cities: 4, pursuits: [2,2,1], wins: [0,0,0] },
    { region: 'TX', label: 'Texas', lat: 31.4, lng: -99.3, cities: 13, pursuits: [5,12,0], wins: [2,2,0] },
    { region: 'UT', label: 'Utah', lat: 39.3, lng: -111.7, cities: 2, pursuits: [1,0,1], wins: [0,0,0] },
    { region: 'VA', label: 'Virginia', lat: 37.5, lng: -78.8, cities: 6, pursuits: [8,1,0], wins: [1,0,0] },
    { region: 'WA', label: 'Washington', lat: 47.4, lng: -120.7, cities: 4, pursuits: [2,3,1], wins: [2,0,0] },
    { region: 'WI', label: 'Wisconsin', lat: 44.6, lng: -89.6, cities: 2, pursuits: [1,1,0], wins: [0,0,0] },
    { region: 'WY', label: 'Wyoming', lat: 43.0, lng: -107.6, cities: 1, pursuits: [1,0,0], wins: [0,0,0] }
  ],

  dossiers: [
    { id: 'd1', year: 2025, lat: 36.1, lng: -119.0, location: 'Central California', category: 'Transit', title: 'Competitive RFP award', path: 'Best-value procurement', detail: 'Requirements analysis, technical response, competition, and a publicly confirmed award.', evidence: 'Award confirmed', level: 4, confirmed: true, multiYear: true, po: false },
    { id: 'd2', year: 2025, lat: 28.5, lng: -81.4, location: 'Central Florida', category: 'Smart Infrastructure', title: 'Executed design-build contract', path: 'Master agreement', detail: 'A competitive response became an executed contract for future service authorizations.', evidence: 'Contract confirmed', level: 4, confirmed: true, multiYear: true, po: false },
    { id: 'd3', year: 2025, lat: 33.9, lng: -118.2, location: 'Southern California', category: 'Transit', title: 'Master agreement to delivery order', path: 'Task-order procurement', detail: 'Standing agreement, itemized order, engineering submittal, installation scope, and scheduled delivery.', evidence: 'Order confirmed', level: 5, confirmed: true, multiYear: true, po: true },
    { id: 'd4', year: 2025, lat: 26.7, lng: -80.1, location: 'Southeast Florida', category: 'Transit', title: 'Countywide requirements contract', path: 'Multi-category contract', detail: 'Pre-established categories and pricing converted into an issued delivery order.', evidence: 'Order confirmed', level: 5, confirmed: true, multiYear: true, po: true },
    { id: 'd5', year: 2025, lat: 41.1, lng: -73.8, location: 'Lower Hudson Valley', category: 'Transit', title: 'Prime-contractor supply project', path: 'Distributor-led public work', detail: 'Technical scope, phased quantities, drawings, and supplier pricing supported a confirmed customer project through a public-works bidder.', evidence: 'Customer project confirmed', level: 2, confirmed: true, multiYear: true, po: false },
    { id: 'd6', year: 2025, lat: 34.18, lng: -118.53, location: 'Southern California', category: 'Parks & Trails', title: 'Specified-product public project', path: 'Specified-product strategy', detail: 'A named technical specification created demand through prime contractors and became a confirmed customer project.', evidence: 'Customer project confirmed', level: 3, confirmed: true, multiYear: false, po: false },
    { id: 'd7', year: 2026, lat: 25.8, lng: -80.3, location: 'South Florida', category: 'Smart Infrastructure', title: 'Head-to-head public selection', path: 'Cooperative comparison', detail: 'Site visit, photometrics, stamped engineering, physical demonstration, and formal public selection.', evidence: 'Selection confirmed', level: 5, confirmed: true, multiYear: false, po: false },
    { id: 'd8', year: 2026, lat: 27.95, lng: -82.46, location: 'Florida Gulf Coast', category: 'Transit', title: 'Best-value technology award', path: 'Competitive RFP', detail: 'Formal scoring favored the stronger technical and lifecycle position, not simply the lowest initial price.', evidence: 'Award confirmed; full terms not yet public', level: 4, confirmed: true, multiYear: false, po: false }
  ],

  fieldProjects: [
    { id: 1, year: 2021, lat: 40.23, lng: -111.66, location: 'Provo, UT', category: 'Parks & Trails', procurement: false, documented: true },
    { id: 2, year: 2021, lat: 32.85, lng: -97.14, location: 'Bedford, TX', category: 'Parks & Trails', procurement: false, documented: false },
    { id: 3, year: 2022, lat: 36.07, lng: -80.34, location: 'Winston-Salem, NC', category: 'Smart Infrastructure', procurement: false, documented: true },
    { id: 4, year: 2022, lat: 33.91, lng: -117.26, location: 'Moreno Valley, CA', category: 'Emergency / Resilience', procurement: true, documented: true },
    { id: 5, year: 2022, lat: 32.84, lng: -79.97, location: 'North Charleston, SC', category: 'Public Safety', procurement: false, documented: true },
    { id: 6, year: 2022, lat: 32.78, lng: -80.01, location: 'Charleston, SC', category: 'Parks & Trails', procurement: false, documented: true },
    { id: 7, year: 2022, lat: 39.90, lng: -75.08, location: 'Oaklyn, NJ', category: 'Parks & Trails', procurement: false, documented: true },
    { id: 8, year: 2022, lat: 38.94, lng: -77.08, location: 'Washington, DC', category: 'Emergency / Resilience', procurement: true, documented: true },
    { id: 9, year: 2023, lat: 32.51, lng: -93.75, location: 'Shreveport, LA', category: 'Smart Infrastructure', procurement: true, documented: true },
    { id: 10, year: 2023, lat: 42.41, lng: -71.12, location: 'Medford, MA', category: 'Smart Infrastructure', procurement: false, documented: true },
    { id: 11, year: 2023, lat: 30.45, lng: -91.11, location: 'Baton Rouge, LA', category: 'Emergency / Resilience', procurement: true, documented: true },
    { id: 12, year: 2024, lat: 35.79, lng: -78.78, location: 'Cary, NC', category: 'Transit', procurement: false, documented: true },
    { id: 13, year: 2023, lat: 27.07, lng: -80.40, location: 'Martin County, FL', category: 'Smart Infrastructure', procurement: false, documented: true },
    { id: 14, year: 2023, lat: 33.85, lng: -117.87, location: 'Anaheim, CA', category: 'Emergency / Resilience', procurement: true, documented: true },
    { id: 15, year: 2023, lat: 40.13, lng: -88.33, location: 'Champaign, IL', category: 'Parks & Trails', procurement: false, documented: true },
    { id: 16, year: 2023, lat: 34.20, lng: -86.17, location: 'Boaz, AL', category: 'Smart Infrastructure', procurement: true, documented: true },
    { id: 17, year: 2024, lat: 41.47, lng: -87.06, location: 'Valparaiso, IN', category: 'Parks & Trails', procurement: false, documented: true },
    { id: 18, year: 2024, lat: 36.07, lng: -79.80, location: 'Greensboro, NC', category: 'Parks & Trails', procurement: false, documented: true },
    { id: 19, year: 2023, lat: 32.79, lng: -79.94, location: 'Charleston, SC', category: 'Parks & Trails', procurement: false, documented: true },
    { id: 20, year: 2024, lat: 35.75, lng: -80.32, location: 'Linwood, NC', category: 'Parks & Trails', procurement: false, documented: true },
    { id: 21, year: 2023, lat: 28.52, lng: -80.68, location: 'Merritt Island, FL', category: 'Smart Infrastructure', procurement: false, documented: true },
    { id: 22, year: 2024, lat: 37.97, lng: -87.57, location: 'Evansville, IN', category: 'Transit', procurement: true, documented: true },
    { id: 23, year: 2024, lat: 35.87, lng: -78.84, location: 'Durham, NC', category: 'Transit', procurement: false, documented: true },
    { id: 24, year: 2024, lat: 33.97, lng: -120.09, location: 'California', category: 'Smart Infrastructure', procurement: false, documented: false },
    { id: 25, year: 2024, lat: 38.05, lng: -97.34, location: 'Newton, KS', category: 'Parks & Trails', procurement: false, documented: true },
    { id: 26, year: 2025, lat: 34.04, lng: -118.26, location: 'Los Angeles, CA', category: 'Transit', procurement: true, documented: true },
    { id: 27, year: 2025, lat: 35.96, lng: -80.01, location: 'High Point, NC', category: 'Transit', procurement: false, documented: true },
    { id: 28, year: 2025, lat: 30.26, lng: -97.71, location: 'Austin, TX', category: 'Transit', procurement: true, documented: true },
    { id: 29, year: 2026, lat: 26.66, lng: -80.09, location: 'Palm Springs, FL', category: 'Transit', procurement: true, documented: true },
    { id: 30, year: 2026, lat: 30.42, lng: -87.22, location: 'Pensacola, FL', category: 'Parks & Trails', procurement: true, documented: true },
    { id: 31, year: 2026, lat: 35.78, lng: -78.64, location: 'Raleigh, NC', category: 'Transit', procurement: true, documented: false },
    { id: 32, year: 2026, lat: 41.18, lng: -73.79, location: 'Lower Hudson Valley, NY', category: 'Transit', procurement: false, documented: false },
    { id: 33, year: 2026, lat: 40.01, lng: -74.31, location: 'Lakehurst, NJ', category: 'Public Safety', procurement: false, documented: false },
    { id: 34, year: 2026, lat: 39.74, lng: -104.98, location: 'Denver, CO', category: 'Smart Infrastructure', procurement: false, documented: false },
    { id: 35, year: 2026, lat: 27.76, lng: -81.46, location: 'Florida', category: 'Smart Infrastructure', procurement: false, documented: false },
    { id: 36, year: 2026, lat: 26.35, lng: -98.22, location: 'Hidalgo County, TX', category: 'Smart Infrastructure', procurement: false, documented: false },
    { id: 37, year: 2026, lat: 40.44, lng: -80.00, location: 'Pittsburgh, PA', category: 'Smart Infrastructure', procurement: false, documented: false },
    { id: 38, year: 2026, lat: 42.27, lng: -85.58, location: 'Kalamazoo, MI', category: 'Smart Infrastructure', procurement: false, documented: false },
    { id: 39, year: 2026, lat: 35.39, lng: -119.02, location: 'Bakersfield, CA', category: 'Transit', procurement: true, documented: false },
    { id: 40, year: 2026, lat: 29.17, lng: -81.00, location: 'South Daytona, FL', category: 'Smart Infrastructure', procurement: false, documented: false },
    { id: 41, year: 2026, lat: 26.14, lng: -81.79, location: 'Naples, FL', category: 'Smart Infrastructure', procurement: false, documented: false }
  ]
};

// Backward-compatible alias for any cached map script.
window.AKRD_COVERAGE_PROJECTS = window.AKRD_COVERAGE.fieldProjects;
