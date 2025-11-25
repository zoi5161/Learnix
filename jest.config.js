module.exports = {
  testEnvironment: 'jsdom',
  moduleFileExtensions: ['js', 'jsx'],
  testMatch: ['**/__tests__/**/*.js?(x)', '**/?(*.)+(spec|test).js?(x)'],
  moduleDirectories: ['node_modules', 'client/src'],
  transform: {
    '^.+\\.(js|jsx)$': 'babel-jest',
  },
};