import { Job, JobWorkableGroup, makeid, prelog, toKebabCase } from '@keep3r-network/cli-utils';
import { ethers } from 'ethers';
import { getMainnetSdk } from '../../eth-sdk-build';
import metadata from './metadata.json';

const getWorkableTxs: Job['getWorkableTxs'] = async (args) => {
  const correlationId = toKebabCase(metadata.name);
  // setup logs
  const logMetadata = {
    job: metadata.name,
    block: args.advancedBlock,
    logId: makeid(5),
  };
  const logConsole = prelog(logMetadata);

  logConsole.log(`Trying to work`);

  const network = ethers.utils.formatBytes32String('KEEP3R');

  // setup job
  const signer = args.fork.ethersProvider.getSigner(args.keeperAddress);
  const { job, sequencer } = getMainnetSdk(signer);
  const jobs = await sequencer.connect(args.keeperAddress).callStatic['getNextJobs(bytes32)'](network);

  if (!jobs.length) {
    logConsole.log('No workable jobs found');
    return args.subject.complete();
  }

  try {
    for (let i = 0; i < jobs.length; i++) {
      if (args.skipIds.includes(correlationId)) {
        logConsole.log(`Job in progress, avoid running`);
        continue;
      }

      logConsole.warn(`Job ${jobs[i].canWork ? `${jobs[i].job} is` : `${jobs[i].job} is not`} workable`);
      if (!jobs[i].canWork) continue;

      try {
        await job.connect(args.keeperAddress).callStatic.work(jobs[i].job, jobs[i].args, {
          blockTag: args.advancedBlock,
        });
      } catch (err: any) {
        logConsole.warn('Workable but failed to work', {
          message: err.message,
        });
        continue;
      }

      const workableGroups: JobWorkableGroup[] = [];

      for (let index = 0; index < args.bundleBurst; index++) {
        const tx = await job.connect(args.keeperAddress).populateTransaction.work(jobs[i].job, jobs[i].args, {
          nonce: args.keeperNonce,
          gasLimit: 2_000_000,
          type: 2,
        });

        workableGroups.push({
          targetBlock: args.targetBlock + index,
          txs: [tx],
          logId: `${logMetadata.logId}-${makeid(5)}`,
        });
      }

      args.subject.next({
        workableGroups,
        correlationId: jobs[i].job,
      });
    }

    // send it to the core in case it passed the simulation
  } catch (err: any) {
    logConsole.warn('Unexpected error', { message: err.message });
  }

  // finish job process
  args.subject.complete();
};

module.exports = {
  getWorkableTxs,
} as Job;
