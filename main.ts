// NEON ORBIT — dossier builder for the best-game-01 entry.
//
// This program is the hand-in step for our game: it assembles everything
// the make.fun judge needs into the output directory in one run. It copies
// game/ (NEON ORBIT itself: a single self-contained index.html, no network
// requests) and screenshots/ (the game's cover and proof-of-play images)
// next to a freshly written dossier.json, the machine-readable summary the
// judge reads, produced by the vendored buildDossier in vendor/.
//
// The screenshots are part of the contract, not decoration: there must be
// 3 or 4 PNG/JPEG shots of the real game (start screen, gameplay, game
// over), each at most 256 KiB, and the first by name becomes the cover.
//
// Run it the way the grader does, with the output directory pointed
// wherever the dossier should land:
//   MAKEFUN_OUTPUT_DIR=out node main.ts
//
// A working best-game-01 entry (Node 22, standard library only): the game is this directory's
// game/ folder, plain static files a desktop browser loads offline (game/index.html and its ES
// modules, no library and no network request), and the program hands it in. It copies game/ and
// screenshots/ from beside this file to /output and writes /output/dossier.json, the summary the
// judge reads, with the vendored make.fun library. A starting point, not a winner: Block Dodger, a
// plain 2D canvas game where a paddle dodges falling blocks and catches coins, with a title screen,
// score, lives and levels, game over and restart, flat colours and no sound. Build your own game
// (any genre, any library you vendor under game/, or none), put your 3 or 4 PNG or JPEG screenshots
// in screenshots/ (the first by name is the cover) and run it.
//
// Serve it locally with `node serve.ts`, then open http://localhost:8080.
// Outside the grader's container, MAKEFUN_OUTPUT_DIR stands in for /output:
//   mkdir -p out && MAKEFUN_OUTPUT_DIR=out node main.ts

import { cpSync, existsSync, mkdirSync, readdirSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { buildDossier } from './vendor/makefun-game.ts';

const here = fileURLToPath(new URL('.', import.meta.url));
const out = process.env.MAKEFUN_OUTPUT_DIR ?? '/output';

mkdirSync(out, { recursive: true });
cpSync(join(here, 'game'), join(out, 'game'), { recursive: true });
mkdirSync(join(out, 'screenshots'), { recursive: true });
if (existsSync(join(here, 'screenshots'))) cpSync(join(here, 'screenshots'), join(out, 'screenshots'), { recursive: true });

// NEON ORBIT's entry stands or falls on its screenshots, so fail here with a
// plain instruction instead of letting buildDossier report a bare count.
// The scan is sorted, so the check (and the cover, first by name) never
// depends on the order the filesystem happens to list the files in.
const shotNames = readdirSync(join(out, 'screenshots'))
  .filter((name) => /\.(png|jpe?g)$/i.test(name))
  .sort();
if (shotNames.length === 0) {
  throw new Error(
    'screenshots/ holds no PNG or JPEG image: add 3 or 4 screenshots of NEON ORBIT ' +
      '(start screen, gameplay, game over; each at most 256 KiB) beside main.ts and run again.',
  );
}

// The scorer's own caps (reference/gate.json): only text_max_bytes shapes the bytes; the others refuse an entry the
// scorer would refuse (more than 4 screenshots or one over 256 KiB; more than 993 files in game/ or 48 MiB of game
// files, in all, or a path under game/ over 1000 bytes: game/ counts beside /output's own 1000-entry cap, its
// screenshots/ and dossier.json).
writeFileSync(
  join(out, 'dossier.json'),
  buildDossier(out, {
    text_max_bytes: 163840,
    screenshots: { max: 4, max_bytes: 262144 },
    game_max_files: 993,
    game_max_bytes: 50331648,
    game_path_max_bytes: 1000,
  }),
);
