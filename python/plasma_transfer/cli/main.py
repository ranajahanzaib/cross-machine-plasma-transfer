import typer
from rich.console import Console
from rich.table import Table

app = typer.Typer(help="Cross-Machine Plasma Transfer Analysis CLI")
console = Console()


@app.command()
def info():
    """Display platform research summary and active protocol."""
    console.print("[bold cyan]Cross-Machine Plasma Transfer Analysis[/bold cyan]")
    console.print("Investigating domain shift and transfer learning between DIII-D and MAST tokamaks.")
    console.print("Active Protocol: [green]Protocol B (Challenge-Compatible Label-Free Adaptation)[/green]")


@app.command()
def ingest(profile: str = typer.Option("quickstart", help="Dataset profile to ingest")):
    """Ingest real experimental dataset shots."""
    from plasma_transfer.ingestion.dataset_manager import DatasetManager
    console.print(f"Ingesting profile: [bold]{profile}[/bold]...")
    dm = DatasetManager()
    if profile == "quickstart":
        paths = dm.ingest_quickstart(lambda msg, p: console.print(f"[{int(p*100)}%] {msg}"))
        console.print(f"[bold green]Successfully ingested {len(paths)} shots.[/bold green]")


@app.command()
def run_pipeline():
    """Execute end-to-end analysis and generate scientific artifacts."""
    from plasma_transfer.experiments.pipeline import ExperimentPipeline
    console.print("Running end-to-end scientific pipeline...")
    pipe = ExperimentPipeline()
    res = pipe.run_quickstart_analysis()
    console.print(f"[bold green]Artifacts generated for {res['metadata']['num_observations']} observations.[/bold green]")


if __name__ == "__main__":
    app()
