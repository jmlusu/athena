$ids = @("13a13acc-1dc8-4fde-a6f5-251fbf67383e", "5a89de93-2590-420b-b180-ea9651bb68b5", "3acf0578-0837-44e8-bfe0-e8229f133151", "95e087e8-70b9-4be4-a299-6e70e68a8fc2", "cc1fa6a7-ceee-4d54-8ebb-5edd2062c5e0", "c0b031c4-aebb-4a75-b1d0-27fd72d5be07")
foreach ($id in $ids) {
    try {
        Invoke-RestMethod -Uri "http://localhost:8000/api/v1/athena/profiles/$id" -Method Delete -Headers @{ "X-API-Key"="dev-admin-key" }
        Write-Host ("Deleted " + $id)
    } catch {
        $err = $_.Exception.Message
        Write-Host ("Failed to delete " + $id + ": " + $err)
    }
}