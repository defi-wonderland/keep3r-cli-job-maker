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
  const jobs = await sequencer.callStatic['getNextJobs(bytes32)'](network);

  // return if there are no workable jobs
  if (!jobs.length) {
    logConsole.log('No workable jobs found');
    return args.subject.complete();
  }

  // for each workable job
  for (const workableJob of jobs) {
    // setup logs for strategy
    const jobLogId = `${logMetadata.logId}-${makeid(5)}`;
    const jobConsole = prelog({ ...logMetadata, logId: jobLogId });

    // skip job if already in progress
    if (args.skipIds.includes(workableJob.job)) {
      jobConsole.log(`Job in progress, avoid running`);
      continue;
    }

    jobConsole.warn(`Job ${workableJob.job} ${workableJob.canWork ? `is` : `is not`} workable`);

    // check if it's the network's turn to work, go to the next job in the array if it isn't
    if (!workableJob.canWork) continue;

    try {
      let tx: any | undefined;
      try {
        await job.connect(args.keeperAddress).callStatic.workMetered(workableJob.job, workableJob.args, {
          blockTag: args.advancedBlock,
        });

        // create work tx
        tx = await job.populateTransaction.workMetered(workableJob.job, workableJob.args, {
          nonce: args.keeperNonce,
          gasLimit: 5_000_000,
          type: 2,
        });
      } catch (err: unknown) {
        if ((err as any)?.error?.error?.data?.reason === 'GasMeteredMaximum') {
          jobConsole.log(`Fallbacking to work`);

          // create work tx
          tx = await job.populateTransaction.work(workableJob.job, workableJob.args, {
            nonce: args.keeperNonce,
            gasLimit: 5_000_000,
            type: 2,
          });
        } else {
          throw err;
        }
      }

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
    } catch (err: unknown) {
      // handle error logs
      jobConsole.warn('Unexpected error', { message: (err as Error).message });
    }
  }

  // finish job process
  args.subject.complete();
};

module.exports = {
  getWorkableTxs,
} as Job;
