import type { Appliance } from '@/types/system.types';
import type { MarketplaceCategory, Product } from '@/types/product.types';

export const marketplaceCategories: MarketplaceCategory[] = [
  { id: 'inverter', title: 'Inverter', subtitle: 'Brand Selection' },
  { id: 'panel', title: 'Solar Panel', subtitle: 'Brand Selection' },
  { id: 'battery', title: 'Batteries', subtitle: 'Brand Selection' },
  { id: 'accessory', title: 'Solar Accessories', subtitle: 'Select Products' }
];

export const defaultAppliances: Appliance[] = [
  { id: 'lights', name: 'LED Bulbs', watts: 12, quantity: 0, hours: 6 },
  { id: 'fans', name: 'Fans', watts: 80, quantity: 0, hours: 8 },
  { id: 'fridge', name: 'Refrigerators', watts: 200, quantity: 0, hours: 10 },
  { id: 'washingMachine', name: 'Washing Machine', watts: 500, quantity: 0, hours: 1 },
  { id: 'ac1TonInverter', name: 'AC 1 Ton (Inverter)', watts: 900, quantity: 0, hours: 4 },
  { id: 'ac15TonInverter', name: 'AC 1.5 Ton (Inverter)', watts: 1200, quantity: 0, hours: 4 },
  { id: 'ac2TonInverter', name: 'AC 2 Ton (Inverter)', watts: 1800, quantity: 0, hours: 4 }
];

export const products: Product[] = [
  { id: 'fox-10kw', category: 'inverter', brand: 'FOX', name: 'FOX 10.5kW Single Phase', tag: 'Recommended', price: 394000, specs: ['10.5kW', 'Hybrid', '5 Years'] },
  { id: 'goodwe-6kw', category: 'inverter', brand: 'GoodWe', name: 'GoodWe 6kW Hybrid', tag: 'Best Value', price: 285000, specs: ['6kW', 'Hybrid', '5 Years'] },
  { id: 'sungrow-10kw', category: 'inverter', brand: 'Sungrow', name: 'Sungrow SH10RS Hybrid', tag: 'Premium', price: 520000, specs: ['10kW', 'Hybrid', 'Smart Monitoring'] },
  { id: 'solis-8kw', category: 'inverter', brand: 'Solis', name: 'Solis 8kW On-Grid', tag: 'Recommended', price: 245000, specs: ['8kW', 'On-Grid', 'Tier-1'] },
  { id: 'huawei-6kw', category: 'inverter', brand: 'Huawei', name: 'Huawei SUN2000 6kW', tag: 'Premium', price: 410000, specs: ['6kW', 'Smart Energy', 'AI Ready'] },
  { id: 'longi-585', category: 'panel', brand: 'Longi', name: 'Longi Hi-MO X10 585W', tag: 'Premium', price: 24000, specs: ['585W', 'TOPCon', '25 Years'] },
  { id: 'ja-550', category: 'panel', brand: 'JA Solar', name: 'JA Solar 550W Mono', tag: 'Best Value', price: 20500, specs: ['550W', 'Mono PERC', '25 Years'] },
  { id: 'astro-560', category: 'panel', brand: 'Astro', name: 'Astro Energy 560W Mono', tag: 'Best Value', price: 19500, specs: ['560W', 'Mono', 'Budget'] },
  { id: 'jinko-585', category: 'panel', brand: 'Jinko Solar', name: 'Jinko Tiger Neo 585W', tag: 'Recommended', price: 23500, specs: ['585W', 'N-Type', '30 Years'] },
  { id: 'aiko-610', category: 'panel', brand: 'AIKO', name: 'AIKO ABC 610W', tag: 'Premium', price: 28500, specs: ['610W', 'ABC Cells', 'Premium'] },
  { id: 'fox-batt-5', category: 'battery', brand: 'FOX', name: 'FOX EP5 5.18kWh Battery', tag: 'Recommended', price: 420000, specs: ['5.18kWh', 'LFP', '10 Years'] },
  { id: 'pylon-us3000', category: 'battery', brand: 'Pylontech', name: 'Pylontech US3000C', tag: 'Best Seller', price: 365000, specs: ['3.5kWh', 'LFP', '10 Years'] },
  { id: 'dyness-dl5', category: 'battery', brand: 'Dyness', name: 'Dyness DL5.0C Battery', tag: 'Recommended', price: 395000, specs: ['5.12kWh', 'Lithium', 'Long Life'] },
  { id: 'soluna-10k', category: 'battery', brand: 'Soluna', name: 'Soluna 10k Pack HV', tag: 'Premium', price: 760000, specs: ['10kWh', 'Lithium', 'Premium'] },
  { id: 'huawei-luna5', category: 'battery', brand: 'Huawei', name: 'Huawei LUNA2000 5kWh', tag: 'Premium', price: 640000, specs: ['5kWh', 'Smart Battery', 'AI Managed'] },
  { id: 'goodwe-lynx5', category: 'battery', brand: 'GoodWe', name: 'GoodWe Lynx Home 5kWh', tag: 'Best Value', price: 510000, specs: ['5kWh', 'Lithium', 'Hybrid Ready'] },
  { id: 'galv-roof', category: 'accessory', brand: 'Local Galvanized', name: 'Local Galvanized Standard Roof', tag: 'Recommended', price: 45000, specs: ['Galvanized Steel', '130 km/h', 'Install Ready'] },
  { id: 'elevated-structure', category: 'accessory', brand: 'Local Galvanized', name: 'Elevated Structure', tag: 'Best Value', price: 90000, specs: ['12 AWG', '140 km/h', '5 Years'] },
  { id: 'dc-cable-6mm', category: 'accessory', brand: 'Solar Cable', name: 'DC Cable 6mm', tag: 'Recommended', price: null, specs: ['6mm Copper', 'UV Resistant', 'Double Insulated'] },
  { id: 'protection-box', category: 'accessory', brand: 'Protection', name: 'AC/DC Protection Box', tag: 'Premium', price: null, specs: ['IP65', 'SPD Ready', 'Outdoor'] },
  { id: 'earthing-kit', category: 'accessory', brand: 'Earthing', name: 'Earthing Kit', tag: 'Best Value', price: null, specs: ['Copper Bonded', 'Corrosion Safe', 'Install Ready'] },
  { id: 'mc4-connectors', category: 'accessory', brand: 'Connectors', name: 'MC4 Connectors', tag: 'Recommended', price: null, specs: ['IP67', '1000V DC', 'Snap Lock'] }
];
