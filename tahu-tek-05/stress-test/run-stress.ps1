# Jalankan dari folder tahu-tek-05 (tempat docker-compose.yml). Windows PowerShell.
# Pastikan stack hidup: docker compose up -d
$stages = 10, 100, 500, 1000
New-Item -ItemType Directory -Force -Path results | Out-Null

foreach ($vu in $stages) {
  Write-Host "=== Stress test $vu VU ===" -ForegroundColor Cyan
  docker run --rm -i `
    -e K6_WEB_DASHBOARD=true `
    -e K6_WEB_DASHBOARD_EXPORT=/results/report-$vu-vu.html `
    -e VUS=$vu -e HOLD=90s `
    -e BASE_URL=http://host.docker.internal:3000 `
    -v "${PWD}/results:/results" `
    -v "${PWD}/stress-test:/scripts" `
    grafana/k6 run --summary-export=/results/summary-$vu-vu.json /scripts/load-test.js
  # catat pemakaian resource container tepat setelah tes
  docker stats --no-stream | Out-File -Encoding utf8 "results/docker-stats-$vu-vu.txt"
  Start-Sleep -Seconds 15
}
Write-Host "Selesai. Buka results\report-*-vu.html di browser (ada grafik throughput, response time, error rate)."
