# Beaver Platform UI/UX Style Guide

This comprehensive UI/UX style guide documents the design standards, principles, and implementation guidelines for the Beaver platform. It serves as a reference for designers, developers, and stakeholders involved in the platform's ongoing development and maintenance.

## Table of Contents

1. [Introduction](#introduction)
2. [Design Principles](#design-principles)
3. [Visual Design](#visual-design)
   - [Typography](#typography)
   - [Color Palette](#color-palette)
   - [Spacing and Layout](#spacing-and-layout)
   - [Iconography](#iconography)
   - [Shadows and Depth](#shadows-and-depth)
4. [Component Guidelines](#component-guidelines)
   - [Navigation and Sidebar](#navigation-and-sidebar)
   - [Header](#header)
   - [Content Area](#content-area)
   - [Details Panel](#details-panel)
   - [Footer](#footer)
   - [Buttons and Controls](#buttons-and-controls)
   - [Forms and Inputs](#forms-and-inputs)
   - [Architecture Diagram](#architecture-diagram)
5. [Interaction Patterns](#interaction-patterns)
   - [States and Feedback](#states-and-feedback)
   - [Loading States](#loading-states)
   - [Responsive Design](#responsive-design)
6. [Accessibility Guidelines](#accessibility-guidelines)
7. [Appendix](#appendix)

## Introduction

The Beaver platform is designed to support architecture and engineering teams by providing tools for architectural documentation, decision record management, and impact analysis. This style guide ensures that the user interface remains consistent, intuitive, and aligned with best practices in UX/UI design.

## Design Principles

Our design follows these core principles:

1. **Visual Consistency**: Maintain uniform typography, border styles, icons, and buttons across all screens.

2. **Clear Hierarchy**: Prioritize important elements visually and use differentiated font weights to establish a clear information hierarchy.

3. **Focus on Readability**: Ensure minimum font size of 16px and maintain a contrast ratio of at least 4.5:1 between text and background.

4. **Immediate Feedback**: Provide visual cues for user actions through animations, loading indicators, and state changes.

5. **Obvious Priority Actions**: Distinguish primary buttons from secondary actions to guide users toward main tasks.

6. **Minimalism Oriented to Function**: Include only visual elements that serve a clear purpose in helping users achieve their goals.

7. **Intuitive Navigation**: Create predictable navigation patterns that align with user expectations.

8. **Accessible Design**: Ensure the interface is usable by people with varying abilities and needs.

## Visual Design

### Typography

- **Font Family**: Use a modern sans-serif font (Inter, Roboto, or Poppins)
- **Size Hierarchy**:
  - Main Titles (H1): 24-32px
  - Section Titles (H2): 20-24px
  - Subsection Titles (H3): 18-20px
  - Menu Items: 16-18px
  - Body Text: 16px
  - Auxiliary Text: 12-14px
- **Weight Usage**:
  - Bold (600/700) for titles and emphasis
  - Medium (500) for subtitles and important elements
  - Regular (400) for body text and general content

### Color Palette

- **Primary Color**: Purple (#7839EE)
  - Used for active/interactive elements, highlighting, and primary actions
  - Variations: Light (#9A6CF4), Dark (#5B20C2)

- **Neutral Colors**:
  - Background: White (#FFFFFF)
  - Sidebar Background: Light Gray (#F1F1F5)
  - Text: Dark Gray (#333333)
  - Secondary Text: Medium Gray (#666666)
  - Borders: Light Gray (#DDDDDD)

- **Functional Colors**:
  - Success: Green (#34C759)
  - Warning: Amber (#FFC107)
  - Error: Red (#FF3B30)
  - Info: Blue (#2196F3)

### Spacing and Layout

- **Grid System**: 
  - Three-column layout for complex interfaces
  - 8px base unit (follow 8pt grid principles)
  - Section proportions: Navigation (20-25%), Content (50-60%), Details (20-25%)

- **Spacing Units**:
  - Extra Small: 4px
  - Small: 8px
  - Medium: 16px
  - Large: 24px
  - Extra Large: 32px
  - XX Large: 48px

- **Container Padding**:
  - Cards and Panels: 16px
  - Main Sections: 24px
  - Form Fields: 12px horizontal, 8px vertical

### Iconography

- **Style**: Consistent style throughout (either all outlined or all filled)
- **Size**: 
  - Standard UI icons: 20-24px
  - Feature icons: 24-32px
  - Small indicators: 16px
- **Spacing**: Minimum 8px distance between icon and associated text
- **Usage**: Icons should be contextually relevant to their function

### Shadows and Depth

- **Depth Levels**:
  - Level 1 (subtle): `box-shadow: 0px 1px 2px rgba(0,0,0,0.05)`
  - Level 2 (medium): `box-shadow: 0px 2px 4px rgba(0,0,0,0.1)`
  - Level 3 (pronounced): `box-shadow: 0px 4px 8px rgba(0,0,0,0.15)`

- **Border Radius**: 
  - Standard elements: 8px
  - Buttons: 8px
  - Small elements: 4px
  - Pills/tags: 16px or fully rounded

## Component Guidelines

### Navigation and Sidebar

- **Width**: 240-260px (expanded), 64-80px (collapsed)
- **Background**: Slightly darker than main content area
- **Layout**:
  - App logo at top (with text when expanded)
  - Vertical menu with items grouped by function
  - Each menu item includes an icon and label
  - Active item highlighted with background color, left indicator, and stronger typography
  - Theme toggle control at bottom

- **States**:
  - Default: Regular weight text, standard icon
  - Hover: Subtle background highlight
  - Active: Filled background, high-contrast text, indicator bar
  - Disabled: Reduced opacity

### Header

- **Height**: 56-64px
- **Layout**:
  - Environment selector dropdown
  - Page title (below header or part of header)
  - Quick action icons (settings, notifications)
  - User profile/account access
  - Optional: search functionality

- **Behavior**:
  - Fixed position when scrolling
  - Consistent across all pages
  - Clear visual separation from content area

### Content Area

- **Background**: White (#FFFFFF)
- **Padding**: 24px
- **Layout**:
  - Clean, organized presentation of primary content
  - Clear section headings
  - Adaptive width based on viewport
  - Scrollable when content exceeds viewport height

- **For Architecture Diagram**:
  - Central focus on diagram visualization
  - Component connections clearly labeled
  - Visual distinction between node types
  - Directional indicators on connections
  - Side toolbar with interaction controls

### Component Cards

- **Dimensions**:
  - Fixed height: 180px
  - Flexible width based on container
  - Padding: 16px (1rem)

- **Layout**:
  - Flexbox-based with column direction
  - Header: Component name (truncated if needed) with status tag
  - Body: Description text limited to 2 lines with ellipsis
  - Footer: Tags (max 3 visible with counter) and creation date

- **Text Handling**:
  - Component name: Truncate with ellipsis if exceeds 70% of card width
  - Description: Line clamp to 2 lines with ellipsis
  - Tags: Truncate individual tags if longer than container
  - Date format: Compact format (DD/MM/YYYY)

- **Visual Design**:
  - Border radius: 8px (rounded-lg)
  - Shadow: Subtle shadow for depth
  - Hover state: Primary color border highlight
  - Tags: Maximum 3 visible with counter for additional
  - Status indicators: Color-coded pills (Active: green, Inactive: amber, Deprecated: red)

### Details Panel

- **Width**: 320-360px (can be collapsible)
- **Layout**:
  - Search/filter functionality at top
  - Categorized information in collapsible sections
  - Component metadata in key-value format
  - Clear section headings
  - Compact presentation of detailed information
  - Modal actions (buttons) should be placed at the bottom with consistent spacing (gap-4)
  - Avoid duplicate action buttons (Edit/Delete) in different parts of the same modal

- **Interactions**:
  - Expand/collapse sections
  - Quick filters for information types
  - Direct relationship to selected content in main area
  - Close button should be positioned in the top-right corner as an icon (✕) without label
  - Action buttons at the bottom should follow platform-wide color and style conventions

### Footer

- **Height**: 80-100px
- **Background**: Light gray, visually separated from content
- **Layout**:
  - Two-column structure
  - Left: Logo, copyright, developer credits
  - Right: Quick links organized by category
  - All text properly aligned and sized for readability

### Buttons and Controls

- **Primary Buttons**:
  - Background: Primary color
  - Text: White
  - Padding: 8px 16px (minimum)
  - Height: 36-40px
  - Border-radius: 8px
  - Hover effect: Slight darkening of background

- **Secondary Buttons**:
  - Background: Transparent or light gray
  - Border: 1px solid (color varies by context)
  - Text: Same as border color
  - Same dimensions as primary buttons
  - Hover effect: Slight background fill

- **Tertiary/Text Buttons**:
  - No background or border
  - Text: Primary color or context-appropriate
  - Underline on hover

- **Icon Buttons**:
  - Square or circular background
  - Consistent padding (usually 8px)
  - Clear hover state
  - Optional tooltip for clarity

### Forms and Inputs

- **Text Inputs**:
  - Height: 36-40px
  - Padding: 8px 12px
  - Border: 1px solid border color
  - Border-radius: 4-8px
  - Focus state: Primary color highlight
  - Error state: Error color highlight with message

- **Textarea Inputs**:
  - Padding: 12px
  - Border: 1px solid border color
  - Border-radius: 4-8px
  - Description fields: Maximum 256 characters with visual counter
  - Character counter: Shows remaining characters
  - Warning state: Counter turns red when 20 or fewer characters remain
  - Error state: Border changes to error color with descriptive message

- **Dropdowns**:
  - Similar styling to text inputs
  - Clear indicator for expandability
  - Consistent styling of dropdown options
  - Active/selected state highlighted

- **Checkboxes and Radio Buttons**:
  - Custom styling matching overall design language
  - Clear active/selected states
  - Appropriate spacing with labels

### Architecture Diagram

- **Nodes**:
  - Circular containers with contextual icons
  - Consistent size (40-64px diameter)
  - Clear labels
  - Interactive hover and selection states

- **Connections**:
  - Directional arrows showing relationship flow
  - Protocol labels on connections
  - Line thickness indicating importance or type
  - Connection highlights on node selection

- **Controls**:
  - Zoom in/out buttons
  - Reset view option
  - Export/download functionality
  - Pan and direct manipulation capabilities

## Interaction Patterns

### States and Feedback

- **Hover States**: 
  - Subtle color change or shadow effect
  - Change in background tone
  - Transition: 0.2s ease

- **Active/Selected States**:
  - Clear visual distinction
  - Change in background, border, or text weight
  - Optional icon state change

- **Disabled States**:
  - Reduced opacity (usually 0.5-0.6)
  - Removal of hover effects
  - Cursor change to indicate non-interactivity

- **Feedback Messages**:
  - Success: Green background with confirmation text
  - Error: Red background with problem description and solution
  - Warning: Amber background with cautionary information
  - Information: Blue background with helpful context

### Loading States

- **Global Loading**: Centered spinner or progress bar when loading entire pages
- **Component Loading**: Inline indicators for specific content areas
- **Button Loading**: State change or spinner within button during action processing
- **Skeleton Screens**: Gray placeholder elements during content loading
- **Infinite Scroll Loading**:
  - Small centered spinner at the bottom of the list
  - Automatic loading of additional content when user reaches bottom of viewport
  - Initial batch of 12 items for immediate display
  - Subsequent batches of 8 items to maintain performance
  - Clear loading indicator using border animation
  - Non-intrusive design that doesn't block continuing to view loaded content

### Responsive Design

- **Breakpoints**:
  - Mobile: 320-639px
  - Tablet: 640-1023px
  - Desktop: 1024px and above

- **Behavior Changes**:
  - Sidebar collapses to icons-only on smaller screens
  - Two-column layout on tablet (sidebar + main content)
  - Three-column layout on desktop (sidebar + main content + details)
  - Footer stacks to single column on mobile

## Accessibility Guidelines

- **Color Contrast**: Maintain 4.5:1 minimum ratio between text and background
- **Focus States**: Visible focus indicators for keyboard navigation
- **Text Sizing**: Support browser text resizing up to 200%
- **Screen Readers**: Ensure all UI elements have appropriate ARIA labels
- **Keyboard Navigation**: All interactive elements must be accessible via keyboard
- **Touch Targets**: Minimum size of 44px × 44px for touch interfaces

## Appendix

- **File Naming Conventions**: Follow kebab-case for all design assets
- **Version Control**: Document all UI changes in the changelog
- **Design System Assets**: Link to Figma libraries and component repositories
- **Implementation Resources**: Links to code repositories and documentation

---

This style guide is a living document and will be updated as the Beaver platform evolves. All team members are encouraged to contribute to its ongoing refinement and improvement. 