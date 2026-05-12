const { spawnSync } = require('node:child_process');

const steps = [
  {
    name: 'outbound guard policy modes',
    command: 'npm',
    args: ['run', 'test:outbound-guard'],
  },
  {
    name: 'telegram inbound full smoke',
    command: 'npm',
    args: ['run', 'smoke:telegram-inbound:full'],
  },
];

for (const step of steps) {
  console.log(`\n[local-safety] ${step.name}`);
  const result = spawnSync(step.command, step.args, {
    stdio: 'inherit',
    shell: process.platform === 'win32',
    env: {
      ...process.env,
      FORCE_COLOR: process.env.FORCE_COLOR ?? '0',
    },
  });

  if (result.error) {
    console.error(`[local-safety] failed to start ${step.name}: ${result.error.message}`);
    process.exit(1);
  }

  if (result.status !== 0) {
    console.error(`[local-safety] ${step.name} failed with exit code ${result.status}`);
    process.exit(result.status ?? 1);
  }
}

console.log('\n[local-safety] ok: outbound guard policy and full inbound smoke passed');
