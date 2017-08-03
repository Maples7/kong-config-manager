# kong-config-manager
Yet another Kong CLI tool who can operate CURD on configs of dozens of live [Kong](https://getkong.org/) instances. In this way, the config of Kong can be version-controlled and rollback with the help of git.

## Usage

### Installation

```sh
npm i -g kong-config-manager
```

### Recommended Workflow

0. `kcm -h`: check the manual
1. `mkdir kong-config && cd kong-config`: Under your own `src` folder, make a new one to store Kong config. The folder name is arbitrary.
2. `git init`: make it a git repo
3. then create a config file for this CLI tool named `kcm-config.json` (other name is also accepted, though it makes following commands a little bit more verbose with a specific customized config file), and fill it with an object about Kong instances and their hosts. **NOTE**: the default instance name is `main`. If there is no `main` here, specify the instance in the following commands with option `-f`.
4. `kcm dump`: dump config of Kong instance `main` to this repo
5. If you make any changes over your local configs, make good use of `kcm apply` to apply changes to live Kong instances. Get more details below.

### Commands

- `kcm dump`: dump live Kong configs to your git repo, referring to R(Retrieve) operation
- `kcm apply`: update Kong configs to live Kong instances, including CUD(Create, Update, Delete) operations

Run `kcm [command] -h` to check the manual for details.

### How to make changes over local configs

#### Create

Under any folder which `kcm dump` creates, create a new JSON file with arbitrary file name. Then check the [Kong Admin API document](https://getkong.org/docs/0.10.x/admin-api/) to get to know what params are required and fill them in the new JSON file.

**NOTE**:

1. adding **new plugin** should be paid more attention. If you want to add a new plugin under some specific api, use `api_id` field in the new JSON file to achieve it. This field would be used as URL route's param for `POST - /apis/{name or id}/plugins/` API.

2. after success to add items, the JSON files you create manually would be removed.

#### Update

Just modify any existing items with the identify field unchanged, then run `kcm apply`.

#### Delete

All you need to do is to remove the file of items you want to delete, then run `kcm apply`, 

**ATTENTION**:

after each `kcm apply`, the tool will exec `dump` automatically to keep your local config is always refresh and the same with the remote Kong config.

### Examples

#### Commands
```sh
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

#### CLI config file

For example, `kcm-config.json` in the current working directory:

```json
{
  "main": "http://192.168.99.100:8001",
  "sec_test": "https://localhost:8444"
}
```

The key would be also used as folder name with all configs of corresponding Kong instance in it, so do **NOT** use any illegal characters for a folder name.

## About Version

This tool are fully tested under version **0.10.x** of Kong, any other versions are NOT guaranteed. Theoretically, once the admin APIs of Kong remain unchanged, this tool would work perfectly. But again, nothing is determined for sure.

## Contribution

If you want to contribute to this project, feel free to raise any PRs.

## License
[GPLv3](LICENSE)
