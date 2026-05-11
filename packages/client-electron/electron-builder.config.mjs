export default {
  appId: 'com.realmfall.client',
  productName: 'Realmfall',
  directories: {
    output: process.env.REALMFALL_ELECTRON_RELEASE_DIR ?? 'release',
  },
  extraMetadata: {
    main: 'dist/main.js',
  },
  files: ['dist/**/*', 'package.json'],
  win: {
    signAndEditExecutable: false,
    target: [
      {
        target: 'nsis',
        arch: ['x64'],
      },
    ],
  },
  nsis: {
    artifactName: '${productName}-Setup-${version}.${ext}',
    oneClick: false,
  },
};
