import { MultiSizeTarget, PresetBundle } from '@/types/multi-size';
import { ECOMMERCE_PRESETS } from './constants/ecommerce-presets';

const STORAGE_KEY = 'volticen_user_preset_bundles_v1';

export const BUILTIN_BUNDLES: PresetBundle[] = [
  {
    id: 'bundle-blog-web',
    name: 'Gói Blog & Quản trị Web',
    nameEn: 'Blog & Web Admin Pack',
    description: 'Trọn bộ ảnh Hero Banner, Bìa bài viết chuẩn SEO và Thumbnail danh mục',
    descriptionEn: 'Full set of Hero Banner, SEO-optimized Feature Cover, and Category Thumbnail',
    isBuiltIn: true,
    targets: [
      {
        id: '1920-hero',
        name: 'Full HD / Banner lớn (1920px)',
        nameEn: 'Full HD / Hero Banner (1920px)',
        width: 1920,
        folderName: '1920px_hero_banner',
        badge: 'Web',
        badgeEn: 'Web',
        ratio: '16:9',
      },
      {
        id: 'blog-feature',
        name: 'Feature Image / Bìa bài viết (1200×630)',
        nameEn: 'Feature Image / Article Cover (1200×630)',
        width: 1200,
        height: 630,
        folderName: '1200px_feature_image',
        badge: 'Blog / OpenGraph',
        badgeEn: 'Blog / OpenGraph',
        ratio: '1.91:1',
      },
      {
        id: 'web-thumbnail',
        name: 'Thumbnail bài viết (720×720)',
        nameEn: 'Post Thumbnail (720×720)',
        width: 720,
        height: 720,
        folderName: '720px_thumbnail',
        badge: 'Thumb',
        badgeEn: 'Thumb',
        ratio: '1:1',
      },
    ],
  },
  {
    id: 'bundle-omnichannel-sales',
    name: 'Gói Bán hàng Đa kênh',
    nameEn: 'Omnichannel Commerce Pack',
    description: 'Chuẩn kích thước đăng Shopee, TikTok Shop và bài viết giới thiệu Facebook',
    descriptionEn: 'Standard dimensions for Shopee, TikTok Shop, and Facebook promo posts',
    isBuiltIn: true,
    targets: [
      {
        id: 'shopee-main',
        name: 'Shopee / Lazada / Tiki (1000×1000)',
        nameEn: 'Shopee / Lazada / Tiki (1000×1000)',
        width: 1000,
        height: 1000,
        folderName: '1000px_ecom_square',
        badge: 'Sàn TMĐT',
        badgeEn: 'Marketplace',
        ratio: '1:1',
      },
      {
        id: 'tiktok-fashion',
        name: 'TikTok Shop Dọc (900×1200)',
        nameEn: 'TikTok Shop Portrait (900×1200)',
        width: 900,
        height: 1200,
        folderName: '900x1200_tiktok_shop',
        badge: 'TikTok Shop',
        badgeEn: 'TikTok Shop',
        ratio: '3:4',
      },
      {
        id: 'facebook-post',
        name: 'Facebook Post / Bìa (1200×630)',
        nameEn: 'Facebook Post / Cover (1200×630)',
        width: 1200,
        height: 630,
        folderName: '1200x630_facebook_post',
        badge: 'Facebook',
        badgeEn: 'Facebook',
        ratio: '1.91:1',
      },
    ],
  },
  {
    id: 'bundle-social-media',
    name: 'Gói Mạng xã hội & Story',
    nameEn: 'Social Media & Story Pack',
    description: 'Phủ sóng toàn bộ bài đăng ngang, bài đăng vuông và Story/Reels dọc tràn viền',
    descriptionEn: 'Covers horizontal posts, square posts, and full-screen vertical Story/Reels',
    isBuiltIn: true,
    targets: [
      {
        id: 'facebook-post',
        name: 'Bài đăng ngang (1200×630)',
        nameEn: 'Horizontal Post (1200×630)',
        width: 1200,
        height: 630,
        folderName: '1200x630_horizontal_post',
        badge: 'Facebook / Zalo',
        badgeEn: 'Facebook / Social',
        ratio: '1.91:1',
      },
      {
        id: 'square-post',
        name: 'Bài đăng vuông (1080×1080)',
        nameEn: 'Square Post (1080×1080)',
        width: 1080,
        height: 1080,
        folderName: '1080x1080_square_post',
        badge: 'Instagram / Feed',
        badgeEn: 'Instagram / Feed',
        ratio: '1:1',
      },
      {
        id: 'story-reels',
        name: 'Story / Reels / Shorts (1080×1920)',
        nameEn: 'Story / Reels / Shorts (1080×1920)',
        width: 1080,
        height: 1920,
        folderName: '1080x1920_story_reels',
        badge: 'Story / Reels',
        badgeEn: 'Story / Reels',
        ratio: '9:16',
      },
    ],
  },
];

export function getSavedBundles(): PresetBundle[] {
  if (typeof window === 'undefined') return BUILTIN_BUNDLES;
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return BUILTIN_BUNDLES;
    const custom: PresetBundle[] = JSON.parse(raw);
    return [...BUILTIN_BUNDLES, ...custom];
  } catch (e) {
    console.error('Failed to read user preset bundles from localStorage', e);
    return BUILTIN_BUNDLES;
  }
}

