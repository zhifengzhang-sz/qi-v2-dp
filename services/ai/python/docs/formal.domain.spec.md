Below is a formal mathematical specification for the core functions in `app.py` file.

---

## 1. Preliminaries

Let:
- $\Sigma$ be the alphabet (set of characters) for textual data.
- A prompt or any text be an element of $\Sigma^*$.
- $V$ be the vocabulary (set of tokens) used by the tokenizer.
- A tokenizer be a function 
  $$ T: \Sigma^* \to V^* $$
  that maps strings to sequences of tokens.
- A language model be a function 
  $$ f: V^* \to \Delta(V) $$
  providing a distribution over $V$, where $\Delta(V)$ is the set of probability distributions on $V$.

---

## 2. Setup Environment

The function `setup_environment()` configures execution settings. It determines the number of threads using:
  
$$ n = \min(\text{cpu\_count} \text{ or } 1, 8) $$

and then sets environment variables accordingly:
- $\scriptsize OMP\_NUM\_THREADS = n$
- $\scriptsize MKL\_NUM\_THREADS = n$

In addition, it configures PyTorch:
- $torch.set\_num\_threads(n)$
- Enables memory-efficient computation with settings:
  - $torch.backends.cuda.matmul.allow\_tf32 = True$
  - $torch.backends.cudnn.allow\_tf32 = True$

---

## 3. Model Loading

The function `load_model()` performs the following steps:

1. **Model Identifier:**  
   Let $m_{\text{id}}$ denote the model identifier, set as  
   $$ m_{\text{id}} = \text{"deepseek-ai/deepseek-coder-6.7b-base"} $$

2. **Tokenizer Loading:**  
   The tokenizer is loaded through the function 
   $$ T(m_{\text{id}}) : \Sigma^* \to V^*, $$
   with options:
   - $use\_fast = \text{True}$
   - $trust\_remote\_code = True$

3. **Model Instantiation:**  
   The language model is loaded via the function 
   $$ f(m_{\text{id}}): V^* \to \Delta(V), $$
   with options to enable 8-bit quantization:
   - $\text{device\_map} = \text{"cpu"}$
   - $\text{load\_in\_8bit} = \text{True}$
   - $\text{torch\_dtype} = \text{torch.float16}$
   - $\text{trust\_remote\_code} = \text{True}$
   - $\text{low\_cpu\_mem\_usage} = \text{True}$

Thus, `load_model()` returns a tuple $(m, T)$ where $m$ is the loaded model and $T$ is the corresponding tokenizer.

---

## 4. Text Generation

The function `generate_text(prompt, model, tokenizer, max_length=500)` formalizes the text generation process:

1. **Tokenization:**  
   Given an input prompt $p \in \Sigma^*$, tokenization produces:
   $$ x = T(p) \quad \text{where} \quad x \in V^* $$

2. **Generation Process:**  
   The model uses $x$ to generate an output sequence of tokens of maximum length $L$, where:
   $$ g: V^* \times \mathbb{N} \to V^* $$
   such that:
   $$ g(x, L) = (t_1, t_2, \dots, t_k),\quad k \le L $$
   The generation parameters include temperature $\theta = 0.7$, top-p $= 0.95$, and a repetition penalty $= 1.1$, ensuring sampling from the distribution provided by $f$.

3. **Decoding:**  
   The final step decodes the token sequence back to a string:
   $$ \text{output} = T^{-1}\big((t_1, t_2, \dots, t_k)\big) $$

Thus, overall,  
$$ \text{generate\_text}(p, m, T) = T^{-1}\Big(g\big(T(p), L\big)\Big) $$

with $L = 500$ by default.

---

## 5. Execution Flow

When executed as a script, the file proceeds as follows:

1. **Environment Optimization:**  
   Call `setup_environment()` to configure resource limits.

2. **Model Setup:**  
   Display a message and load the model and tokenizer:
   $$ (m, T) = \text{load\_model()} $$

3. **Prompt Processing:**  
   Define a sample prompt $p$:
   $$ p = \text{"Write a Python function to implement merge sort. Include comments explaining the code."} $$

4. **Response Generation:**  
   Generate the response:
   $$ r = \text{generate\_text}(p, m, T) $$
   and then output $r$.

---

This formal specification provides a rigorous definition of the key concepts and functions within your main application, ensuring that each operation—from environment setup through to model inference—is precisely described.