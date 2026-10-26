# Bioprocess Explorer

An interactive, clickable antibody plant. Each step shows a **live engineering model** next to the **real 3D molecules** that make the step work.

**Milestone 1: Protein A capture** (`protein-a-capture.html`)

- **3D structure**: human IgG Fc bound to protein A's B domain (PDB [1FC2](https://www.rcsb.org/structure/1FC2), Deisenhofer 1981). The page finds the contact residues itself (Fc atoms within 4.0 Å of protein A) and highlights the histidines that let low pH release the antibody.
- **Langmuir isotherm**: how much antibody the resin holds at equilibrium, with a K<sub>d</sub> slider in nM and mg/mL.
- **Breakthrough curve**: a lumped kinetic (LDF) column model solved live in the browser. It reports DBC<sub>10</sub>, capacity used and load time.
- **How it's modeled**: every equation with today's numbers plugged in, a parameter table that tags each value as *source*, *assumed* or *fitted*, plus assumptions, a glossary and references.
- **Checked against published data**: the transport parameter is fitted to one Cytiva data point (6 min) and then compared with a second point it never saw (2.4 min). The model gives 31.6 mg/mL; the data sheet gives about 35 mg/mL (−10%).

This is a learning tool. It is not a design, scale-up or validation tool.

## How to open it

1. Download `protein-a-capture.html`.
2. Double-click it. It opens in your web browser (Chrome, Safari, Edge or Firefox).

There is no install and no build step. The page needs the internet for two things: the 3D viewer library and the 1FC2 structure file. If either can't load, the model and plots still work.

## What it depends on

| Dependency | What it does | Where it comes from |
|---|---|---|
| [3Dmol.js](https://3dmol.org) 2.5.5 | Draws the 3D protein in the page using WebGL. BSD-3 license (free to use, keep the notice). | Loaded by a `<script>` tag from the jsDelivr CDN. |
| PDB entry 1FC2 | Atom coordinates for the Fc / protein A complex. Public domain (CC0). | Downloaded at page load from files.rcsb.org. |
| Google Fonts (Saira, IBM Plex Mono) | Typefaces only. | fonts.googleapis.com. The page falls back to system fonts. |
| Node.js (only for tests) | Runs JavaScript outside the browser so the test file can check the math. | [nodejs.org](https://nodejs.org), install the LTS version. |

Terms:
- **CDN** (content delivery network): a public server that hosts libraries so a page can load them by URL.
- **WebGL**: the browser feature that draws 3D graphics.

## Tests

The model engine has a test suite of 55 checks: hand-calculated isotherm and unit conversions, mass conservation, the sharp-front and linear-isotherm limits, grid convergence, direction of effects, and the published-data calibration.

```bash
node test/model.test.js
```

Open Terminal in this folder (on a Mac: right-click the folder in Finder → *New Terminal at Folder*), paste the line above, and press Enter. It should end with `55 passed, 0 failed`.

The tests read the first `<script>` block straight out of the HTML file, so the page and the tests always use the same math.

## Sources

All model inputs are listed on the page under *Parameters, units and sources* and *References*. In short:

- Cytiva, *Capacity and performance of MabSelect PrismA protein A chromatography resin*, CY14008-02Jun20-AN: Langmuir fits (q<sub>max</sub>, K<sub>d</sub>) for three resins and the 6 min DBC used for fitting.
- Cytiva, *MabSelect SuRe data file*, CY12754-10Jul20-DF: bead size (about 85 µm) and the 2.4 min DBC used as a check.
- Deisenhofer J., *Biochemistry* 20:2361–2370 (1981): the 1FC2 structure.
- Sheth B., UCL PhD thesis (2009): K<sub>d</sub> of 36–181 nM, shown for comparison.

## Credits

Built by Preston with AI assistance (Claude). Layout and quality bar inspired by *Balance Bench* by Dr. Logan Morton (not part of this project).
