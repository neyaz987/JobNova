from google.oauth2.credentials import Credentials
from googleapiclient.discovery import build
from app.core.config import settings
from datetime import datetime, timedelta
from typing import Optional

class CalendarService:
    @staticmethod
    def create_event(token: str, summary: str, description: str, start_time: datetime, end_time: Optional[datetime] = None):
        """
        Creates an event in the user's Google Calendar.
        Requires a valid OAuth2 token.
        """
        if not end_time:
            end_time = start_time + timedelta(hours=1)
            
        creds = Credentials(token)
        service = build('calendar', 'v3', credentials=creds)
        
        event = {
            'summary': summary,
            'description': description,
            'start': {
                'dateTime': start_time.isoformat() + 'Z',
                'timeZone': 'UTC',
            },
            'end': {
                'dateTime': end_time.isoformat() + 'Z',
                'timeZone': 'UTC',
            },
            'reminders': {
                'useDefault': False,
                'overrides': [
                    {'method': 'email', 'minutes': 24 * 60},
                    {'method': 'popup', 'minutes': 30},
                ],
            },
        }
        
        return service.events().insert(calendarId='primary', body=event).execute()
