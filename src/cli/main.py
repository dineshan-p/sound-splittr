"""Command-line interface for Sound Splittr.

Usage:
    python src/cli/main.py -i song.mp3 -o output/

The CLI provides a simple interface for stem separation without the
web frontend. Use --verbose for GPU status and --dry-run to validate
inputs before processing.
"""

from __future__ import annotations

import sys
import os
from pathlib import Path

_PROJECT_ROOT = Path(__file__).resolve().parent.parent.parent
if str(_PROJECT_ROOT) not in sys.path:
    sys.path.insert(0, str(_PROJECT_ROOT))

import click


def show_gpu_status() -> None:
    """Display GPU availability and memory.

    Queries PyTorch's CUDA backend to show GPU count, names, free/total
    memory, and a recommendation for whether GPU or CPU mode is suitable.
    """
    try:
        import torch  # noqa: F811

        num_gpus = torch.cuda.device_count()
        if num_gpus > 0:
            gpu_names = [torch.cuda.get_device_name(i) for i in range(num_gpus)]
            print("\n🎉 Found GPU(s):")
            for i, name in enumerate(gpu_names):
                print(f"  GPU {i}: {name}")

            free_gb, total_gb = torch.cuda.mem_get_info()
            free_gb /= 1e9
            model_needed = "~2.5 GB"
            print(f"🧠 GPU Memory : {free_gb:.1f} GB free (of {total_gb / 1e9:.1f} GB)")
            print(f"🧠 Model needs: {model_needed}")

            if free_gb > 3.0:
                print("✅ Plenty of memory – ready for many songs!")
            elif free_gb < 1.5:
                print("⚠️  Memory is tight – consider --no-gpu")
        else:
            print("\n💻 No GPU found – will use CPU instead.")
            print("   This still works, just slower for long tracks.")

    except Exception as exc:
        print(f"\n⚠️  Could not query GPU status ({exc}) – assuming CPU mode")


@click.command()
@click.option("--input", "-i", "input_file", required=True,
              help="Path to input audio file (MP3, WAV, FLAC, OGG)")
@click.option("--output", "-o", "output_dir", required=True,
              help="Directory to save separated stems")
@click.option("--model", "-m", default="htdemucs",
              type=click.Choice(["htdemucs", "mdxdemucs", "htdemucs_6s"], case_sensitive=False),
              help="Demucs model name (default: htdemucs)")
@click.option("--device", "-d", default="auto",
              type=click.Choice(["auto", "cuda", "cpu"], case_sensitive=False),
              help="Hardware device (default: auto – picks best available)")
@click.option("--format", "-f", default="mp3",
              type=click.Choice(["mp3", "wav", "flac"]),
              help="Output format (default: mp3)")
@click.option("--bitrate", "-b", default=320,
              type=int,
              help="MP3 bitrate in kbps (only used with --format mp3; default: 320)")
@click.option("--verbose", "-v", is_flag=True, default=False,
              help="Show detailed processing information")
@click.option("--no-gpu", is_flag=True, default=False,
              help="Force CPU mode even if GPU is available")
@click.option("--dry-run", is_flag=True, default=False,
              help="Validate inputs but do not actually process the audio")
def main(
    input_file: str,
    output_dir: str,
    model: str,
    device: str,
    format: str,           # noqa: A002 – intentional; shadows built-in 'format'
    bitrate: int,
    verbose: bool,
    no_gpu: bool,
    dry_run: bool,
) -> None:
    """Separate an audio file into individual stems using Demucs AI.

    This is the entry point for the CLI tool. It validates inputs,
    optionally shows GPU status, and delegates to the processing pipeline.

    Examples:
        # Basic usage with defaults
        $ python src/cli/main.py -i song.mp3 -o output/

        # 6-stem separation with FLAC output
        $ python src/cli/main.py -i song.mp3 -o output/ -m htdemucs_6s -f flac

        # Dry-run to validate before processing
        $ python src/cli/main.py -i song.mp3 -o output/ --dry-run

        # Force CPU mode
        $ python src/cli/main.py -i song.mp3 -o output/ --no-gpu
    """
    input_path = Path(input_file).resolve()
    if not input_path.is_file():
        click.echo(f"❌ Error: Input file not found: {input_file}", err=True)
        click.echo(f"   Try: python src/cli/main.py -i song.mp3 -o output/", err=True)
        sys.exit(1)

    output_path = Path(output_dir).resolve()
    if not output_path.exists():
        output_path.mkdir(parents=True, exist_ok=True)
        click.echo(f"📁 Created output directory: {output_dir}")

    if verbose:
        show_gpu_status()

    if dry_run:
        click.echo(f"\n✅ Dry-run passed!")
        click.echo(f"   Input     : {input_path.name}")
        click.echo(f"   Output dir: {output_dir}")
        click.echo(f"   Model     : {model}")
        click.echo(f"   Device    : {'CPU' if no_gpu else device}")
        click.echo(f"   Format    : {format} ({bitrate} kbps)")
        return

    effective_device = "cpu" if no_gpu else device

    from src.pipeline.process import process_audio_file

    click.echo(f"\n🔄 Processing: {input_path.name}")
    click.echo(f"   Model     : {model}")
    click.echo(f"   Device    : {effective_device}")
    click.echo(f"   Output dir: {output_dir}")

    try:
        result = process_audio_file(
            input_file=str(input_path),
            output_dir=output_dir,
            model_name=model,
            device=effective_device,
            format=format,
            bitrate=bitrate,
            num_workers=2,
        )
    except Exception as exc:
        click.echo(f"\n❌ Processing failed: {exc}", err=True)
        sys.exit(1)

    click.echo("\n" + "=" * 50)
    click.echo("✅ Processing complete!")
    click.echo("=" * 50)
    click.echo(f"   Input file  : {result['file']}")
    click.echo(f"   Duration    : {result['duration']:.1f}s")
    click.echo(f"   Model used  : {result['model']}")
    click.echo(f"   Device      : {result.get('device', 'N/A')}")
    click.echo(f"\n   Stems created ({len(result['stems'])}):")

    for stem in result["stems"]:
        size_kb = stem["size"] / 1024
        click.echo(f"     • {stem['name']:<8} → {stem['path']} ({size_kb:.0f} KB)")


if __name__ == "__main__":
    main()
