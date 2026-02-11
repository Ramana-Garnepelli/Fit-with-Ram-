#!/bin/bash

# Automated Test Execution Script for Fit with Ram
# This script tests critical user flows

echo "========================================="
echo "Fit with Ram - Automated Test Execution"
echo "========================================="
echo ""

BASE_URL="http://localhost:5000"
FRONTEND_URL="http://localhost:3000"

# Colors for output
GREEN='\033[0;32m'
RED='\033[0;31m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

PASSED=0
FAILED=0

# Test function
test_api() {
    local test_name="$1"
    local method="$2"
    local endpoint="$3"
    local data="$4"
    local expected_status="$5"
    
    echo -n "Testing: $test_name... "
    
    if [ "$method" == "GET" ]; then
        response=$(curl -s -w "\n%{http_code}" "$BASE_URL$endpoint")
    else
        response=$(curl -s -w "\n%{http_code}" -X "$method" -H "Content-Type: application/json" -d "$data" "$BASE_URL$endpoint")
    fi
    
    status_code=$(echo "$response" | tail -n1)
    body=$(echo "$response" | head -n-1)
    
    if [ "$status_code" == "$expected_status" ]; then
        echo -e "${GREEN}PASS${NC} (Status: $status_code)"
        ((PASSED++))
        return 0
    else
        echo -e "${RED}FAIL${NC} (Expected: $expected_status, Got: $status_code)"
        echo "Response: $body"
        ((FAILED++))
        return 1
    fi
}

echo "=== Backend Health Check ==="
test_api "Backend Server Running" "GET" "/" "200"
echo ""

echo "=== TC-006: View All Programs ==="
test_api "Get Programs List" "GET" "/api/programs" "200"
echo ""

echo "=== TC-001: User Signup ==="
TIMESTAMP=$(date +%s)
SIGNUP_DATA="{\"name\":\"Test User $TIMESTAMP\",\"email\":\"testuser$TIMESTAMP@example.com\",\"phone\":\"9876543210\",\"password\":\"Test@123\"}"
test_api "Create New User" "POST" "/api/auth/signup" "$SIGNUP_DATA" "201"

# Extract token for subsequent tests
if [ $? -eq 0 ]; then
    TOKEN=$(echo "$body" | grep -o '"token":"[^"]*' | cut -d'"' -f4)
    echo "Token obtained: ${TOKEN:0:20}..."
fi
echo ""

echo "=== TC-003: User Login ==="
LOGIN_DATA="{\"email\":\"testuser$TIMESTAMP@example.com\",\"password\":\"Test@123\"}"
test_api "User Login" "POST" "/api/auth/login" "$LOGIN_DATA" "200"
echo ""

echo "=== TC-004: Invalid Login ==="
INVALID_LOGIN="{\"email\":\"wrong@example.com\",\"password\":\"WrongPass\"}"
test_api "Invalid Credentials" "POST" "/api/auth/login" "$INVALID_LOGIN" "400"
echo ""

echo "=== TC-026: Duplicate Email Signup ==="
test_api "Duplicate Email" "POST" "/api/auth/signup" "$SIGNUP_DATA" "400"
echo ""

echo "========================================="
echo "Test Execution Summary"
echo "========================================="
echo -e "Total Tests: $((PASSED + FAILED))"
echo -e "${GREEN}Passed: $PASSED${NC}"
echo -e "${RED}Failed: $FAILED${NC}"

if [ $FAILED -eq 0 ]; then
    echo -e "\n${GREEN}All tests passed!${NC}"
    exit 0
else
    echo -e "\n${RED}Some tests failed. Please review.${NC}"
    exit 1
fi
