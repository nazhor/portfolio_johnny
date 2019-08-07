SET destiny_folder=E:\Projects\Web\johnny-devv.github.io

REM Dark zone from here, do not modify
ECHO Starting process
hugo
XCOPY /S /E /Y public %destiny_folder%
SET /P tmp="Process complete, press a key to close"

