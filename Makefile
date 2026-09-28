VENV := .venv
PYTHON := $(VENV)/bin/python
PIP := $(VENV)/bin/pip
PRE_COMMIT := $(VENV)/bin/pre-commit

.PHONY: setup install pre-commit pre-commit-all clean

setup: install
	$(PRE_COMMIT) install

install:
	python3 -m venv $(VENV)
	$(PIP) install --upgrade pip
	$(PIP) install -r requirements-dev.txt

pre-commit:
	$(PRE_COMMIT) run

pre-commit-all:
	$(PRE_COMMIT) run --all-files

clean:
	rm -rf $(VENV)
