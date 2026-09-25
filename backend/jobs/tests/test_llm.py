import pytest
from django.core.cache import cache
from llm_engine.provider import llm_service

def test_llm_smart_fallback_email():
    prompt = "find email addresses in email column"
    result = llm_service.generate_regex_from_nl(prompt, task_type='NL_REGEX_REPLACE')
    assert result["is_valid"] is True
    assert result["is_safe"] is True
    assert "@" in result["regex_pattern"]

def test_llm_redis_cache():
    cache.clear()
    prompt = "find phone numbers formatted as 123-456-7890"
    
    # First call: Cache Miss
    res1 = llm_service.generate_regex_from_nl(prompt)
    assert res1["cached"] is False
    
    # Second call: Cache Hit
    res2 = llm_service.generate_regex_from_nl(prompt)
    assert res2["cached"] is True
    assert res2["regex_pattern"] == res1["regex_pattern"]
