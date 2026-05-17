AGENTS.md

An audio stem splitter application using Demucs for DJing. This project enables DJs to create custom versions of their songs with separated stems (vocals, drums, bass, melody) for live remixing and performance.

---

## Important: Learning This Together

Since you're new to stem splitters, our goal is to build and understand the tool together:

- **Explain code**: Agents will explain key code sections as we build them
- **Good comments**: All code should have clear, educational comments
- **Step-by-step**: We'll progress in phases so you learn as we build
- **No jargon without explanation**: Technical terms get explained when they appear

---

## Roles

### 1. Project Architect [@architect] - "The Guide"

- **Responsibilities**: Oversee project design, coordinate agent work, explain concepts
- **Tasks**:
  - Design overall system architecture with you in mind
  - Explain why we're making certain design choices
  - Simplify technical concepts for better understanding
  - Coordinate cross-agent collaboration
  - Review all code for clarity and educational value

### 2. Audio Engineer [@audio_engineer] - "The Sound Expert"

- **Responsibilities**: Handle all audio processing, demucs integration, quality assurance
- **Tasks**:
  - Integrate Demucs library and configure models
  - Explain audio concepts (samples, channels, bit depth)
  - Optimize audio processing pipeline for quality
  - Post-processing for stem quality enhancement
  - Test separation quality across different song genres
  - **Always comment why we process audio this way**

### 3. Backend Developer [@backend] - "The Pipeline Builder"

- **Responsibilities**: Implement core services, API endpoints, file management
- **Tasks**:
  - Build file upload/download handlers with clear explanations
  - Implement queue system for batch processing
  - Create API endpoints with documentation
  - Manage metadata extraction (BPFID3, tags)
  - Implement caching for audio models
  - **Comment on file formats and why we use them**

### 4. Frontend/CLI Developer [@frontend] - "The Interface Designer"

- **Responsibilities**: Build intuitive user interfaces (web or CLI)
- **Tasks**:
  - Maintain and improve the Click-based CLI tool
  - Plan Angular web interface for drag-and-drop uploads
  - Design REST API endpoints for future frontend consumption
  - Show processing status in real-time with explanations

### 5. QA Tester [@qa] - "The Quality Checker"

- **Responsibilities**: Test audio quality, edge cases, error handling
- **Tasks**:
  - Create test suite with diverse audio samples across genres
  - Test memory usage and processing speed
  - Validate stem separation quality
  - Document known limitations and issues
  - Create "how to fix" guides with explanations
  - **Test that everything is beginner-friendly**

### 6. Documentation Specialist [@docs] - "The Teacher"

- **Responsibilities**: Create tutorials, guides, explain code
- **Tasks**:
  - Write installation guide with "why" explanations
  - Create "first use" tutorial for beginners
  - Add inline code comments and docstrings
  - Maintain code examples for learning
  - Document API with examples
  - Create FAQ with gentle troubleshooting
  - **All docs should be beginner-appropriate**

### 7. Deployment Engineer [@deploy] - "The Container Maker"

- **Responsibilities**: Dockerize, production setup, deployment
- **Tasks**:
  - Create simple Dockerfile with explanations
  - Set up Docker Compose for local development
  - Write deployment guides with step-by-step instructions
  - Configure production server with beginner instructions
  - Explain each deployment decision

---

## Communication Style

### For the Architect

- Always explain technical decisions in simple terms
- When introducing a concept, use an analogy
- Check understanding between major milestones

### For Audio Engineer

