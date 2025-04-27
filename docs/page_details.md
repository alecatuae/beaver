# Page Details

## Main Pages

### Architecture Overview
- **Description**: This page allows users to view and interact with the enterprise architecture graph. It uses Cytoscape.js to render nodes and edges, offering layouts such as cola (force-directed), concentric, and breadth-first.

- **Features**:
  - Interactive graph visualization.
  - Native filters by environment, domain, and criticality.
  - Temporal queries support via `valid_from` and `valid_to`.

### ADR Management
- **Description**: Dedicated page for managing Architectural Decision Records (ADRs).
- **Features**:
  - Creation and editing of ADRs.
  - Full diff and rollback capabilities.
  - Integration with impact workflow for comments and merges.

### Impact Workflow
- **Description**: Facilitates the impact workflow, allowing architects to manage changes.
- **Features**:
  - Draft, visual diff, comments, and merge by architect role.

### Glossary
- **Description**: Provides an embedded dictionary with tag support.
- **Features**:
  - Autocomplete terms with `#tag`.
  - Hover-card definitions.
  - Bulk tagging and search support via API.

## Administration Pages

### User Management
- **Description**: Admin page for managing user accounts and roles.
- **Features**:
  - Create, read, update, and delete (CRUD) operations for users.
  - Role assignment and management.

### System Settings
- **Description**: Allows administrators to configure system-wide settings.
- **Features**:
  - Configuration of application settings.
  - Monitoring and logging settings.

## Authentication Pages

### Login
- **Description**: Page for user authentication.
- **Features**:
  - Secure login with JWT authentication.
  - Password recovery and reset options.

### Registration
- **Description**: Allows new users to register for an account.
- **Features**:
  - User registration form.
  - Email verification process.

## CRUD Operations

### Component Management
- **Description**: Page for managing software components.
- **Features**:
  - CRUD operations for components.
  - Association of components with ADRs and other entities.

### Team Management
- **Description**: Manage teams within the organization.
- **Features**:
  - CRUD operations for teams.
  - Team role and permission management.

## Conclusion
This document provides a detailed overview of the main pages within the Beaver application, including administrative and authentication functionalities. For more detailed information, refer to the `Architecture_v1.2_en_us.md` document. 