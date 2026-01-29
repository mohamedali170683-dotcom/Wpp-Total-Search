# Contributing to Wpp-Total-Search

Thank you for your interest in contributing! This document provides guidelines for contributing to the project.

## Getting Started

1. Fork the repository
2. Clone your fork locally
3. Set up the development environment (see README.md)
4. Create a new branch for your feature/fix

## Development Setup

```bash
# Clone your fork
git clone https://github.com/yourusername/Wpp-Total-Search.git
cd Wpp-Total-Search/backend

# Create virtual environment
python -m venv venv
source venv/bin/activate

# Install development dependencies
pip install -r requirements.txt
pip install -r requirements-dev.txt  # if available

# Run tests to ensure everything works
pytest tests/ -v
```

## Code Style

We follow these coding standards:

- **Python**: PEP 8 style guide
- **Type hints**: Use type hints for all function parameters and return values
- **Docstrings**: Google-style docstrings for all public functions
- **Line length**: Maximum 100 characters

### Example

```python
from typing import List, Optional

def analyze_keywords(
    keywords: List[str],
    platform: Optional[str] = None
) -> dict:
    """
    Analyze keywords across platforms.
    
    Args:
        keywords: List of keywords to analyze
        platform: Optional platform filter
        
    Returns:
        Dictionary containing analysis results
    """
    # Implementation
    pass
```

## Pull Request Process

1. **Create a feature branch**
   ```bash
   git checkout -b feature/your-feature-name
   ```

2. **Make your changes**
   - Write clean, documented code
   - Add tests for new functionality
   - Update documentation if needed

3. **Run tests**
   ```bash
   pytest tests/ -v
   ```

4. **Commit with meaningful messages**
   ```bash
   git commit -m "feat: add platform gap detection for Pinterest"
   ```
   
   We use [Conventional Commits](https://www.conventionalcommits.org/):
   - `feat:` new feature
   - `fix:` bug fix
   - `docs:` documentation changes
   - `refactor:` code refactoring
   - `test:` adding tests
   - `chore:` maintenance tasks

5. **Push and create PR**
   ```bash
   git push origin feature/your-feature-name
   ```
   Then create a Pull Request on GitHub.

## Pull Request Guidelines

- Provide a clear description of the changes
- Reference any related issues
- Ensure all tests pass
- Update documentation if needed
- Keep PRs focused on a single feature/fix

## Reporting Issues

When reporting issues, please include:

1. **Description**: Clear description of the problem
2. **Steps to reproduce**: Minimal steps to reproduce
3. **Expected behavior**: What you expected to happen
4. **Actual behavior**: What actually happened
5. **Environment**: Python version, OS, etc.

## Feature Requests

Feature requests are welcome! Please include:

1. **Use case**: Why is this feature needed?
2. **Proposed solution**: How should it work?
3. **Alternatives considered**: Other approaches you've thought of

## Project Structure

```
backend/
├── app/
│   ├── main.py           # FastAPI app entry point
│   ├── config.py         # Configuration management
│   ├── models/           # Pydantic data models
│   ├── services/         # Business logic & external API clients
│   ├── routers/          # API endpoint definitions
│   └── utils/            # Helper functions
├── demo_data/            # Sample data for testing
└── tests/                # Test suite
```

### Adding a New Platform

1. Add platform enum in `models/keyword.py`
2. Add endpoint mapping in `services/keywordtool.py`
3. Add platform patterns in `services/opportunity_analyzer.py`
4. Add tests in `tests/`
5. Update documentation

### Adding a New Ad Library

1. Create service in `services/` (e.g., `linkedin_ads.py`)
2. Add models in `models/ad_creative.py`
3. Add router endpoints in `routers/brand_audit.py`
4. Add demo data in `demo_data/`
5. Update documentation

## Questions?

Feel free to open an issue for questions or reach out to the maintainers.

## License

By contributing, you agree that your contributions will be licensed under the MIT License.
