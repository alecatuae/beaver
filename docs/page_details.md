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
  - Interactive form with field validations:
    - Required name and description fields
    - Description field limited to 256 characters with visual counter
    - Dynamic tag management with add/remove capabilities
    - Status selection (Active, Inactive, Deprecated)
  - Real-time list updates after create, edit, or delete operations
  - Modal-based interface for detail viewing and editing
  - Responsive card-based layout:
    - Fixed-height component cards (180px) for consistent visual presentation
    - Intelligent text truncation for long names and descriptions
    - Limited tag display (up to 3) with counter for additional tags
    - Compact date display format
    - Status indication with color-coded badges
  - Performance optimized interface:
    - Infinite scroll implementation loading 12 components initially
    - Additional components load automatically (8 at a time) when scrolling down
    - Intersection Observer API used for efficient detection of scroll position
    - Visual loading indicator for transparency during data fetching
    - Responsive grid layout adapting to different screen sizes (1, 2, or 3 columns)
  - Improved user protection and experience:
    - Confirmation dialog for deletion operations to prevent accidental data loss
    - Clear warning about irreversible actions
    - Consistent button placement and styling in confirmation dialogs
    - Ability to cancel deletion operations

### Team Management
- **Description**: Manage teams within the organization.
- **Features**:
  - CRUD operations for teams.
  - Team role and permission management.

## Conclusion
This document provides a detailed overview of the main pages within the Beaver application, including administrative and authentication functionalities. For more detailed information, refer to the `Architecture_v1.2_en_us.md` document. 