import { Job, JobWorkableGroup, makeid, prelog } from '@keep3r-network/cli-utils';
import { ethers } from 'ethers';
import { getMainnetSdk } from '../../eth-sdk-build';
import metadata from './metadata.json';

const getWorkableTxs: Job['getWorkableTxs'] = async (args) => {
  // setup logs
  const logMetadata = {
    job: metadata.name,
    block: args.advancedBlock,
    logId: makeid(5),
  };
  const logConsole = prelog(logMetadata);

  logConsole.log(`Trying to work`);

  // get 'KEEP3R' in bytes32
  const network = ethers.utils.formatBytes32String('KEEP3R');

  // setup job with default fork provider
  const signer = args.fork.ethersProvider.getSigner(args.keeperAddress);
  const { job, sequencer } = getMainnetSdk(signer);

  // get array of workable jobs
  const jobs = await sequencer.connect(args.keeperAddress).callStatic['getNextJobs(bytes32)'](network);

  // return if there are no workable jobs
  if (!jobs.length) {
    logConsole.log('No workable jobs found');
    return args.subject.complete();
  }

  // for each workable job
  for (const workableJob of jobs) {
    //skip job if already in progress
    if (args.skipIds.includes(workableJob.job)) {
      logConsole.log(`Job in progress, avoid running`);
      continue;
    }

    logConsole.warn(`Job ${workableJob.canWork ? `${workableJob.job} is` : `${workableJob.job} is not`} workable`);

    // check if is the network's turn to work, go to the next job in the array if it isn't
    if (!workableJob.canWork) continue;

    try {
      // check if the tx throws an error when called with this parameters
      await job.connect(args.keeperAddress).callStatic.work(workableJob.job, workableJob.args, {
        blockTag: args.advancedBlock,
      });

      // create work tx
      const tx = await job.connect(args.keeperAddress).populateTransaction.work(workableJob.job, workableJob.args, {
        nonce: args.keeperNonce,
        gasLimit: 2_000_000,
        type: 2,
      });

      // create a workable group every bundle burst
      const workableGroups: JobWorkableGroup[] = new Array(args.bundleBurst).fill(null).map((_, index) => ({
        targetBlock: args.targetBlock + index,
        txs: [tx],
        logId: `${logMetadata.logId}-${makeid(5)}`,
      }));

      // submit all bundles
      args.subject.next({
        workableGroups,
        correlationId: workableJob.job,
      });
    } catch (err: any) {
      // handle error logs
      logConsole.warn('Unexpected error', { message: err.message });
    }
  }

  // finish job process
  args.subject.complete();
};

module.exports = {
  getWorkableTxs,
} as Job;
