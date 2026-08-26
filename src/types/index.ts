// ============================================================================
// AGRI-TWIN 3D - INTEROPERABLE PRECISION AGRICULTURE DIGITAL TWIN TYPES
// Based on OGC SensorThings API, AgGateway ADAPT, and ISO 19115 Metadata Standards
// ============================================================================

export type UserRole = 'ADMINISTRATOR' | 'AGRONOMIST' | 'FARMER' | 'DEVELOPER';

export interface UserProfile {
  id: string;
  name: string;
  email: string;
  role: UserRole;
  avatar: string;
  organization: string;
  assignedFields: string[];
}

export interface FarmField {
  id: string;
  name: string;
  location: string;
  coordinates: [number, number]; // [lat, lng]
  areaHa: number;
  cropType: string;
  sowingDate: string;
  harvestExpected: string;
  soilType: string;
  elevationMeanM: number;
  elevationRangeM: [number, number];
  gridResolutionM: number;
  gridRows: number;
  gridCols: number;
}

export interface GridCell {
  id: string;
  row: number;
  col: number;
  x: number;
  y: number;
  elevation: number;
  // Soil properties (SoilGrids 2.0 downscaled)
  soilOrganicCarbon_g_kg: number;
  soilClay_percent: number;
  soilSand_percent: number;
  soilPH: number;
  soilMoisture_vol_percent: number;
  soilDepth0_15_cm: number;
  soilDepth15_30_cm: number;
  soilDepth30_60_cm: number;
  soilDepth60_100_cm: number;
  // Sentinel-2 spectral indices
  s2_B2_Blue: number;
  s2_B3_Green: number;
  s2_B4_Red: number;
  s2_B8_NIR: number;
  s2_B11_SWIR: number;
  s2_NDVI: number;
  s2_NDRE: number;
  s2_EVI: number;
  // UAV OpenDroneMap high-res
  uav_RGB_hex: string;
  uav_NDVI: number;
  uav_CanopyHeight_m: number;
  uav_Thermal_C: number;
  // Farm Management
  seedDensity_k_ha: number;
  nitrogenApplied_kg_ha: number;
  irrigation_mm: number;
  // Ground truth vs Predicted
  groundTruthYield_kg_ha: number;
  apsimSimulatedYield_kg_ha: number;
  xgboostResidual_kg_ha: number;
  predictedYield_kg_ha: number;
  predictionConfidence: number; // 0 to 1
  managementZone: 1 | 2 | 3 | 4;
}

export interface JulianDayRecord {
  day: number;
  calendarDate: string;
  growthStage: string;
  avgNDVI: number;
  avgBiomass_ton_ha: number;
  avgSoilMoisture_percent: number;
  cumulativeGDD_C: number; // Growing degree days
  precipitation_mm: number;
  solarRadiation_MJ_m2: number;
  uavAvailable: boolean;
  satelliteAvailable: boolean;
}

export interface ADAPTPlugin {
  id: string;
  sourceName: string;
  protocol: 'ADAPT_PLUGIN' | 'OGC_STA' | 'REST_RASTERIO' | 'ISO_XML';
  nativeResolution: string;
  targetResolution: string;
  reprojection: string;
  status: 'ACTIVE' | 'HOT_SWAPPED' | 'FALLBACK_TRIGGERED' | 'STANDBY';
  latencyMs: number;
  lastIngestedIso: string;
  recordsCount: number;
  confidenceWeight: number;
}

export interface ISOProvenanceRecord {
  id: string;
  timestamp: string;
  user: string;
  action: string;
  sourceDataset: string;
  isoStandard: string;
  transformationType: string;
  lineageHash: string;
  status: 'SUCCESS' | 'WARNING' | 'VALIDATED';
}

export interface ArchitectureComparison {
  architectureName: string;
  code: 'RAW' | 'ADHOC' | 'INTEROPERABLE';
  r2: number;
  rmse: number;
  mae: number;
  integrationTimeHours: number;
  iouManagementZones: number;
  ci95_Lower: number;
  ci95_Upper: number;
  latencySec: number;
  dataHarmonizationScore: number;
}

export interface SobolSensitivityIndex {
  sourceName: string;
  category: 'UAV' | 'Satellite' | 'Soil' | 'Management';
  firstOrderIndex_Si: number; // S_i
  totalEffectIndex_STi: number; // S_Ti
  confidenceInterval: [number, number];
  varianceExplainedPercent: number;
}

export interface StatisticalValidation {
  kolmogorovSmirnov: {
    statistic_D: number;
    pValue: number;
    isIdenticalDistribution: boolean;
  };
  oneWayAnova: {
    fStatistic: number;
    pValue: number;
    significantDifference: boolean;
  };
  bootstrapCI: {
    rawMeanR2: number;
    rawCI: [number, number];
    adhocMeanR2: number;
    adhocCI: [number, number];
    interoperableMeanR2: number;
    interoperableCI: [number, number];
  };
  externalValidation: {
    testCounty: string;
    fieldId: string;
    r2: number;
    rmse: number;
    mae: number;
  };
}

export interface ResilienceScenarioState {
  uavBlackout: boolean;
  soilDelay15Days: boolean;
  soilSensorHotSwap: boolean;
  hyperspectralPluginLoaded: boolean;
  systemConfidenceDegradation: number; // 0 to 100%
  activeFallbackStrategy: string;
}

export type View3DLayer = 
  | 'TERRAIN_DEM'
  | 'CROP_NDVI'
  | 'CROP_BIOMASS'
  | 'PREDICTED_YIELD'
  | 'GROUND_TRUTH'
  | 'SOIL_ORGANIC_CARBON'
  | 'SOIL_CLAY'
  | 'SOIL_MOISTURE'
  | 'SOIL_PH'
  | 'NITROGEN_RX'
  | 'MANAGEMENT_ZONES'
  | 'CONFIDENCE_HEATMAP'
  | 'UAV_RGB_HIGHRES';

export type SubsurfaceDepth = '0_15' | '15_30' | '30_60' | '60_100';
