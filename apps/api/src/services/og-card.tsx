import { mkdir, readFile, writeFile } from 'node:fs/promises';
import path from 'node:path';

import React from 'react';
import { Resvg } from '@resvg/resvg-js';
import satori from 'satori';

const FONT_CANDIDATES = [
  '/usr/share/fonts/truetype/dejavu/DejaVuSans.ttf',
  '/usr/share/fonts/truetype/liberation2/LiberationSans-Regular.ttf',
];

let cachedFont: Buffer | undefined;

async function loadFont(): Promise<Buffer> {
  if (cachedFont) return cachedFont;
  for (const candidate of FONT_CANDIDATES) {
    try {
      cachedFont = await readFile(candidate);
      return cachedFont;
    } catch {
      // Try the next system font.
    }
  }
  throw new Error('No usable system font found for OG rendering.');
}

export async function renderOgCard(options: {
  cacheDir: string;
  cacheKey: string;
  title: string;
  subtitle: string;
  badge: string;
  footer: string;
}): Promise<Buffer> {
  const outputPath = path.join(options.cacheDir, `${options.cacheKey}.png`);
  await mkdir(options.cacheDir, { recursive: true });

  try {
    return await readFile(outputPath);
  } catch {
    // Cache miss.
  }

  const fontData = await loadFont();
  const svg = await satori(
    <div
      style={{
        width: '1200px',
        height: '630px',
        display: 'flex',
        flexDirection: 'column',
        justifyContent: 'space-between',
        background:
          'radial-gradient(circle at 20% 20%, rgba(34,197,94,0.18), transparent 28%), linear-gradient(135deg, #04070d 0%, #08111e 45%, #111827 100%)',
        color: '#f8fafc',
        padding: '56px',
        fontFamily: 'DejaVu Sans',
      }}
    >
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
          <div style={{ width: '12px', height: '12px', borderRadius: '9999px', background: '#f97316' }} />
          <div style={{ fontSize: '24px', letterSpacing: '0.24em', textTransform: 'uppercase', color: '#93c5fd' }}>
            Investor Intel / Iran Monitor
          </div>
        </div>
        <div
          style={{
            border: '1px solid rgba(148,163,184,0.35)',
            padding: '12px 20px',
            borderRadius: '9999px',
            fontSize: '22px',
            color: '#fde68a',
          }}
        >
          {options.badge}
        </div>
      </div>

      <div style={{ display: 'flex', flexDirection: 'column', gap: '18px', maxWidth: '960px' }}>
        <div style={{ fontSize: '68px', fontWeight: 700, lineHeight: 1.05 }}>{options.title}</div>
        <div style={{ fontSize: '30px', lineHeight: 1.35, color: '#cbd5e1' }}>{options.subtitle}</div>
      </div>

      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end' }}>
        <div style={{ fontSize: '22px', color: '#94a3b8' }}>{options.footer}</div>
        <div style={{ display: 'flex', gap: '12px' }}>
          {['Conflict', 'Markets', 'Provenance'].map((label) => (
            <div
              key={label}
              style={{
                border: '1px solid rgba(51,65,85,1)',
                background: 'rgba(15,23,42,0.72)',
                padding: '12px 18px',
                borderRadius: '9999px',
                fontSize: '20px',
                color: '#e2e8f0',
              }}
            >
              {label}
            </div>
          ))}
        </div>
      </div>
    </div>,
    {
      width: 1200,
      height: 630,
      fonts: [
        {
          name: 'DejaVu Sans',
          data: fontData,
          weight: 400,
          style: 'normal',
        },
      ],
    },
  );

  const resvg = new Resvg(svg, {
    fitTo: {
      mode: 'width',
      value: 1200,
    },
  });
  const png = resvg.render().asPng();
  await writeFile(outputPath, png);
  return png;
}
