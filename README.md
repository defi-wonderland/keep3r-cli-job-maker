[![image](https://img.shields.io/npm/v/@defi-wonderland/keep3r-cli-job-maker.svg?style=flat-square)](https://www.npmjs.org/package/@defi-wonderland/keep3r-cli-job-maker)

# MakerDAO Keep3r CLI Job

This job enables The Keep3r Network keepers on Ethereum to execute the different MakerDAO jobs.

> ⚠️ **DEPRECATED – DO NOT USE**
>
> This repository is no longer maintained and is **deprecated**.
>
> It may contain **outdated, insecure, or vulnerable code** and should **not** be used in production or as a dependency in any project.
>
> The repository is retained solely for historical reference. No support, updates, or security patches will be provided.

## How to install

1. Open a terminal inside your [CLI](https://github.com/keep3r-network/cli) setup
2. Run `yarn add @defi-wonderland/keep3r-cli-job-maker`
3. Add job inside your CLI config file. It should look something like this:
```
{
    ...
    "jobs": [
        ...,
        {
            "path": "node_modules/@defi-wonderland/keep3r-cli-job-maker/dist/src/mainnet/maker"
        }
    ]
}
```

## Keeper Requirements

* Must be a valid Keeper on Keep3r V2
* Must have 50 bonded KP3R

## Useful Links

* [Job](https://etherscan.io/address/0x5D469E1ef75507b0E0439667ae45e280b9D81B9C)
* [Sequencer](https://etherscan.io/address/0x9566eB72e47E3E20643C0b1dfbEe04Da5c7E4732)
* [Documentation](https://github.com/keep3r-network/keep3r.network/pull/52)
* [Keep3r V1](https://etherscan.io/address/0x1ceb5cb57c4d4e2b2433641b95dd330a33185a44)