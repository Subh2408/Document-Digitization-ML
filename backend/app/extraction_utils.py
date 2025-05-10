# InsureDocsProject/backend/app/extraction_utils.py
import re
import logging
from typing import Dict, List, Any

logger = logging.getLogger(__name__)

# --- Define Regex Patterns (Examples - ADJUST THESE TO YOUR NEEDS) ---

# Policy Numbers: Matches patterns like ABC-123456 or POL1234567 or INS-987-654
POLICY_NUMBER_PATTERN = r'\b([A-Z]{3}[-_]?\d{3,})\b'

# Dates: Matches MM/DD/YYYY or YYYY-MM-DD
# Uses non-capturing groups (?:...) where possible for cleaner output if only date needed
DATE_PATTERN = r'\b(?:\d{1,2}[/-]\d{1,2}[/-]\d{4}|\d{4}[/-]\d{1,2}[/-]\d{1,2})\b'

# Amounts: Matches $1,234.56 or $567 or $ 123.45 (handles optional space and comma)
AMOUNT_PATTERN = r'\$\s?(\d{1,3}(?:[,]?\d{3})*(?:\.\d{2})?)' # Capture group 1 gets the number part

# --- Extraction Function ---

def extract_information_with_regex(text: str) -> Dict[str, List[Any]]:
    """
    Applies predefined regex patterns to extract information from text.

    Args:
        text: The input text string (likely from OCR).

    Returns:
        A dictionary where keys are entity types (e.g., 'policy_numbers')
        and values are lists of found matches.
    """
    if not text:
        logger.warning("extract_information_with_regex called with empty text.")
        return {}

    extracted_data: Dict[str, List[Any]] = {}

    try:
        # Extract Policy Numbers
        # findall returns a list of all matching strings (or captured groups if defined)
        policy_numbers = re.findall(POLICY_NUMBER_PATTERN, text)
        # Store unique values, filter out potential empty matches if pattern allows
        extracted_data["policy_numbers"] = sorted(list(set(filter(None, policy_numbers))))
        logger.info(f"Found {len(extracted_data['policy_numbers'])} policy numbers.")

        # Extract Dates
        dates = re.findall(DATE_PATTERN, text)
        extracted_data["dates"] = sorted(list(set(filter(None, dates))))
        logger.info(f"Found {len(extracted_data['dates'])} dates.")

        # Extract Amounts (only the number part from capture group 1)
        amounts_str = re.findall(AMOUNT_PATTERN, text)
        # Convert amount strings to numbers (optional, depends on desired output)
        amounts_numeric = []
        for amount_s in amounts_str:
            try:
                # Remove commas before converting
                cleaned_amount = amount_s.replace(',', '')
                amounts_numeric.append(float(cleaned_amount))
            except ValueError:
                logger.warning(f"Could not convert found amount '{amount_s}' to float.")
                # Optionally store the raw string instead: amounts_numeric.append(amount_s)
        # Store unique numeric values
        extracted_data["amounts"] = sorted(list(set(amounts_numeric)))
        logger.info(f"Found {len(extracted_data['amounts'])} amounts.")

        # --- Add more extraction rules here as needed ---

    except Exception as e:
        logger.error(f"Error during regex extraction: {e}", exc_info=True)
        # Return partially extracted data or empty dict depending on requirements
        # return {}

    return extracted_data