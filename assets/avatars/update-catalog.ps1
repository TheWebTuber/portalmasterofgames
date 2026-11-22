$ErrorActionPreference = 'Stop'
$catalog = Join-Path $PSScriptRoot 'catalog.json'
$files = Get-ChildItem -LiteralPath $PSScriptRoot -File -Force |
    Where-Object { $_.Extension -ieq '.vrm' -and -not ($_.Attributes -band [IO.FileAttributes]::ReparsePoint) } |
    Sort-Object { [regex]::Replace($_.Name, '\d+', { param($match) $match.Value.PadLeft(20, '0') }) }

$remaining = [ordered]@{}
foreach ($item in $files) {
    $key = $item.Name.Replace('%', '%25').Replace('#', '%23').Replace('?', '%3F')
    $remaining[$key] = $item
}

$exists = [IO.File]::Exists($catalog)
$models = @()
if ($exists) {
    $json = [IO.File]::ReadAllText($catalog)
    if (-not $json.TrimStart().StartsWith('[')) { throw 'Expected a JSON array in catalog.json.' }
    $parsed = ConvertFrom-Json -InputObject $json
    $models = @($parsed | Where-Object { $null -ne $_ })
}
$original = ConvertTo-Json -InputObject $models -Depth 50
$next = @(foreach ($model in $models) {
    if ($null -ne $model.file -and $remaining.Contains($model.file)) {
        $item = $remaining[$model.file]
        $remaining.Remove($model.file)
        $model.file = $item.Name.Replace('%', '%25').Replace('#', '%23').Replace('?', '%3F')
        $model
    }
}
foreach ($key in $remaining.Keys) {
    $item = $remaining[$key]
    $name = ($item.BaseName -replace '[-_\s]+', ' ').Trim()
    if (-not $name) { $name = $item.Name }
    [pscustomobject]@{ name = $name; file = $key }
})

# Compare the parsed data so a repeat run preserves the existing file formatting.
$output = ConvertTo-Json -InputObject $next -Depth 50
if (-not $exists -or $output -cne $original) {
    $temp = Join-Path $PSScriptRoot ([IO.Path]::GetRandomFileName())
    try {
        [IO.File]::WriteAllText($temp, $output + [Environment]::NewLine, [Text.UTF8Encoding]::new($false))
        if ($exists) {
            [IO.File]::Replace($temp, $catalog, [System.Management.Automation.Language.NullString]::Value)
        } else {
            [IO.File]::Move($temp, $catalog)
        }
    } finally {
        [IO.File]::Delete($temp)
    }
}
Write-Output ("Avatar catalog: {0} model(s)." -f $next.Count)
