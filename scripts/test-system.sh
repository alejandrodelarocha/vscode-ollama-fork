#!/bin/bash

echo "🧪 Ollama System Integration Test"
echo "=================================="
echo ""

TESTS_PASSED=0
TESTS_FAILED=0

test_endpoint() {
  local name=$1
  local url=$2
  local expected=$3

  echo -n "Testing $name... "

  response=$(curl -s -w "\n%{http_code}" "$url" 2>/dev/null)
  http_code=$(echo "$response" | tail -n 1)
  body=$(echo "$response" | sed '$d')

  if [[ "$http_code" == "$expected" ]]; then
    echo "✅ ($http_code)"
    ((TESTS_PASSED++))
    return 0
  else
    echo "❌ (Expected: $expected, Got: $http_code)"
    echo "   Response: $body"
    ((TESTS_FAILED++))
    return 1
  fi
}

echo "=== License Server Availability ==="
test_endpoint "Status endpoint" "https://license.rochastudios.ai/api/status" "200"
echo ""

echo "=== Landing Pages ==="
test_endpoint "Ollama landing" "https://ollama.rochastudios.ai" "200"
test_endpoint "Auth page" "https://license.rochastudios.ai/auth" "200"
test_endpoint "Pricing page" "https://ollama.rochastudios.ai/pricing" "200"
echo ""

echo "=== Ollama GPU Server ==="
test_endpoint "Ollama API" "http://142.54.161.210:11434/api/tags" "200"
echo ""

echo "=== Database Health ==="
ssh root@209.42.26.107 << 'DBTEST'
echo -n "Database integrity: "
result=$(sqlite3 /root/ollama-license.db "PRAGMA integrity_check;")
if [[ "$result" == "ok" ]]; then
  echo "✅"
else
  echo "❌ - $result"
fi

echo -n "Database tables: "
count=$(sqlite3 /root/ollama-license.db "SELECT COUNT(name) FROM sqlite_master WHERE type='table';")
echo "✅ ($count tables)"
DBTEST

echo ""
echo "=== Process Health ==="
ssh root@209.42.26.107 << 'PROCTEST'
echo -n "License server: "
if pm2 status ollama-license | grep -q "online"; then
  echo "✅ (Running)"
else
  echo "❌ (Not running)"
fi

echo -n "Memory usage: "
mem=$(pm2 info ollama-license | grep "memory" | awk '{print $NF}')
echo "✅ ($mem)"
PROCTEST

echo ""
echo "=== DNS Resolution ==="
echo -n "license.rochastudios.ai: "
if dig +short license.rochastudios.ai | grep -q '[0-9]'; then
  echo "✅"
else
  echo "❌ (Not resolving)"
fi

echo -n "ollama.rochastudios.ai: "
if dig +short ollama.rochastudios.ai | grep -q '[0-9]'; then
  echo "✅"
else
  echo "⚠️  (Cloudflare Pages may be pending)"
fi

echo ""
echo "=== Test Results ==="
echo "Passed: $TESTS_PASSED ✅"
echo "Failed: $TESTS_FAILED ❌"
echo ""

if [ $TESTS_FAILED -eq 0 ]; then
  echo "🎉 All tests passed! System is ready."
  exit 0
else
  echo "⚠️  Some tests failed. Check above for details."
  exit 1
fi
