import { defineConfig } from '@dethcrypto/eth-sdk';

export default defineConfig({
  outputPath: 'src/eth-sdk-build',
  contracts: {
    mainnet: {
      job: '0x28937B751050FcFd47Fd49165C6E1268c296BA19',
      sequencer: '0x9566eB72e47E3E20643C0b1dfbEe04Da5c7E4732',
    },
  },
});
