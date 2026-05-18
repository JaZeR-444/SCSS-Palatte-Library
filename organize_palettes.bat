@echo off
setlocal enabledelayedexpansion

:: SCSS Palette Organizer
:: This script scans the root directory for .scss files, counts the number of color variables,
:: and moves them into categorized folders (e.g., "5 Color Palette").

echo Scanning for SCSS palettes...
echo.

set "movedCount=0"

for %%f in (*.scss) do (
    set "filename=%%f"
    set "colorCount=0"
    
    :: Count lines in the "CSS HEX" section (lines starting with -- and containing #)
    for /f %%a in ('findstr /R /C:"^--.*: #" "%%f" ^| find /c "#"') do (
        set "colorCount=%%a"
    )
    
    if !colorCount! GTR 0 (
        set "targetFolder=!colorCount! Color Palette"
        
        if not exist "!targetFolder!" (
            mkdir "!targetFolder!"
        )
        
        move "%%f" "!targetFolder!\" >nul
        echo [OK] Moved "%%f" to "!targetFolder!"
        set /a movedCount+=1
    ) else (
        echo [SKIP] "%%f" (No standard color variables detected)
    )
)

echo.
if %movedCount% GTR 0 (
    echo Successfully organized %movedCount% palettes.
) else (
    echo No palettes were found to organize.
)

pause
