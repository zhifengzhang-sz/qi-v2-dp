# Detailed Documentation: Environment Variable Substitution with envplate

## Overview

In many containerized environments and configuration management scenarios, you need to generate configuration files (or environment files) by substituting environment variables into a template. In our case, we have a template file (`.env-local.template`) that contains placeholders (using the `${VARIABLE}` syntax) which need to be replaced with actual values from a `.env` file.

Traditionally, tools like `envsubst` have been used for this purpose. However, `envsubst` does a simple text substitution without robust escaping, which might cause issues (especially with JSON data). **envplate** is an alternative tool written in Go that offers more robust handling of special characters and quoting, making it a good choice when generating files like JSON configuration files.

This documentation explains how to install and use **envplate** in an Ubuntu DevContainer (running in VSCode), how to integrate it with your Makefile, and some details on handling potential quoting issues.

---

## Table of Contents

1. [Installation in the Ubuntu DevContainer](#installation)
2. [Using envplate](#using-envplate)
3. [Integration with a Makefile](#integration-with-a-makefile)
4. [Handling Quoting and Escaping Issues](#handling-quoting-and-escaping-issues)
5. [Summary and Best Practices](#summary-and-best-practices)

---

## Installation in the Ubuntu DevContainer

Since **envplate** is not available in the default Ubuntu repositories, you need to download the precompiled binary and install it manually. Add the following steps to your Dockerfile (or run them inside your devcontainer):

1. **Ensure curl is installed:**

   ```dockerfile
   RUN apt-get update && apt-get install -y curl
   ```

2. **Download and install envplate:**

   Replace `v0.5.0` with the latest version if needed.

   ```dockerfile
   RUN curl -L https://github.com/segmentio/envplate/releases/download/v0.5.0/envplate_linux_amd64 -o /usr/local/bin/envplate && \
       chmod +x /usr/local/bin/envplate
   ```

This snippet downloads the `envplate` binary to `/usr/local/bin` and makes it executable. After rebuilding your devcontainer, you should be able to verify the installation by running:

```sh
envplate --help
```

---

## Using envplate

**envplate** processes a template file, substitutes environment variables, and by default writes the changes directly to the file (in place). However, if you want to view or redirect the output, you can use the dry-run flag (`-d`), which sends the processed content to STDOUT.

### Basic Usage

- **To process a template file and output to STDOUT:**

  ```sh
  envplate .env-local.template -d
  ```

- **To generate a new file with the substituted content:**

  ```sh
  envplate .env-local.template -d > .env-local
  ```

> **Note:**  
> Without the `-d` flag, envplate will update the file in place and you may not see any output on STDOUT. This is why using `-d` is recommended when you want to capture the output or pipe it to another command.

---

## Integration with a Makefile

Integrating **envplate** into your Makefile automates the generation of the `.env-local` file from your template. A typical `configure` target might look like this:

```makefile
configure: ## Configure Ollama and .env-local
	@mkdir -p ollama/config
	@if [ ! -f .env-local.template ]; then \
		echo "$(RED)Error: .env-local.template not found. Please create it.$(RESET)"; exit 1; \
	fi
	@echo "$(GREEN)Generating .env-local from .env-local.template$(RESET)"
	@set -a && . ./.env && set +a && envplate .env-local.template -d > .env-local
	@echo '{ \
		"gpu": false, \
		"compute": "cpu", \
		"numThread": $(OLLAMA_NUM_THREAD), \
		"modelPath": "/root/.ollama/models", \
		"format": "gguf", \
		"parameters": { \
			"num_ctx": $(OLLAMA_NUM_CTX), \
			"num_batch": $(OLLAMA_NUM_BATCH), \
			"num_gqa": 8, \
			"rope_frequency_base": 1000000 \
		} \
	}' > ollama/config/config.json
	@docker exec -i qi-ollama /bin/sh -c 'mkdir -p /root/.ollama/config'
	@docker cp ollama/config/config.json qi-ollama:/root/.ollama/config/
```

### Explanation

1. **Sourcing the .env File:**
   - The command `@set -a && . ./.env && set +a` exports all variables defined in `.env` into the shell’s environment so that **envplate** can see them.

2. **Running envplate:**
   - The command `envplate .env-local.template -d > .env-local` processes the `.env-local.template` file and outputs the substituted content to `.env-local`.

3. **Container Operations:**
   - The Makefile also creates a configuration JSON file and copies it into the running container.

---

## Handling Quoting and Escaping Issues

### Why Quoting Matters

When substituting environment variables into a JSON (or any configuration file), you must ensure that the inserted values do not break the syntax. For example, if an environment variable contains a double quote (`"`), it can break the JSON formatting if not escaped.

### Best Practices

1. **Avoid Wrapping the Entire JSON in Extra Quotes:**
   - In your `.env-local.template`, use the natural JSON quoting. For example, write:
     ```json
     {
       "name": "${MODEL_NAME}",
       "parameters": {
         "num_thread": ${OLLAMA_NUM_THREAD},
         "num_ctx": ${OLLAMA_NUM_CTX},
         "num_batch": ${OLLAMA_NUM_BATCH}
       },
       "endpoints": [{
         "type": "ollama",
         "url": "http://ollama-service:11434",
         "ollamaName": "${OLLAMA_MODEL_NAME}"
       }]
     }
     ```
     This approach avoids issues that might arise from wrapping the JSON in additional single quotes.

2. **Control and Sanitize Environment Variable Contents:**
   - Ensure that values in your `.env` file do not include unescaped quotes or other special characters that could conflict with JSON syntax.
   - Document the expected format of these variables so that accidental misconfiguration is avoided.

3. **Preprocessing/Advanced Templating:**
   - **envplate** does a better job than `envsubst` in many cases, but if your variables are user-generated or dynamically sourced, consider additional validation or sanitization.
   - Alternatively, you could use a preprocessing script or a more advanced templating tool that automatically escapes problematic characters. However, if your values are controlled, this is typically unnecessary.

---

## Summary and Best Practices

- **Installation:**  
  Install **envplate** in your Ubuntu DevContainer by downloading the binary via `curl` and making it executable. This keeps your setup lightweight without additional Python dependencies.

- **Usage:**  
  Use `envplate .env-local.template -d > .env-local` to generate your configuration file. The `-d` flag (dry-run) outputs the result to STDOUT for redirection.

- **Integration:**  
  Incorporate the command into your Makefile so that configuration generation is automated and reproducible. Ensure that the environment variables from your `.env` file are exported before running **envplate**.

- **Quoting Issues:**  
  Avoid extra wrapping quotes in the template and document the expected formats of environment variables. Sanitize or validate variable values if there is any risk of problematic characters.

By following these guidelines, you can reliably generate configuration files using **envplate** within your VSCode Ubuntu DevContainer, reducing the risk of formatting errors and ensuring a smooth build and deployment process.

