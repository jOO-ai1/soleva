#!/usr/bin/env bash
set -Eeuo pipefail

# Test Alpine repository connectivity
echo "Testing Alpine repository connectivity..."

# Test different Alpine mirrors
mirrors=(
    "https://dl-cdn.alpinelinux.org/alpine/v3.19"
    "https://mirror.yandex.ru/mirrors/alpine/v3.19"
    "https://mirrors.aliyun.com/alpine/v3.19"
    "https://mirror.leaseweb.com/alpine/v3.19"
)

for mirror in "${mirrors[@]}"; do
    echo "Testing mirror: $mirror"
    if curl -s --connect-timeout 10 --max-time 30 "$mirror/main/x86_64/APKINDEX.tar.gz" > /dev/null; then
        echo "✅ $mirror is accessible"
    else
        echo "❌ $mirror is not accessible"
    fi
done

echo "Alpine connectivity test completed."
