# InsureDocsProject/backend/app/ocr_utils.py
import os
import fitz                 # PyMuPDF - For opening PDF and rendering pages
from PIL import Image         # Pillow - For handling image data from PyMuPDF
import io                   # For handling image bytes in memory
import traceback            # For error logging
import logging              # Use standard logging
import easyocr              # <<<--- USING EasyOCR, NOT pytesseract
import threading            # For lazy init lock
from typing import Optional

# --- Get Logger ---
logger = logging.getLogger(__name__)

# --- Application Settings Import ---
try:
    from .config import settings
except ImportError:
    logger.error("Failed to import settings from .config in ocr_utils.py. Using default UPLOAD_DIR.")
    class FallbackSettings:
        UPLOAD_DIR = "uploaded_documents"
    settings = FallbackSettings()

# --- Directory Definitions ---
UPLOAD_DIRECTORY = settings.UPLOAD_DIR
TEXT_OUTPUT_DIR = os.path.join(UPLOAD_DIRECTORY, "extracted_text")

# --- Initialize EasyOCR Reader (Lazy and Thread-Safe) ---
# Store reader in a global variable, protected by a lock for initialization
_easyocr_reader = None
_easyocr_lock = threading.Lock()

def get_easyocr_reader():
    """Initializes (if needed) and returns the EasyOCR reader instance."""
    global _easyocr_reader
    if _easyocr_reader is None:
        # Use lock to prevent multiple threads initializing simultaneously
        with _easyocr_lock:
            # Double check if another thread initialized it while waiting for lock
            if _easyocr_reader is None:
                try:
                    logger.info("Initializing EasyOCR Reader (lang='en', gpu=False)...")
                    _easyocr_reader = easyocr.Reader(['en'], gpu=False) # Explicitly CPU
                    logger.info("EasyOCR Reader initialized.")
                except Exception as init_err:
                    logger.critical(f"Failed to initialize EasyOCR Reader: {init_err}", exc_info=True)
                    # Keep it None on failure, subsequent calls will raise error
                    _easyocr_reader = None
                    raise RuntimeError("Failed to initialize EasyOCR Engine.") from init_err
    # If it failed initialization previously, _easyocr_reader will be None
    if _easyocr_reader is None:
        raise RuntimeError("EasyOCR Reader is unavailable (failed initialization).")
    return _easyocr_reader

# --- Helper Functions ---
def get_full_pdf_path(stored_filename: str) -> str:
    """Constructs the full path to the stored PDF file."""
    if not stored_filename:
        logger.error("get_full_pdf_path called with empty stored_filename")
        raise ValueError("stored_filename cannot be empty")
    # Ensure base directory exists (mainly for consistency, might be created by main)
    if not os.path.exists(UPLOAD_DIRECTORY): os.makedirs(UPLOAD_DIRECTORY, exist_ok=True)
    return os.path.join(UPLOAD_DIRECTORY, stored_filename)

def get_output_text_path(stored_pdf_filename: str) -> str:
    """Generates the full path for the output extracted text file."""
    if not stored_pdf_filename:
        logger.error("get_output_text_path called with empty stored_pdf_filename")
        raise ValueError("stored_pdf_filename cannot be empty")
    base_filename = os.path.splitext(stored_pdf_filename)[0]
    txt_filename = f"{base_filename}.txt"
    # Ensure output directory exists
    if not os.path.exists(TEXT_OUTPUT_DIR): os.makedirs(TEXT_OUTPUT_DIR, exist_ok=True)
    return os.path.join(TEXT_OUTPUT_DIR, txt_filename)


# --- Internal function to try text layer extraction ---
def _try_text_layer_extraction(doc_id: int, doc: fitz.Document) -> Optional[str]:
    """Attempts text layer extraction using PyMuPDF."""
    logger.info(f"[Task {doc_id}] Attempting PyMuPDF text layer extraction...")
    full_text = ""
    try:
        num_pages = len(doc)
        sufficient_pages = 0
        min_chars_heuristic = 30 # Adjust heuristic as needed
        for i, page in enumerate(doc):
            try:
                # Extract text - using "text" preserves basic layout
                text = page.get_text("text").strip()
                if len(text) > min_chars_heuristic:
                    sufficient_pages += 1
                full_text += f"\n--- Page {i+1} (Text Layer) ---\n{text}\n"
            except Exception as page_err:
                 logger.warning(f"[Task {doc_id}] Error extracting text layer from page {i+1}: {page_err}")
                 full_text += f"\n--- Page {i+1} (TEXT EXTRACT ERROR) ---\n"

        # Determine if enough text was likely found
        if num_pages > 0 and (sufficient_pages / num_pages) > 0.5:
            logger.info(f"[Task {doc_id}] Text layer deemed sufficient ({sufficient_pages}/{num_pages} pages).")
            return full_text
        else:
            logger.info(f"[Task {doc_id}] Text layer insufficient ({sufficient_pages}/{num_pages} pages). Will attempt OCR.")
            return None
    except Exception as e:
        logger.warning(f"[Task {doc_id}] Error during overall text layer extraction: {e}. Will attempt OCR.", exc_info=False)
        return None

