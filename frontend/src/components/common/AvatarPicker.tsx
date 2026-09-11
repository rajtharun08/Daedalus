import React, { useState } from 'react';
import { Check, Sparkles, Bot, Gamepad2, Shapes, Terminal } from 'lucide-react';

export interface PresetAvatar {
  id: string;
  name: string;
  category: 'Cyber Bots' | 'Retro Pixel' | 'Geometric Shapes';
  url: string;
}

export const PRESET_AVATARS: PresetAvatar[] = [
  // Cyber Bots (bottts)
  {
    id: 'bot-apollo',
    name: 'Apollo',
    category: 'Cyber Bots',
    url: 'https://api.dicebear.com/7.x/bottts/svg?seed=Apollo',
  },
  {
    id: 'bot-nova',
    name: 'Nova',
    category: 'Cyber Bots',
    url: 'https://api.dicebear.com/7.x/bottts/svg?seed=Nova',
  },
  {
    id: 'bot-circuit',
    name: 'Circuit',
    category: 'Cyber Bots',
    url: 'https://api.dicebear.com/7.x/bottts/svg?seed=Circuit',
  },
  {
    id: 'bot-glitch',
    name: 'Glitch',
    category: 'Cyber Bots',
    url: 'https://api.dicebear.com/7.x/bottts/svg?seed=Glitch',
  },
  {
    id: 'bot-byte',
    name: 'Byte',
    category: 'Cyber Bots',
    url: 'https://api.dicebear.com/7.x/bottts/svg?seed=Byte',
  },

  // Retro Pixel (pixel-art)
  {
    id: 'pix-felix',
    name: 'Felix',
    category: 'Retro Pixel',
    url: 'https://api.dicebear.com/7.x/pixel-art/svg?seed=Felix',
  },
  {
    id: 'pix-luna',
    name: 'Luna',
    category: 'Retro Pixel',
    url: 'https://api.dicebear.com/7.x/pixel-art/svg?seed=Luna',
  },
  {
    id: 'pix-max',
    name: 'Max',
    category: 'Retro Pixel',
    url: 'https://api.dicebear.com/7.x/pixel-art/svg?seed=Max',
  },
  {
    id: 'pix-kira',
    name: 'Kira',
    category: 'Retro Pixel',
    url: 'https://api.dicebear.com/7.x/pixel-art/svg?seed=Kira',
  },
  {
    id: 'pix-pixel',
    name: 'Pixel',
    category: 'Retro Pixel',
    url: 'https://api.dicebear.com/7.x/pixel-art/svg?seed=Pixel',
  },

  // Geometric Shapes (shapes)
  {
    id: 'shape-matrix',
    name: 'Matrix',
    category: 'Geometric Shapes',
    url: 'https://api.dicebear.com/7.x/shapes/svg?seed=Matrix',
  },
  {
    id: 'shape-vector',
    name: 'Vector',
    category: 'Geometric Shapes',
    url: 'https://api.dicebear.com/7.x/shapes/svg?seed=Vector',
  },
  {
    id: 'shape-prism',
    name: 'Prism',
    category: 'Geometric Shapes',
    url: 'https://api.dicebear.com/7.x/shapes/svg?seed=Prism',
  },
  {
    id: 'shape-nexus',
    name: 'Nexus',
    category: 'Geometric Shapes',
    url: 'https://api.dicebear.com/7.x/shapes/svg?seed=Nexus',
  },
  {
    id: 'shape-cipher',
    name: 'Cipher',
    category: 'Geometric Shapes',
    url: 'https://api.dicebear.com/7.x/shapes/svg?seed=Cipher',
  },
];

interface Props {
  selectedUrl: string;
  onSelect: (url: string) => void;
  usernameSeed?: string;
}

export const AvatarPicker: React.FC<Props> = ({ selectedUrl, onSelect, usernameSeed }) => {
  const [filter, setFilter] = useState<'All' | 'Cyber Bots' | 'Retro Pixel' | 'Geometric Shapes'>('All');

  const categories: Array<{ id: 'All' | 'Cyber Bots' | 'Retro Pixel' | 'Geometric Shapes'; label: string; icon: any }> = [
    { id: 'All', label: 'All (15)', icon: Sparkles },
    { id: 'Cyber Bots', label: 'Bots', icon: Bot },
    { id: 'Retro Pixel', label: 'Pixel', icon: Gamepad2 },
    { id: 'Geometric Shapes', label: 'Shapes', icon: Shapes },
  ];

  const filteredAvatars = filter === 'All' ? PRESET_AVATARS : PRESET_AVATARS.filter((a) => a.category === filter);

  return (
    <div className="space-y-2.5">
      <div className="flex items-center justify-between">
        <label className="text-xs font-mono text-zinc-300 flex items-center gap-1.5">
          <Sparkles className="w-3.5 h-3.5 text-cyan-400" />
          <span>Choose Avatar</span>
        </label>
      </div>

      {/* Category Pills */}
      <div className="flex items-center gap-1.5 overflow-x-auto pb-1 scrollbar-none">
        {categories.map((cat) => {
          const Icon = cat.icon;
          const isActive = filter === cat.id;
          return (
            <button
              type="button"
              key={cat.id}
              onClick={() => setFilter(cat.id)}
              className={`px-2.5 py-1 rounded-lg text-xs font-mono flex items-center gap-1.5 cursor-pointer transition-all shrink-0 ${
                isActive
                  ? 'bg-cyan-500/20 text-cyan-300 border border-cyan-400/40 font-semibold'
                  : 'bg-zinc-900/60 text-zinc-400 hover:text-zinc-200 border border-white/5'
              }`}
            >
              <Icon className="w-3.5 h-3.5" />
              <span>{cat.label}</span>
            </button>
          );
        })}
      </div>

      {/* 15 Avatar Grid */}
      <div className="grid grid-cols-5 gap-2.5 max-h-56 overflow-y-auto pr-1 scrollbar-thin">
        {filteredAvatars.map((avatar) => {
          const isSelected = selectedUrl === avatar.url;
          return (
            <button
              type="button"
              key={avatar.id}
              onClick={() => onSelect(avatar.url)}
              title={avatar.name}
              className={`relative group rounded-xl p-1.5 border transition-all cursor-pointer flex flex-col items-center gap-1.5 ${
                isSelected
                  ? 'border-cyan-400 bg-cyan-500/15 shadow-[0_0_14px_rgba(0,240,255,0.3)] ring-1 ring-cyan-400/60'
                  : 'border-white/10 bg-zinc-900/60 hover:border-white/30 hover:bg-zinc-900'
              }`}
            >
              <div className="w-11 h-11 sm:w-12 sm:h-12 rounded-xl overflow-hidden bg-zinc-950 flex items-center justify-center shrink-0">
                <img
                  src={avatar.url}
                  alt={avatar.name}
                  className="w-full h-full object-cover"
                  loading="lazy"
                />
              </div>

              <span className="text-[10px] font-mono text-zinc-400 group-hover:text-zinc-200 truncate max-w-[56px] text-center">
                {avatar.name}
              </span>

              {isSelected && (
                <div className="absolute -top-1 -right-1 w-4.5 h-4.5 rounded-full bg-cyan-400 text-zinc-950 flex items-center justify-center shadow-md">
                  <Check className="w-3 h-3 stroke-[3]" />
                </div>
              )}
            </button>
          );
        })}
      </div>
    </div>
  );
};
