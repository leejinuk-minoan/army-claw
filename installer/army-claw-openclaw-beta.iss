#define MyAppName "Army Claw OpenClaw Beta"
#define MyAppVersion "0.2.0-beta.1"
#define MyAppPublisher "Army Claw"
#define PayloadZip "ArmyClawOpenClawBetaPayload-0.2.0-beta.1.zip"

[Setup]
AppId={{5B0C6337-4F08-4D72-A28D-2A6242F87F1B}
AppName={#MyAppName}
AppVersion={#MyAppVersion}
AppPublisher={#MyAppPublisher}
DefaultDirName={localappdata}\ArmyClawBeta
DefaultGroupName=Army Claw OpenClaw Beta
DisableProgramGroupPage=yes
OutputDir=..\release
OutputBaseFilename=ArmyClawOpenClawBetaSetup-0.2.0-beta.1
Compression=none
SolidCompression=no
WizardStyle=modern
ArchitecturesAllowed=x64compatible
ArchitecturesInstallIn64BitMode=x64compatible
PrivilegesRequired=lowest
LicenseFile=..\release\army-claw-openclaw-beta\LICENSE-OPENCLAW.txt

[Languages]
Name: "korean"; MessagesFile: "compiler:Languages\Korean.isl"
Name: "english"; MessagesFile: "compiler:Default.isl"

[Files]
Source: "..\release\{#PayloadZip}"; DestDir: "{app}"; Flags: ignoreversion
Source: "..\release\army-claw-openclaw-beta\LICENSE-OPENCLAW.txt"; DestDir: "{app}"; Flags: ignoreversion
Source: "..\release\army-claw-openclaw-beta\NOTICE.txt"; DestDir: "{app}"; Flags: ignoreversion
Source: "..\release\army-claw-openclaw-beta\ARMY_CLAW_BETA_README.txt"; DestDir: "{app}"; Flags: ignoreversion
Source: "..\release\army-claw-openclaw-beta\THIRD_PARTY_NOTICES-OPENCLAW.md"; DestDir: "{app}"; Flags: ignoreversion

[Icons]
Name: "{group}\Army Claw OpenClaw Beta"; Filename: "{app}\bin\ArmyClawOpenClawBeta.cmd"; WorkingDir: "{app}\bin"
Name: "{group}\Army Claw OpenClaw Status"; Filename: "{app}\bin\ArmyClawOpenClawStatus.cmd"; WorkingDir: "{app}\bin"
Name: "{group}\Army Claw OpenClaw Gateway"; Filename: "{app}\bin\ArmyClawOpenClawGateway.cmd"; WorkingDir: "{app}\bin"
Name: "{group}\Army Claw Hancom Tools"; Filename: "{app}\bin\ArmyClawHancomTools.cmd"; Parameters: "status --json"; WorkingDir: "{app}\bin"
Name: "{autodesktop}\Army Claw OpenClaw Beta"; Filename: "{app}\bin\ArmyClawOpenClawBeta.cmd"; WorkingDir: "{app}\bin"; Tasks: desktopicon

[Tasks]
Name: "desktopicon"; Description: "Create a desktop shortcut"; GroupDescription: "Additional shortcuts"; Flags: unchecked

[Run]
Filename: "powershell.exe"; Parameters: "-NoProfile -ExecutionPolicy Bypass -Command ""Expand-Archive -LiteralPath '{app}\{#PayloadZip}' -DestinationPath '{app}' -Force; Remove-Item -LiteralPath '{app}\{#PayloadZip}' -Force"""; Flags: runhidden waituntilterminated
Filename: "{app}\bin\ArmyClawOpenClawBeta.cmd"; Description: "Run Army Claw OpenClaw Beta"; Flags: nowait postinstall skipifsilent

[UninstallDelete]
Type: filesandordirs; Name: "{app}\app"
Type: filesandordirs; Name: "{app}\node"
Type: filesandordirs; Name: "{app}\bin"