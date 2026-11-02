#!/usr/bin/env bash
# Linux/Mac/Git Bash. Jalankan dari folder tahu-tek-05.
mkdir -p results
for vu in 10 100 500 1000; do
  echo "=== Stress test $vu VU ==="
  docker run --rm -i \
    -e K6_WEB_DASHBOARD=true -e K6_WEB_DASHBOARD_EXPORT=/results/report-$vu-vu.html \
    -e VUS=$vu -e HOLD=90s -e BASE_URL=http://host.docker.internal:3000 \
    -v "$PWD/results:/results" -v "$PWD/stress-test:/scripts" \
    grafana/k6 run --summary-export=/results/summary-$vu-vu.json /scripts/load-test.js
  docker stats --no-stream > results/docker-stats-$vu-vu.txt
  sleep 15
done
