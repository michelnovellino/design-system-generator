# Contributing to Design System Generator

First off, thank you for taking the time to contribute! Contributions from the community help make this project better for everyone.

Please review the following guidelines before you start working on any changes.

## Architecture Guidelines (ADRs)

Before making any significant architectural changes, please read the **Architecture Decision Records (ADRs)** located in the [`docs/DECISIONS.md`](docs/DECISIONS.md) file. 

This project follows strict guidelines:
- **Zero Vue coupling in engines**: All calculations (color, contrast, CVD, typography) live in pure TypeScript under `src/engines/` and must remain framework-agnostic.
- **Official packages only**: APCA and Bridge PCA formulas must use unmodified official packages (`apca-w3` and `bridge-pca`).
- **No Style Dictionary**: For CSS variables, Tailwind configuration, and standard JSON export, we use our own light-weight transforms (defined under `src/export/`). Refer to ADR-004 before proposing a change to this setup.

## Development Setup

This project uses **pnpm** as its package manager.

### Prerequisites

- Node.js 20+ (Node 24 recommended)
- `pnpm` (configured in `package.json`)

### Installation

Clone the repository and install the dependencies:

```bash
git clone https://github.com/michelnovellino/design-system-generator.git
cd design-system-generator
pnpm install
```

### Local Development

Start the development server:

```bash
pnpm dev
```

The application will be running at `http://localhost:5173`.

### Running Tests

We use **Vitest** for testing the engines and components. Ensure your changes do not break any tests, and write new tests for any added features or engine modifications.

```bash
pnpm test          # Run tests once
pnpm test:watch    # Run tests in watch mode
```

### Production Build

Before submitting a Pull Request, verify that the project type-checks and builds successfully:

```bash
pnpm build
```

## Pull Request Process

1. Create a new branch for your feature or bug fix: `git checkout -b feature/your-feature-name`.
2. Commit your changes with clear, descriptive commit messages.
3. Ensure all tests pass (`pnpm test`) and the project builds successfully (`pnpm build`).
4. Push to your branch and submit a Pull Request (PR) to the `main` branch.
5. In your PR description, explain the rationale behind your changes and what problem they solve.

## Code of Conduct

We expect all contributors to adhere to our [Code of Conduct](CODE_OF_CONDUCT.md). Please be respectful and collaborative in all communication.
