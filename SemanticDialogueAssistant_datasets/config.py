# ==========================
# PROJECT CONFIGURATION
# ==========================

# Hugging Face Models
SEMANTIC_MODEL = "sentence-transformers/paraphrase-multilingual-MiniLM-L12-v2"

SENTIMENT_MODEL = "cardiffnlp/twitter-xlm-roberta-base-sentiment"

# Similarity threshold
SIMILARITY_THRESHOLD = 0.70

# Reward System
MAX_STARS = 5

# Attention Threshold
MIN_ATTENTION_SCORE = 70

# CSV Files
PRAGMATICS_DATASET = "datasets/pragmatics.csv"
PROGRESS_FILE = "datasets/progress.csv"
REWARDS_FILE = "datasets/rewards.csv"
EXPECTED_ANSWERS = "datasets/expected_answers.csv"

# Supported Characters
CHARACTERS = [
    "Parent",
    "Teacher",
    "Friend",
    "Stranger"
]

# Speech Settings
LANGUAGE = "ta"

# Transliteration
ALLOW_TANGLISH = True