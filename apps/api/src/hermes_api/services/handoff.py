import re


_EXPLICIT_HUMAN_PATTERNS = (
    r"\bquero\s+(falar|conversar)\s+com\s+((um|uma)\s+)?(humano|atendente|pessoa)\b",
    r"\b(falar|conversar)\s+com\s+((um|uma)\s+)?(humano|atendente|pessoa)\b",
    r"\bchama\s+(um\s+)?atendente\b",
    r"\batendimento\s+humano\b",
    r"\bme\s+transfere\s+para\s+(um\s+)?atendente\b",
)


def explicitly_requests_human(text: str) -> bool:
    normalized = " ".join(text.casefold().split())
    return any(re.search(pattern, normalized) for pattern in _EXPLICIT_HUMAN_PATTERNS)
