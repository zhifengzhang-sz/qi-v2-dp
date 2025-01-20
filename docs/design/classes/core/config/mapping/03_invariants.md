# Cross-cutting Invariants

## 1. Type Safety

$$
\begin{aligned}
&\forall c \in Config: type(c) \in T \\
&\forall s \in Schema: valid(s) \\
&\forall k \in Cache: unique(k)
\end{aligned}
$$

## 2. Behavioral Invariants

$$
\begin{aligned}
&\forall l \in Loader: implements(l, I_{loader}) \\
&\forall v \in Validator: implements(v, I_{validator}) \\
&\forall c \in Cache: implements(c, I_{cache})
\end{aligned}
$$

## 3. State Invariants

$$
\begin{aligned}
&\forall s \in State: \exists e \in Event: \delta(s,e) \text{ defined} \\
&\forall c \in Cache: fresh(c) \implies valid(c) \\
&\forall t \in Transaction: atomic(t)
\end{aligned}
$$

## 4. Category Invariants

$$
\begin{aligned}
&\forall f,g \in Mor(\mathfrak{C}): (f \circ g) \in Mor(\mathfrak{C}) \\
&\forall a \in Ob(\mathfrak{C}): id_a \in Mor(\mathfrak{C}) \\
&\forall f,g,h: (f \circ g) \circ h = f \circ (g \circ h)
\end{aligned}
$$
