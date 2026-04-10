"""Huawei Cloud authentication using the official SDK.

Uses BasicCredentials (AK/SK) which automatically signs each API request.
No manual token management needed — the SDK handles all signing internally.

Provides separate credentials for SIS (me-east-1) and NLP (cn-north-4)
since they use different project IDs.
"""

from config import Config

try:
    from huaweicloudsdkcore.auth.credentials import BasicCredentials
    HUAWEI_SDK_AVAILABLE = True
except ImportError:
    HUAWEI_SDK_AVAILABLE = False

# Singleton credentials instances — reused by all service clients.
_sis_credentials = None
_nlp_credentials = None


def _check_sdk():
    if not HUAWEI_SDK_AVAILABLE:
        raise RuntimeError(
            "Huawei Cloud SDK is not installed. "
            "Run: pip install huaweicloudsdkcore huaweicloudsdksis huaweicloudsdknlp"
        )
    if not Config.HUAWEI_AK or not Config.HUAWEI_SK:
        raise ValueError(
            "Huawei Cloud credentials not configured. "
            "Set HUAWEI_AK and HUAWEI_SK in backend/.env"
        )


def get_credentials():
    """Get Huawei Cloud credentials for SIS (Speech) services.

    Returns a BasicCredentials instance bound to the SIS project ID.
    """
    global _sis_credentials
    _check_sdk()

    if _sis_credentials is None:
        _sis_credentials = BasicCredentials(
            ak=Config.HUAWEI_AK,
            sk=Config.HUAWEI_SK,
            project_id=Config.HUAWEI_SIS_PROJECT_ID,
        )
    return _sis_credentials


def get_iam_token(region: str = None, project_id: str = None) -> str:
    """Get an IAM token for WebSocket auth (X-Auth-Token).

    Tokens are cached for 23 hours (they expire after 24h).
    """
    import time
    import requests as http_requests

    region = region or Config.HUAWEI_SIS_REGION
    project_id = project_id or Config.HUAWEI_SIS_PROJECT_ID

    # Check cache
    cache_key = f"{region}:{project_id}"
    if cache_key in _token_cache:
        token, expiry = _token_cache[cache_key]
        if time.time() < expiry:
            return token

    # Request new token
    iam_url = f"https://iam.{region}.myhuaweicloud.com/v3/auth/tokens"
    body = {
        "auth": {
            "identity": {
                "methods": ["hw_ak_sk"],
                "hw_ak_sk": {
                    "access": {"key": Config.HUAWEI_AK},
                    "secret": {"key": Config.HUAWEI_SK},
                },
            },
            "scope": {
                "project": {"id": project_id},
            },
        }
    }

    resp = http_requests.post(iam_url, json=body, timeout=30)
    resp.raise_for_status()

    token = resp.headers["X-Subject-Token"]
    _token_cache[cache_key] = (token, time.time() + 23 * 3600)
    return token


_token_cache: dict = {}


def get_nlp_credentials():
    """Get Huawei Cloud credentials for NLP (Translation) services.

    Returns a BasicCredentials instance bound to the NLP project ID
    in cn-north-4.
    """
    global _nlp_credentials
    _check_sdk()

    if _nlp_credentials is None:
        _nlp_credentials = BasicCredentials(
            ak=Config.HUAWEI_AK,
            sk=Config.HUAWEI_SK,
            project_id=Config.HUAWEI_NLP_PROJECT_ID,
        )
    return _nlp_credentials
