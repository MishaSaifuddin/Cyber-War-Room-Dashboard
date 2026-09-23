# -*- mode: python ; coding: utf-8 -*-
"""PyInstaller spec for the Cyber War Room desktop app.

Build with:
    pyinstaller war_room.spec --noconfirm
"""

from PyInstaller.utils.hooks import collect_submodules

datas = [
    ("index.html", "."),
    ("css", "css"),
    ("js", "js"),
    ("assets/war_room.ico", "assets"),
    ("assets/war_room.png", "assets"),
]
hiddenimports = (
    collect_submodules("psutil")
    + collect_submodules("websockets")
    + collect_submodules("pystray")
)

a = Analysis(
    ["backend/desktop_launcher.py"],
    pathex=["."],
    binaries=[],
    datas=datas,
    hiddenimports=hiddenimports,
    hookspath=[],
    hooksconfig={},
    runtime_hooks=[],
    excludes=[],
    noarchive=False,
    optimize=0,
)
pyz = PYZ(a.pure)

exe = EXE(
    pyz,
    a.scripts,
    a.binaries,
    a.datas,
    [],
    name="CyberWarRoom",
    debug=False,
    bootloader_ignore_signals=False,
    strip=False,
    upx=True,
    upx_exclude=[],
    runtime_tmpdir=None,
    console=False,
    disable_windowed_traceback=False,
    argv_emulation=False,
    target_arch=None,
    codesign_identity=None,
    entitlements_file=None,
    icon="assets/war_room.ico",
)