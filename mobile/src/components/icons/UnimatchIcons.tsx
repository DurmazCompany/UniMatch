// mobile/src/components/icons/UnimatchIcons.tsx
//
// UniMatch ikon seti — 6 hediye + Coin + Boost
// Kullanım:
//   import { CoinIcon, BoostIcon, RoseIcon, BouquetIcon, TeddyIcon, CakeIcon, HeartIcon, RingIcon } from '@/components/icons/UnimatchIcons';
//   <CoinIcon size={24} />
//
// Bağımlılık: react-native-svg (Expo'da hazır gelir)

import React from 'react';
import Svg, {
  Defs,
  LinearGradient,
  RadialGradient,
  Stop,
  Circle,
  Ellipse,
  Path,
  Rect,
} from 'react-native-svg';

type IconProps = {
  size?: number;
};

// Her gradient için benzersiz id (aynı ekranda 2 ikon kullanılırsa çakışmasın diye)
let _gradientIdCounter = 0;
const nextGid = (prefix: string) => `${prefix}_${++_gradientIdCounter}`;

// ───────────────────────────────────────────────────────────
// COIN — para birimi (header, paywall, bakiye gösterimleri)
// ───────────────────────────────────────────────────────────
export const CoinIcon: React.FC<IconProps> = ({ size = 24 }) => {
  const g = nextGid('coin');
  return (
    <Svg width={size} height={size} viewBox="0 0 64 64">
      <Defs>
        <LinearGradient id={g} x1="0" y1="0" x2="1" y2="1">
          <Stop offset="0" stopColor="#FFE066" />
          <Stop offset="0.5" stopColor="#FFB800" />
          <Stop offset="1" stopColor="#996515" />
        </LinearGradient>
      </Defs>
      <Circle cx="32" cy="32" r="28" fill={`url(#${g})`} />
      <Circle cx="32" cy="32" r="22" fill="none" stroke="#FFF8DC" strokeWidth="0.8" opacity="0.5" />
      <Ellipse cx="28" cy="20" rx="14" ry="6" fill="#FFFFFF" opacity="0.35" />
      <Path
        d="M32 44 C 32 44, 22 36, 22 28 C 22 24, 25 22, 28 22 C 30 22, 31 24, 32 25 C 33 24, 34 22, 36 22 C 39 22, 42 24, 42 28 C 42 36, 32 44, 32 44 Z"
        fill="#7A4A00"
        opacity="0.85"
      />
    </Svg>
  );
};

// ───────────────────────────────────────────────────────────
// BOOST — yıldırım/profil yükseltme (boost ekranı, paywall)
// ───────────────────────────────────────────────────────────
export const BoostIcon: React.FC<IconProps & { active?: boolean }> = ({ size = 24, active = false }) => {
  const g = nextGid('boost');
  return (
    <Svg width={size} height={size} viewBox="0 0 64 64">
      <Defs>
        <LinearGradient id={g} x1="0" y1="0" x2="1" y2="1">
          <Stop offset="0" stopColor={active ? '#FF00FF' : '#A855F7'} />
          <Stop offset="0.5" stopColor="#EC4899" />
          <Stop offset="1" stopColor="#F97316" />
        </LinearGradient>
      </Defs>
      <Path
        d="M36 4 L12 36 L26 36 L22 60 L50 26 L34 26 Z"
        fill={`url(#${g})`}
        stroke="#FFFFFF"
        strokeWidth="1"
        strokeLinejoin="round"
      />
      <Path d="M36 4 L34 26 L50 26" fill="#FFFFFF" opacity="0.25" />
    </Svg>
  );
};

