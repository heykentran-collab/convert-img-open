/**
 * Types and interfaces for E-commerce & Social Media image presets
 */

export type PresetCategory = 'all' | 'vn-ecom' | 'intl-ecom' | 'social' | 'standard';

export interface EcommercePreset {
  id: string;
  name: string;
  nameEn?: string;
  platform: string;
  platformEn?: string;
  category: 'vn-ecom' | 'intl-ecom' | 'social' | 'standard';
  purpose: string;
  purposeEn?: string;
  ratio: string; // e.g. "1:1", "3:4", "16:9", "2:1", "4:3", "9:16"
  width: number;
  height: number;
  recommendation?: string;
  recommendationEn?: string;
  badgeColor: string; // e.g. orange, cyan, amber, etc.
}
