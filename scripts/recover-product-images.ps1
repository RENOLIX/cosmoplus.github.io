$ErrorActionPreference = 'Stop'
$repoRoot = (Resolve-Path (Join-Path $PSScriptRoot '..')).Path
$products = Get-Content -LiteralPath (Join-Path $repoRoot 'woocommerce-products.json') -Raw | ConvertFrom-Json
$urls = @($products | ForEach-Object { $_.images | ForEach-Object { $_.src } } | Where-Object { $_ } | Sort-Object -Unique)
$results = $urls | ForEach-Object -Parallel {
  $sourceUrl = [Uri]$_
  $root = $using:repoRoot
  if ($sourceUrl.Host -ne 'cosmoplus.store' -or $sourceUrl.AbsolutePath -notmatch '^/wp-content/uploads/\d{4}/\d{2}/[^/]+$') { throw "Unexpected product image URL: $_" }
  $digest = [Security.Cryptography.SHA256]::HashData([Text.Encoding]::UTF8.GetBytes([string]$_))
  $name = [Convert]::ToHexString($digest).ToLowerInvariant().Substring(0,20) + [IO.Path]::GetExtension($sourceUrl.AbsolutePath).ToLowerInvariant()
  $target = Join-Path -Path $root -ChildPath (Join-Path 'assets/products' $name)
  $targetFull = [IO.Path]::GetFullPath($target)
  if (-not $targetFull.StartsWith($root + [IO.Path]::DirectorySeparatorChar,[StringComparison]::OrdinalIgnoreCase)) { throw "Invalid image path: $targetFull" }
  if ((Test-Path -LiteralPath $targetFull) -and (Get-Item -LiteralPath $targetFull).Length -gt 1000) { return [pscustomobject]@{Success=$true;File=$targetFull} }
  $directory = Split-Path -Parent $targetFull
  New-Item -ItemType Directory -Path $directory -Force | Out-Null
  $address = 'https://cosmoplus-1-1362ac4.ingress-bonde.ewp.live' + $sourceUrl.AbsolutePath
  for ($attempt=1; $attempt -le 3; $attempt++) {
    try {
      Invoke-WebRequest -NoProxy -Uri $address -OutFile $targetFull -TimeoutSec 45 -ErrorAction Stop | Out-Null
      if ((Get-Item -LiteralPath $targetFull).Length -le 1000) { throw 'Image too small' }
      return [pscustomobject]@{Success=$true;File=$targetFull}
    } catch {
      if ($attempt -eq 3) { return [pscustomobject]@{Success=$false;File=$targetFull;Error=$_.Exception.Message} }
    }
  }
} -ThrottleLimit 5
$good = @($results | Where-Object { $_.Success })
$bad = @($results | Where-Object { -not $_.Success })
Write-Output "$($good.Count)/$($urls.Count) product images available"
if ($bad.Count) { $bad | Format-Table File,Error -AutoSize | Out-String | Write-Output; exit 1 }