// ───────────────────────────────────────────────────────────
// GÜL — 100 coin
// ───────────────────────────────────────────────────────────
export const RoseIcon: React.FC<IconProps> = ({ size = 48 }) => {
  const r = nextGid('rose');
  const s = nextGid('stem');
  return (
    <Svg width={size} height={size} viewBox="0 0 64 64">
      <Defs>
        <RadialGradient id={r} cx="0.5" cy="0.4">
          <Stop offset="0" stopColor="#FF6B9D" />
          <Stop offset="0.7" stopColor="#E91E63" />
          <Stop offset="1" stopColor="#9F1239" />
        </RadialGradient>
        <LinearGradient id={s} x1="0" y1="0" x2="0" y2="1">
          <Stop offset="0" stopColor="#22C55E" />
          <Stop offset="1" stopColor="#15803D" />
        </LinearGradient>
      </Defs>
      <Path d="M32 32 L31 58" stroke={`url(#${s})`} strokeWidth="2" strokeLinecap="round" fill="none" />
      <Path d="M31 46 Q22 44 20 50 Q26 52 31 48 Z" fill={`url(#${s})`} />
      <Ellipse cx="22" cy="26" rx="8" ry="9" fill={`url(#${r})`} opacity="0.85" transform="rotate(-20 22 26)" />
      <Ellipse cx="42" cy="26" rx="8" ry="9" fill={`url(#${r})`} opacity="0.85" transform="rotate(20 42 26)" />
      <Ellipse cx="32" cy="34" rx="9" ry="10" fill={`url(#${r})`} opacity="0.9" />
      <Ellipse cx="28" cy="22" rx="6" ry="7" fill={`url(#${r})`} />
      <Ellipse cx="36" cy="22" rx="6" ry="7" fill={`url(#${r})`} />
      <Circle cx="32" cy="26" r="5" fill="#9F1239" />
      <Path d="M30 25 Q32 22 34 25 Q33 28 32 26 Q31 28 30 25 Z" fill="#FF6B9D" opacity="0.6" />
    </Svg>
  );
};

// ───────────────────────────────────────────────────────────
// BUKET — 250 coin
// ───────────────────────────────────────────────────────────
export const BouquetIcon: React.FC<IconProps> = ({ size = 48 }) => {
  const a = nextGid('bqA');
  const b = nextGid('bqB');
  const w = nextGid('wrap');
  const s = nextGid('bqStem');
  return (
    <Svg width={size} height={size} viewBox="0 0 64 64">
      <Defs>
        <RadialGradient id={a}>
          <Stop offset="0" stopColor="#FF6B9D" />
          <Stop offset="1" stopColor="#9F1239" />
        </RadialGradient>
        <RadialGradient id={b}>
          <Stop offset="0" stopColor="#FFB6C1" />
          <Stop offset="1" stopColor="#D4537E" />
        </RadialGradient>
        <LinearGradient id={w} x1="0" y1="0" x2="0" y2="1">
          <Stop offset="0" stopColor="#FFF8DC" />
          <Stop offset="1" stopColor="#E5C9A8" />
        </LinearGradient>
        <LinearGradient id={s}>
          <Stop offset="0" stopColor="#22C55E" />
          <Stop offset="1" stopColor="#15803D" />
        </LinearGradient>
      </Defs>
      <Path d="M22 38 L32 60 L42 38 Z" fill={`url(#${w})`} stroke="#C9A876" strokeWidth="0.5" />
      <Path d="M28 38 L30 52" stroke={`url(#${s})`} strokeWidth="1.5" fill="none" />
      <Path d="M32 38 L32 54" stroke={`url(#${s})`} strokeWidth="1.5" fill="none" />
      <Path d="M36 38 L34 52" stroke={`url(#${s})`} strokeWidth="1.5" fill="none" />
      <Ellipse cx="20" cy="32" rx="6" ry="3" fill={`url(#${s})`} transform="rotate(-30 20 32)" />
      <Ellipse cx="44" cy="32" rx="6" ry="3" fill={`url(#${s})`} transform="rotate(30 44 32)" />
      <Circle cx="22" cy="22" r="9" fill={`url(#${a})`} />
      <Circle cx="42" cy="22" r="9" fill={`url(#${b})`} />
      <Circle cx="32" cy="14" r="9" fill={`url(#${a})`} />
      <Circle cx="32" cy="28" r="8" fill={`url(#${b})`} />
      <Circle cx="22" cy="22" r="3" fill="#9F1239" />
      <Circle cx="42" cy="22" r="3" fill="#9F1239" />
      <Circle cx="32" cy="14" r="3" fill="#9F1239" />
      <Circle cx="32" cy="28" r="3" fill="#9F1239" />
      <Rect x="28" y="40" width="8" height="3" fill="#EC4899" />
      <Path d="M28 43 L24 48 L26 44 Z" fill="#EC4899" />
      <Path d="M36 43 L40 48 L38 44 Z" fill="#EC4899" />
    </Svg>
  );
};

