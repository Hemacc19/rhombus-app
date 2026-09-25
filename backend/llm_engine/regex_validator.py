import re
import concurrent.futures
import time
import logging

logger = logging.getLogger(__name__)

class RegexValidator:
    """
    Validates regex patterns for syntactic correctness and guards against 
    Catastrophic Backtracking (ReDoS vulnerabilities).
    """

    DANGEROUS_PATTERNS = [
        r'\((?:[^\)]*[\+\*])[^\)]*\)[\+\*]',   # Nested quantifiers like (a+)+ or (\w+)*
        r'\((?:[^\)]*\|[^\)]*)\)[\+\*]',       # Ambiguous alternations like (a|a)+
        r'\.\*[\s\S]*\.\*',                     # Multiple ungreedy wildcards .*.*
        r'\.\+[\s\S]*\.\+',                     # Multiple .+ .+
    ]

    @classmethod
    def validate_pattern(cls, pattern: str) -> dict:
        """
        Validates a regex pattern.
        Returns:
            {
                "is_valid": bool,
                "is_safe": bool,
                "error": str or None,
                "cleaned_pattern": str
            }
        """
        if not pattern or not isinstance(pattern, str):
            return {
                "is_valid": False,
                "is_safe": False,
                "error": "Pattern is empty or invalid type.",
                "cleaned_pattern": pattern
            }

        # Clean outer quotes if LLM added them
        cleaned_pattern = pattern.strip('`"\' ')
        
        # Remove trailing/leading inline code flags if present
        if cleaned_pattern.startswith('regex'):
            cleaned_pattern = cleaned_pattern[5:].strip()

        # Step 1: Syntactic Validity Check
        try:
            compiled_re = re.compile(cleaned_pattern)
        except re.error as e:
            return {
                "is_valid": False,
                "is_safe": False,
                "error": f"Invalid Regex Syntax: {str(e)}",
                "cleaned_pattern": cleaned_pattern
            }

        # Step 2: Static Analysis for ReDoS Vulnerability
        for dangerous in cls.DANGEROUS_PATTERNS:
            if re.search(dangerous, cleaned_pattern):
                return {
                    "is_valid": True,
                    "is_safe": False,
                    "error": "Potential Catastrophic Backtracking (ReDoS) detected in pattern structure.",
                    "cleaned_pattern": cleaned_pattern
                }

        # Step 3: Time-Bounded Benchmark against Adversarial Strings
        is_safe, benchmark_error = cls._run_safety_benchmark(compiled_re)
        if not is_safe:
            return {
                "is_valid": True,
                "is_safe": False,
                "error": f"Safety Benchmark Failed: {benchmark_error}",
                "cleaned_pattern": cleaned_pattern
            }

        return {
            "is_valid": True,
            "is_safe": True,
            "error": None,
            "cleaned_pattern": cleaned_pattern
        }

    @classmethod
    def _run_safety_benchmark(cls, compiled_re, timeout_seconds=0.1) -> tuple:
        """
        Executes regex match against synthetic worst-case test strings in a thread pool 
        to detect exponential execution time.
        """
        test_strings = [
            "a" * 30 + "!",
            "1" * 30 + "@",
            "abc" * 15 + "#",
            "john.doe@" * 5 + "invalid_domain",
            " " * 30 + "x"
        ]

        def _test_match():
            for test_str in test_strings:
                compiled_re.search(test_str)
                compiled_re.findall(test_str)
            return True

        with concurrent.futures.ThreadPoolExecutor(max_workers=1) as executor:
            future = executor.submit(_test_match)
            try:
                future.result(timeout=timeout_seconds)
                return True, None
            except concurrent.futures.TimeoutError:
                return False, f"Regex evaluation timed out after {timeout_seconds}s (catastrophic backtracking risk)."
            except Exception as e:
                return False, f"Execution error during safety test: {str(e)}"
