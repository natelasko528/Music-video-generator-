# Music Video Conversational AI - Dependencies

# Core Web Framework
fastapi==0.109.0
uvicorn[standard]==0.27.0
websockets==12.0
python-multipart==0.0.6

# LangChain & AI
langchain==0.1.4
langchain-openai==0.0.5
openai==1.10.0
tiktoken==0.5.2

# Database
asyncpg==0.29.0  # PostgreSQL async driver
psycopg2-binary==2.9.9  # PostgreSQL sync driver
redis==5.0.1
sqlalchemy==2.0.25

# Data Processing
pydantic==2.5.3
pydantic-settings==2.1.0
python-dotenv==1.0.1

# Audio Analysis (for music features)
librosa==0.10.1
essentia==2.1b6.dev1110
audioread==3.0.1
soundfile==0.12.1

# Video Processing
ffmpeg-python==0.2.0
Pillow==10.2.0
opencv-python==4.9.0.80

# AWS & Storage
boto3==1.34.34  # AWS SDK
botocore==1.34.34

# Monitoring & Logging
prometheus-client==0.19.0
python-json-logger==2.0.7

# Utilities
aiohttp==3.9.3
asyncio==3.4.3
python-dateutil==2.8.2
pytz==2024.1

# State Management
transitions==0.9.0  # State machine

# Testing
pytest==8.0.0
pytest-asyncio==0.23.4
pytest-cov==4.1.0
httpx==0.26.0  # For testing FastAPI

# Development
black==24.1.1  # Code formatting
flake8==7.0.0  # Linting
mypy==1.8.0  # Type checking
pre-commit==3.6.0

# Optional: Video Generation APIs
# Add these based on which services you use:
# runway-ml==0.1.0
# replicate==0.22.0

# Optional: Vector Database
# pinecone-client==3.0.2
# weaviate-client==3.26.1
# chromadb==0.4.22