// ───────────────────────────────────────────────────────────
// AYICIK — 500 coin
// ───────────────────────────────────────────────────────────
export const TeddyIcon: React.FC<IconProps> = ({ size = 48 }) => {
  const g = nextGid('teddy');
  return (
    <Svg width={size} height={size} viewBox="0 0 64 64">
      <Defs>
        <RadialGradient id={g} cx="0.4" cy="0.3">
          <Stop offset="0" stopColor="#D4A373" />
          <Stop offset="1" stopColor="#8B5A2B" />
        </RadialGradient>
      </Defs>
      <Circle cx="18" cy="18" r="7" fill={`url(#${g})`} />
      <Circle cx="46" cy="18" r="7" fill={`url(#${g})`} />
      <Circle cx="18" cy="18" r="3" fill="#FFB6C1" />
      <Circle cx="46" cy="18" r="3" fill="#FFB6C1" />
      <Ellipse cx="32" cy="48" rx="14" ry="12" fill={`url(#${g})`} />
      <Ellipse cx="32" cy="50" rx="8" ry="7" fill="#E5C9A8" />
      <Circle cx="32" cy="28" r="14" fill={`url(#${g})`} />
      <Ellipse cx="32" cy="32" rx="6" ry="5" fill="#E5C9A8" />
      <Circle cx="27" cy="26" r="1.8" fill="#1F2937" />
      <Circle cx="37" cy="26" r="1.8" fill="#1F2937" />
      <Circle cx="27.5" cy="25.5" r="0.6" fill="#FFFFFF" />
      <Circle cx="37.5" cy="25.5" r="0.6" fill="#FFFFFF" />
      <Ellipse cx="32" cy="31" rx="1.5" ry="1.2" fill="#1F2937" />
      <Path d="M30 33 Q32 35 34 33" stroke="#1F2937" strokeWidth="0.8" fill="none" strokeLinecap="round" />
      <Path d="M26 42 L32 44 L26 46 Z" fill="#EC4899" />
      <Path d="M38 42 L32 44 L38 46 Z" fill="#EC4899" />
      <Circle cx="32" cy="44" r="1.5" fill="#BE185D" />
    </Svg>
  );
};

// ───────────────────────────────────────────────────────────
// DOĞUM GÜNÜ PASTASI — 750 coin
// ───────────────────────────────────────────────────────────
export const CakeIcon: React.FC<IconProps> = ({ size = 48 }) => {
  const cb = nextGid('cakeBot');
  const ct = nextGid('cakeTop');
  const fl = nextGid('flame');
  return (
    <Svg width={size} height={size} viewBox="0 0 64 64">
      <Defs>
        <LinearGradient id={cb} x1="0" y1="0" x2="0" y2="1">
          <Stop offset="0" stopColor="#FFE4E1" />
          <Stop offset="1" stopColor="#FFC0CB" />
        </LinearGradient>
        <LinearGradient id={ct} x1="0" y1="0" x2="0" y2="1">
          <Stop offset="0" stopColor="#FFF0F5" />
          <Stop offset="1" stopColor="#FFB6C1" />
        </LinearGradient>
        <LinearGradient id={fl} x1="0" y1="0" x2="0" y2="1">
          <Stop offset="0" stopColor="#FEF08A" />
          <Stop offset="0.5" stopColor="#FB923C" />
          <Stop offset="1" stopColor="#DC2626" />
        </LinearGradient>
      </Defs>
      <Ellipse cx="32" cy="56" rx="22" ry="3" fill="#D1D5DB" />
      <Rect x="14" y="38" width="36" height="18" rx="2" fill={`url(#${cb})`} />
      <Path
        d="M14 40 Q18 42 22 40 Q26 42 30 40 Q34 42 38 40 Q42 42 46 40 Q50 42 50 38 L50 38 L14 38 Z"
        fill="#FF1493"
      />
      <Rect x="22" y="22" width="20" height="16" rx="2" fill={`url(#${ct})`} />
      <Path d="M22 24 Q25 26 28 24 Q31 26 34 24 Q37 26 40 24 Q42 25 42 22 L22 22 Z" fill="#EC4899" />
      <Circle cx="20" cy="48" r="1.5" fill="#EC4899" />
      <Circle cx="32" cy="48" r="1.5" fill="#EC4899" />
      <Circle cx="44" cy="48" r="1.5" fill="#EC4899" />
      <Circle cx="26" cy="32" r="1" fill="#BE185D" />
      <Circle cx="38" cy="32" r="1" fill="#BE185D" />
      <Rect x="30.5" y="12" width="3" height="10" fill="#3B82F6" />
      <Path d="M32 4 Q29 8 30 12 Q32 11 34 12 Q35 8 32 4 Z" fill={`url(#${fl})`} />
      <Ellipse cx="32" cy="9" rx="1" ry="2" fill="#FEF08A" />
    </Svg>
  );
};

