# C4 to Implementation Mapping

## 1. Container to Interface Mapping
$$
\begin{aligned}
\text{Loader System} &\mapsto \text{ILoader} \\
\text{Validator System} &\mapsto \text{IValidator} \\
\text{Schema System} &\mapsto \text{ISchema} \\
\text{Transform System} &\mapsto \text{ITransform} \\
\text{Cache System} &\mapsto \text{ICache} \\
\text{Event System} &\mapsto \text{IEvent}
\end{aligned}
$$

## 2. Component to Class Mapping
$$
\begin{aligned}
\text{BaseLoader} &\mapsto \text{BaseLoaderImpl} \\
\text{SchemaValidator} &\mapsto \text{SchemaValidatorImpl} \\
\text{SchemaManager} &\mapsto \text{SchemaManagerImpl} \\
\text{Transformer} &\mapsto \text{TransformerImpl} \\
\text{CacheStore} &\mapsto \text{CacheStoreImpl} \\
\text{EventEmitter} &\mapsto \text{EventEmitterImpl}
\end{aligned}
$$

## 3. Interface Contracts
$$
\begin{aligned}
I_{loader} &= \{load, validate, watch\} \\
I_{validator} &= \{validate, getSchema\} \\
I_{schema} &= \{load, validate\} \\
I_{transform} &= \{convert, merge\} \\
I_{cache} &= \{get, set, clear\} \\
I_{event} &= \{emit, on, off\}
\end{aligned}
$$