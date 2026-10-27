# Bioprocess Explorer

An interactive, clickable antibody plant. Each step shows a **live engineering model** next to the **real 3D molecules** that make the step work.

## Pages

| Step | Page | Model | Structure | Tests |
|---|---|---|---|---|
| 1 | `bioreactor.html` | CHO batch culture: Monod growth, glucose, dissolved O₂ (k<sub>L</sub>a), antibody (Luedeking–Piret) | IgG1 made in CHO cells (PDB [1HZH](https://www.rcsb.org/structure/1HZH)) | 70 |
| 3 | `protein-a-capture.html` | Langmuir isotherm + lumped kinetic breakthrough column | Fc + protein A (PDB [1FC2](https://www.rcsb.org/structure/1FC2)) | 55 |

The pages link through the plant strip at the top. The Bioreactor's **Load into Protein A capture** button carries the harvest titer to step 3 as its feed concentration.

### Step 1: Bioreactor (`bioreactor.html`)

- **Four coupled ODEs** (cells, glucose, dissolved oxygen, antibody) solved live with RK4.
- **Oxygen ceiling**: the most cells the bubbles can feed, k<sub>L</sub>a·C*/q<sub>O₂</sub>, drawn on the cell plot and shown as an oxygen budget bar.
- **Synced plots**: hover any of the four plots to read the same moment on all of them. Pin a run to compare.
- **Two cell lines**: a research clone with published Luedeking–Piret constants (López-Meza 2016), and a production-style clone whose productivity is fitted so a 7-day batch reaches the typical 1 g/L (Kunert & Reinhart 2016). That fit comes out to 73.9 pg/cell/day.
- **3D**: the whole antibody, heavy and light chains colored, the Fc stem estimated in the page, glycans shown.
- Not modeled yet: feeding (fed-batch), lactate, glutamine, a dissolved-oxygen controller.

### Step 3: Protein A capture (`protein-a-capture.html`)

- **3D structure**: human IgG Fc bound to protein A's B domain (PDB [1FC2](https://www.rcsb.org/structure/1FC2), Deisenhofer 1981). The page finds the contact residues itself (Fc atoms within 4.0 Å of protein A) and highlights the histidines that let low pH release the antibody.
- **Langmuir isotherm**: how much antibody the resin holds at equilibrium, with a K<sub>d</sub> slider in nM and mg/mL.
- **Breakthrough curve**: a lumped kinetic (LDF) column model solved live in the browser. It reports DBC<sub>10</sub>, capacity used and load time.
- **How it's modeled**: every equation with today's numbers plugged in, a parameter table that tags each value as *source*, *assumed* or *fitted*, plus assumptions, a glossary and references.
- **Checked against published data**: the transport parameter is fitted to one Cytiva data point (6 min) and then compared with a second point it never saw (2.4 min). The model gives 31.6 mg/mL; the data sheet gives about 35 mg/mL (−10%).

This is a learning tool. It is not a design, scale-up or validation tool.

## How to open it

1. Download the `.html` files (keep them in the same folder so the links between pages work).
2. Double-click one. It opens in your web browser (Chrome, Safari, Edge or Firefox).

There is no install and no build step. The page needs the internet for two things: the 3D viewer library and the structure files. If either can't load, the model and plots still work.

## What it depends on

| Dependency | What it does | Where it comes from |
|---|---|---|
| [3Dmol.js](https://3dmol.org) 2.5.5 | Draws the 3D protein in the page using WebGL. BSD-3 license (free to use, keep the notice). | Loaded by a `<script>` tag from the jsDelivr CDN. |
| PDB entries 1FC2, 1HZH | Atom coordinates for the molecules. Public domain (CC0). | Downloaded at page load from files.rcsb.org. |
| Google Fonts (Saira, IBM Plex Mono) | Typefaces only. | fonts.googleapis.com. The page falls back to system fonts. |
| Node.js (only for tests) | Runs JavaScript outside the browser so the test file can check the math. | [nodejs.org](https://nodejs.org), install the LTS version. |

Terms:
- **CDN** (content delivery network): a public server that hosts libraries so a page can load them by URL.
- **WebGL**: the browser feature that draws 3D graphics.

## Tests

Each page's model engine has its own test file (125 checks in all):

- `test/model.test.js` (Protein A, 55): hand-calculated isotherm and unit conversions, mass conservation, the sharp-front and linear-isotherm limits, grid convergence, direction of effects, published-data calibration.
- `test/bioreactor.test.js` (Bioreactor, 70): exact exponential growth, the yield balance, Luedeking–Piret integral, oxygen steady state and its 1/k<sub>L</sub>a time constant, the oxygen ceiling, no negative values, step-size convergence, direction of effects, calibration.

```bash
node test/model.test.js
node test/bioreactor.test.js
```

Open Terminal in this folder (on a Mac: right-click the folder in Finder → *New Terminal at Folder*), paste a line, and press Enter. Each should end with `0 failed`.

The tests read the first `<script>` block straight out of the HTML file, so the page and the tests always use the same math.

## Sources

All model inputs are listed on each page under *Parameters, units and sources* and *References*.

Bioreactor:

- Ihling et al. 2021, *Front. Bioeng. Biotechnol.* 9:725498: CHO doubling about 20 h, shake-flask k<sub>L</sub>a 8–42 h⁻¹.
- Chaudhry 2024, *BioProcess International*: CHO q<sub>O₂</sub> 2–8 × 10⁻¹⁰ mmol/cell/h, C* about 0.21 mM.
- Kunert & Reinhart 2016, *Appl. Microbiol. Biotechnol.* 100:3451: batch titers about 1 g/L.
- López-Meza et al. 2016, *Cytotechnology*: yield and Luedeking–Piret constants (read from the abstract).
- Zalai et al. 2016, *Appl. Microbiol. Biotechnol.* 100:7011: seeding at 0.5 × 10⁶ cells/mL.
- Saphire et al. 2001, *Science* 293:1155: the 1HZH structure.

Protein A capture:

- Cytiva, *Capacity and performance of MabSelect PrismA protein A chromatography resin*, CY14008-02Jun20-AN: Langmuir fits (q<sub>max</sub>, K<sub>d</sub>) for three resins and the 6 min DBC used for fitting.
- Cytiva, *MabSelect SuRe data file*, CY12754-10Jul20-DF: bead size (about 85 µm) and the 2.4 min DBC used as a check.
- Deisenhofer J., *Biochemistry* 20:2361–2370 (1981): the 1FC2 structure.
- Sheth B., UCL PhD thesis (2009): K<sub>d</sub> of 36–181 nM, shown for comparison.

## Credits

Built by Preston with AI assistance (Claude). Layout and quality bar inspired by *Balance Bench* by Dr. Logan Morton (not part of this project).
