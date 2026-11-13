import React from 'react';
import { PulgiAppearance, PulgiEmotion } from '../types/pulgi';
import { EMOTION_PROFILES } from '../utils/emotionTracker';

interface PulgiAvatarProps {
  appearance: PulgiAppearance;
  name?: string;
  size?: number;
  animate?: boolean;
  speaking?: boolean;
  emotion?: PulgiEmotion;
  className?: string;
}

function blendHexColors(baseHex: string, tintHex: string, ratio: number): string {
  const cleanA = baseHex.replace('#', '');
  const cleanB = tintHex.replace('#', '');
  if (!/^[0-9a-fA-F]{6}$/.test(cleanA) || !/^[0-9a-fA-F]{6}$/.test(cleanB)) {
    return baseHex;
  }
  const rA = parseInt(cleanA.slice(0, 2), 16);
  const gA = parseInt(cleanA.slice(2, 4), 16);
  const bA = parseInt(cleanA.slice(4, 6), 16);

  const rB = parseInt(cleanB.slice(0, 2), 16);
  const gB = parseInt(cleanB.slice(2, 4), 16);
  const bB = parseInt(cleanB.slice(4, 6), 16);

  const r = Math.round(rA * (1 - ratio) + rB * ratio);
  const g = Math.round(gA * (1 - ratio) + gB * ratio);
  const b = Math.round(bA * (1 - ratio) + bB * ratio);

  return `#${[r, g, b].map((v) => v.toString(16).padStart(2, '0')).join('')}`;
}

