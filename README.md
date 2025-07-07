# Workbench

## Clone the repo and configure `.env`

```bash
git clone https://github.com/cadentj/interp-workbench.git
cd interp-workbench
cp .env.template .env.local
cp models.template.toml models.local.toml
```

Check out some example model templates under `workbench/_web/_model_config_examples`.

## Start the backend server and frontend UI

You'll need to install `bun` to run the frontend and `uv` to run the backend. Once you have those installed, run:

```bash
uv sync
```

to add all required packages. Then run

```bash
bun install
```

from `workbench/_web` to install the relevant packages.

Then run 

```bash
workbench api
```

to set up the backend server, and

```bash
workbench web
``` 

to start up the frontend UI.
