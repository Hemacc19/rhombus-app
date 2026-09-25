import pytest
from llm_engine.regex_validator import RegexValidator

def test_valid_regex_pattern():
    pattern = r"\b[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Za-z]{2,7}\b"
    result = RegexValidator.validate_pattern(pattern)
    assert result["is_valid"] is True
    assert result["is_safe"] is True
    assert result["error"] is None

def test_invalid_syntax_regex():
    pattern = r"(\b[A-Z" # Unclosed bracket
    result = RegexValidator.validate_pattern(pattern)
    assert result["is_valid"] is False
    assert result["is_safe"] is False
    assert "Invalid Regex Syntax" in result["error"]

def test_catastrophic_backtracking_detection():
    # Dangerous nested quantifier (a+)+
    dangerous_pattern = r"(a+)+"
    result = RegexValidator.validate_pattern(dangerous_pattern)
    assert result["is_safe"] is False
    assert "Catastrophic Backtracking" in result["error"] or "ReDoS" in result["error"]
