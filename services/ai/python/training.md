# Model Fine-tuning and Training Data Preparation

This document outlines the process to fine-tune the model for specialized areas, including C4 system design, TypeScript coding, and continuous project learning.

---

## Specialized Training Areas

1. **C4 System Design**  
   Focuses on system architecture, component design, integration patterns, and configuration management.
2. **TypeScript Development**  
   Enhances capabilities in TypeScript, covering type systems, modern patterns, API implementations, and testing practices.
3. **Continuous Project Learning**  
   The model adapts to your project over time by learning from new commits, pull requests, code reviews, and documentation.

---

## Collecting Training Data

Since you currently don’t have a prepared dataset, here are some concrete approaches to collect data:

### 1. Public Data Sources

- **C4 Data via Hugging Face Datasets:**  
  The [C4 (Colossal Clean Crawled Corpus)](https://huggingface.co/datasets/c4) can be used as a raw text source. You can load a subset and filter for design-related keywords:
  ```python
  from datasets import load_dataset

  # Load a small subset of the C4 dataset
  dataset = load_dataset("c4", "en", split="train[:1%]")  
  # Filter examples containing 'architecture' or 'design'
  design_data = dataset.filter(lambda x: "architecture" in x["text"].lower() or "design" in x["text"].lower())
  print(f"Collected {len(design_data)} design-related examples.")
  ```
  Save the output as part of your training data.

- **GitHub Repositories for TypeScript:**  
  Explore public GitHub repositories to collect real-world TypeScript code. For example, clone a popular project and extract the TypeScript files:
  ```bash
  git clone https://github.com/angular/angular.git
  # List all TypeScript files and archive them:
  find angular -type f -name "*.ts" > angular_ts_files.txt
  tar -czvf training_data/angular_typescript.tar.gz -T angular_ts_files.txt
  ```

### 2. Scraping or Using APIs

- **GitHub API:**  
  Use the GitHub API to search for repositories or code snippets related to design documents or TypeScript code. For example, using Python’s `requests`:
  ```python
  import requests

  query = "language:TypeScript stars:>500"
  url = f"https://api.github.com/search/repositories?q={query}"
  response = requests.get(url)
  data = response.json()
  for repo in data.get("items", []):
      print(repo["full_name"], repo["html_url"])
  ```
  This provides a list of popular TypeScript repositories you can consider cloning.

- **Web Scraping Design Docs:**  
  If some organizations publish design documents publicly (for instance, blog posts or PDF files), consider using tools like `wget` or Python’s `BeautifulSoup` to scrape them. Example with `wget`:
  ```bash
  wget -r -l1 -H -t1 -nd -N -np -A.pdf,http://example.com/design-docs/
  ```
  Then, manually review and convert the PDFs to text if needed.

### 3. Internal Sources (If Available)

- **Project Documentation and Git History:**  
  Even if you don’t have a standalone dataset, you may collect internal documents:
  ```bash
  # Extract commit messages
  git log --pretty=format:"%s" > training_data/commit_messages.txt

  # Copy internal design docs or markdown files:
  cp -r ./internal_design_docs ./training_data/internal_design_docs
  cp -r ./docs ./training_data/project_docs
  ```

### 4. Data Cleaning and Consolidation

After collecting the data, you will likely need to preprocess it:
- Remove duplicates.
- Convert PDFs to plain text (using tools such as `pdftotext`).
- Normalize formatting (e.g., converting markdown to plain text if necessary).

A helper script can combine and clean these sources:
```python
# filepath: /home/zzhang/python/scripts/prepare_data.py
import argparse, os, shutil

def prepare_data(source, output):
    os.makedirs(output, exist_ok=True)
    # Example: Copy TypeScript files
    ts_source = os.path.join(source, "src")
    ts_output = os.path.join(output, "typescript")
    if os.path.exists(ts_source):
        shutil.copytree(ts_source, ts_output, dirs_exist_ok=True)
    # Copy design docs
    design_source = os.path.join(source, "design-docs")
    design_output = os.path.join(output, "c4_designs")
    if os.path.exists(design_source):
        shutil.copytree(design_source, design_output, dirs_exist_ok=True)
    # Copy project documentation
    docs_source = os.path.join(source, "docs")
    docs_output = os.path.join(output, "project_docs")
    if os.path.exists(docs_source):
        shutil.copytree(docs_source, docs_output, dirs_exist_ok=True)
    print("Training data prepared in:", output)

if __name__ == "__main__":
    parser = argparse.ArgumentParser()
    parser.add_argument("--source", required=True, help="Path to the source project or data repository")
    parser.add_argument("--output", default="training_data", help="Output directory for training data")
    args = parser.parse_args()
    prepare_data(args.source, args.output)
```

---

## Fine-tuning Process

1. **Start Fine-tuning**

   For example, to fine-tune the CodeGen 350M baseline:
   ```bash
   python scripts/train.py \
     --model="codegen-350m" \
     --training_data="training_data" \
     --epochs=3 \
     --batch_size=4
   ```
   Adjust `--epochs` and `--batch_size` based on your dataset size.

2. **Export the Fine-tuned Model**

   Once training is complete:
   ```bash
   python scripts/export.py --output="models/fine_tuned"
   ```

3. **Update Model Configuration**

   Add a new entry in your configuration file to reference the fine-tuned model:
   ```python
   # filepath: /home/zzhang/python/config/model_config.py
   MODEL_CONFIGS = {
       "deepseek-6.7b": ModelConfig(
           model_id="deepseek-ai/deepseek-coder-6.7b-base",
           model_type="deepseek",
           description="DeepSeek Coder 6.7B - Full model",
           parameters="6.7B",
           cpu_friendly=False
       ),
       "codegen-350m": ModelConfig(
           model_id="Salesforce/codegen-350m-mono",
           model_type="codegen",
           description="CodeGen 350M - Fast CPU model",
           parameters="350M",
           cpu_friendly=True
       ),
       "project-tuned": ModelConfig(
           model_id="./models/fine_tuned",
           model_type="custom",
           description="Project-specific tuned model",
           parameters="350M",
           cpu_friendly=True,
           continuous_learning=True
       )
   }
   ```

---

## Continuous Learning

To keep the model updated as your project evolves:

- **Automate Data Collection:** Schedule periodic data extraction (e.g., new commits or documentation) using CI/CD pipelines.
- **Incremental Training:** Retrain the model on new data and merge it with the previous fine-tuned weights.
- **Monitoring:** Evaluate model performance using scripts and update configurations as needed.

Monitor training progress with TensorBoard:
```bash
tensorboard --logdir=training_logs
```

Evaluate the model:
```bash
python scripts/evaluate.py --model="project-tuned"
python scripts/benchmark.py --models="codegen-350m,project-tuned"
```

---

This document now provides concrete methods and examples for collecting training data—even when starting without an existing dataset. For quick reference on running the service, please see the main README.
