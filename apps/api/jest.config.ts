import type { Config } from 'jest';

const shared: Pick<Config, 'moduleFileExtensions' | 'transform' | 'testEnvironment' | 'moduleNameMapper'> = {
  moduleFileExtensions: ['ts', 'js'],
  transform: {
    '^.+\\.ts$': ['ts-jest', { tsconfig: 'tsconfig.json' }]
  },
  testEnvironment: 'node',
  moduleNameMapper: {
    '^@/(.*)$': '<rootDir>/$1'
  }
};

const config: Config = {
  projects: [
    {
      ...shared,
      displayName: 'unit',
      rootDir: 'src',
      testRegex: '.*\\.spec\\.ts$'
    },
    {
      ...shared,
      displayName: 'e2e',
      rootDir: 'src',
      testRegex: '.*\\.e2e-spec\\.ts$'
    }
  ]
};

export default config;
