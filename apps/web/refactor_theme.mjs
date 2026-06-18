import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const targetDir = path.join(__dirname, 'app', 'cm');

const darkThemeMappings = [
  // Backgrounds
  { regex: /dark:bg-\[#121212\]/g, replace: 'dark:bg-[#161616]' },
  { regex: /dark:bg-zinc-950/g, replace: 'dark:bg-[#161616]' },
  
  { regex: /dark:bg-zinc-900/g, replace: 'dark:bg-[#1a1a1a]' },
  { regex: /dark:bg-\[#1e1e1e\]/g, replace: 'dark:bg-[#1a1a1a]' },
  
  { regex: /dark:bg-zinc-800\/(\d+)/g, replace: 'dark:bg-[#2a2a2a]/$1' },
  { regex: /dark:bg-zinc-800/g, replace: 'dark:bg-[#2a2a2a]' },
  { regex: /dark:bg-zinc-700/g, replace: 'dark:bg-[#333333]' },
  { regex: /dark:hover:bg-zinc-800/g, replace: 'dark:hover:bg-[#2a2a2a]' },
  { regex: /dark:hover:bg-zinc-700/g, replace: 'dark:hover:bg-[#333333]' },

  // Borders
  { regex: /dark:border-zinc-800/g, replace: 'dark:border-[#2a2a2a]' },
  { regex: /dark:border-\[#2a2a2a\]/g, replace: 'dark:border-[#2a2a2a]' },
  { regex: /dark:divide-zinc-800\/30/g, replace: 'dark:divide-[#2a2a2a]/30' },
  { regex: /dark:divide-zinc-800\/50/g, replace: 'dark:divide-[#2a2a2a]/50' },
  { regex: /dark:lg:border-zinc-800/g, replace: 'dark:lg:border-[#2a2a2a]' },
  
  // Gradients
  { regex: /dark:from-zinc-900\/50/g, replace: 'dark:from-[#1a1a1a]/50' },
  { regex: /dark:to-zinc-900\/50/g, replace: 'dark:to-[#1a1a1a]/50' },

  // Text colors
  { regex: /dark:text-zinc-500/g, replace: 'dark:text-gray-400' },
  { regex: /dark:text-zinc-400/g, replace: 'dark:text-gray-400' },
  { regex: /dark:text-zinc-300/g, replace: 'dark:text-gray-300' },
  { regex: /dark:text-zinc-200/g, replace: 'dark:text-gray-200' },
  { regex: /dark:text-zinc-100/g, replace: 'dark:text-gray-100' },
  { regex: /dark:text-white/g, replace: 'dark:text-gray-100' },

  // Interactive
  { regex: /dark:focus:bg-zinc-900/g, replace: 'dark:focus:bg-[#1a1a1a]' },
];

const emeraldToGoldMappings = [
  { regex: /text-emerald-500/g, replace: 'text-[#C9A84C]' },
  { regex: /bg-emerald-500/g, replace: 'bg-[#C9A84C]' },
  { regex: /bg-emerald-600/g, replace: 'bg-[#b8993f]' },
  { regex: /hover:bg-emerald-700/g, replace: 'hover:bg-[#a68936]' },
  { regex: /text-emerald-600/g, replace: 'text-[#b8993f]' },
  { regex: /bg-emerald-50/g, replace: 'bg-[#C9A84C]/10' },
  { regex: /dark:bg-emerald-950\/30/g, replace: 'dark:bg-[#C9A84C]/20' },
  { regex: /dark:text-emerald-400/g, replace: 'dark:text-[#C9A84C]' },
  { regex: /border-emerald-500/g, replace: 'border-[#C9A84C]' },
  { regex: /focus:ring-emerald-500/g, replace: 'focus:ring-[#C9A84C]' },
];

const excludedFromAll = [
  'MapSection.tsx',
  'MapLayersPanel.tsx',
  'MapComponent.tsx',
  'cm-geo.ts',
  'cm-mock.ts',
  'cm-types.ts',
  'ward-zone-map.ts'
];

const excludedFromEmeraldReplacement = [
  'KPIStatsRow.tsx',
  'LocalityHealthTable.tsx',
  'WardPerformanceGrid.tsx',
  'ComplaintBreakdownGrid.tsx',
  'DelhiHealthScoreBar.tsx'
];

function processDirectory(directory) {
  const files = fs.readdirSync(directory);
  
  for (const file of files) {
    const fullPath = path.join(directory, file);
    const stat = fs.statSync(fullPath);
    
    if (stat.isDirectory()) {
      processDirectory(fullPath);
    } else if (fullPath.endsWith('.tsx') || fullPath.endsWith('.ts')) {
      const fileName = path.basename(fullPath);
      
      // Completely skip map-related components
      if (excludedFromAll.includes(fileName)) {
        console.log(`Skipping map component: ${fileName}`);
        continue;
      }

      let content = fs.readFileSync(fullPath, 'utf8');
      let originalContent = content;
      
      // 1. Apply Dark Theme Alignments to all non-map UI components
      for (const { regex, replace } of darkThemeMappings) {
        content = content.replace(regex, replace);
      }
      
      // 2. Apply Emerald -> Gold mappings to specific UI components only
      if (!excludedFromEmeraldReplacement.includes(fileName)) {
        for (const { regex, replace } of emeraldToGoldMappings) {
          content = content.replace(regex, replace);
        }
      } else {
        console.log(`Skipping emerald->gold for ${fileName} to preserve positive metric colors.`);
      }
      
      if (content !== originalContent) {
        fs.writeFileSync(fullPath, content, 'utf8');
        console.log(`Updated ${fileName}`);
      }
    }
  }
}

processDirectory(targetDir);
console.log('CM Dark theme UI alignment script complete!');
