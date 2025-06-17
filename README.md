# Workbench

## Clone the repo and configure `.env`

```bash
git clone https://github.com/TransluceAI/docent.git
cd docent
cp .env.template .env.local
cp models.template.toml models.local.toml
```

Check out some example model templates under `workbench/_web/_model_config_examples`.

## Start the backend server and frontend UI

```bash
uv sync
```

Then run 

```bash
workbench api
```

to set up the backend server, and

```bash
workbench web
``` 

to start up the frontend UI.