export const PulgiAvatar: React.FC<PulgiAvatarProps> = ({
  appearance,
  name = 'Pulgi',
  size = 64,
  animate = false,
  speaking = false,
  emotion = 'neutral',
  className = '',
}) => {
  const emotionProfile = EMOTION_PROFILES[emotion] || EMOTION_PROFILES.neutral;
  const emotionClass = emotion !== 'neutral' ? emotionProfile.cssClass : '';

  if (appearance.customAvatarDataUrl) {
    return (
      <div
        className={`relative inline-flex shrink-0 items-center justify-center overflow-hidden rounded-2xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 ${
          animate ? 'pulgi-float' : ''
        } ${emotionClass} ${className}`}
        style={{ width: size, height: size }}
      >
        <img
          src={appearance.customAvatarDataUrl}
          alt={name}
          referrerPolicy="no-referrer"
          className="h-full w-full object-cover"
        />
      </div>
    );
  }

  const { hairStyle, hairColor, eyeColor, bodyColor, accentColor, outlineColor, expression } = appearance;
  const resolvedHairColor = hairColor || accentColor;
  const activeBodyColor =
    emotion !== 'neutral' && emotionProfile.bodyTint
      ? blendHexColors(bodyColor, emotionProfile.bodyTint, 0.58)
      : bodyColor;

  // Back hair layer sits behind the iconic Pulgi silhouette
  const renderBackHair = () => {
    switch (hairStyle) {
      case 'shaggy-long':
        return (
          <g>
            <path
              d="M42 78 C24 96 18 134 16 170 L32 158 L38 176 L54 156 L58 106 Z"
              fill={resolvedHairColor}
              stroke={outlineColor}
              strokeWidth="5.5"
              strokeLinejoin="round"
            />
            <path
              d="M158 78 C176 96 182 134 184 170 L168 158 L162 176 L146 156 L142 106 Z"
              fill={resolvedHairColor}
              stroke={outlineColor}
              strokeWidth="5.5"
              strokeLinejoin="round"
            />
          </g>
        );
      case 'wild-shag':
        return (
          <g>
            <path
              d="M48 64 C22 72 10 102 18 124 L10 140 L22 154 L14 174 L32 164 L40 179 L56 156 L56 96 Z"
              fill={resolvedHairColor}
              stroke={outlineColor}
              strokeWidth="5.5"
              strokeLinejoin="round"
            />
            <path
              d="M152 64 C178 72 190 102 182 124 L190 140 L178 154 L186 174 L168 164 L160 179 L144 156 L144 96 Z"
              fill={resolvedHairColor}
              stroke={outlineColor}
              strokeWidth="5.5"
              strokeLinejoin="round"
            />
          </g>
        );
      case 'flipped-bob':
        return (
          <g>
            <path
              d="M46 76 C32 98 32 130 14 148 C22 158 46 156 56 140 Z"
              fill={resolvedHairColor}
              stroke={outlineColor}
              strokeWidth="5.5"
              strokeLinejoin="round"
            />
            <path
              d="M154 76 C168 98 168 130 186 148 C178 158 154 156 144 140 Z"
              fill={resolvedHairColor}
              stroke={outlineColor}
              strokeWidth="5.5"
              strokeLinejoin="round"
            />
          </g>
        );
      case 'bowl-cut':
        return (
          <path
            d="M36 96 C34 114 40 128 52 132 L148 132 C160 128 166 114 164 96 Z"
            fill={resolvedHairColor}
            stroke={outlineColor}
            strokeWidth="5.5"
            strokeLinejoin="round"
          />
        );
      case 'retro-waves':
        return (
          <g>
            <path
              d="M46 72 C24 84 22 110 30 124 C18 140 24 162 46 158 C56 156 60 144 58 128 Z"
              fill={resolvedHairColor}
              stroke={outlineColor}
              strokeWidth="5.5"
              strokeLinejoin="round"
            />
            <path
              d="M154 72 C176 84 178 110 170 124 C182 140 176 162 154 158 C144 156 140 144 142 128 Z"
              fill={resolvedHairColor}
              stroke={outlineColor}
              strokeWidth="5.5"
              strokeLinejoin="round"
            />
          </g>
        );
      case 'monroe-curls':
        return (
          <g>
            <circle cx="38" cy="90" r="16" fill={resolvedHairColor} stroke={outlineColor} strokeWidth="5.5" />
            <circle cx="32" cy="116" r="15" fill={resolvedHairColor} stroke={outlineColor} strokeWidth="5.5" />
            <circle cx="42" cy="138" r="13" fill={resolvedHairColor} stroke={outlineColor} strokeWidth="5.5" />
            <circle cx="162" cy="90" r="16" fill={resolvedHairColor} stroke={outlineColor} strokeWidth="5.5" />
            <circle cx="168" cy="116" r="15" fill={resolvedHairColor} stroke={outlineColor} strokeWidth="5.5" />
            <circle cx="158" cy="138" r="13" fill={resolvedHairColor} stroke={outlineColor} strokeWidth="5.5" />
          </g>
        );
      case 'curly-bangs':
        return (
          <g>
            <path
              d="M44 74 C24 84 20 106 28 120 C16 134 18 156 30 166 C22 178 44 182 54 166 L58 106 Z"
              fill={resolvedHairColor}
              stroke={outlineColor}
              strokeWidth="5.5"
              strokeLinejoin="round"
            />
            <path
              d="M156 74 C176 84 180 106 172 120 C184 134 182 156 170 166 C178 178 156 182 146 166 L142 106 Z"
              fill={resolvedHairColor}
              stroke={outlineColor}
              strokeWidth="5.5"
              strokeLinejoin="round"
            />
          </g>
        );
      default:
        return null;
    }
  };

  // Top/front hair sits cleanly above the eyes so expressions remain sharp and clear
  const renderFrontHair = () => {
    switch (hairStyle) {
      case 'flared':
        return (
          <path
            d="M100 84 L68 30 L132 36 Z"
            fill={resolvedHairColor}
            stroke={outlineColor}
            strokeWidth="6.5"
            strokeLinejoin="round"
          />
        );
      case 'shaggy-long':
        return (
          <g>
            <path
              d="M38 92 C40 44 68 24 100 26 C132 24 160 44 162 92 L144 82 L132 96 L116 80 L100 98 L84 80 L68 96 L56 82 Z"
              fill={resolvedHairColor}
              stroke={outlineColor}
              strokeWidth="5.5"
              strokeLinejoin="round"
            />
            <path d="M74 44 L66 72 M100 36 L100 72 M126 44 L134 72" stroke={outlineColor} strokeWidth="2.8" strokeLinecap="round" strokeOpacity="0.45" />
          </g>
        );
      case 'wild-shag':
        return (
          <g>
            <path
              d="M36 86 L28 58 L50 64 L54 32 L78 46 L98 18 L118 44 L142 30 L148 62 L172 56 L164 88 L142 82 L124 96 L102 78 L80 96 L58 80 Z"
              fill={resolvedHairColor}
              stroke={outlineColor}
              strokeWidth="5.5"
              strokeLinejoin="round"
            />
            <path d="M68 48 Q78 62 72 74 M102 36 Q112 50 104 68 M132 48 Q122 62 128 74" stroke={outlineColor} strokeWidth="2.8" strokeLinecap="round" strokeOpacity="0.5" fill="none" />
          </g>
        );
      case 'flipped-bob':
        return (
          <g>
            <path
              d="M42 94 C42 42 70 28 100 28 C130 28 158 42 158 94 C138 98 120 96 100 96 C80 96 62 98 42 94 Z"
              fill={resolvedHairColor}
              stroke={outlineColor}
              strokeWidth="5.5"
              strokeLinejoin="round"
            />
            <path d="M84 54 L80 86 M100 46 L100 86 M116 54 L120 86" stroke={outlineColor} strokeWidth="2.5" strokeLinecap="round" strokeOpacity="0.35" />
          </g>
        );
      case 'bowl-cut':
        return (
          <g>
            <path
              d="M38 98 C38 38 68 28 100 28 C132 28 162 38 162 98 Q131 92 100 95 Q69 92 38 98 Z"
              fill={resolvedHairColor}
              stroke={outlineColor}
              strokeWidth="5.5"
              strokeLinejoin="round"
            />
            <path d="M72 48 Q100 38 128 48" stroke="#FFFFFF" strokeWidth="3.5" strokeLinecap="round" strokeOpacity="0.38" fill="none" />
          </g>
        );
      case 'retro-waves':
        return (
          <g>
            <path
              d="M40 90 C38 42 74 22 114 26 C146 30 162 56 158 92 C142 84 128 74 114 58 C108 78 92 98 62 96 C50 95 44 92 40 90 Z"
              fill={resolvedHairColor}
              stroke={outlineColor}
              strokeWidth="5.5"
              strokeLinejoin="round"
            />
            <path d="M62 66 C82 54 96 42 110 42" stroke={outlineColor} strokeWidth="3" strokeLinecap="round" strokeOpacity="0.4" fill="none" />
          </g>
        );
      case 'monroe-curls':
        return (
          <g>
            <path
              d="M42 84 C40 50 62 28 90 28 C104 20 126 24 138 38 C156 44 162 66 156 86 C140 76 122 72 100 80 C78 72 58 76 42 84 Z"
              fill={resolvedHairColor}
              stroke={outlineColor}
              strokeWidth="5.5"
              strokeLinejoin="round"
            />
            <path d="M68 54 C78 44 92 48 94 58 M112 46 C122 40 134 48 130 58" stroke={outlineColor} strokeWidth="3" strokeLinecap="round" strokeOpacity="0.45" fill="none" />
          </g>
        );
      case 'curly-bangs':
        return (
          <g>
            <path
              d="M38 92 C36 46 66 24 100 24 C134 24 164 46 162 92 C152 100 138 98 130 90 C122 100 108 100 100 92 C92 100 78 100 70 90 C62 98 48 100 38 92 Z"
              fill={resolvedHairColor}
              stroke={outlineColor}
              strokeWidth="5.5"
              strokeLinejoin="round"
            />
            <path d="M66 56 C74 48 84 54 80 64 M100 48 C110 42 116 52 108 60 M128 56 C136 50 144 58 136 66" stroke={outlineColor} strokeWidth="3" strokeLinecap="round" strokeOpacity="0.45" fill="none" />
          </g>
        );
      case 'sprout':
        return (
          <g>
            <path
              d="M100 84 C100 62 100 46 100 34"
              stroke={outlineColor}
              strokeWidth="6.5"
              strokeLinecap="round"
              fill="none"
            />
            <path
              d="M100 44 C78 40 72 22 86 20 C98 18 102 32 100 44 Z"
              fill={resolvedHairColor}
              stroke={outlineColor}
              strokeWidth="5.5"
              strokeLinejoin="round"
            />
            <path
              d="M100 40 C118 30 128 18 114 16 C102 14 98 28 100 40 Z"
              fill={resolvedHairColor}
              stroke={outlineColor}
              strokeWidth="5.5"
              strokeLinejoin="round"
            />
          </g>
        );
      case 'twin-buns':
        return (
          <g>
            <circle cx="62" cy="66" r="16" fill={resolvedHairColor} stroke={outlineColor} strokeWidth="6" />
            <circle cx="138" cy="66" r="16" fill={resolvedHairColor} stroke={outlineColor} strokeWidth="6" />
          </g>
        );
      case 'curl':
        return (
          <path
            d="M100 84 C84 62 84 30 106 28 C122 26 128 42 114 48 C104 52 98 42 105 37"
            fill="none"
            stroke={outlineColor}
            strokeWidth="7"
            strokeLinecap="round"
          />
        );
      case 'spiky':
        return (
          <path
            d="M86 78 L64 36 L90 54 L100 22 L110 54 L136 36 L114 78 Z"
            fill={resolvedHairColor}
            stroke={outlineColor}
            strokeWidth="6"
            strokeLinejoin="round"
          />
        );
      case 'crown':
        return (
          <path
            d="M78 72 L70 34 L90 52 L100 24 L110 52 L130 34 L122 72 Z"
            fill="#FDE68A"
            stroke={outlineColor}
            strokeWidth="6"
            strokeLinejoin="round"
          />
        );
      case 'halo':
        return (
          <ellipse
            cx="100"
            cy="36"
            rx="34"
            ry="10"
            fill="none"
            stroke="#38BDF8"
            strokeWidth="6"
          />
        );
    }
  };

  const renderEyes = () => {
    if (expression === 'wink') {
      return (
        <g>
          <g className={animate ? 'pulgi-blink' : ''}>
            <ellipse cx="77" cy="127" rx="20" ry="22" fill={eyeColor} />
            <circle cx="71" cy="119" r="6" fill="#FFFFFF" />
            <circle cx="83" cy="133" r="3" fill="#BAE6FD" />
          </g>
          <path
            d="M107 129 Q123 116 139 129"
            fill="none"
            stroke={outlineColor}
            strokeWidth="6.5"
            strokeLinecap="round"
          />
        </g>
      );
    }

    if (expression === 'sleepy') {
      return (
        <g>
          <path d="M59 128 Q77 139 95 128" fill="none" stroke={outlineColor} strokeWidth="6.5" strokeLinecap="round" />
          <path d="M105 128 Q123 139 141 128" fill="none" stroke={outlineColor} strokeWidth="6.5" strokeLinecap="round" />
        </g>
      );
    }

    if (expression === 'focused') {
      return (
        <g>
          <ellipse cx="77" cy="129" rx="19" ry="19" fill={eyeColor} />
          <ellipse cx="123" cy="129" rx="19" ry="19" fill={eyeColor} />
          <circle cx="71" cy="122" r="5" fill="#FFFFFF" />
          <circle cx="117" cy="122" r="5" fill="#FFFFFF" />
          <path d="M58 108 L93 115" stroke={outlineColor} strokeWidth="5.5" strokeLinecap="round" />
          <path d="M142 108 L107 115" stroke={outlineColor} strokeWidth="5.5" strokeLinecap="round" />
        </g>
      );
    }

    if (expression === 'excited') {
      return (
        <g className={animate ? 'pulgi-blink' : ''}>
          <ellipse cx="77" cy="126" rx="21" ry="23" fill={eyeColor} />
          <ellipse cx="123" cy="126" rx="21" ry="23" fill={eyeColor} />
          <circle cx="70" cy="117" r="7" fill="#FFFFFF" />
          <circle cx="116" cy="117" r="7" fill="#FFFFFF" />
          <circle cx="84" cy="133" r="3.5" fill="#FDE68A" />
          <circle cx="130" cy="133" r="3.5" fill="#FDE68A" />
        </g>
      );
    }

    if (expression === 'curious') {
      return (
        <g className={animate ? 'pulgi-blink' : ''}>
          <ellipse cx="77" cy="128" rx="19" ry="21" fill={eyeColor} />
          <ellipse cx="123" cy="125" rx="21" ry="23" fill={eyeColor} />
          <circle cx="71" cy="120" r="5.5" fill="#FFFFFF" />
          <circle cx="117" cy="116" r="6.5" fill="#FFFFFF" />
        </g>
      );
    }

    if (expression === 'creative' || expression === 'proud') {
      return (
        <g className={animate ? 'pulgi-blink' : ''}>
          <ellipse cx="77" cy="127" rx="20" ry="22" fill={eyeColor} />
          <ellipse cx="123" cy="127" rx="20" ry="22" fill={eyeColor} />
          <circle cx="71" cy="118" r="6" fill="#FFFFFF" />
          <circle cx="117" cy="118" r="6" fill="#FFFFFF" />
          <circle cx="84" cy="133" r="3" fill="#A5F3FC" />
          <circle cx="130" cy="133" r="3" fill="#A5F3FC" />
        </g>
      );
    }

    return (
      <g className={animate ? 'pulgi-blink' : ''}>
        <ellipse cx="77" cy="127" rx="20.5" ry="22.5" fill={eyeColor} />
        <ellipse cx="123" cy="127" rx="20.5" ry="22.5" fill={eyeColor} />
        <circle cx="71" cy="119" r="5.5" fill="#FFFFFF" fillOpacity="0.92" />
        <circle cx="117" cy="119" r="5.5" fill="#FFFFFF" fillOpacity="0.92" />
      </g>
    );
  };

  return (
    <span
      data-emotion={emotion}
      className={`inline-flex shrink-0 items-center justify-center ${animate ? 'pulgi-float' : ''} ${className}`}
    >
      <svg
        width={size}
        height={size}
        viewBox="0 0 200 200"
        fill="none"
        role="img"
        aria-label={`Avatar do Pulgi ${name}`}
        className={`shrink-0 select-none transition-all duration-500 ${emotionClass}`}
      >
        {/* Subtle ground shadow */}
        <ellipse cx="100" cy="181" rx="46" ry="7" fill={outlineColor} fillOpacity="0.12" />

        {/* Back hair layers for long/voluminous styles */}
        {renderBackHair()}

        {/* Iconic Pulgi silhouette: twin-arch top + cleft + wide flared pointed lower wings */}
        <path
          d="M100 84 C91 64 56 60 44 92 C36 113 42 129 22 146 C38 153 66 151 100 151 C134 151 162 153 178 146 C158 129 164 113 156 92 C144 60 109 64 100 84 Z"
          fill={activeBodyColor}
          stroke={outlineColor}
          strokeWidth="6.5"
          strokeLinejoin="round"
          style={{ transition: 'fill 450ms ease' }}
        />

        {/* Signature center cleft line descending between the two arches */}
        <path
          d="M100 84 L100 144"
          stroke={outlineColor}
          strokeWidth="4.5"
          strokeLinecap="round"
          strokeOpacity="0.85"
        />

        {/* Two little angled stick legs at the bottom center */}
        <path
          d="M89 151 L73 176 M111 151 L127 176"
          stroke={outlineColor}
          strokeWidth="7"
          strokeLinecap="round"
        />

        {/* Giant low-set eyes */}
        {renderEyes()}

        {/* Top/front hair / bangs / topete */}
        {renderFrontHair()}

        {/* Subtle voice speaking indicator when actively talking */}
        {speaking && (
          <ellipse cx="100" cy="146" rx="6" ry="4.5" fill={outlineColor} />
        )}
      </svg>
    </span>
  );
};