- Never assume knowledge of audio concepts
- Always comment WHY we do something, not just HOW
- Use audio metaphors ("

### For Documentation

- Start with "What this is" before "How it works"
- Always include "Why this matters"
- Keep examples beginner-friendly

---

## Code Commentary Standards

All code must follow these principles:

### DO: Include comments

```python
# Extract stems from multi-track audio audio_file
# Returns a dictionary with tracks separated into different stems
with open(audio_file) as f:
    # Process audio

def process_audio(audio):
    """Main function to process audio.
    Uses Demucs model to separate vocals, drums, bass, melody."""
    # ... implementation with comments
```

### FORGIVE: Occasional questions

- It's OK to ask for code explanations
- It's OK to say "I don't understand this part"
- Agents should explain any confusing section

### AVOID: Bare functions without docstrings

```
# BAD

def load_audio(file):
    return torchaudio.load(file)

# GOOD
def load_audio(file):
    """Load audio file into torch tensor format.

    Args:
        file: Path to audio file

    Returns:
        Tensor with audio data
		"""
    # Load the audio
    return torchaudio.load(file)
```

---

## Workflow Phases

### Phase 1: Foundation (Weeks 1-2)

**Goal**: Basic splitter that works end-to-end

1. **Setup** (Architect leads)
   - Initialize Python project
   - Install dependencies
   - Create basic directory structure
   - Explain each file's purpose

2. **Audio Core** (Audio Engineer + Backend + Architect)
   - Integrate Demucs
   - Basic file input/output
   - Simple processing pipeline
   - Comment every audio operation

3. **CLI Interface** (Frontend + Backend)
   - Click-based command-line tool with progress output
   - Dry-run mode for validation before processing
   - GPU status detection and reporting

**End Goal**: Upload song → Get stems in 5 minutes → Download all stems

### Phase 2: Quality & Testing (Weeks 3-4)

**Goal**: Reliable, high-quality output

1. **Test Suite** (QA + Audio Engineer)
   - Create diverse test files (rock, pop, electronic, jazz)
   - Measure quality metrics
   - Test with different file sizes/formats
   - Document expected quality per genre

2. **Optimization** (Audio Engineer + Backend)
   - Batch processing improvements
   - Memory management
   - GPU vs CPU handling
   - Caching strategies

**End Goal**: Process any audio file reliably with good quality

### Phase 3: Polish & Documentation (Weeks 5-6)

**Goal**: Production-ready, easy to use

1. **User Guides** (Docs + Frontend)
   - "First Time Use" guide
   - "Understanding Your Stems" tutorial
   - "Best Practices" guide
   - FAQ and troubleshooting

2. **Code Polish** (Architect + All)
   - Final code review
   - Add missing comments
   - Fix bugs from testing
   - Performance improvements

3. **Deployment** (Deploy + Architect)
   - Docker images
   - Cloud deployment options
   - Local installation instructions

### Phase 4: Maintenance & Enhancement (Ongoing)

**Goal**: Keep improving

- Monitor usage and collect feedback
- Add new features as needed
- Update for new Demucs versions
- Expand genre coverage

---

## Technical Stack (Beginner-friendly)

### Core Dependencies

- **Python 3.10+**: Easy to learn, lots of resources
- **demucs**: Audio separation (handles the hard work)
- **scipy**: Audio resampling & spectral analysis
- **click**: CLI framework (command-line interface)

### Why These?

- Python is great for beginners - lots of tutorials
- Demucs handles the complex audio AI stuff
- Click provides a robust, well-documented CLI

### Optional / Planned Stack

- **FastAPI**: For REST API endpoints (backend for Angular)
- **Angular**: Web frontend (planned, replacing Streamlit)
- **Docker**: For consistent environments

---

## Project Structure

```
stem_splitter/
├── README.md                 # Main guide with explanations
├── requirements.txt          # Python dependencies
├── AGENTS.md                 # This file
├── AGENT_CHECKLIST.md        # Per-phase tasks
│
├── src/                      # Main Python code
│   ├── __init__.py
│   ├── core/                 # Core audio processing
│   │   ├── __init__.py
│   │   ├── demucs_helper.py  # Demucs integration (heavily commented)
│   │   └── audio_io.py       # File I/O with soundfile/pydub (explained)
│   ├── pipeline/             # Processing pipeline
│   │   ├── __init__.py
│   │   └── process.py        # Main processing function
│   ├── cli/                  # CLI interface (Click-based)
│   │   └── main.py           # Command line interface
│   └── utils/                # Utilities
│       ├── __init__.py       # Common helpers (format_duration, file size)
│       └── quality.py        # Quality metrics
│
├── app/                      # Demucs models cache
│   └── models/
│
├── web/                      # Static web files (if needed)
│
├── tests/                    # Test suite
│   ├── __init__.py
│   ├── test_audio.py
│   ├── test_demes.py
│   └── fixtures/             # Test audio files
│
├── config/                   # Configuration files
│   ├── models.json           # Model configuration
│   └── presets.yaml          # Audio presets
│
├── docs/                     # Documentation
│   ├── tutorial/             # Step-by-step tutorials
│   ├── api/                  # API documentation
│   └── faq/                  # FAQ with explanations
│
├── docker/                   # Docker files
│   ├── Dockerfile
│   └── docker-compose.yml
│
└── logs/                     # Application logs
```

### Key File Explanations

#### README.md

**What**: Main user guide  
**Why**: First thing users read  
**Contents**: Installation, usage examples, troubleshooting  
**Style**: Conversational, assumes no prior knowledge

#### src/cli/main.py

**What**: Click-based CLI tool
**Why**: Primary user interface for splitting audio files from terminal
**Features**: GPU detection, dry-run mode, verbose output, format/bitrate options



#### requirements.txt

**What**: Python package dependencies  
**Why**: Ensures everyone has same setup  
**Style**: Well-commented dependencies

---

## Deliverables

### Minimum Viable Product (Weeks 1-2)

- [ ] Upload audio file
- [ ] Process with Demucs
- [ ] Download vocal, drums, bass, melody stems
- [ ] Basic error handling

### Full Version (Weeks 4-6)

- [ ] All MVP features
- [ ] Quality testing suite
- [ ] Docker container
- [ ] Complete documentation
- [ ] FAQ and tutorials

---

## Notes for Beginning Development

1. **Start Simple**: First version should just work, not be perfect
2. **Test Often**: Catch issues early, learn from mistakes
3. **Learn Together**: This is about learning as we build
4. **Quality Over Speed**: Audio quality matters for DJing

---

## Next Steps

Before we begin:

1. Review this AGENTS.md and project plan
2. Discuss what features you care about most
3. Plan the Angular frontend architecture
4. Set up development environment together

Let me know if you have questions about any section!
