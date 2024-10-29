# The QI System

@import "./overview_qi_system.md"

## The Conceptual Model

@import "./plantuml/qi_system.puml" {as="plantuml"}

1. Information flow is modeled by `Data Platform` system.  It is colored by `MediumSeaGreen`.
2. Operations: `Fund Manager`, `Portfolio Manager`, `Execution Manager`, `Research System`, and `Simulation System`, they are colored by `MediumSlateGray`. From data interaction point of view, operations are the models that not only need to consume data but also need to publish data into `Data Platform`.
3. Applications: `Visualization and Monitoring System`. These models only consume data from the `Data Platform` and is colored by `Brown`.
4. External resources: `External data sources` and `Databases`. These models are colored by `MediumSlateBlue`.

*Operations* and *applications* are the users of the *data platform*, together they form the QI core system, while the external resources are the resources on which the core system rely.

---

@import "./plantuml/qi_system_containers.puml" {as="plantuml"}

---
