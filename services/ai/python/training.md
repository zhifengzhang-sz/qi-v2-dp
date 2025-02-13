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

## Training Data Preparation

### Data Sources

- **C4 Design Documents:**  
  Collect design artifacts from your engineering documentation or public repositories.
  
- **TypeScript Codebase:**  
  Gather source code, tests, and API definitions from your project repository or open-source projects.
  
- **Project Context:**  
  Export Git commit logs, pull request discussions, and project documentation.

### Collecting Training Data

#### C4 Design Examples

Clone your design repository:
```bash
git clone https://github.com/yourorg/c4-designs.git
cp -r c4-designs/design-docs ./training_data/c4_designs
```

#### TypeScript Source Files

Archive TypeScript files:
```bash
find ./src -name "*.ts" > ts_files.txt
tar -czvf training_data/typescript_codebase.tar.gz -T ts_files.txt
```

#### Project Context

Export commit messages as training data:
```bash
git log --pretty=format:"%s" > training_data/commit_messages.txt
cp -r ./docs ./training_data/project_docs
```

### Preprocessing and Consolidation

A helper script can be used to consolidate these sources:

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
    parser.add_argument("--source", required=True, help="Path to the source project repository")
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

This document provides comprehensive details on acquiring training data and fine-tuning your model. For a quick reference on running the service, please see the main README.

Finally, update your main README.md to reference this new TRAINING.md file. For example, under a new section like "Advanced Training" you could add:

```markdown
## Advanced Training

For detailed instructions on preparing training data and fine-tuning the model, please refer to [TRAINING.md](./TRAINING.md).
```

This structure keeps your main README clean while providing in-depth training documentation separately.