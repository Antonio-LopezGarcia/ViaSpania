$ErrorActionPreference = 'Stop'
$rootDir = Split-Path -Parent $PSScriptRoot
$bundleDir = Join-Path $rootDir 'src-tauri/resources/geospatial'
$binDir = Join-Path $bundleDir 'bin'
$shareDir = Join-Path $bundleDir 'share'
$licenseDir = Join-Path $bundleDir 'licenses'
$commands = @('gdalinfo', 'gdalwarp', 'gdal_translate', 'gdaldem', 'gdalsrsinfo', 'gdaltransform', 'gdallocationinfo', 'ogr2ogr', 'proj')

if (Test-Path $bundleDir) { Remove-Item -Recurse -Force $bundleDir }
New-Item -ItemType Directory -Force $binDir, (Join-Path $shareDir 'gdal'), (Join-Path $shareDir 'proj'), $licenseDir | Out-Null
New-Item -ItemType File -Force (Join-Path $bundleDir '.gitkeep') | Out-Null

$resolved = @{}
foreach ($name in $commands) {
  $tool = Get-Command "$name.exe" -ErrorAction SilentlyContinue
  if (-not $tool) { throw "Falta la utilidad requerida en Windows: $name.exe" }
  $resolved[$name] = $tool.Source
  Copy-Item $tool.Source (Join-Path $binDir "$name.exe")
}
$sourceBin = Split-Path -Parent $resolved['gdalinfo']
Get-ChildItem $sourceBin -Filter '*.dll' | Copy-Item -Destination $binDir

$gdalData = if ($env:GDAL_DATA) { $env:GDAL_DATA } else { Join-Path (Split-Path -Parent $sourceBin) 'share/gdal' }
$projData = if ($env:PROJ_DATA) { $env:PROJ_DATA } elseif ($env:PROJ_LIB) { $env:PROJ_LIB } else { Join-Path (Split-Path -Parent $sourceBin) 'share/proj' }
if (-not (Test-Path $gdalData)) { throw 'No se encontró GDAL_DATA. Defina la variable antes de compilar.' }
if (-not (Test-Path $projData)) { throw 'No se encontró PROJ_DATA. Defina la variable antes de compilar.' }
Copy-Item "$gdalData/*" (Join-Path $shareDir 'gdal') -Recurse
Get-ChildItem (Join-Path $shareDir 'gdal') -Include 'GDALLogo*.svg','gdalicon.png' -Recurse -ErrorAction SilentlyContinue | Remove-Item -Force
Copy-Item "$projData/*" (Join-Path $shareDir 'proj') -Recurse

$condaPrefix = Split-Path -Parent (Split-Path -Parent $sourceBin)
$condaPackages = conda list --prefix $condaPrefix --json | ConvertFrom-Json
$condaInfo = conda info --json | ConvertFrom-Json
foreach ($packageName in @('gdal', 'proj')) {
  $package = $condaPackages | Where-Object { $_.name -eq $packageName } | Select-Object -First 1
  if (-not $package) { throw "Conda no contiene el paquete requerido: $packageName" }
  $packageBuild = if ($package.build_string) { $package.build_string } else { $package.build }
  if (-not $packageBuild) { throw "Conda no informó de la compilación instalada de $packageName" }
  $packageDirectoryName = "$($package.name)-$($package.version)-$packageBuild"
  $packageDirectory = $null
  foreach ($packagesDirectory in $condaInfo.pkgs_dirs) {
    $candidate = Join-Path $packagesDirectory $packageDirectoryName
    if (Test-Path $candidate) {
      $packageDirectory = $candidate
      break
    }
  }
  if (-not $packageDirectory) { throw "No se encontró el paquete extraído de Conda: $packageDirectoryName" }
  $packageLicenseDirectory = Join-Path $packageDirectory 'info/licenses'
  $licenseFiles = @(Get-ChildItem $packageLicenseDirectory -File -Recurse -ErrorAction SilentlyContinue)
  if ($licenseFiles.Count -lt 1) { throw "El paquete Conda $packageName no contiene avisos de licencia." }
  foreach ($licenseFile in $licenseFiles) {
    $relativeName = $licenseFile.FullName.Substring($packageLicenseDirectory.Length) -replace '^[\\/]+', '' -replace '[\\/]', '-'
    Copy-Item $licenseFile.FullName (Join-Path $licenseDir "$packageName-$relativeName")
  }
}
$manifest = Join-Path $bundleDir 'THIRD_PARTY_MANIFEST.txt'
$lines = @('ViaSpania bundled geospatial runtime — Windows','Generated from the files copied into this release; system libraries are excluded.','','Executables and DLLs:')
$lines += Get-ChildItem $binDir -File | Sort-Object Name | ForEach-Object { '- ' + $_.Name }
$lines += @('','Licence files included:')
$lines += Get-ChildItem $licenseDir -File | Sort-Object Name | ForEach-Object { '- ' + $_.Name }
$lines | Set-Content -Encoding UTF8 $manifest
if ((Get-ChildItem $licenseDir -File).Count -lt 2) { throw 'El paquete geoespacial no contiene los avisos mínimos de GDAL y PROJ.' }
$sizeMb = [math]::Round((Get-ChildItem $bundleDir -Recurse | Measure-Object Length -Sum).Sum / 1MB, 1)
Write-Host "Recursos geoespaciales preparados para Windows: $sizeMb MB"
