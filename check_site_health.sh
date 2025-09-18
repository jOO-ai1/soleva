#!/bin/bash

# Colors
GREEN="\e[32m"
RED="\e[31m"
NC="\e[0m"

check_url() {
    local url=$1
    local expected=$2
    echo -n "Testing $url ... "
    status=$(curl -s -o /dev/null -w "%{http_code}" "$url")
    ctype=$(curl -s -I "$url" | grep -i "content-type:" | awk '{print $2}' | tr -d '\r')

    if [[ "$status" == "200" && "$ctype" == "$expected" ]]; then
        echo -e "${GREEN}OK${NC} ($status, $ctype)"
    else
        echo -e "${RED}FAIL${NC} ($status, $ctype)"
    fi
}

echo "=== Soleva Site Health Check ==="

# 1. Main pages
check_url "https://solevaeg.com" "text/html"
check_url "https://admin.solevaeg.com" "text/html"

# 2. Deep links
check_url "https://solevaeg.com/products/some-product-slug" "text/html"
check_url "https://admin.solevaeg.com/dashboard" "text/html"

# 3. Assets
check_url "https://admin.solevaeg.com/assets/index-Bj-RUECf.js" "application/javascript"
check_url "https://admin.solevaeg.com/assets/index-BHOWDHBU.css" "text/css"

# 4. Check Nginx logs for critical 404 errors (excluding favicon and expected assets)
echo -n "Checking Nginx logs for critical 404 errors ... "
critical_404s=$(docker compose logs nginx 2>/dev/null | grep "404" | grep -v "favicon.ico" | grep -v "/assets/index.js" | grep -v "/assets/index.css" | wc -l)
if [[ "$critical_404s" -gt 0 ]]; then
    echo -e "${RED}Found $critical_404s critical 404 errors${NC}"
    echo "Recent critical 404s:"
    docker compose logs nginx 2>/dev/null | grep "404" | grep -v "favicon.ico" | grep -v "/assets/index.js" | grep -v "/assets/index.css" | tail -3
else
    echo -e "${GREEN}No critical 404 errors found${NC}"
fi

echo "=== Check Complete ==="
