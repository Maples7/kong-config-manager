# kong-config-manager

[![Build Status](https://travis-ci.org/Maples7/kong-config-manager.svg?branch=master)](https://travis-ci.org/Maples7/kong-config-manager)
[![Coverage Status](https://coveralls.io/repos/github/Maples7/kong-config-manager/badge.svg)](https://coveralls.io/github/Maples7/kong-config-manager)
[![npm version](https://badge.fury.io/js/kong-config-manager.svg)](https://badge.fury.io/js/kong-config-manager)           

[![NPM](https://nodei.co/npm/kong-config-manager.png?downloads=true&downloadRank=true&stars=true)](https://nodei.co/npm/kong-config-manager/)
[![NPM](https://nodei.co/npm-dl/kong-config-manager.png?months=6&height=3)](https://nodei.co/npm/kong-config-manager/)

Yet another Kong CLI tool who can operate CURD on configs of dozens of live [Kong](https://getkong.org/) instances. In this way, the config of Kong can be version-controlled and rollback with the help of git.

## Usage

### Installation

```sh
npm i -g kong-config-manager
```

### Recommended Workflow

0. `kcm -h`: check the manual.

1. `kcm init`: the default directory name is `kong-config`, you can use `-d` option to specify one another. In the directory, `kcm-config.json` would be created here as a demo config file. The default instance name is `main`.

2. `kcm dump`: dump config of Kong instance `main` to this repo

3. If you make any changes over your local configs, make good use of `kcm apply` to apply changes to live Kong instances. 

Get more details below.

### Commands

- `kcm init`: init a git repo and create a demo config file
- `kcm dump`: dump live Kong configs to your git repo, referring to R(Retrieve) operation
- `kcm apply`: update Kong configs to live Kong instances, including CUD(Create, Update, Delete) operations

Run `kcm [command] -h` to check the manual for details.

### How to make changes over local configs

#### Create

Under any folder which `kcm dump` creates, create a new JSON file with arbitrary file name. Then check the [Kong Admin API document](https://getkong.org/docs/0.10.x/admin-api/) to get to know what params are required and fill them in the new JSON file.

**NOTE**:

0. As Kong's Admin APIs' document implies, `/cluster` has **NO** POST API.

1. Adding **new plugin** should be paid more attention. If you want to add a new plugin under some specific api, use `api_id` field in the new JSON file to achieve it. This field would be used as URL route's param for `POST - /apis/{name or id}/plugins/` API.

2. After successfully adding items, the JSON files you create manually would be removed.

#### Update

Just modify any existing items with the identifying field unchanged, then run `kcm apply`.

**NOTE**: As Kong's Admin APIs' document implies, `/cluster` and `/upstreams/{name or id}/targets` do **NOT** have PATCH and PUT APIs.

#### Delete

All you need to do is to remove the file of items you want to delete, then run `kcm apply`.

**NOTE**: Be careful about deleting cluster node.

**ATTENTION**:

After each `kcm apply`, the tool will exec `dump` automatically to keep your local config is always refreshed and the same with the remote Kong config.

### Examples

#### CLI config file

For example, `kcm-config.json` in the current working directory:

```js
{
  // the value can be a string as `host`
  "main": "http://192.168.99.100:8001",
  "sec_test": "https://localhost:8444",
  // but a plain object is recommended
  "third_test": {
    // `host` is a required field
    "host": "http://localhost:8001",
    // specify which objects are your real concerns to dump and apply
    // this can be used to avoid too many `consumers` here
    // see ./enums/index.js to get valid objects
    // `targets` are bound up with `upstreams`, so use `upstreams` rather than `targets`
    "objects": ["apis", "plugins", "certificates", "snis", "upstreams"]
  }
}
```

**NOTE**: the protocol like `http` or `https` can NOT be omitted.

#### Commands

```sh
# init a git repo `kong-config`
kcm init

# init a git repo `my-kong-config`
kcm init --dir my-kong-config

# use `kcm-config.json` and dump Kong instance `main` 
kcm dump

# use `kcm-config.json` and dump all instances listed in it
kcm dump --all

# use `https://localhost:8444` as host and store configs in `main` folder
kcm dump --host https://localhost:8444

# use `kcm-config.json` and dump Kong instance `sec_test` 
kcm dump --instance sec_test

# use `https://localhost:8444` as host and store configs in `sec_test` folder
kcm dump --host https://localhost:8444 --instance sec_test

# use `kcm-config.json` and apply configs of Kong instance `main` 
kcm apply

# use `kcm-config.json` and apply configs of all Kong instances concurrently
kcm apply --all

# use `https://localhost:8444` as host and apply configs in `main` folder
kcm apply --host https://localhost:8444

# use `kcm-config.json` to find corresponding host and apply configs in `sec_test` folder
kcm apply --instance sec_test

# use `https://localhost:8444` as host and apply configs in `sec_test` folder
kcm apply --host https://localhost:8444 --instance sec_test
```

## About Version

This tool are fully tested under version **0.10.x** of Kong, any other versions are NOT guaranteed. Theoretically, once the admin APIs of Kong remain unchanged, this tool would work perfectly. But again, nothing is determined for sure.

## Contribution

If you want to contribute to this project, feel free to raise any PRs.

### Test

Firstly, pull git submodule `kong-mock-server` and install all npm dependencies for test. 

Then, make sure you have installed CLI tool `kong-config-manager` or run `npm link` in the root directory of this project.

Finally, run `npm test`.

### TODO

- [x] use more readable field as filename, remember to filenamify
- [x] auto-generate a CLI config file template `kcm-config.json` at the beginning or with `kcm init`
- [x] add support for operating on part of objects, not all. (consumers may be too many)
- [ ] add test mode for `apply`. Just show diff, don't operate truly
- [ ] * ~~omit some unimportant fields such as `created_at`~~ NO NEED TO DO THIS
- [x] * support node version 4 (need more consideration)

## Relatives

- [kong-mock-server](https://github.com/Maples7/kong-mock-server)

## License
[GPLv3](LICENSE)
