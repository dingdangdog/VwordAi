## 安装包

Windows、macOS 和 Linux 分开构建。某个平台的文件要等对应任务成功后才会出现。安装包未签名。

| 平台 | 文件 |
| --- | --- |
| Windows x64 | VwordAi-Setup-__VERSION__.exe |
| macOS Apple 芯片 | VwordAi-__VERSION__-arm64.dmg，以及同名 zip |
| macOS Intel | VwordAi-__VERSION__-x64.dmg，以及同名 zip |
| Linux x64 | VwordAi-__VERSION__.AppImage 和 VwordAi-__VERSION__.deb |

macOS 若提示无法打开，到系统设置的隐私与安全性里允许，或对应用执行 `xattr -dr com.apple.quarantine`。AppImage 需要先加上可执行权限。deb 用 `dpkg -i` 安装。

校验文件是 `SHA256SUMS-windows.txt`、`SHA256SUMS-macos.txt` 和 `SHA256SUMS-linux.txt`。同目录的 blockmap 用于增量更新。

自动更新使用 `latest.yml`、`latest-mac.yml` 和 `latest-linux.yml`。客户端读取标成最新的 Release。
