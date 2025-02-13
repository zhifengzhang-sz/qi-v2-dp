.PHONY: venv install dev-install test format check test-coverage clean

VENV = .venv
PYTHON = $(VENV)/bin/python
PIP = $(VENV)/bin/pip

$(VENV)/bin/activate: requirements.txt
	python -m venv $(VENV)
	$(PIP) install --upgrade pip
	$(PIP) install -r requirements.txt

venv: $(VENV)/bin/activate

install: venv

dev-install: venv
	$(PIP) install pytest pytest-cov black mypy

test: dev-install
	$(PYTHON) -m pytest

format: dev-install
	$(PYTHON) -m black .

check: dev-install
	$(PYTHON) -m mypy .

test-coverage: dev-install
	$(PYTHON) -m pytest --cov=. --cov-report=html tests/

clean:
	rm -rf $(VENV)
	find . -type d -name "__pycache__" -exec rm -rf {} +
	find . -type f -name "*.pyc" -delete