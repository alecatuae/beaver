# MariaDB Schema

## Introduction
This document outlines the data schema for the MariaDB database used in the Beaver application. It is designed to support the application's architecture and functionality as described in the `Architecture_v1.2_en_us.md` document.

## Tables and Models
- **User**: Stores user information and credentials.
- **Team**: Contains data about different teams within the organization.
- **Component**: Represents software components with associated metadata.
- **ADR**: Architectural Decision Records with status and decision details.
- **RoadmapItem**: Tracks items on the development roadmap.
- **Log**: Records system and user activity logs.
- **Category**: Stores all possible categories for components, including name, description, and an image (PNG or SVG, max 256x256px).

## Enums
- **Role**: Defines user roles within the application.
- **Env**: Specifies different environments (e.g., development, production).
- **Status**: Indicates the current status of components and ADRs.
- **RoadmapType**: Categorizes roadmap items.
- **ADRStatus**: Tracks the status of ADRs.

## Glossary Tables
- **GlossaryTerm**: Stores terms and definitions used across the application.
- **ComponentTag**: Tags associated with components.
- **RelationshipTag**: Tags for relationships between components.
- **ADRTag**: Tags specific to ADRs.

### Category Table
- **id**: Unique identifier for each category
- **name**: Name of the category
- **description**: Description of the category
- **image**: Path to the image file (relativo ao /public/images/categories)
- **created_at**: Timestamp of category creation

**Nota:** As imagens são armazenadas no sistema de arquivos em vez de no banco de dados, com o campo `image` apenas armazenando o caminho relativo.

## Conclusion
This schema provides a comprehensive overview of the data structure for the MariaDB database, ensuring it supports the application's needs effectively. For more detailed information, refer to the `Architecture_v1.2_en_us.md` document. 