# --- Internal function for EasyOCR processing ---
def _perform_easyocr_on_doc(doc_id: int, doc: fitz.Document) -> str:
    """Performs EasyOCR on images extracted from PDF pages via PyMuPDF."""
    logger.info(f"[Task {doc_id}] Starting EasyOCR processing...")
    full_text_ocr = ""
    reader = get_easyocr_reader() # Initialize reader if this is the first OCR task
    num_pages = len(doc)
    logger.info(f"[Task {doc_id} EasyOCR] Processing {num_pages} pages.")

    for i, page in enumerate(doc):
        page_num = i + 1
        logger.debug(f"[Task {doc_id} EasyOCR] Getting image for page {page_num}/{num_pages}...")
        try:
            # Render page to image bytes via PyMuPDF
            pix = page.get_pixmap(dpi=300) # 300 DPI recommended for OCR
            img_data = pix.tobytes("png") # PNG is lossless

            # Perform OCR with EasyOCR
            logger.debug(f"  [Page {page_num}] Running EasyOCR...")
            # Read text, joining into paragraphs if possible, detail=0 just gets text list
            results = reader.readtext(img_data, detail=0, paragraph=True)
            page_text = "\n".join(results) # Combine results into a single string for the page
            full_text_ocr += f"\n--- Page {page_num} (EasyOCR) ---\n{page_text}\n"
            logger.debug(f"  [Page {page_num}] EasyOCR successful.")

        except Exception as page_err:
            logger.warning(f"[Task {doc_id} EasyOCR] WARNING: Error processing page {page_num} with EasyOCR: {page_err}", exc_info=True)
            full_text_ocr += f"\n--- Page {page_num} (EASYOCR ERROR: {str(page_err)}) ---\n"

    return full_text_ocr

# --- Main Exposed Function ---
def perform_text_extract_or_ocr(doc_id: int, pdf_full_path: str, text_output_full_path: str) -> str:
    """
    Extracts text from PDF: Tries PyMuPDF text layer first, falls back to EasyOCR if needed.
    Saves the resulting text to text_output_full_path.

    Returns: Full path to the output text file on success.
    Raises: Exception on critical failure.
    """
    logger.info(f"[Task {doc_id}] Starting hybrid text extraction/OCR for: {pdf_full_path}")
    if not os.path.exists(pdf_full_path):
        logger.error(f"[Task {doc_id}] Input PDF not found: {pdf_full_path}")
        raise FileNotFoundError(f"Input PDF not found: {pdf_full_path}")

    doc: Optional[fitz.Document] = None
    final_text = ""
    extracted_from_layer = False

    try:
        doc = fitz.open(pdf_full_path) # Open PDF document

        # Step 1: Attempt text layer extraction
        extracted_text = _try_text_layer_extraction(doc_id, doc)

        if extracted_text is not None:
            final_text = extracted_text
            extracted_from_layer = True
        else:
            # Step 2: Fallback to EasyOCR on images
            final_text = _perform_easyocr_on_doc(doc_id, doc)
            # If _perform_easyocr_on_doc fails critically, it raises an exception handled below

        # Step 3: Save the final resulting text
        logger.info(f"[Task {doc_id}] Writing final text (from {'Layer' if extracted_from_layer else 'EasyOCR'}) to {text_output_full_path}")
        with open(text_output_full_path, "w", encoding="utf-8") as f:
            f.write(final_text)
        logger.info(f"[Task {doc_id}] Final text saved successfully.")
        return text_output_full_path # Return success path

    except Exception as e:
        logger.error(f"[Task {doc_id}] CRITICAL FAILURE in text_extract_or_ocr for {pdf_full_path}: {e}", exc_info=True)
        raise # Re-raise the caught exception to signal failure to the background task

    finally:
        if doc: # Ensure PDF document object is closed
            try:
                doc.close(); logger.debug(f"[Task {doc_id}] Closed PDF document.")
            except Exception as close_err:
                logger.warning(f"[Task {doc_id}] Error closing PDF: {close_err}")