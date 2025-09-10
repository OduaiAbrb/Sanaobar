import requests
import sys
import json
from datetime import datetime
import time

class EcoReceiptAPITester:
    def __init__(self, base_url="http://localhost:8001"):
        self.base_url = base_url
        self.token = None
        self.user_id = None
        self.tests_run = 0
        self.tests_passed = 0
        self.created_receipt_id = None

    def run_test(self, name, method, endpoint, expected_status, data=None, headers=None):
        """Run a single API test"""
        url = f"{self.base_url}{endpoint}"
        test_headers = {'Content-Type': 'application/json'}
        
        if self.token:
            test_headers['Authorization'] = f'Bearer {self.token}'
        
        if headers:
            test_headers.update(headers)

        self.tests_run += 1
        print(f"\n🔍 Testing {name}...")
        print(f"   URL: {url}")
        
        try:
            if method == 'GET':
                response = requests.get(url, headers=test_headers, timeout=10)
            elif method == 'POST':
                response = requests.post(url, json=data, headers=test_headers, timeout=10)
            elif method == 'DELETE':
                response = requests.delete(url, headers=test_headers, timeout=10)

            success = response.status_code == expected_status
            if success:
                self.tests_passed += 1
                print(f"✅ Passed - Status: {response.status_code}")
                try:
                    response_data = response.json()
                    if isinstance(response_data, dict) and len(str(response_data)) < 500:
                        print(f"   Response: {response_data}")
                    return True, response_data
                except:
                    return True, {}
            else:
                print(f"❌ Failed - Expected {expected_status}, got {response.status_code}")
                try:
                    error_data = response.json()
                    print(f"   Error: {error_data}")
                except:
                    print(f"   Error: {response.text}")
                return False, {}

        except requests.exceptions.RequestException as e:
            print(f"❌ Failed - Network Error: {str(e)}")
            return False, {}
        except Exception as e:
            print(f"❌ Failed - Error: {str(e)}")
            return False, {}

    def test_health_check(self):
        """Test health check endpoint"""
        success, response = self.run_test(
            "Health Check",
            "GET",
            "/api/health",
            200
        )
        return success

    def test_register(self):
        """Test user registration"""
        test_email = f"test_user_{datetime.now().strftime('%H%M%S')}@ecoreceipt.com"
        success, response = self.run_test(
            "User Registration",
            "POST",
            "/api/auth/register",
            200,
            data={
                "email": test_email,
                "password": "testpass123",
                "name": "Test User"
            }
        )
        
        if success and 'access_token' in response:
            self.token = response['access_token']
            self.user_id = response['user']['id']
            print(f"   Registered user: {test_email}")
            return True
        return False

    def test_login_demo_user(self):
        """Test login with demo user"""
        success, response = self.run_test(
            "Demo User Login",
            "POST",
            "/api/auth/login",
            200,
            data={
                "email": "demo@ecoreceipt.com",
                "password": "password123"
            }
        )
        
        if success and 'access_token' in response:
            self.token = response['access_token']
            self.user_id = response['user']['id']
            print(f"   Logged in as demo user")
            return True
        return False

    def test_login_invalid_credentials(self):
        """Test login with invalid credentials"""
        success, response = self.run_test(
            "Invalid Login",
            "POST",
            "/api/auth/login",
            401,
            data={
                "email": "invalid@test.com",
                "password": "wrongpassword"
            }
        )
        return success

    def test_get_receipts_unauthorized(self):
        """Test getting receipts without token"""
        old_token = self.token
        self.token = None
        success, response = self.run_test(
            "Get Receipts (Unauthorized)",
            "GET",
            "/api/receipts",
            401
        )
        self.token = old_token
        return success

    def test_get_receipts(self):
        """Test getting user receipts"""
        success, response = self.run_test(
            "Get User Receipts",
            "GET",
            "/api/receipts",
            200
        )
        
        if success:
            print(f"   Found {len(response)} receipts")
        return success

    def test_create_receipt(self):
        """Test creating a new receipt"""
        receipt_data = {
            "retailer": "Test Store",
            "date": "2024-01-15",
            "time": "14:30",
            "items": [
                {"name": "Test Item 1", "quantity": 2, "price": 15.99},
                {"name": "Test Item 2", "quantity": 1, "price": 8.50}
            ],
            "subtotal": 40.48,
            "tax": 4.05,
            "total": 44.53,
            "category": "Groceries",
            "logo": "https://placehold.co/50x50/4CAF50/FFFFFF?text=TS"
        }
        
        success, response = self.run_test(
            "Create Receipt",
            "POST",
            "/api/receipts",
            200,
            data=receipt_data
        )
        
        if success and 'id' in response:
            self.created_receipt_id = response['id']
            print(f"   Created receipt with ID: {self.created_receipt_id}")
        return success

    def test_get_single_receipt(self):
        """Test getting a single receipt by ID"""
        if not self.created_receipt_id:
            print("❌ Skipped - No receipt ID available")
            return False
            
        success, response = self.run_test(
            "Get Single Receipt",
            "GET",
            f"/api/receipts/{self.created_receipt_id}",
            200
        )
        return success

    def test_get_nonexistent_receipt(self):
        """Test getting a non-existent receipt"""
        success, response = self.run_test(
            "Get Non-existent Receipt",
            "GET",
            "/api/receipts/nonexistent-id",
            404
        )
        return success

    def test_environmental_impact(self):
        """Test environmental impact analytics"""
        success, response = self.run_test(
            "Environmental Impact Analytics",
            "GET",
            "/api/analytics/environmental-impact",
            200
        )
        
        if success:
            expected_keys = ['trees_saved', 'water_saved', 'co2_reduced']
            if all(key in response for key in expected_keys):
                print(f"   Impact: {response['trees_saved']} trees, {response['water_saved']}L water, {response['co2_reduced']}kg CO2")
            else:
                print(f"   Warning: Missing expected keys in response")
        return success

    def test_spending_analytics(self):
        """Test spending analytics"""
        success, response = self.run_test(
            "Spending Analytics",
            "GET",
            "/api/analytics/spending",
            200
        )
        
        if success:
            expected_keys = ['total_spent', 'category_breakdown', 'monthly_spending']
            if all(key in response for key in expected_keys):
                print(f"   Total spent: ${response['total_spent']}")
                print(f"   Categories: {len(response['category_breakdown'])}")
                print(f"   Monthly data points: {len(response['monthly_spending'])}")
            else:
                print(f"   Warning: Missing expected keys in response")
        return success

    def test_ai_chat(self):
        """Test AI chat functionality"""
        success, response = self.run_test(
            "AI Chat",
            "POST",
            "/api/ai/chat",
            200,
            data={"message": "How much have I spent this month?"}
        )
        
        if success and 'response' in response:
            print(f"   AI Response: {response['response'][:100]}...")
        return success

    def test_ocr_endpoint(self):
        """Test OCR endpoint (mock)"""
        success, response = self.run_test(
            "OCR Processing",
            "POST",
            "/api/receipts/ocr",
            200
        )
        
        if success and 'parsed_receipt' in response:
            print(f"   OCR processed receipt from: {response['parsed_receipt']['retailer']}")
        return success

    def test_delete_receipt(self):
        """Test deleting a receipt"""
        if not self.created_receipt_id:
            print("❌ Skipped - No receipt ID available")
            return False
            
        success, response = self.run_test(
            "Delete Receipt",
            "DELETE",
            f"/api/receipts/{self.created_receipt_id}",
            200
        )
        return success

    def run_all_tests(self):
        """Run all API tests"""
        print("🚀 Starting EcoReceipt API Tests")
        print("=" * 50)
        
        # Basic connectivity
        if not self.test_health_check():
            print("❌ Health check failed - API may not be running")
            return False
        
        # Authentication tests
        print("\n📝 Authentication Tests")
        self.test_login_invalid_credentials()
        
        # Try demo user first, if fails try registration
        if not self.test_login_demo_user():
            print("Demo user login failed, trying registration...")
            if not self.test_register():
                print("❌ Could not authenticate - stopping tests")
                return False
        
        # Unauthorized access test
        self.test_get_receipts_unauthorized()
        
        # Receipt management tests
        print("\n📄 Receipt Management Tests")
        self.test_get_receipts()
        self.test_create_receipt()
        self.test_get_single_receipt()
        self.test_get_nonexistent_receipt()
        
        # Analytics tests
        print("\n📊 Analytics Tests")
        self.test_environmental_impact()
        self.test_spending_analytics()
        
        # AI and OCR tests
        print("\n🤖 AI & OCR Tests")
        self.test_ai_chat()
        self.test_ocr_endpoint()
        
        # Cleanup
        print("\n🧹 Cleanup Tests")
        self.test_delete_receipt()
        
        return True

def main():
    # Use the public URL from frontend .env
    public_url = "http://localhost:8001"  # Default fallback
    
    try:
        with open('/app/frontend/.env', 'r') as f:
            for line in f:
                if line.startswith('VITE_REACT_APP_BACKEND_URL='):
                    public_url = line.split('=', 1)[1].strip()
                    break
    except:
        pass
    
    print(f"Testing API at: {public_url}")
    
    tester = EcoReceiptAPITester(public_url)
    
    if not tester.run_all_tests():
        print("\n❌ Test suite failed to complete")
        return 1
    
    # Print final results
    print("\n" + "=" * 50)
    print(f"📊 Final Results: {tester.tests_passed}/{tester.tests_run} tests passed")
    
    if tester.tests_passed == tester.tests_run:
        print("🎉 All tests passed!")
        return 0
    else:
        print(f"⚠️  {tester.tests_run - tester.tests_passed} tests failed")
        return 1

if __name__ == "__main__":
    sys.exit(main())