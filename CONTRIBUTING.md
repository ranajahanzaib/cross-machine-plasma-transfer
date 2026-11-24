## Contributing

We welcome contributions of all kinds from researchers, computational physicists, and software engineers to improve this project.

### How to Get Involved

1. **Fork the Repository**: Fork the repository to your GitHub account.
2. **Clone Your Fork**:
   ```bash
   git clone https://github.com/ranajahanzaib/cross-machine-plasma-transfer.git
   cd cross-machine-plasma-transfer
   ```
3. **Set Up the Environment**:
   ```bash
   uv sync
   pnpm install
   ```
4. **Create a Feature Branch**:
   ```bash
   git checkout -b feature/your-feature-name
   ```
5. **Run Tests & Verify Lineage**:
   ```bash
   uv run pytest tests/
   pnpm build
   ```
6. **Submit a Pull Request**: Push your branch and open a Pull Request with a clear summary of your physical/computational additions.

### Scientific Integrity & Leakage Prevention Guidelines

- Never introduce target machine (MAST) equilibrium labels into feature generation or preprocessing steps for Protocol A and B experiments.
- Always run `ProtocolGuard` checks when introducing new feature families or models.
- Maintain reproducible random seeds and documented unit conversions.
