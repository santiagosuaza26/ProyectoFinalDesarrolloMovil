const {spawnSync} = require('child_process');
const fs = require('fs');
const path = require('path');

function sdkCandidates() {
  const candidates = [];

  if (process.env.ANDROID_SDK_ROOT) {
    candidates.push(process.env.ANDROID_SDK_ROOT);
  }

  if (process.env.ANDROID_HOME) {
    candidates.push(process.env.ANDROID_HOME);
  }

  if (process.platform === 'win32') {
    if (process.env.LOCALAPPDATA) {
      candidates.push(path.join(process.env.LOCALAPPDATA, 'Android', 'Sdk'));
    }
    if (process.env.USERPROFILE) {
      candidates.push(
        path.join(process.env.USERPROFILE, 'AppData', 'Local', 'Android', 'Sdk'),
      );
    }
  } else {
    if (process.env.HOME) {
      candidates.push(path.join(process.env.HOME, 'Android', 'Sdk'));
    }
  }

  const unique = [];
  for (const candidate of candidates) {
    if (candidate && !unique.includes(candidate)) {
      unique.push(candidate);
    }
  }

  return unique;
}

function resolveSdkPath() {
  return sdkCandidates().find(candidate => fs.existsSync(candidate));
}

function joinPathParts(parts) {
  return parts.filter(Boolean).join(path.delimiter);
}

function buildEnvWithAndroidTools() {
  const sdkPath = resolveSdkPath();
  if (!sdkPath) {
    return {env: process.env, sdkPath: undefined};
  }

  const emulatorDir = path.join(sdkPath, 'emulator');
  const platformToolsDir = path.join(sdkPath, 'platform-tools');
  const cmdlineToolsBin = path.join(sdkPath, 'cmdline-tools', 'latest', 'bin');
  const toolsBin = path.join(sdkPath, 'tools', 'bin');

  const env = {
    ...process.env,
    ANDROID_SDK_ROOT: process.env.ANDROID_SDK_ROOT || sdkPath,
    ANDROID_HOME: process.env.ANDROID_HOME || sdkPath,
    PATH: joinPathParts([
      emulatorDir,
      platformToolsDir,
      cmdlineToolsBin,
      toolsBin,
      process.env.PATH,
    ]),
  };

  return {env, sdkPath};
}

function run(command, args, env) {
  const result = spawnSync(command, args, {
    stdio: 'inherit',
    env,
    shell: process.platform === 'win32',
  });

  process.exit(result.status ?? 1);
}

const args = process.argv.slice(2);
const {env, sdkPath} = buildEnvWithAndroidTools();

if (!sdkPath) {
  console.error(
    'Android SDK not found. Set ANDROID_SDK_ROOT or install SDK in the default path.',
  );
  process.exit(1);
}

if (args.length === 1 && args[0] === '--list-avds') {
  const emulatorBinary =
    process.platform === 'win32'
      ? path.join(sdkPath, 'emulator', 'emulator.exe')
      : path.join(sdkPath, 'emulator', 'emulator');

  if (!fs.existsSync(emulatorBinary)) {
    console.error(`Emulator binary not found at: ${emulatorBinary}`);
    process.exit(1);
  }

  run(emulatorBinary, ['-list-avds'], env);
}

if (args.length === 0) {
  console.error('Usage: node e2e/run-detox.js <detox args>');
  process.exit(1);
}

const detoxBinary =
  process.platform === 'win32'
    ? path.join(process.cwd(), 'node_modules', '.bin', 'detox.cmd')
    : path.join(process.cwd(), 'node_modules', '.bin', 'detox');

if (!fs.existsSync(detoxBinary)) {
  console.error('Detox binary not found. Run npm install first.');
  process.exit(1);
}

run(detoxBinary, args, env);
