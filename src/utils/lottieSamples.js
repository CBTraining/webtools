// Check if an object satisfies minimum Lottie animation schema
export function isValidLottie(data) {
  if (!data || typeof data !== 'object') return false;
  return (
    Array.isArray(data.layers) &&
    (typeof data.v === 'string' || typeof data.fr === 'number') &&
    typeof data.ip === 'number' &&
    typeof data.op === 'number'
  );
}

// Download JSON helper
import { downloadBlob } from './downloadUtils';

export function downloadJsonFile(data, fileName = 'lottie-animation.json') {
  const jsonStr = typeof data === 'string' ? data : JSON.stringify(data, null, 2);
  const blob = new Blob([jsonStr], { type: 'application/json' });
  const safeName = fileName.endsWith('.json') ? fileName : `${fileName}.json`;
  downloadBlob(blob, safeName);
}

export const SAMPLE_LOTTIE_ANIMATIONS = [
  {
    id: 'spinner',
    name: 'Rotating Loader Ring',
    description: 'Smooth gradient arc spinning indefinitely',
    data: {
      v: '5.7.4',
      fr: 30,
      ip: 0,
      op: 60,
      w: 300,
      h: 300,
      nm: 'Rotating Loader',
      ddd: 0,
      assets: [],
      layers: [
        {
          ddd: 0,
          ind: 1,
          ty: 4,
          nm: 'Spinner Ring',
          sr: 1,
          ks: {
            o: { a: 0, k: 100 },
            r: {
              a: 1,
              k: [
                { i: { x: [0.833], y: [0.833] }, o: { x: [0.167], y: [0.167] }, t: 0, s: [0] },
                { t: 60, s: [360] }
              ]
            },
            p: { a: 0, k: [150, 150, 0] },
            a: { a: 0, k: [0, 0, 0] },
            s: { a: 0, k: [100, 100, 100] }
          },
          ao: 0,
          shapes: [
            {
              ty: 'gr',
              nm: 'Ring Group',
              it: [
                {
                  d: 1,
                  ty: 'el',
                  s: { a: 0, k: [140, 140] },
                  p: { a: 0, k: [0, 0] },
                  nm: 'Circle Path'
                },
                {
                  ty: 'tm',
                  s: {
                    a: 1,
                    k: [
                      { i: { x: [0.4], y: [1] }, o: { x: [0.6], y: [0] }, t: 0, s: [0] },
                      { i: { x: [0.4], y: [1] }, o: { x: [0.6], y: [0] }, t: 30, s: [25] },
                      { t: 60, s: [0] }
                    ]
                  },
                  e: {
                    a: 1,
                    k: [
                      { i: { x: [0.4], y: [1] }, o: { x: [0.6], y: [0] }, t: 0, s: [25] },
                      { i: { x: [0.4], y: [1] }, o: { x: [0.6], y: [0] }, t: 30, s: [95] },
                      { t: 60, s: [100] }
                    ]
                  },
                  o: { a: 0, k: 0 },
                  m: 1,
                  nm: 'Trim'
                },
                {
                  ty: 'st',
                  c: { a: 0, k: [0.38, 0.45, 0.98, 1] },
                  o: { a: 0, k: 100 },
                  w: { a: 0, k: 14 },
                  lc: 2,
                  lj: 2,
                  nm: 'Blue Stroke'
                },
                {
                  ty: 'tr',
                  p: { a: 0, k: [0, 0] },
                  a: { a: 0, k: [0, 0] },
                  s: { a: 0, k: [100, 100] },
                  r: { a: 0, k: 0 },
                  o: { a: 0, k: 100 }
                }
              ]
            }
          ],
          ip: 0,
          op: 60,
          st: 0
        }
      ]
    }
  },
  {
    id: 'pulse',
    name: 'Pulsing Radar Wave',
    description: 'Expanding wave with fading glow',
    data: {
      v: '5.7.4',
      fr: 30,
      ip: 0,
      op: 60,
      w: 300,
      h: 300,
      nm: 'Pulsing Wave',
      ddd: 0,
      assets: [],
      layers: [
        {
          ddd: 0,
          ind: 1,
          ty: 4,
          nm: 'Core Dot',
          sr: 1,
          ks: {
            o: { a: 0, k: 100 },
            r: { a: 0, k: 0 },
            p: { a: 0, k: [150, 150, 0] },
            a: { a: 0, k: [0, 0, 0] },
            s: {
              a: 1,
              k: [
                { i: { x: [0.4, 0.4, 0.4], y: [1, 1, 1] }, o: { x: [0.6, 0.6, 0.6], y: [0, 0, 0] }, t: 0, s: [85, 85, 100] },
                { i: { x: [0.4, 0.4, 0.4], y: [1, 1, 1] }, o: { x: [0.6, 0.6, 0.6], y: [0, 0, 0] }, t: 30, s: [115, 115, 100] },
                { t: 60, s: [85, 85, 100] }
              ]
            }
          },
          ao: 0,
          shapes: [
            {
              ty: 'gr',
              nm: 'Center',
              it: [
                {
                  d: 1,
                  ty: 'el',
                  s: { a: 0, k: [48, 48] },
                  p: { a: 0, k: [0, 0] },
                  nm: 'Circle'
                },
                {
                  ty: 'fl',
                  c: { a: 0, k: [0.93, 0.28, 0.42, 1] },
                  o: { a: 0, k: 100 },
                  nm: 'Pink Fill'
                },
                {
                  ty: 'tr',
                  p: { a: 0, k: [0, 0] },
                  a: { a: 0, k: [0, 0] },
                  s: { a: 0, k: [100, 100] },
                  r: { a: 0, k: 0 },
                  o: { a: 0, k: 100 }
                }
              ]
            }
          ],
          ip: 0,
          op: 60,
          st: 0
        },
        {
          ddd: 0,
          ind: 2,
          ty: 4,
          nm: 'Ripple Ring',
          sr: 1,
          ks: {
            o: {
              a: 1,
              k: [
                { i: { x: [0.4], y: [1] }, o: { x: [0.6], y: [0] }, t: 0, s: [90] },
                { t: 60, s: [0] }
              ]
            },
            r: { a: 0, k: 0 },
            p: { a: 0, k: [150, 150, 0] },
            a: { a: 0, k: [0, 0, 0] },
            s: {
              a: 1,
              k: [
                { i: { x: [0.4, 0.4, 0.4], y: [1, 1, 1] }, o: { x: [0.6, 0.6, 0.6], y: [0, 0, 0] }, t: 0, s: [40, 40, 100] },
                { t: 60, s: [240, 240, 100] }
              ]
            }
          },
          ao: 0,
          shapes: [
            {
              ty: 'gr',
              nm: 'Wave',
              it: [
                {
                  d: 1,
                  ty: 'el',
                  s: { a: 0, k: [60, 60] },
                  p: { a: 0, k: [0, 0] },
                  nm: 'Circle'
                },
                {
                  ty: 'st',
                  c: { a: 0, k: [0.93, 0.28, 0.42, 1] },
                  o: { a: 0, k: 100 },
                  w: { a: 0, k: 6 },
                  nm: 'Wave Stroke'
                },
                {
                  ty: 'tr',
                  p: { a: 0, k: [0, 0] },
                  a: { a: 0, k: [0, 0] },
                  s: { a: 0, k: [100, 100] },
                  r: { a: 0, k: 0 },
                  o: { a: 0, k: 100 }
                }
              ]
            }
          ],
          ip: 0,
          op: 60,
          st: 0
        }
      ]
    }
  },
  {
    id: 'bounce',
    name: 'Bouncing Ball',
    description: 'Dynamic ball bounce with squash & stretch',
    data: {
      v: '5.7.4',
      fr: 30,
      ip: 0,
      op: 60,
      w: 300,
      h: 300,
      nm: 'Bouncing Ball',
      ddd: 0,
      assets: [],
      layers: [
        {
          ddd: 0,
          ind: 1,
          ty: 4,
          nm: 'Ball',
          sr: 1,
          ks: {
            o: { a: 0, k: 100 },
            r: { a: 0, k: 0 },
            p: {
              a: 1,
              k: [
                { i: { x: 0.5, y: 1 }, o: { x: 0.5, y: 0 }, t: 0, s: [150, 70, 0] },
                { i: { x: 0.5, y: 0 }, o: { x: 0.5, y: 1 }, t: 30, s: [150, 230, 0] },
                { t: 60, s: [150, 70, 0] }
              ]
            },
            a: { a: 0, k: [0, 0, 0] },
            s: {
              a: 1,
              k: [
                { i: { x: [0.5, 0.5, 0.5], y: [1, 1, 1] }, o: { x: [0.5, 0.5, 0.5], y: [0, 0, 0] }, t: 0, s: [100, 100, 100] },
                { i: { x: [0.5, 0.5, 0.5], y: [1, 1, 1] }, o: { x: [0.5, 0.5, 0.5], y: [0, 0, 0] }, t: 26, s: [90, 115, 100] },
                { i: { x: [0.5, 0.5, 0.5], y: [1, 1, 1] }, o: { x: [0.5, 0.5, 0.5], y: [0, 0, 0] }, t: 30, s: [135, 70, 100] },
                { i: { x: [0.5, 0.5, 0.5], y: [1, 1, 1] }, o: { x: [0.5, 0.5, 0.5], y: [0, 0, 0] }, t: 35, s: [90, 115, 100] },
                { t: 60, s: [100, 100, 100] }
              ]
            }
          },
          ao: 0,
          shapes: [
            {
              ty: 'gr',
              nm: 'Ball Shape',
              it: [
                {
                  d: 1,
                  ty: 'el',
                  s: { a: 0, k: [56, 56] },
                  p: { a: 0, k: [0, 0] },
                  nm: 'Circle'
                },
                {
                  ty: 'fl',
                  c: { a: 0, k: [0.12, 0.74, 0.53, 1] },
                  o: { a: 0, k: 100 },
                  nm: 'Emerald Fill'
                },
                {
                  ty: 'tr',
                  p: { a: 0, k: [0, 0] },
                  a: { a: 0, k: [0, 0] },
                  s: { a: 0, k: [100, 100] },
                  r: { a: 0, k: 0 },
                  o: { a: 0, k: 100 }
                }
              ]
            }
          ],
          ip: 0,
          op: 60,
          st: 0
        },
        {
          ddd: 0,
          ind: 2,
          ty: 4,
          nm: 'Shadow',
          sr: 1,
          ks: {
            o: {
              a: 1,
              k: [
                { i: { x: [0.5], y: [1] }, o: { x: [0.5], y: [0] }, t: 0, s: [15] },
                { i: { x: [0.5], y: [0] }, o: { x: [0.5], y: [1] }, t: 30, s: [55] },
                { t: 60, s: [15] }
              ]
            },
            r: { a: 0, k: 0 },
            p: { a: 0, k: [150, 245, 0] },
            a: { a: 0, k: [0, 0, 0] },
            s: {
              a: 1,
              k: [
                { i: { x: [0.5, 0.5, 0.5], y: [1, 1, 1] }, o: { x: [0.5, 0.5, 0.5], y: [0, 0, 0] }, t: 0, s: [50, 30, 100] },
                { i: { x: [0.5, 0.5, 0.5], y: [0, 0, 0] }, o: { x: [0.5, 0.5, 0.5], y: [1, 1, 1] }, t: 30, s: [120, 70, 100] },
                { t: 60, s: [50, 30, 100] }
              ]
            }
          },
          ao: 0,
          shapes: [
            {
              ty: 'gr',
              nm: 'Shadow Shape',
              it: [
                {
                  d: 1,
                  ty: 'el',
                  s: { a: 0, k: [60, 20] },
                  p: { a: 0, k: [0, 0] },
                  nm: 'Ellipse'
                },
                {
                  ty: 'fl',
                  c: { a: 0, k: [0, 0, 0, 1] },
                  o: { a: 0, k: 100 },
                  nm: 'Black Fill'
                },
                {
                  ty: 'tr',
                  p: { a: 0, k: [0, 0] },
                  a: { a: 0, k: [0, 0] },
                  s: { a: 0, k: [100, 100] },
                  r: { a: 0, k: 0 },
                  o: { a: 0, k: 100 }
                }
              ]
            }
          ],
          ip: 0,
          op: 60,
          st: 0
        }
      ]
    }
  }
];
