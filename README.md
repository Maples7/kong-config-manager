# kong-config-manager

[![Build Status](https://travis-ci.org/Maples7/kong-config-manager.svg?branch=master)](https://travis-ci.org/Maples7/kong-config-manager)
[![Coverage Status](https://coveralls.io/repos/github/Maples7/kong-config-manager/badge.svg)](https://coveralls.io/github/Maples7/kong-config-manager)
[![npm version](https://badge.fury.io/js/kong-config-manager.svg)](https://badge.fury.io/js/kong-config-manager)

[![NPM](https://nodei.co/npm/kong-config-manager.png?downloads=true&downloadRank=true&stars=true)](https://nodei.co/npm/kong-config-manager/)

Yet another Kong CLI tool who can operate CURD on configurations of dozens of live [Kong](https://getkong.org/) instances. In this way, the configuration of Kong can be version-controlled and rollback with the help of git.

## Usage

### Installation

```sh
npm i -g kong-config-manager
```

### Recommended Workflow

1. `kcm -h`: check the manual.

2. `kcm init`: the default directory name is `kong-config`, you can use `-d` option to specify one another. In the directory, `kcm-config.json` would be created here as a demo of CLI configuration file. The default instance name is `main`.

3. `cd kong-config`: enter the git repo, the dir name should stay the same with step 1.

4. `kcm dump`: dump configurations of Kong instance `main` to this repo.

5. If you make any changes over your local configurations, make good use of `kcm apply` to apply changes to live Kong instances.

Get more details below.

### Commands

- `kcm init`: init a git repo and create a demo of CLI configuration file
- `kcm dump`: dump live Kong configurations to your git repo, referring to R(Retrieve) operation
- `kcm apply`: update Kong configurations to live Kong instances, including CUD(Create, Update, Delete) operations

Run `kcm [command] -h` to check the manual for details.

### How to make changes over local configurations

#### Create

Under any folder which `kcm dump` creates, create a new JSON file with arbitrary file name. Then check the [Kong Admin API document](https://getkong.org/docs/0.10.x/admin-api/) to get to know what params are required and fill them in the new JSON file.

**NOTE**:

1. Adding **new plugin** should be paid more attention. If you want to add a new plugin under some specific api, use `api_id` field in the new JSON file to achieve it. This field would be used as URL route's param for `POST - /apis/{name or id}/plugins/` API.

2. After successfully adding items, the JSON files you create manually would be removed.

#### Update

Just modify any existing items with the identifying field unchanged, then run `kcm apply`.

**NOTE**: As Kong's Admin APIs' document implies, `/cluster` and `/upstreams/{name or id}/targets` do **NOT** have PATCH and PUT APIs.

#### Delete

All you need to do is to remove the file of items you want to delete, then run `kcm apply`.

**NOTE**: Be VERY careful about deleting cluster node.

**SOMETHING GOOD TO KNOW**:

After each `kcm apply`, the tool will exec `dump` automatically to keep your local configuration is always refreshed and the same with the remote Kong configuration.

If you want to review your change before `kcm apply`, you can make good use of `git diff` by yourself. Of course, `kcm apply` will ask you to determine changes before applying for real.

### Examples

#### CLI configuration file

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
    // this can be used to avoid too many `consumers` here and to
    // dump plugins' configurations such as ACL
    // `targets` are bound up with `upstreams`, so use `upstreams` rather than `targets`
    "objects": ["apis", "plugins", "certificates", "snis", "upstreams"]
  }
}
```

**NOTE**: the protocol like `http` or `https` can NOT be omitted.

#### Commands Examples

```sh
# init a git repo `kong-config`
kcm init

# init a git repo `my-kong-config`
kcm init --dir my-kong-config

# use `kcm-config.json` and dump Kong instance `main`
kcm dump

# use `kcm-config.json` and dump all instances listed in it
kcm dump --all

# use `https://localhost:8444` as host and store configurations in `main` folder
kcm dump --host https://localhost:8444

# use `kcm-config.json` and dump Kong instance `sec_test`
kcm dump --instance sec_test

# use `https://localhost:8444` as host and store configurations in `sec_test` folder
kcm dump --host https://localhost:8444 --instance sec_test

# use `https://localhost:8444` as host and store configurations in `sec_test` folder using insecure connection (which will ignore ssl errors)
kcm dump --host https://localhost:8444 --instance sec_test --no-ssl

# use `kcm-config.json` and apply configurations of Kong instance `main`
kcm apply

# apply configurations of Kong instance `main` without using git to track diffs
kcm apply --no-git

# use `kcm-config.json` and apply configurations of all Kong instances concurrently
kcm apply --all

# use `https://localhost:8444` as host and apply configurations in `main` folder
kcm apply --host https://localhost:8444

# use `kcm-config.json` to find corresponding host and apply configurations in `sec_test` folder
kcm apply --instance sec_test

# use `https://localhost:8444` as host and apply configurations in `sec_test` folder
kcm apply --host https://localhost:8444 --instance sec_test

# use `https://localhost:8444` as host and apply configurations in `sec_test` folder using insecure connection (which will ignore ssl errors)
kcm apply --host https://localhost:8444 --instance sec_test --no-ssl
```

## Debug

Add `DEBUG=kcm:*` before any commands to see more debug information, e.g. `DEBUG=kcm:* kcm apply`.

## About Version

This tool are tested under version **0.10.x** and **0.11.x** of Kong and adjusted to be compatible with other above versions, though any other versions are NOT guaranteed. Theoretically, once the admin APIs of Kong remain unchanged, this tool would work perfectly. But again, nothing is determined for sure.

[`cluster` endpoint has disappeared since 0.11.x of Kong](https://github.com/Mashape/kong/blob/master/CHANGELOG.md#admin-api), and this tool would make it unpainful by getting the version of your Kong instance firstly.

However, the admin APIs might also have slight changes between 2 consistent small versions. In this situation, this tool would raise a WARNING with yellow color since v1.2.0 without exiting with error directly. Therefore, if you find there are any warnings about non-2xx response (404 in most cases) and know that's because your own Kong instance is not compatible with this tool, you could just ignore the warnings. You can take advantage of `objects` field in `kcm-config.json` to make these annoying warnings slient by not tracking some objects such as `cluster`.

Also, you are welcome to raise issues or even PRs to make it more compatible.

## Contribution

If you want to contribute to this project, feel free to raise any PRs.

### Test

Firstly, pull git submodule `kong-mock-server` and install all npm dependencies for test.

Then, make sure you have installed CLI tool `kong-config-manager` or run `npm link` in the root directory of this project.

Finally, run `npm test`.

To display mock server `logs use npm run log`

## Relatives

- [kong-mock-server](https://github.com/Maples7/kong-mock-server)

## License

[GPLv3](LICENSE)
