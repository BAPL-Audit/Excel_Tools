import requests
import time
import hashlib
import hmac
import base64
import json
import logging
from typing import Optional
import os

# Configure logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

# API Configuration
API_KEY = os.getenv("LONGCAT_API_KEY", "your_api_key")
API_SECRET = os.getenv("LONGCAT_API_SECRET", "your_api_secret")
API_ENDPOINT = os.getenv("LONGCAT_API_ENDPOINT", "https://api-meituan.com/longcat/ai/chat")

# Constants
MAX_RETRIES = 3
RETRY_DELAY = 1  # seconds
REQUEST_TIMEOUT = 30  # seconds


def generate_signature(timestamp: int, api_secret: str) -> str:
    """
    Generate HMAC-SHA256 signature for LongCat API authentication.

    Args:
        timestamp: Unix timestamp for the request
        api_secret: Secret API key for HMAC signature generation

    Returns:
        Hexadecimal HMAC-SHA256 signature
    """
    try:
        message = str(timestamp).encode("utf-8")
        secret = api_secret.encode("utf-8")
        signature = hmac.new(secret, message, hashlib.sha256).hexdigest()
        return signature
    except Exception as e:
        logger.error(f"Error generating signature: {str(e)}")
        raise LongCatAPIError(f"Failed to generate signature: {str(e)}")


def longcat_chat(prompt: str, max_retries: int = MAX_RETRIES) -> str:
    """
    Send chat request to LongCat API with retry logic and error handling.

    Args:
        prompt: The user prompt/question for the AI
        max_retries: Maximum number of retry attempts for failed requests

    Returns:
        AI response text as string

    Raises:
        LongCatAPIError: For API-related errors after all retries exhausted
    """
    if not prompt or not prompt.strip():
        raise ValueError("Prompt cannot be empty")

    if len(prompt) > 10000:  # Prevent overly long prompts
        raise ValueError("Prompt too long. Maximum 10000 characters allowed.")

    timestamp = int(time.time())
    signature = generate_signature(timestamp, API_SECRET)

    headers = {
        "Content-Type": "application/json",
        "x-api-key": API_KEY,
        "x-signature": signature,
        "x-timestamp": str(timestamp),
    }

    payload = {
        "model": "longcat-gpt",
        "messages": [
            {
                "role": "system",
                "content": "You are a chartered accountant AI assistant specializing in data analysis and Indian taxation."
            },
            {
                "role": "user",
                "content": prompt
            }
        ]
    }

    last_exception = None

    for attempt in range(max_retries):
        try:
            logger.info(f"Sending request to LongCat API (attempt {attempt + 1}/{max_retries})")

            response = requests.post(
                API_ENDPOINT,
                headers=headers,
                data=json.dumps(payload),
                timeout=REQUEST_TIMEOUT
            )

            # Handle different HTTP status codes
            if response.status_code == 200:
                try:
                    result = response.json()

                    # Extract AI response from the expected format
                    if "choices" in result and len(result["choices"]) > 0:
                        ai_response = result["choices"][0].get("message", {}).get("content", "")
                        if ai_response:
                            logger.info("Successfully received response from LongCat API")
                            return ai_response
                        else:
                            raise LongCatAPIError("Empty response received from AI service")
                    else:
                        raise LongCatAPIError("Invalid response format from AI service")

                except json.JSONDecodeError as e:
                    raise LongCatAPIError(f"Invalid JSON response from API: {str(e)}")

            elif response.status_code == 401:
                raise LongCatAPIError("Authentication failed. Invalid API credentials.")

            elif response.status_code == 403:
                raise LongCatAPIError("Access forbidden. Check API permissions.")

            elif response.status_code == 429:
                # Rate limiting - wait longer before retrying
                if attempt < max_retries - 1:
                    wait_time = RETRY_DELAY * (2 ** attempt)  # Exponential backoff
                    logger.warning(f"Rate limited. Waiting {wait_time}s before retry...")
                    time.sleep(wait_time)
                    continue
                else:
                    raise LongCatAPIError("Rate limit exceeded. Please try again later.")

            elif response.status_code >= 500:
                # Server error - worth retrying
                if attempt < max_retries - 1:
                    wait_time = RETRY_DELAY * (2 ** attempt)
                    logger.warning(f"Server error {response.status_code}. Retrying in {wait_time}s...")
                    time.sleep(wait_time)
                    continue
                else:
                    raise LongCatAPIError(f"Server error: {response.status_code} - {response.text}")
            else:
                raise LongCatAPIError(f"HTTP error {response.status_code}: {response.text}")

        except requests.exceptions.Timeout:
            last_exception = LongCatAPIError("Request timeout. AI service is taking too long to respond.")
            if attempt < max_retries - 1:
                wait_time = RETRY_DELAY * (2 ** attempt)
                logger.warning(f"Request timeout. Retrying in {wait_time}s...")
                time.sleep(wait_time)
                continue

        except requests.exceptions.ConnectionError:
            last_exception = LongCatAPIError("Unable to connect to AI service. Please check your internet connection.")
            if attempt < max_retries - 1:
                wait_time = RETRY_DELAY * (2 ** attempt)
                logger.warning(f"Connection error. Retrying in {wait_time}s...")
                time.sleep(wait_time)
                continue

        except requests.exceptions.RequestException as e:
            last_exception = LongCatAPIError(f"Network error: {str(e)}")
            if attempt < max_retries - 1:
                wait_time = RETRY_DELAY * (2 ** attempt)
                logger.warning(f"Network error. Retrying in {wait_time}s...")
                time.sleep(wait_time)
                continue

    # If we get here, all retries have been exhausted
    if last_exception:
        raise last_exception
    else:
        raise LongCatAPIError("Failed to get response from AI service after multiple attempts.")


class LongCatAPIError(Exception):
    """Custom exception for LongCat API related errors."""
    pass


# Test function for development
def test_api_connection():
    """
    Test the API connection with a simple prompt.
    Returns True if successful, False otherwise.
    """
    try:
        test_prompt = "Hello, this is a test message."
        response = longcat_chat(test_prompt)
        logger.info("API connection test successful")
        return True
    except Exception as e:
        logger.error(f"API connection test failed: {str(e)}")
        return False


if __name__ == "__main__":
    # Simple test when run directly
    try:
        test_response = longcat_chat("What are the key components of TDS deduction?")
        print("AI Response:", test_response)
    except Exception as e:
        print("Error:", str(e))