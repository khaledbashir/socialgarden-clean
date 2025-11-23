"""
Google OAuth Handler
Handles OAuth authentication flow for Google Sheets access
"""

import os
import json
import base64
from typing import Optional, Dict, Any
from google.oauth2.credentials import Credentials
from google_auth_oauthlib.flow import Flow
from googleapiclient.discovery import build
import requests

class GoogleOAuthHandler:
    """Handle OAuth flow and token management"""
    
    def __init__(self):
        self.client_id = os.getenv('GOOGLE_OAUTH_CLIENT_ID')
        self.client_secret = os.getenv('GOOGLE_OAUTH_CLIENT_SECRET')
        self.redirect_uri = os.getenv('GOOGLE_OAUTH_REDIRECT_URI')
        self.scopes = [
            'https://www.googleapis.com/auth/spreadsheets',
            'https://www.googleapis.com/auth/drive',
            'https://www.googleapis.com/auth/userinfo.email'
        ]
        
        if not all([self.client_id, self.client_secret, self.redirect_uri]):
            raise ValueError("Google OAuth credentials not configured in environment")
    
    def get_authorization_url(self, state: str = None) -> tuple:
        """
        Generate Google OAuth authorization URL
        Returns: (auth_url, state)
        """
        flow = Flow.from_client_config(
            {
                "installed": {
                    "client_id": self.client_id,
                    "client_secret": self.client_secret,
                    "auth_uri": "https://accounts.google.com/o/oauth2/auth",
                    "token_uri": "https://oauth2.googleapis.com/token",
                    "redirect_uris": [self.redirect_uri]
                }
            },
            scopes=self.scopes,
            redirect_uri=self.redirect_uri
        )
        
        auth_url, state = flow.authorization_url(access_type='offline', prompt='consent')
        return auth_url, state
    
    def exchange_code_for_token(self, code: str) -> Dict[str, Any]:
        """
        Exchange authorization code for access token
        Returns: token dictionary with access_token, refresh_token, etc
        """
        try:
            # Use requests directly to avoid scope validation issues
            token_response = requests.post(
                "https://oauth2.googleapis.com/token",
                data={
                    "code": code,
                    "client_id": self.client_id,
                    "client_secret": self.client_secret,
                    "redirect_uri": self.redirect_uri,
                    "grant_type": "authorization_code"
                }
            )
            
            if not token_response.ok:
                raise Exception(f"Token exchange failed: {token_response.text}")
            
            token_data = token_response.json()
            
            # Create credentials from token
            credentials = Credentials(
                token=token_data.get('access_token'),
                refresh_token=token_data.get('refresh_token'),
                token_uri="https://oauth2.googleapis.com/token",
                client_id=self.client_id,
                client_secret=self.client_secret,
                scopes=self.scopes
            )
            
            # Return token info
            return {
                'access_token': credentials.token,
                'refresh_token': credentials.refresh_token,
                'token_type': 'Bearer',
                'expires_in': credentials.expiry,
                'scope': ' '.join(self.scopes)
            }
        except Exception as e:
            raise Exception(f"Failed to exchange code for token: {str(e)}")
    
    def get_sheets_service(self, access_token: str):
        """Get Google Sheets service with access token"""
        credentials = Credentials(token=access_token)
        return build('sheets', 'v4', credentials=credentials)
    
    def get_drive_service(self, access_token: str):
        """Get Google Drive service with access token"""
        credentials = Credentials(token=access_token)
        return build('drive', 'v3', credentials=credentials)
    
    def get_user_email(self, access_token: str) -> str:
        """Get authenticated user's email address"""
        try:
            response = requests.get(
                'https://www.googleapis.com/oauth2/v2/userinfo',
                headers={'Authorization': f'Bearer {access_token}'}
            )
            response.raise_for_status()
            return response.json().get('email')
        except Exception as e:
            raise Exception(f"Failed to get user email: {str(e)}")
    
    @staticmethod
    def encode_token(token_dict: Dict[str, Any]) -> str:
        """Encode token dict to base64 string for safe storage"""
        json_str = json.dumps(token_dict)
        return base64.b64encode(json_str.encode()).decode()
    
    @staticmethod
    def decode_token(encoded_token: str) -> Dict[str, Any]:
        """Decode token from base64 string"""
        json_str = base64.b64decode(encoded_token.encode()).decode()
        return json.loads(json_str)


def get_oauth_handler():
    """Factory function to get OAuth handler"""
    return GoogleOAuthHandler()
