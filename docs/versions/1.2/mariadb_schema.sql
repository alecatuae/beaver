-- MariaDB Schema

-- Table: User
-- Stores user information and credentials.
CREATE TABLE User (
    id INT AUTO_INCREMENT PRIMARY KEY,  -- Unique identifier for each user
    username VARCHAR(255) NOT NULL,    -- Username of the user
    password_hash VARCHAR(255) NOT NULL, -- Hashed password for security
    email VARCHAR(255) NOT NULL,       -- Email address of the user
    role ENUM('admin', 'user', 'guest') NOT NULL, -- Role of the user in the system
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP -- Timestamp of user creation
);

-- Table: Team
-- Contains data about different teams within the organization.
CREATE TABLE Team (
    id INT AUTO_INCREMENT PRIMARY KEY,  -- Unique identifier for each team
    name VARCHAR(255) NOT NULL,        -- Name of the team
    description TEXT,                  -- Description of the team's purpose
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP -- Timestamp of team creation
);

-- Table: Category
-- Stores all possible categories for components.
CREATE TABLE Category (
    id INT AUTO_INCREMENT PRIMARY KEY,  -- Unique identifier for each category
    name VARCHAR(255) NOT NULL,        -- Name of the category
    description TEXT,                  -- Description of the category
    image VARCHAR(255),                -- Path to the image file (relative to /public/images/categories)
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP -- Timestamp of category creation
    -- Images are stored in the filesystem instead of in the database
);

-- Table: Component
-- Represents software components with associated metadata.
CREATE TABLE Component (
    id INT AUTO_INCREMENT PRIMARY KEY,  -- Unique identifier for each component
    name VARCHAR(255) NOT NULL,        -- Name of the component
    description TEXT,                  -- Description of the component
    status ENUM('active', 'inactive', 'deprecated') NOT NULL, -- Current status of the component
    category_id INT,                   -- Category of the component (FK)
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP, -- Timestamp of component creation
    FOREIGN KEY (category_id) REFERENCES Category(id)
);

-- Table: ADR
-- Architectural Decision Records with status and decision details.
CREATE TABLE ADR (
    id INT AUTO_INCREMENT PRIMARY KEY,  -- Unique identifier for each ADR
    title VARCHAR(255) NOT NULL,       -- Title of the ADR
    decision TEXT NOT NULL,            -- Decision details of the ADR
    status ENUM('proposed', 'accepted', 'rejected') NOT NULL, -- Current status of the ADR
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP -- Timestamp of ADR creation
);

-- Table: RoadmapItem
-- Tracks items on the development roadmap.
CREATE TABLE RoadmapItem (
    id INT AUTO_INCREMENT PRIMARY KEY,  -- Unique identifier for each roadmap item
    title VARCHAR(255) NOT NULL,       -- Title of the roadmap item
    description TEXT,                  -- Description of the roadmap item
    type ENUM('feature', 'bugfix', 'improvement') NOT NULL, -- Type of roadmap item
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP -- Timestamp of roadmap item creation
);

-- Table: Log
-- Records system and user activity logs.
CREATE TABLE Log (
    id INT AUTO_INCREMENT PRIMARY KEY,  -- Unique identifier for each log entry
    user_id INT,                       -- ID of the user associated with the log
    action VARCHAR(255) NOT NULL,      -- Description of the action performed
    timestamp TIMESTAMP DEFAULT CURRENT_TIMESTAMP, -- Timestamp of the log entry
    FOREIGN KEY (user_id) REFERENCES User(id) -- Foreign key linking to User table
);

-- Table: GlossaryTerm
-- Stores terms and definitions used across the application.
CREATE TABLE GlossaryTerm (
    id INT AUTO_INCREMENT PRIMARY KEY,  -- Unique identifier for each glossary term
    term VARCHAR(255) NOT NULL,        -- The glossary term
    definition TEXT NOT NULL           -- Definition of the glossary term
);

-- Table: ComponentTag
-- Tags associated with components.
CREATE TABLE ComponentTag (
    id INT AUTO_INCREMENT PRIMARY KEY,  -- Unique identifier for each component tag
    component_id INT,                  -- ID of the associated component
    tag VARCHAR(255) NOT NULL,         -- Tag for the component
    FOREIGN KEY (component_id) REFERENCES Component(id) -- Foreign key linking to Component table
);

-- Table: ADRTag
-- Tags specific to ADRs.
CREATE TABLE ADRTag (
    id INT AUTO_INCREMENT PRIMARY KEY,  -- Unique identifier for each ADR tag
    adr_id INT,                        -- ID of the associated ADR
    tag VARCHAR(255) NOT NULL,         -- Tag for the ADR
    FOREIGN KEY (adr_id) REFERENCES ADR(id) -- Foreign key linking to ADR table
); 