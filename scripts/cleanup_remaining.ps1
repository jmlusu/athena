$ids = @('9d3a7a7e-7f8e-4def-be1c-d219e776dcd7', 'cb45413c-2dca-4446-ad71-fc4ea1fe72c1')
foreach ($id in $ids) {
    try {
        Invoke-RestMethod -Uri "http://localhost:8000/api/v1/athena/profiles/$id" -Method Delete -Headers @{ "X-API-Key"="dev-admin-key" }
        Write-Host ("Deleted " + $id)
    } catch {
        Write-Host ("Failed to delete " + $id + ": " + $_.Exception.Message)
    }
}