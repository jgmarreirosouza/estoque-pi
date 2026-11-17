// Configuração do Jest (testes unitários do aplicativo).
// Rodar:  npx jest        |  com cobertura:  npx jest --coverage
//
// O Babel do Expo carrega por padrão os plugins do Reanimated/Worklets (animações),
// que não são necessários para testar lógica pura — por isso são desligados aqui,
// só para os testes (o app continua usando a configuração normal).
// Localiza o babel-preset-expo (pode estar dentro de node_modules/expo ou na raiz).
const presetExpo = require.resolve('babel-preset-expo', {
  paths: [require.resolve('expo/package.json')],
});

module.exports = {
  preset: 'jest-expo',
  testMatch: ['<rootDir>/__tests__/**/*.test.ts?(x)'],
  collectCoverageFrom: ['services/risco.ts'],
  transform: {
    '^.+\\.[jt]sx?$': [
      'babel-jest',
      { presets: [[presetExpo, { reanimated: false, worklets: false }]] },
    ],
  },
};
