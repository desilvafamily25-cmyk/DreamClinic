param(
  [Parameter(Mandatory = $true)]
  [string]$DocxPath,

  [Parameter(Mandatory = $false)]
  [string]$OutputPath
)

Add-Type -AssemblyName System.IO.Compression.FileSystem

function Repair-Mojibake {
  param(
    [string]$Text
  )

  if ([string]::IsNullOrEmpty($Text)) {
    return $Text
  }

  if (($Text.IndexOf([char]0x00E2) -lt 0) -and ($Text.IndexOf([char]0xFFFD) -lt 0)) {
    return $Text
  }

  $bytes = [System.Text.Encoding]::GetEncoding(1252).GetBytes($Text)
  return [System.Text.Encoding]::UTF8.GetString($bytes)
}

function Get-NodeText {
  param(
    [System.Xml.XmlNode]$Node,
    [System.Xml.XmlNamespaceManager]$Ns
  )

  $parts = New-Object System.Collections.Generic.List[string]
  $nodes = $Node.SelectNodes('.//w:t|.//w:br', $Ns)
  foreach ($item in $nodes) {
    if ($item.LocalName -eq 't') {
      $parts.Add($item.InnerText)
    }
    elseif ($item.LocalName -eq 'br') {
      $parts.Add("`n")
    }
  }

  return (Repair-Mojibake ($parts -join ''))
}

$resolved = (Resolve-Path -LiteralPath $DocxPath).Path
$zip = [System.IO.Compression.ZipFile]::OpenRead($resolved)
$entry = $zip.Entries | Where-Object { $_.FullName -eq 'word/document.xml' } | Select-Object -First 1

if (-not $entry) {
  $zip.Dispose()
  throw "Could not find word/document.xml inside $resolved"
}

$reader = New-Object System.IO.StreamReader($entry.Open())
$xmlContent = $reader.ReadToEnd()
$reader.Close()
$zip.Dispose()

[xml]$xml = $xmlContent
$ns = New-Object System.Xml.XmlNamespaceManager($xml.NameTable)
$ns.AddNamespace('w', 'http://schemas.openxmlformats.org/wordprocessingml/2006/main')
$ns.AddNamespace('v', 'urn:schemas-microsoft-com:vml')
$ns.AddNamespace('o', 'urn:schemas-microsoft-com:office:office')

$body = $xml.SelectSingleNode('//w:body', $ns)
$blocks = @()

foreach ($child in $body.ChildNodes) {
  if ($child.LocalName -eq 'p') {
    $styleNode = $child.SelectSingleNode('./w:pPr/w:pStyle', $ns)
    $style = ''
    if ($styleNode) {
      $styleAttr = $styleNode.Attributes | Where-Object { $_.LocalName -eq 'val' } | Select-Object -First 1
      if ($styleAttr) {
        $style = $styleAttr.Value
      }
    }

    $text = Get-NodeText -Node $child -Ns $ns
    $isRule = ($child.OuterXml -match 'o:hr="t"')

    if ($isRule -and [string]::IsNullOrWhiteSpace($text)) {
      $blocks += [PSCustomObject]@{
        type = 'hr'
      }
      continue
    }

    $blocks += [PSCustomObject]@{
      type = 'paragraph'
      style = $style
      text = $text
    }
    continue
  }

  if ($child.LocalName -eq 'tbl') {
    $rows = @()
    $rowNodes = $child.SelectNodes('./w:tr', $ns)
    foreach ($rowNode in $rowNodes) {
      $cells = @()
      $cellNodes = $rowNode.SelectNodes('./w:tc', $ns)
      foreach ($cellNode in $cellNodes) {
        $cellText = Get-NodeText -Node $cellNode -Ns $ns
        $cells += $cellText.Trim()
      }
      $rows += ,@($cells)
    }

    $blocks += [PSCustomObject]@{
      type = 'table'
      rows = @($rows)
    }
  }
}

$json = $blocks | ConvertTo-Json -Depth 10

if ($OutputPath) {
  [System.IO.File]::WriteAllText((Resolve-Path -LiteralPath (Split-Path -Parent $OutputPath)).Path + '\' + (Split-Path -Leaf $OutputPath), $json, [System.Text.UTF8Encoding]::new($false))
}
else {
  $json
}
