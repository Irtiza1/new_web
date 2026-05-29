#!/bin/bash

# Test script for Luxe Leather advanced traffic tracking and analytics endpoints
# Run this on your local terminal with Next.js development server running at http://localhost:3000

echo "=== LUXE LEATHER TRAFFIC API TESTER ==="
echo ""

# 1. Test page view tracking
echo "1. Sending test Page View tracking event..."
curl -s -X POST http://localhost:3000/api/analytics/track \
  -H "Content-Type: application/json" \
  -d '{
    "eventType": "page_view",
    "path": "/shop",
    "referrer": "Google Search",
    "sessionId": "curl-test-session-001",
    "country": "United States",
    "region": "California",
    "city": "San Jose",
    "deviceType": "Desktop",
    "os": "Mac",
    "browser": "Chrome",
    "metadata": null
  }'
echo -e "\nDone.\n"

# 2. Test search tracking
echo "2. Sending test Search Query tracking event..."
curl -s -X POST http://localhost:3000/api/analytics/track \
  -H "Content-Type: application/json" \
  -d '{
    "eventType": "search",
    "path": "/shop?search=wallet",
    "referrer": "Direct",
    "sessionId": "curl-test-session-001",
    "country": "Canada",
    "region": "Ontario",
    "city": "Toronto",
    "deviceType": "Mobile",
    "os": "iOS",
    "browser": "Safari",
    "metadata": {
      "query": "wallet"
    }
  }'
echo -e "\nDone.\n"

# 3. Test cart addition tracking
echo "3. Sending test Add-to-Cart tracking event..."
curl -s -X POST http://localhost:3000/api/analytics/track \
  -H "Content-Type: application/json" \
  -d '{
    "eventType": "add_to_cart",
    "path": "/products/classic-duffle",
    "referrer": "Instagram",
    "sessionId": "curl-test-session-002",
    "country": "United Kingdom",
    "region": "England",
    "city": "London",
    "deviceType": "Tablet",
    "os": "Android",
    "browser": "Firefox",
    "metadata": {
      "productId": "duffle-bag-id-123",
      "name": "Classic Duffle Bag",
      "price": 289.00
    }
  }'
echo -e "\nDone.\n"

# 4. Instructions for admin GET endpoint
echo "=== ADMIN ANALYTICS GET ENDPOINT ==="
echo "The admin analytics GET endpoint (/api/analytics?type=traffic) is protected by session authentication."
echo "To test this endpoint with full cookies, execute the following script inside your browser's Developer Tools Console while logged into the admin dashboard:"
echo ""
echo "    fetch('/api/analytics?type=traffic')"
echo "      .then(res => res.json())"
echo "      .then(console.log)"
echo "      .catch(console.error);"
echo ""
echo "======================================"