export function saveCustomBundle(bundle: Omit<PresetBundle, 'id' | 'isBuiltIn'>): PresetBundle {
  const newBundle: PresetBundle = {
    ...bundle,
    id: `custom-bundle-${Date.now()}`,
    isBuiltIn: false,
  };

  if (typeof window !== 'undefined') {
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      const custom: PresetBundle[] = raw ? JSON.parse(raw) : [];
      custom.push(newBundle);
      localStorage.setItem(STORAGE_KEY, JSON.stringify(custom));
    } catch (e) {
      console.error('Failed to save custom preset bundle', e);
    }
  }

  return newBundle;
}

export function deleteCustomBundle(bundleId: string): void {
  if (typeof window === 'undefined') return;
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return;
    const custom: PresetBundle[] = JSON.parse(raw);
    const filtered = custom.filter((b) => b.id !== bundleId);
    localStorage.setItem(STORAGE_KEY, JSON.stringify(filtered));
  } catch (e) {
    console.error('Failed to delete custom preset bundle', e);
  }
}

/**
 * Returns localized bundle name based on active locale
 */
export function getLocalizedBundleName(bundle: PresetBundle, locale: string): string {
  if (locale === 'en') {
    if (bundle.nameEn) return bundle.nameEn;
    switch (bundle.id) {
      case 'bundle-blog-web':
        return 'Blog & Web Admin Pack';
      case 'bundle-omnichannel-sales':
        return 'Omnichannel Commerce Pack';
      case 'bundle-social-media':
        return 'Social Media & Story Pack';
    }
  }
  return bundle.name;
}

/**
 * Returns localized bundle description based on active locale
 */
export function getLocalizedBundleDesc(bundle: PresetBundle, locale: string): string {
  if (locale === 'en') {
    if (bundle.descriptionEn) return bundle.descriptionEn;
    switch (bundle.id) {
      case 'bundle-blog-web':
        return 'Full set of Hero Banner, SEO-optimized Feature Cover, and Category Thumbnail';
      case 'bundle-omnichannel-sales':
        return 'Standard dimensions for Shopee, TikTok Shop, and Facebook promo posts';
      case 'bundle-social-media':
        return 'Covers horizontal posts, square posts, and full-screen vertical Story/Reels';
    }
  }
  return bundle.description || '';
}

/**
 * Returns localized target name based on active locale
 */
export function getLocalizedTargetName(target: MultiSizeTarget, locale: string): string {
  if (locale === 'en') {
    if (target.nameEn) return target.nameEn;

    switch (target.id) {
      case '1920-hero':
        return 'Full HD / Hero Banner (1920px)';
      case 'blog-feature':
        return 'Feature Image / Cover (1200×630)';
      case 'web-thumbnail':
        return 'Post Thumbnail (720×720)';
      case 'shopee-main':
        return 'Shopee / Lazada / Tiki (1000×1000)';
      case 'tiktok-fashion':
        return 'TikTok Shop Portrait (900×1200)';
      case 'facebook-post':
        return 'Facebook Post / Cover (1200×630)';
      case 'square-post':
        return 'Square Post (1080×1080)';
      case 'story-reels':
        return 'Story / Reels / Shorts (1080×1920)';
    }

    // Look up in ECOMMERCE_PRESETS
    const presetId = target.id.startsWith('preset-')
      ? target.id.replace(/^preset-/, '').replace(/-\d+$/, '')
      : target.id;
    const match = ECOMMERCE_PRESETS.find((p) => p.id === presetId);
    if (match?.nameEn) return match.nameEn;

    // Translate common Vietnamese phrases if present in target.name
    let n = target.name;
    if (n.includes('Gói Bán hàng Đa kênh')) n = n.replace('Gói Bán hàng Đa kênh', 'Omnichannel Commerce Pack');
    if (n.includes('TikTok Shop Dọc')) n = n.replace('TikTok Shop Dọc', 'TikTok Shop Portrait');
    if (n.includes('Facebook Post / Bìa')) n = n.replace('Facebook Post / Bìa', 'Facebook Post / Cover');
    if (n.includes('Bài đăng ngang')) n = n.replace('Bài đăng ngang', 'Horizontal Post');
    if (n.includes('Bài đăng vuông')) n = n.replace('Bài đăng vuông', 'Square Post');
    if (n.includes('Banner lớn')) n = n.replace('Banner lớn', 'Hero Banner');
    if (n.includes('Bìa bài viết')) n = n.replace('Bìa bài viết', 'Article Cover');
    if (n.includes('Thumbnail bài viết')) n = n.replace('Thumbnail bài viết', 'Post Thumbnail');
    return n;
  }

  // If locale === 'vi', return Vietnamese name
  return target.name;
}

/**
 * Returns localized target badge based on active locale
 */
export function getLocalizedTargetBadge(target: MultiSizeTarget, locale: string): string {
  if (locale === 'en') {
    if (target.badgeEn) return target.badgeEn;
    if (target.badge === 'Sàn TMĐT') return 'Marketplace';
    if (target.badge === 'Facebook / Zalo') return 'Facebook / Social';
    return target.badge || '';
  }
  return target.badge || '';
}
