# InsureDocsProject/backend/app/ner_utils.py
import spacy
import re
import logging
from typing import Dict, Any, List, Set, Optional

logger = logging.getLogger(__name__)

# --- Load spaCy Model ---
NLP_MODEL_NAME = "en_core_web_sm" # Or "en_core_web_md" / "en_core_web_lg"
NLP = None
try:
    logger.info(f"Loading spaCy model '{NLP_MODEL_NAME}' for NER...")
    NLP = spacy.load(NLP_MODEL_NAME)
    logger.info("spaCy model loaded successfully for NER.")
except OSError:
    logger.error(f"SpaCy model '{NLP_MODEL_NAME}' not found. Please run: python -m spacy download {NLP_MODEL_NAME}")
except Exception as e:
    logger.error(f"Unexpected error loading spaCy model: {e}", exc_info=True)

# --- Define Regex Patterns ---
# Compile regex patterns for efficiency. Using named groups optional but helpful.
# Refine these patterns based on REAL examples of your document data!
REGEX_CONFIG = [
    {"label": "POLICY_NUMBER", "pattern": re.compile(r"policy\s*(?:number|num|no|#)[:\s]*([A-Z0-9\-]{6,25})\b", re.IGNORECASE)},
    {"label": "CLAIM_NUMBER", "pattern": re.compile(r"claim\s*(?:number|num|no|#)[:\s]*([A-Z0-9\-]{6,25})\b", re.IGNORECASE)},
    {"label": "MEMBER_ID", "pattern": re.compile(r"\b(?:member|subscriber)\s*id[:\s]*([A-Z0-9]{5,20})\b", re.IGNORECASE)},
    {"label": "GROUP_NUMBER", "pattern": re.compile(r"\bgroup\s*(?:number|num|no|#)[:\s]*([A-Z0-9\-]{5,20})\b", re.IGNORECASE)},
    # Find ISO dates like YYYY-MM-DD
    {"label": "REGEX_DATE_ISO", "pattern": re.compile(r"\b(\d{4}-\d{2}-\d{2})\b")},
    # Find common US dates like MM/DD/YYYY or MM-DD-YYYY
    {"label": "REGEX_DATE_US", "pattern": re.compile(r"\b(\d{1,2}[-/]\d{1,2}[-/]\d{4})\b")},
    # Find amounts with optional $ sign, commas, and cents
    {"label": "REGEX_AMOUNT", "pattern": re.compile(r"(\$?\s?\d{1,3}(?:[,.]\d{3})*(?:\.\d{2})?)\b")},
    {"label": "VIN", "pattern": re.compile(r"\b([A-HJ-NPR-Z0-9]{17})\b", re.IGNORECASE)}
    # Add patterns for NPI, ICD, CPT, SSN (handle masking/PII carefully!), etc.
]

# --- Main Extraction Function ---

def extract_entities(text: str) -> Dict[str, List[str]]:
    """
    Extracts named entities using spaCy and regex from input text.

    Args:
        text: The text content (e.g., from OCR).

    Returns:
        Dictionary with entity labels as keys and list of unique values as values.
    """
    if not text or not isinstance(text, str):
        logger.warning("extract_entities received empty or non-string input.")
        return {}

    # Use a dictionary where values are sets to automatically handle uniqueness
    entities: Dict[str, Set[str]] = {}

    # 1. spaCy Pre-trained NER (if model loaded)
    if NLP:
        try:
            logger.info("Starting spaCy NER processing...")
            doc = NLP(text)
            count = 0
            for ent in doc.ents:
                # Standard spaCy labels: PERSON, NORP, FAC, ORG, GPE, LOC, PRODUCT,
                # EVENT, WORK_OF_ART, LAW, LANGUAGE, DATE, TIME, PERCENT, MONEY, QUANTITY, ORDINAL, CARDINAL
                label = ent.label_
                value = ent.text.strip()
                # Basic filtering/normalization
                if value and len(value) > 1: # Ignore single characters
                    # You might add more cleaning here (e.g., remove leading/trailing punctuation)
                    if label not in entities:
                        entities[label] = set()
                    entities[label].add(value)
                    count += 1
            logger.info(f"spaCy processing complete. Found {count} entities across {len(entities)} types.")
        except Exception as spacy_err:
             logger.error(f"Error during spaCy NER processing: {spacy_err}", exc_info=True)
    else:
         logger.warning("spaCy model not available. Skipping spaCy NER.")

    # 2. Apply Custom Regex Patterns
    logger.info("Applying custom Regex patterns...")
    regex_match_count = 0
    for config in REGEX_CONFIG:
        label = config["label"]
        pattern = config["pattern"]
        try:
            # findall is good if your pattern captures the specific value in a group
            matches = pattern.findall(text)
            if matches:
                # If pattern had one capture group, matches is list[str]
                # If multiple groups, list[tuple]. Handle accordingly.
                # Assuming one capture group based on examples:
                cleaned_matches = {m.strip() for m in matches if isinstance(m, str) and m.strip()}
                if cleaned_matches:
                    if label not in entities: entities[label] = set()
                    new_finds = len(cleaned_matches - entities[label]) # Count how many are new
                    entities[label].update(cleaned_matches)
                    if new_finds > 0: logger.debug(f"Regex found {new_finds} new instance(s) for '{label}'")
                    regex_match_count += new_finds
        except Exception as regex_err:
             logger.error(f"Error applying regex for '{label}': {regex_err}", exc_info=True)
    logger.info(f"Regex processing complete. Found {regex_match_count} new entity instances.")

    # Convert sets to sorted lists for consistent JSON output
    final_entities: Dict[str, List[str]] = {
        label: sorted(list(values))
        for label, values in entities.items()
        if values # Ensure the set is not empty
    }
    logger.info(f"Entity extraction finished. Result keys: {list(final_entities.keys())}")
    return final_entities