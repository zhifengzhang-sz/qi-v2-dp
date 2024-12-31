# 4. Architectural Representation (C4 Model)

## 4.1 System Context Level

### 4.1.1 Context Elements
Let $\mathbb{C}$ be the set of context elements:
$$\mathbb{C} = \{c_{\text{Client}}, c_{\text{WSMachine}}, c_{\text{Server}}\}$$

### 4.1.2 Context Relations
Context relations $R_c$ defined as:
$$R_c = \{(c_{\text{Client}}, c_{\text{WSMachine}}, \text{"Uses"}), (c_{\text{WSMachine}}, c_{\text{Server}}, \text{"Connects to"})\}$$

## 4.2 Container Level

### 4.2.1 Container Set
The set of containers $\mathbb{T}$ within $c_{\text{WSMachine}}$:
$$\mathbb{T} = \{t_{\text{StateManager}}, t_{\text{ConnectionManager}}, t_{\text{MessageHandler}}, t_{\text{MetricsCollector}}\}$$

### 4.2.2 Container Responsibilities
For each container $t \in \mathbb{T}$:
- $t_{\text{StateManager}} \mapsto \{S, E, \delta\}$
- $t_{\text{ConnectionManager}} \mapsto \{\mathbb{W}, \mathbb{K}\}$
- $t_{\text{MessageHandler}} \mapsto \{\mathbb{M}, E_d\}$
- $t_{\text{MetricsCollector}} \mapsto \{V, T\}$

### 4.2.3 Container Relations
Container relations $R_t$ defined as directed graph:
$$R_t = \{(t_1, t_2, l) \mid t_1, t_2 \in \mathbb{T}, l \in \mathbb{S}\}$$

## 4.3 Component Level

### 4.3.1 State Manager Components
Components of $t_{\text{StateManager}}$:
$$\mathbb{P}_{\text{SM}} = \{p_{\text{TransitionEngine}}, p_{\text{ActionExecutor}}, p_{\text{InvariantChecker}}, p_{\text{ContextManager}}\}$$

### 4.3.2 Component Responsibilities
Formal mapping of components to machine elements:
- $p_{\text{TransitionEngine}} \mapsto \delta$
- $p_{\text{ActionExecutor}} \mapsto \Gamma$
- $p_{\text{InvariantChecker}} \mapsto \text{Invariants}$
- $p_{\text{ContextManager}} \mapsto C$

### 4.3.3 Component Relations
Component relations $R_p$ with typing:
$$R_p: \mathbb{P}_{\text{SM}} \times \mathbb{P}_{\text{SM}} \rightarrow \mathfrak{P}(\mathbb{S})$$

## 4.4 Interface Definitions

### 4.4.1 External Interfaces
Client interface $I_c$:
$$I_c = \{(e, \tau) \mid e \in E, \tau \in \{\text{sync}, \text{async}\}\}$$

Server interface $I_s$:
$$I_s = \{(m, d) \mid m \in \mathbb{M}, d \in \mathbb{D}\}$$

### 4.4.2 Internal Interfaces
Between containers:
$$I_t: \mathbb{T} \times \mathbb{T} \rightarrow \mathfrak{P}(E \cup \Gamma)$$

Between components:
$$I_p: \mathbb{P}_{\text{SM}} \times \mathbb{P}_{\text{SM}} \rightarrow \mathfrak{P}(C \cup \Gamma)$$

## 4.5 Architectural Constraints

### 4.5.1 Layering Constraints
1. Context isolation:
   $$\forall c_1, c_2 \in \mathbb{C}: \nexists \text{ direct communication path}$$

2. Container boundaries:
   $$\forall t \in \mathbb{T}: \text{scope}(t) \cap \text{scope}(t') = \emptyset$$

### 4.5.2 Communication Constraints
1. Event flow:
   $$\forall e \in E: \text{path}(e) \text{ must pass through } t_{\text{StateManager}}$$

2. Message flow:
   $$\forall m \in \mathbb{M}: \text{path}(m) \text{ must pass through } t_{\text{MessageHandler}}$$

## 4.6 Implementation Notes

### 4.6.1 Dependency Management
Each container $t \in \mathbb{T}$ must:
1. Expose well-defined public interface
2. Encapsulate internal state
3. Maintain single responsibility

### 4.6.2 Error Handling
1. Each layer handles errors appropriate to its level
2. Errors propagate up through defined interfaces
3. Cross-cutting concerns handled at container level