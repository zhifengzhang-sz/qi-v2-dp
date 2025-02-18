FROM huggingface/transformers-pytorch-cpu:4.34.1

# Copy requirements file
COPY requirements.txt /app/requirements.txt

# Install additional Python packages
RUN pip3 install -r /app/requirements.txt

# Verify installation and version
RUN python3 -c "import transformers; print(f'Transformers version: {transformers.__version__}')"

# Set working directory
WORKDIR /app