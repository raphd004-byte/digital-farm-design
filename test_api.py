#!/usr/bin/env python3
"""
Test suite for Digital Farm Design API.
Run: python test_api.py

Requires: requests (pip install requests)
"""
import requests
import json
import sys

BASE_URL = "http://localhost:3000"

def test_get_health():
    """Test 1: Health endpoint"""
    r = requests.get(f"{BASE_URL}/api/health")
    assert r.status_code == 200, f"Expected 200, got {r.status_code}"
    assert r.json()["status"] == "ok"
    print("PASS: Health endpoint")

def test_get_fruits():
    """Test 2: Fruits list"""
    r = requests.get(f"{BASE_URL}/api/fruits")
    assert r.status_code == 200, f"Expected 200, got {r.status_code}"
    data = r.json()
    assert isinstance(data, list), "Fruits should be a list"
    print(f"PASS: Fruits endpoint ({len(data)} fruits)")

def test_get_homepage():
    """Test 3: Homepage"""
    r = requests.get(f"{BASE_URL}/")
    assert r.status_code == 200, f"Expected 200, got {r.status_code}"
    assert "nature" in r.text.lower() or "farm" in r.text.lower() or "digital" in r.text.lower()
    print("PASS: Homepage")

def test_admin_login_page():
    """Test 4: Admin login page"""
    r = requests.get(f"{BASE_URL}/admin-login.html")
    assert r.status_code == 200, f"Expected 200, got {r.status_code}"
    assert "admin" in r.text.lower() or "login" in r.text.lower()
    print("PASS: Admin login page")

def test_admin_panel():
    """Test 5: Admin dashboard"""
    r = requests.get(f"{BASE_URL}/admin.html")
    assert r.status_code == 200, f"Expected 200, got {r.status_code}"
    assert "admin" in r.text.lower()
    print("PASS: Admin dashboard")

def test_public_site():
    """Test 6: Public site components"""
    # Check index page
    r = requests.get(f"{BASE_URL}/index.html")
    assert r.status_code == 200, f"Expected 200, got {r.status_code}"
    assert "nature" in r.text.lower() or "farm" in r.text.lower()
    print("PASS: Public website")

if __name__ == "__main__":
    print("=" * 50)
    print("Digital Farm Design API Test Suite")
    print("=" * 50)
    tests = [
        test_get_health,
        test_get_fruits,
        test_get_homepage,
        test_admin_login_page,
        test_admin_panel,
        test_public_site,
    ]
    passed = 0
    for test in tests:
        try:
            test()
            passed += 1
        except AssertionError as e:
            print(f"FAIL: {test.__name__} - {e}")
        except Exception as e:
            print(f"ERROR: {test.__name__} - {e}")
    
    print("=" * 50)
    print(f"Results: {passed}/{len(tests)} tests passed")
    print("=" * 50)
    sys.exit(0 if passed == len(tests) else 1)
