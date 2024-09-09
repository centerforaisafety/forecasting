def is_news_domains(domain):
    return any(blacklisted in domain for blacklisted in NEWS_DOMAINS)

NEWS_DOMAINS = [
    "pbs"
    "directorsandboards"
    "thestreet"
    "crunchbase",
    "dealroom",
    "bloomberg",
    "washingtonpost",
    "nytimes",
    "reuters",
    "cnn",
    "legaldive",
    "wsj",
    "bbc",
    "apnews",
    "nbcnews",
    "abcnews",
    "cbsnews",
    "foxnews",
    "usatoday",
    "latimes",
    "theguardian",
    "economist",
    "time",
    "forbes",
    "businessinsider",
    "cnbc",
    "ft",
    "huffpost",
    "npr",
    "politico",
    "vox",
    "aljazeera",
    "thehill",
    "nypost",
    "dailymail",
    "newsweek",
    "usnews",
    "chathamhouse",
    "morningconsult",
    "spf",
    "observer"
]