// ───────────────────────────────────────────────────────────
// KALP — 1000 coin
// ───────────────────────────────────────────────────────────
export const HeartIcon: React.FC<IconProps> = ({ size = 48 }) => {
  const g = nextGid('heart');
  return (
    <Svg width={size} height={size} viewBox="0 0 64 64">
      <Defs>
        <LinearGradient id={g} x1="0" y1="0" x2="0" y2="1">
          <Stop offset="0" stopColor="#FF6B9D" />
          <Stop offset="0.6" stopColor="#EC4899" />
          <Stop offset="1" stopColor="#9F1239" />
        </LinearGradient>
      </Defs>
      <Path
        d="M32 56 C 32 56, 8 40, 8 22 C 8 14, 14 8, 22 8 C 27 8, 31 11, 32 14 C 33 11, 37 8, 42 8 C 50 8, 56 14, 56 22 C 56 40, 32 56, 32 56 Z"
        fill={`url(#${g})`}
        stroke="#9F1239"
        strokeWidth="0.5"
      />
      <Ellipse cx="22" cy="20" rx="6" ry="4" fill="#FFFFFF" opacity="0.4" />
      <Ellipse cx="20" cy="18" rx="2.5" ry="1.5" fill="#FFFFFF" opacity="0.7" />
    </Svg>
  );
};

// ───────────────────────────────────────────────────────────
// YÜZÜK — 2500 coin (en pahalı hediye)
// ───────────────────────────────────────────────────────────
export const RingIcon: React.FC<IconProps> = ({ size = 48 }) => {
  const gold = nextGid('gold');
  const dia = nextGid('diamond');
  return (
    <Svg width={size} height={size} viewBox="0 0 64 64">
      <Defs>
        <LinearGradient id={gold} x1="0" y1="0" x2="1" y2="1">
          <Stop offset="0" stopColor="#FFE066" />
          <Stop offset="0.5" stopColor="#FFB800" />
          <Stop offset="1" stopColor="#996515" />
        </LinearGradient>
        <LinearGradient id={dia} x1="0" y1="0" x2="0" y2="1">
          <Stop offset="0" stopColor="#FFFFFF" />
          <Stop offset="0.4" stopColor="#BAE6FD" />
          <Stop offset="1" stopColor="#0EA5E9" />
        </LinearGradient>
      </Defs>
      <Ellipse cx="32" cy="46" rx="16" ry="11" fill="none" stroke={`url(#${gold})`} strokeWidth="5" />
      <Path d="M32 8 L24 24 L32 36 L40 24 Z" fill={`url(#${dia})`} stroke="#0EA5E9" strokeWidth="0.5" />
      <Path d="M24 24 L40 24" stroke="#FFFFFF" strokeWidth="0.5" opacity="0.7" />
      <Path d="M32 8 L32 36" stroke="#FFFFFF" strokeWidth="0.5" opacity="0.5" />
      <Path d="M28 16 L36 16" stroke="#FFFFFF" strokeWidth="0.5" opacity="0.5" />
      <Path d="M28 14 L29 13 M28 14 L27 15 M28 14 L29 15 M28 14 L27 13" stroke="#FFFFFF" strokeWidth="0.8" />
      <Rect x="26" y="34" width="12" height="4" rx="1" fill={`url(#${gold})`} />
    </Svg>
  );
};

// ───────────────────────────────────────────────────────────
// CATALOG — gifts_catalog tablosuyla eşleşen lookup
// ───────────────────────────────────────────────────────────
export const GIFT_ICONS = {
  rose: RoseIcon,
  bouquet: BouquetIcon,
  teddy: TeddyIcon,
  cake: CakeIcon,
  heart: HeartIcon,
  ring: RingIcon,
} as const;

export type GiftId = keyof typeof GIFT_ICONS;
