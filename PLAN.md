# Plan

Goal: a polished public site where a student clicks through an antibody plant and, at each step, sees a working model beside the real molecules. Public v1 target: August 2027, before ECH 4742 (Bioprocess Engineering & Bioseparations).

## Milestone 1: Protein A capture (this page)

- [x] Single HTML file, no build step, light and dark mode, works at phone width
- [x] PDB 1FC2 in 3Dmol.js; contact residues and histidines computed in the page
- [x] Langmuir isotherm with K<sub>d</sub> slider (nM and mg/mL)
- [x] Breakthrough curve from a lumped kinetic (LDF) model; DBC<sub>10</sub>, capacity used, load time
- [x] "How it's modeled" with live numbers, tagged parameter table, assumptions, glossary, references
- [x] Fit D<sub>e</sub> to one published point; compare with a second (−10%)
- [x] Node test suite (55 checks)
- [ ] **Preston:** open the page on your own computer and confirm the real 1FC2 structure loads and looks right (the build machine could not reach rcsb.org, so it was tested with a stand-in file)
- [ ] **Preston:** read every number in the parameter table against the two Cytiva PDFs yourself
- [ ] Publish with GitHub Pages

## Milestone 2: Bioreactor

- [x] `bioreactor.html`: Monod growth on glucose and O₂, death, glucose and O₂ balances, Luedeking–Piret antibody
- [x] k<sub>L</sub>a slider, oxygen ceiling line, oxygen budget bar, low-DO warning
- [x] Four synced small-multiple plots, pin-a-run comparison, day-by-day table
- [x] Two cell lines: published research clone, production clone fitted to 1 g/L
- [x] 3D IgG1 from CHO cells (1HZH), chains colored, Fc stem estimated, glycans
- [x] Pages linked; titer hand-off to Protein A capture
- [x] Node test suite (70 checks)
- [ ] **Preston:** confirm 1HZH loads and the orange Fc stem lands on the stem, not an arm (tested here only with a stand-in file)
- [ ] Check López-Meza 2016 yield units (abstract prints cells/mL; the page reads it as per g/L glucose) and the journal volume
- [ ] Find a cited K<sub>s</sub> for glucose and a death-rate value (both assumed now)

Next for this page: fed-batch feeding, a DO controller, lactate, and k<sub>L</sub>a from stirring and gas flow (van't Riet correlation, checking its valid range first).

## Open questions to check

- Cytiva Table 3 does not print units for K<sub>d</sub>. The page reads them as mg/mL. Confirm.
- The PrismA note says QB10 in the text but "load to 20% breakthrough" in a table. Which one applies to the 6 min number?
- The 2.4 min data-sheet value does not state a feed concentration (5 mg/mL is assumed).
- Compare the fitted D<sub>e</sub> (2.52 × 10⁻⁸ cm²/s) with published IgG pore diffusivities for agarose protein A resins (for example Hahn et al. 2005, *J. Chromatogr. A* 1093:98).
- The Glueckauf LDF factor and Carta & Jungbauer textbook form were recalled, not re-checked online.

## Next ideas for this page

- Elution: a pH slider that protonates the highlighted histidines and releases antibody
- Wash and cleaning (CIP) steps to make a full cycle and a productivity number
- A general rate model (pore diffusion inside the bead) to compare with the LDF shortcut
- Load a full IgG (PDB 1HZH) to show where the Fc sits on the whole antibody

## Later pages (Concept A roadmap)

1. **Bioreactor** (done: batch growth, oxygen, titer)
2. Harvest (centrifuge, depth filter)
3. **Protein A capture** (done)
4. Low-pH viral inactivation
5. Polishing (ion exchange)
6. UF/DF (tangential flow filtration)
