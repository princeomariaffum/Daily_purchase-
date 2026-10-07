from rest_framework.test import APITestCase
from rest_framework import status
from django.contrib.auth.models import User
from .models import PurchaseSession, PurchaseRecord

class SyncTests(APITestCase):
    def setUp(self):
        # Create a test field agent user
        self.user = User.objects.create_user(username='testagent', password='testpassword123')
        # Authenticate the test client
        self.client.force_authenticate(user=self.user)
        
        # Sample payload coming from the mobile app's Outbox
        self.sync_payload = {
            "client_id": "unique-mobile-uuid-9999",
            "cocoa_season": "2025/2026",
            "zone_name": "Test Zone",
            "society_district_name": "Test District",
            "waybill_no": "WB-TEST-001",
            "records": [
                {
                    "farmer_name": "Kwame Mensah",
                    "farmer_status": "Existing",
                    "cocoa_card_id": "KK-12345",
                    "kilos": 125.0,
                    "amount_ghc": 4500.0,
                    "date": "2026-10-07"
                },
                {
                    "farmer_name": "Ama Serwaa",
                    "farmer_status": "New",
                    "cocoa_card_id": "KK-67890",
                    "kilos": 62.5,
                    "amount_ghc": 2250.0,
                    "date": "2026-10-07"
                }
            ]
        }

    def test_idempotent_sync_prevents_duplicates(self):
        """
        Test that sending the same sync payload twice (e.g. if internet drops and app retries)
        does NOT create duplicate sessions or duplicate records in the database.
        """
        # --- Attempt 1: First sync ---
        response1 = self.client.post('/api/sessions/', self.sync_payload, format='json')
        self.assertEqual(response1.status_code, status.HTTP_201_CREATED)
        
        # Verify 1 session and 2 records were created
        self.assertEqual(PurchaseSession.objects.count(), 1)
        self.assertEqual(PurchaseRecord.objects.count(), 2)

        # --- Attempt 2: Duplicate sync (app retries automatically) ---
        response2 = self.client.post('/api/sessions/', self.sync_payload, format='json')
        
        # The backend should still tell the mobile app "Success!" so it clears its outbox
        self.assertIn(response2.status_code, [status.HTTP_200_OK, status.HTTP_201_CREATED])
        
        # IMPORTANT: The counts should NOT increase. 
        self.assertEqual(PurchaseSession.objects.count(), 1, "A duplicate session was created!")
        self.assertEqual(PurchaseRecord.objects.count(), 2, "Duplicate farmer records were created!")
