Add-Type -AssemblyName System.Windows.Forms, System.Drawing

# 1. 啟動 npx serve 背景程序
$psi = New-Object System.Diagnostics.ProcessStartInfo
$psi.FileName = "cmd.exe"
$psi.Arguments = "/c npx serve -s dist -l 8080"
$psi.WindowStyle = [System.Diagnostics.ProcessWindowStyle]::Hidden
$psi.CreateNoWindow = $true
$process = [System.Diagnostics.Process]::Start($psi)

# 2. 建立右下角系統匣圖示 (System Tray Icon)
$notifyIcon = New-Object System.Windows.Forms.NotifyIcon
$notifyIcon.Icon = [System.Drawing.SystemIcons]::Application
$notifyIcon.Text = "Auto-GAO 掛機伺服器 (Port 8080)"
$notifyIcon.Visible = $true

# 3. 建立右鍵選單
$contextMenu = New-Object System.Windows.Forms.ContextMenuStrip
$openItem = New-Object System.Windows.Forms.ToolStripMenuItem("開啟網頁")
$exitItem = New-Object System.Windows.Forms.ToolStripMenuItem("結束並關閉")

$contextMenu.Items.Add($openItem) | Out-Null
$contextMenu.Items.Add($exitItem) | Out-Null
$notifyIcon.ContextMenuStrip = $contextMenu

# 4. 選單事件綁定
$openItem.Add_Click({
    [System.Diagnostics.Process]::Start("http://localhost:8080")
})

$exitItem.Add_Click({
    $notifyIcon.Visible = $false
    $notifyIcon.Dispose()
    if (!$process.HasExited) {
        Stop-Process -Id $process.Id -Force -ErrorAction SilentlyContinue
    }
    # 確保關閉後端相關的 node/serve 子進程
    Get-Process -Name "node" -ErrorAction SilentlyContinue | Where-Object { $_.CommandLine -like "*serve*" } | Stop-Process -Force -ErrorAction SilentlyContinue
    [System.Windows.Forms.Application]::Exit()
    Exit
})

# 雙擊圖示開啟網頁
$notifyIcon.Add_DoubleClick({
    [System.Diagnostics.Process]::Start("http://localhost:8080")
})

# 5. 啟動訊息迴圈以維持背景執行
[System.Windows.Forms.Application]::Run()
