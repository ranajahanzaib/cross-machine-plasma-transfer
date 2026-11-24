# Changelog

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/), and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [0.1.0] - 2026-11-24

### Added

- Complete scientific research platform for cross-machine magnetic equilibrium transfer analysis between DIII-D and MAST.
- Programmatic `ProtocolGuard` enforcing Protocol A (Strict source-only), Protocol B (Challenge label-free), and Protocol C (FAIR-MAST independent research).
- Machine geometry engine parsing DIII-D skewed F-coils and MAST P-coils in verified $\text{kA}\cdot\text{turn}$.
- Machine-invariant feature engineering: geometry-weighted current moments, gap-aware interpolation, and profile quantiles.
- Univariate and multivariate domain shift analysis (Wasserstein, KS statistic, MMD, stratified domain classifier).
- Domain adaptation methods (Correlation Alignment / CORAL and Optimal Transport via Sinkhorn).
- Equilibrium reconstruction baseline models and $k$-NN source-support Out-of-Distribution (OOD) detector.
- Next.js 14 App Router scientific workbench with D3.js and HTML5 Canvas visualizations across 17 dedicated routes.
- FastAPI backend serving analytical artifacts, machine geometry, and automated Markdown research reports.
