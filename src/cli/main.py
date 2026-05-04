"""
Command-Line Interface
=====================

Alternative to the web interface for users who prefer terminal.

Usage:
    python src/cli/main.py --help

Examples:
    # Split a single file
    python src/cli/main.py --input song.mp3 --output output/

    # Process multiple files
    python src/cli/main.py --input songs/*.mp3 --output splits/
"""

import click
import sys
import os
from pathlib import Path

sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.dirname(__file__))))

from core.demucs_helper import (
    validate_model,
    get_model
)
from core.audio_io import load_audio
from pipeline.process import process_audio_file
from utils.quality import validate_output


@click.command()
@click.option('--input_file', '-i', required=True,
               help='Path to input audio file (MP3, WAV, FLAC, OGG)')
@click.option('--output_dir', '-o', required=True,
               help='Directory to save separated stems')
@click.option('--model', '-m', default='htdemucs',
               help='Demucs model to use (htdemucs, hdemucs, hdemucs_30)'
                'Default: htdemucs')
@click.option('--device', '-d', default='auto',
               help='Device to use: cpu, cuda, mps, or auto (default)')
@click.option('--format', '-f', default='mp3',
               type=click.Choice(['mp3', 'wav', 'flac']),
               help='Output format (default: mp3)')
@click.option('--bitrate', '-b', default=320,
               help='MP3 bitrate in kbps (320 = high quality)')
@click.option('--verbose', '-v', is_flag=True,
               help='Show detailed processing information')
@click.option('--no-gpu', is_flag=True,
               help='Force CPU mode even if GPU available')
@click.option('--dry-run', is_flag=True,
               help='Validate but do not process')
def main(
    input_file: str,
    output_dir: str,
    model: str,
    device: str,
    format: str,
    bitrate: int,
    verbose: bool = False,
    no_gpu: bool = False,
    dry_run: bool = False
):
    """
    Command-line interface for stem splitting.
    
    This CLI allows you to:
    - Process audio files from terminal
    - Use with shell scripts and automation
    - Pipe file lists for batch processing
    
    Args:
        input_file: Path to the audio file to split
        output_dir: Where to save the separated stems
        model: Which Demucs model to use
        device: CPU or GPU to use
        format: Output audio format
        bitrate: MP3 quality (only applies to mp3 output)
        verbose: Show detailed output
        no_gpu: Force CPU even if GPU available
        dry_run: Only validate, don't process
    """
    
    # Setup logging
    if verbose:
        import logging
        logging.basicConfig(level=logging.INFO)
    
    # Check input file exists
    input_path = Path(input_file)
    if not input_path.exists():
        click.echo(f"Error: Input file not found: {input_file}", err=True)
        click.echo(f"  Try: python src/cli/main.py -i song.mp3 -o output/", err=True)
        sys.exit(1)
    
    # Check output directory
    output_path = Path(output_dir)
    if not output_path.exists():
        click.echo(f"Creating output directory: {output_dir}")
        output_path.mkdir(parents=True, exist_ok=True)
    
    # Validate model exists or is downloading
    if not validate_model(model):
        click.echo(f"Downloading model: {model}...")
        from core.demucs_helper import download_model
        download_model(model)
    
    # Process the audio
    click.echo(f"Processing: {input_file}")
    click.echo(f"  Output directory: {output_dir}")
    click.echo(f"  Model: {model}")
    click.echo(f"  Device: {'GPU' if 'cuda' in device.lower() else 'CPU'}")
    
    result = process_audio_file(
        input_file=input_file,
        output_dir=output_dir,
        model=model,
        device=device,
        format=format,
        bitrate=bitrate,
        num_workers=2  # Enable parallel processing
    )
    
    # Report results
    click.echo("\n" + "="*50)
    click.echo("Processing Complete!")
    click.echo("="*50)
    click.echo(f"  Input: {result['file']}")
    click.echo(f"  Duration: {result['duration']:.1f}s")
    click.echo(f"  Model used: {result['model']}")
    
    click.echo(f"  Stems created ({len(result['stems'])}):")
    for stem in result['stems']:
        click.echo(f"    - {stem['name']}: {stem['path']}")
        if verbose:
            click.echo(f"      Size: {stem['size'] / 1024:.1f} KB")
    
    # Validate output quality
    quality_ok, issues = validate_output(
        result['stems'],
        tolerance=0.99  # Allow up to 1% quality loss
    )
    
    if issues:
        click.echo("\n" + "-"*50)
        click.echo("Quality Warning:")
        for issue in issues:
            click.echo(f"  ! {issue}")
    else:
        click.echo("\nQuality check: PASSED")


if __name__ == '__main__':
    main()
