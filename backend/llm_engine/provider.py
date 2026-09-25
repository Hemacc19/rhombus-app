import hashlib
import json
import logging
import requests
from django.conf import settings
from django.core.cache import cache
from .regex_validator import RegexValidator
from .prompts import (
    REGEX_GENERATION_SYSTEM_PROMPT,
    ENTITY_EXTRACTION_SYSTEM_PROMPT,
    PII_MASKING_SYSTEM_PROMPT
)

logger = logging.getLogger(__name__)

class LLMProviderService:
    def __init__(self):
        self.provider = getattr(settings, 'LLM_PROVIDER', 'auto')
        self.openai_key = getattr(settings, 'OPENAI_API_KEY', '')
        self.groq_key = getattr(settings, 'GROQ_API_KEY', '')
        self.anthropic_key = getattr(settings, 'ANTHROPIC_API_KEY', '')
        self.ollama_url = getattr(settings, 'OLLAMA_BASE_URL', 'http://localhost:11434')

    def generate_regex_from_nl(self, prompt: str, task_type: str = 'NL_REGEX_REPLACE') -> dict:
        """
        Translates Natural Language to Regex pattern.
        Utilizes Redis caching for identical prompts.
        Guards against ReDoS and invalid syntax via RegexValidator.
        """
        prompt_clean = prompt.strip().lower()
        cache_key = f"llm_cache:{task_type}:{hashlib.sha256(prompt_clean.encode('utf-8')).hexdigest()}"
        
        # 1. Check Redis Cache
        cached_result = cache.get(cache_key)
        if cached_result:
            logger.info(f"LLM Prompt Cache HIT for prompt: '{prompt}'")
            cached_result['cached'] = True
            return cached_result

        logger.info(f"LLM Prompt Cache MISS for prompt: '{prompt}'. Querying LLM engine...")

        # 2. Query LLM Provider / Smart Fallback
        raw_output = None
        provider_used = "smart_fallback"

        # Ultra-fast path: If prompt matches standard UI templates, bypass remote LLM immediately
        fast_output = self._smart_local_fallback(prompt_clean, task_type)
        if fast_output["pattern"] != r"\b[A-Za-z0-9]+\b":
            raw_output = fast_output
            provider_used = "smart_local_engine"
        else:
            if self.groq_key:
                raw_output = self._call_groq(prompt, task_type)
                provider_used = "groq"
            elif self.openai_key:
                raw_output = self._call_openai(prompt, task_type)
                provider_used = "openai"
            elif self.anthropic_key:
                raw_output = self._call_anthropic(prompt, task_type)
                provider_used = "anthropic"
            elif self._is_ollama_available():
                raw_output = self._call_ollama(prompt, task_type)
                provider_used = "ollama"

            # Fallback to local smart parser if API keys unavailable or calls fail
            if not raw_output:
                raw_output = fast_output
                provider_used = "smart_local_engine"

        # 3. Parse & Validate
        regex_pattern = raw_output.get("pattern", "")
        replacement_suggestion = raw_output.get("replacement", "")

        validation = RegexValidator.validate_pattern(regex_pattern)

        result = {
            "prompt": prompt,
            "regex_pattern": validation["cleaned_pattern"],
            "replacement_suggestion": replacement_suggestion,
            "is_valid": validation["is_valid"],
            "is_safe": validation["is_safe"],
            "validation_error": validation["error"],
            "provider_used": provider_used,
            "cached": False
        }

        # 4. Cache in Redis if valid and safe
        if validation["is_valid"] and validation["is_safe"]:
            cache.set(cache_key, result, timeout=86400 * 7) # Cache for 7 days

        return result

    def _smart_local_fallback(self, prompt: str, task_type: str) -> dict:
        """
        Intelligent local heuristic regex generator for common data cleaning tasks.
        Ensures zero-config testing without API keys!
        """
        import re
        p = prompt.lower()
        
        def has_kw(*kws):
            return any(re.search(rf'\b{re.escape(k)}\b', p) for k in kws)

        pattern = r"\b[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Za-z]{2,7}\b"
        replacement = "[REDACTED_EMAIL]"

        if has_kw("email"):
            pattern = r"\b[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Za-z]{2,7}\b"
            replacement = "[REDACTED_EMAIL]"
            if task_type == 'ENTITY_EXTRACTION':
                pattern = r"@([A-Za-z0-9.-]+\.[A-Za-z]{2,7})"
        elif has_kw("phone", "mobile", "cell", "workphone", "telephone", "contact"):
            pattern = r"(?:\+?\d{1,3}[-.\s]?)?\(?\d{3}\)?[-.\s]?\d{3}[-.\s]?\d{4}\b"
            replacement = "[REDACTED_PHONE]"
            if has_kw("last 4", "mask", "first 6", "digits"):
                pattern = r"(?:\+?\d{1,3}[-.\s]?)?\(?\d{3}\)?[-.\s]?\d{3}[-.\s]?(\d{4})\b"
                replacement = "XXX-XXX-$1"
        elif has_kw("ssn", "social security"):
            pattern = r"\b\d{3}-\d{2}-\d{4}\b"
            replacement = "[REDACTED_SSN]"
            if has_kw("last 4", "mask"):
                pattern = r"\b\d{3}-\d{2}-(\d{4})\b"
                replacement = "XXX-XX-$1"
        elif has_kw("credit card", "card number"):
            pattern = r"\b(?:\d{4}[-\s]?){3}\d{4}\b"
            replacement = "[REDACTED_CARD]"
        elif has_kw("ip address", "ip"):
            pattern = r"\b(?:\d{1,3}\.){3}\d{1,3}\b"
            replacement = "0.0.0.0"
        elif has_kw("url", "link", "website"):
            pattern = r"https?://[^\s/$.?#].[^\s]*"
            replacement = "[REDACTED_URL]"
            if task_type == 'ENTITY_EXTRACTION':
                pattern = r"https?://(?:www\.)?([^/\s]+)"
        elif has_kw("date"):
            pattern = r"\b(?:\d{4}-\d{2}-\d{2}|\d{2}/\d{2}/\d{4})\b"
            replacement = "YYYY-MM-DD"
            if task_type == 'ENTITY_EXTRACTION':
                pattern = r"\b(\d{4})-\d{2}-\d{2}\b"
        elif has_kw("zip", "postal"):
            pattern = r"\b\d{5}(?:-\d{4})?\b"
            replacement = "XXXXX"
        elif has_kw("dollar", "$", "currency", "rupee", "inr"):
            pattern = r"\$"
            replacement = "₹"
        elif has_kw("number", "numbers", "id", "digit", "digits"):
            pattern = r"\b\d+\b"
            replacement = "[REDACTED_NUM]"
        elif has_kw("wallet", "crypto", "bitcoin", "btc", "eth", "ethereum", "address"):
            pattern = r"\b(?:[13][a-km-zA-HJ-NP-Z1-9]{25,34}|0x[a-fA-F0-9]{40}|bc1[a-zA-HJ-NP-Z0-9]{25,39})\b"
            replacement = "[REDACTED_WALLET]"
        elif has_kw("name"):
            if has_kw("first"):
                pattern = r"^[A-Za-z]+"
            elif has_kw("last"):
                pattern = r"[A-Za-z]+$"
            else:
                pattern = r"\b[A-Za-z]+\b"
            replacement = "[REDACTED_NAME]"
        else:
            # General fallback word pattern or custom match
            stopwords = ['find', 'replace', 'remove', 'mask', 'extract', 'with', 'from', 'column', 'in', 'all', 'the', 'keywords', 'words', 'data', 'values', 'entities']
            words = [w for w in p.split() if len(w) > 3 and w not in stopwords]
            
            # If 0 or 1 words are left, it's highly likely just the column name from a UI template 
            # (e.g. "extract keywords from IssueDescription"). Fall back to a generic keyword extractor.
            if len(words) <= 1:
                pattern = r"([A-Za-z0-9]+)"  # Extracts any alphanumeric word or ID
            else:
                target = "|".join(words)
                pattern = rf"\b(?:{target})\b"
                
            replacement = "MATCHED_VAL"

        return {"pattern": pattern, "replacement": replacement}

    def _call_groq(self, prompt: str, task_type: str) -> dict:
        try:
            sys_prompt = REGEX_GENERATION_SYSTEM_PROMPT if task_type == 'NL_REGEX_REPLACE' else (
                ENTITY_EXTRACTION_SYSTEM_PROMPT if task_type == 'ENTITY_EXTRACTION' else PII_MASKING_SYSTEM_PROMPT
            )
            headers = {"Authorization": f"Bearer {self.groq_key}", "Content-Type": "application/json"}
            payload = {
                "model": "llama-3.3-70b-versatile",
                "messages": [
                    {"role": "system", "content": sys_prompt},
                    {"role": "user", "content": prompt}
                ],
                "temperature": 0.0
            }
            res = requests.post("https://api.groq.com/openai/v1/chat/completions", headers=headers, json=payload, timeout=10)
            if res.status_code == 200:
                content = res.json()["choices"][0]["message"]["content"].strip()
                return self._parse_llm_content(content, task_type)
        except Exception as e:
            logger.error(f"Groq API call error: {e}")
        return None

    def _call_openai(self, prompt: str, task_type: str) -> dict:
        try:
            sys_prompt = REGEX_GENERATION_SYSTEM_PROMPT if task_type == 'NL_REGEX_REPLACE' else (
                ENTITY_EXTRACTION_SYSTEM_PROMPT if task_type == 'ENTITY_EXTRACTION' else PII_MASKING_SYSTEM_PROMPT
            )
            headers = {"Authorization": f"Bearer {self.openai_key}", "Content-Type": "application/json"}
            payload = {
                "model": "gpt-4o-mini",
                "messages": [
                    {"role": "system", "content": sys_prompt},
                    {"role": "user", "content": prompt}
                ],
                "temperature": 0.0
            }
            res = requests.post("https://api.openai.com/v1/chat/completions", headers=headers, json=payload, timeout=10)
            if res.status_code == 200:
                content = res.json()["choices"][0]["message"]["content"].strip()
                return self._parse_llm_content(content, task_type)
        except Exception as e:
            logger.error(f"OpenAI API call error: {e}")
        return None

    def _call_anthropic(self, prompt: str, task_type: str) -> dict:
        try:
            sys_prompt = REGEX_GENERATION_SYSTEM_PROMPT
            headers = {"x-api-key": self.anthropic_key, "anthropic-version": "2023-06-01", "Content-Type": "application/json"}
            payload = {
                "model": "claude-3-haiku-20240307",
                "max_tokens": 300,
                "system": sys_prompt,
                "messages": [{"role": "user", "content": prompt}]
            }
            res = requests.post("https://api.anthropic.com/v1/messages", headers=headers, json=payload, timeout=10)
            if res.status_code == 200:
                content = res.json()["content"][0]["text"].strip()
                return self._parse_llm_content(content, task_type)
        except Exception as e:
            logger.error(f"Anthropic API call error: {e}")
        return None

    def _is_ollama_available(self) -> bool:
        try:
            res = requests.get(f"{self.ollama_url}/api/tags", timeout=2)
            return res.status_code == 200
        except Exception:
            return False

    def _call_ollama(self, prompt: str, task_type: str) -> dict:
        try:
            payload = {
                "model": "llama3.2",
                "prompt": f"{REGEX_GENERATION_SYSTEM_PROMPT}\nUser Input: {prompt}\nOutput:",
                "stream": False
            }
            res = requests.post(f"{self.ollama_url}/api/generate", json=payload, timeout=15)
            if res.status_code == 200:
                content = res.json()["response"].strip()
                return self._parse_llm_content(content, task_type)
        except Exception as e:
            logger.error(f"Ollama call error: {e}")
        return None

    def _parse_llm_content(self, content: str, task_type: str) -> dict:
        content_clean = content.strip('`"\' ')
        if task_type == 'PII_MASKING':
            try:
                data = json.loads(content_clean)
                return {"pattern": data.get("regex", ""), "replacement": data.get("replacement", "[MASKED]")}
            except Exception:
                pass
        return {"pattern": content_clean, "replacement": "REDACTED"}

llm_service = LLMProviderService()
