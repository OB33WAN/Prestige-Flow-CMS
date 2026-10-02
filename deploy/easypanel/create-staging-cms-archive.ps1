$ErrorActionPreference = 'Stop'
$repoRoot = (Resolve-Path (Join-Path $PSScriptRoot '../..')).Path
$siteRoot = (Resolve-Path (Join-Path $repoRoot '.public-site')).Path
$archiveRoot = Join-Path $PSScriptRoot 'archives'
$archivePath = Join-Path $archiveRoot 'prestige-flow-staging-cms.zip'
$stageRoot = Join-Path ([IO.Path]::GetTempPath()) ('prestige-flow-staging-cms-' + [guid]::NewGuid().ToString('N'))
New-Item -ItemType Directory -Path $archiveRoot, $stageRoot -Force | Out-Null

try {
    Get-ChildItem -LiteralPath $siteRoot -Force | Copy-Item -Destination $stageRoot -Recurse -Force

    $configPath = Join-Path $stageRoot 'admin/config.yml'
    if (-not (Test-Path -LiteralPath $configPath)) { throw 'Built CMS admin/config.yml is missing.' }
    $configText = Get-Content -LiteralPath $configPath -Raw
    $configText = [regex]::Replace($configText, '(?m)^  site_domain:.*$', '  site_domain: staging.prestigeflow.co.uk')
    $configText = [regex]::Replace($configText, '(?m)^site_url:.*$', 'site_url: https://staging.prestigeflow.co.uk')
    $configText = [regex]::Replace($configText, '(?m)^display_url:.*$', 'display_url: https://staging.prestigeflow.co.uk')
    if ($configText -notmatch '(?m)^  branch: main$' -or
        $configText -notmatch '(?m)^site_url: https://staging\.prestigeflow\.co\.uk$' -or
        $configText -notmatch '(?m)^display_url: https://staging\.prestigeflow\.co\.uk$') {
        throw 'Staging CMS URL or protected main-branch backend configuration is incorrect.'
    }
    if ([regex]::Matches($configText, '(?m)^\s+name: page_copy$').Count -ne 3) {
        throw 'The updated service, industry and area copy fields are missing from the CMS config.'
    }
    [IO.File]::WriteAllText($configPath, $configText, [Text.UTF8Encoding]::new($false))

    $stagingInfra = Join-Path $stageRoot 'deploy/easypanel'
    New-Item -ItemType Directory -Path $stagingInfra -Force | Out-Null
    Copy-Item -LiteralPath (Join-Path $PSScriptRoot 'nginx.conf') -Destination $stagingInfra -Force
    Copy-Item -LiteralPath (Join-Path $PSScriptRoot 'legacy-redirects.conf') -Destination $stagingInfra -Force
    $dockerfile = @(
        'FROM nginx:1.27-alpine',
        'COPY deploy/easypanel/nginx.conf /etc/nginx/conf.d/default.conf',
        'COPY deploy/easypanel/legacy-redirects.conf /etc/nginx/legacy-redirects.conf',
        'COPY . /usr/share/nginx/html/',
        'EXPOSE 80'
    ) -join "`n"
    [IO.File]::WriteAllText((Join-Path $stageRoot 'Dockerfile'), $dockerfile, [Text.Encoding]::ASCII)

    # A staging build should not publish the production GitHub Pages domain hint.
    $stagedCname = Join-Path $stageRoot 'CNAME'
    if (Test-Path -LiteralPath $stagedCname) { Remove-Item -LiteralPath $stagedCname -Force }

    Add-Type -AssemblyName System.IO.Compression.FileSystem
    if (Test-Path -LiteralPath $archivePath) { Remove-Item -LiteralPath $archivePath -Force }
    Compress-Archive -Path (Join-Path $stageRoot '*') -DestinationPath $archivePath -CompressionLevel Optimal

    $zip = [IO.Compression.ZipFile]::OpenRead($archivePath)
    try {
        $entries = @($zip.Entries | ForEach-Object { $_.FullName })
        $badEntries = $entries | Where-Object {
            $_ -match '(^|/)(crm|server|old-site-api|node_modules|\.git|\.env)(/|$)' -or
            $_ -match '(^|/)(ai|llms)\.txt$' -or $_ -match '(^|/)CNAME$'
        }
        if ($badEntries) { throw "Archive contains excluded project files: $($badEntries -join ', ')" }
        foreach ($required in @(
            'Dockerfile', 'admin/config.yml', 'admin/preview.js', 'admin/page-snapshots.js',
            'assets/site-config.js', 'deploy/easypanel/nginx.conf',
            'deploy/easypanel/legacy-redirects.conf', 'index.html',
            'services/drainage/index.html', 'industries/healthcare/index.html', 'areas/index.html'
        )) {
            if ($entries -notcontains $required) { throw "Required staging archive entry is missing: $required" }
        }

        $siteConfigEntry = $zip.GetEntry('assets/site-config.js')
        $reader = [IO.StreamReader]::new($siteConfigEntry.Open())
        try { $siteConfigText = $reader.ReadToEnd() } finally { $reader.Dispose() }
        if ($siteConfigText -match 'sk_(?:live|test)_[A-Za-z0-9]+' -or
            $siteConfigText -match 'whsec_[A-Za-z0-9]+' -or
            $siteConfigText -match '"accessKey"\s*:\s*"[^"]+"') {
            throw 'Public site archive unexpectedly contains a Stripe secret, webhook secret or Web3Forms key.'
        }
        $prefix = 'window.PrestigeFlowConfig = '
        if (-not $siteConfigText.StartsWith($prefix)) { throw 'Public site configuration could not be parsed.' }
        $siteConfig = $siteConfigText.Substring($prefix.Length).Trim().TrimEnd(';') | ConvertFrom-Json
        if ($siteConfig.crm.apiBaseUrl -or $siteConfig.web3forms.accessKey -or -not $siteConfig.oldSitePayments.apiBaseUrl) {
            throw 'Archive must use the separate old-site API with CRM and Web3Forms fallbacks disabled.'
        }
        if ($siteConfig.oldSitePayments.apiBaseUrl -notmatch '^https://') { throw 'Old-site API origin must use HTTPS.' }

        $configEntry = $zip.GetEntry('admin/config.yml')
        $reader = [IO.StreamReader]::new($configEntry.Open())
        try { $zippedConfig = $reader.ReadToEnd() } finally { $reader.Dispose() }
        if ($zippedConfig -notmatch '(?m)^site_url: https://staging\.prestigeflow\.co\.uk$' -or
            [regex]::Matches($zippedConfig, '(?m)^\s+name: page_copy$').Count -ne 3) {
            throw 'The packed CMS is not configured for staging or lacks the new page fields.'
        }
    } finally { $zip.Dispose() }

    Write-Output "Staging archive created and verified: $archivePath"
    Write-Output "Archive size: $((Get-Item -LiteralPath $archivePath).Length) bytes"
    Write-Output 'Contains the static website, updated CMS admin/preview, and HTTPS old-site API routing; excludes CRM/API source and payment/email secrets.'
} finally {
    $resolvedTemp = [IO.Path]::GetFullPath($stageRoot)
    $resolvedTempBase = [IO.Path]::GetFullPath([IO.Path]::GetTempPath())
    if ($resolvedTemp.StartsWith($resolvedTempBase, [StringComparison]::OrdinalIgnoreCase) -and
        (Split-Path -Leaf $resolvedTemp).StartsWith('prestige-flow-staging-cms-', [StringComparison]::Ordinal)) {
        Remove-Item -LiteralPath $resolvedTemp -Recurse -Force
    } else {
        throw "Refusing to remove unexpected temporary staging path: $resolvedTemp"
    }
}
