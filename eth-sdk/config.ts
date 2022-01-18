import { defineConfig } from '@dethcrypto/eth-sdk';

export default defineConfig({
  outputPath: 'src/eth-sdk-build',
  contracts: {
    mainnet: {
      job: '0x5D469E1ef75507b0E0439667ae45e280b9D81B9C',
      sequencer: '0x9566eB72e47E3E20643C0b1dfbEe04Da5c7E4732',
    },
  },
});
