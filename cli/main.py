import subprocess
from pathlib import Path

import typer

app = typer.Typer(add_completion=False)


@app.command()
def api():
    """Start the API development server"""
    api_dir = Path("workbench/_api")
    if not api_dir.exists():
        typer.echo(f"Error: Directory {api_dir} does not exist", err=True)
        raise typer.Exit(1)
    
    try:
        subprocess.run(["uvicorn", "app.main:fastapi_app", "--reload", "--factory"], cwd=api_dir, check=True)
    except subprocess.CalledProcessError as e:
        typer.echo(f"Error running uvicorn: {e}", err=True)
        raise typer.Exit(1)
    except FileNotFoundError:
        typer.echo("Error: uvicorn command not found. Please install uvicorn first.", err=True)
        raise typer.Exit(1)


@app.command()
def web():
    """Start the web development server"""
    web_dir = Path("workbench/_web")
    if not web_dir.exists():
        typer.echo(f"Error: Directory {web_dir} does not exist", err=True)
        raise typer.Exit(1)
    
    try:
        subprocess.run(["bun", "run", "dev"], cwd=web_dir, check=True)
    except subprocess.CalledProcessError as e:
        typer.echo(f"Error running bun dev: {e}", err=True)
        raise typer.Exit(1)
    except FileNotFoundError:
        typer.echo("Error: bun command not found. Please install bun first.", err=True)
        raise typer.Exit(1)


if __name__ == "__main__":
    app()
