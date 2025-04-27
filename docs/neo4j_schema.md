# Neo4j Schema

## Introduction
This document outlines the data schema for the Neo4j database used in the Beaver application. It is designed to support the application's architecture and functionality as described in the `Architecture_v1.2_en_us.md` document.

## Node Labels
- **Component**: Represents a software component with temporal fields `valid_from` and `valid_to`.
- **ADR**: Architectural Decision Record nodes linked with `HAS_DECISION` relationships.

## Relationship Types
- **DEPENDS_ON**: Indicates dependency between components.
- **CONNECTS_TO**: Represents connections between components.
- **RUNS_ON**: Specifies the platform or environment a component runs on.
- **STORES_DATA_IN**: Indicates where a component stores its data.
- **CONTAINS**: Represents containment relationships between components.
- **PROTECTS**: Indicates security or protection relationships.

## Temporal Fields
- **valid_from**: The start date of the component's validity.
- **valid_to**: The end date of the component's validity.

## Glossary and Tagging
- **GlossaryTerm**: Embedded dictionary terms with `#tag` support across nodes and edges.

## Conclusion
This schema provides a comprehensive overview of the data structure for the Neo4j database, ensuring it supports the application's needs effectively. For more detailed information, refer to the `Architecture_v1.2_en_us.md` document. 