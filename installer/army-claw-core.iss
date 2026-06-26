#define MyAppName "Army Claw"
#define MyAppVersion "0.1.0"
#define MyAppPublisher "Army Claw"
#define MyAppExeName "ArmyClawCore.exe"

[Setup]
AppId={{D1DA2FC8-6175-4B93-9E4F-1C5E2192A705}
AppName={#MyAppName}
AppVersion={#MyAppVersion}
AppPublisher={#MyAppPublisher}
DefaultDirName={autopf}\Army Claw
DefaultGroupName=Army Claw
DisableProgramGroupPage=yes
OutputDir=..\release
OutputBaseFilename=ArmyClawCoreSetup-0.1.0
Compression=lzma2
SolidCompression=yes
WizardStyle=modern
ArchitecturesAllowed=x64compatible
ArchitecturesInstallIn64BitMode=x64compatible
PrivilegesRequired=lowest

[Languages]
Name: "korean"; MessagesFile: "compiler:Languages\Korean.isl"
Name: "english"; MessagesFile: "compiler:Default.isl"

[Files]
Source: "..\release\army-claw-core\ArmyClawCore\*"; DestDir: "{app}\ArmyClawCore"; Flags: ignoreversion recursesubdirs createallsubdirs
Source: "..\release\army-claw-core\openclaw.config.example.json"; DestDir: "{app}\config"; Flags: ignoreversion

[Icons]
Name: "{group}\Army Claw"; Filename: "{app}\ArmyClawCore\{#MyAppExeName}"
Name: "{autodesktop}\Army Claw"; Filename: "{app}\ArmyClawCore\{#MyAppExeName}"; Tasks: desktopicon

[Tasks]
Name: "desktopicon"; Description: "바탕화면 바로가기 만들기"; GroupDescription: "추가 바로가기:"

[Run]
Filename: "{app}\ArmyClawCore\{#MyAppExeName}"; Description: "Army Claw 실행"; Flags: nowait postinstall skipifsilent

[UninstallDelete]
Type: filesandordirs; Name: "{app}\logs"
