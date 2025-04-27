### Graph Visualization

The Beaver platform features graph-based visualizations to represent components and their relationships. The design aims for clarity, intuitive navigation, and a professional appearance aligned with architectural documentation standards.

#### Graph Design Specifications

- **Nodes**:
  - **Shape**: Circular container with a solid or outlined border.
  - **Size**: Standardized diameter between 48px and 64px.
  - **Iconography**:
    - Centered contextual icons (e.g., Cloud for Internet, Firewall for security).
    - Icons must follow the platform's visual consistency: outlined or filled, not mixed.
  - **Labeling**:
    - Displayed directly under each node.
    - Font: Sans-serif, medium weight, 14-16px size, dark gray (#333333).
    - Labels should avoid wrapping; truncate long names with tooltips on hover.
  - **Interaction States**:
    - **Hover**: Subtle outer glow or border color change.
    - **Selected**: Thicker border (2-3px), node slightly enlarged (scale 1.05x).

- **Edges (Connections)**:
  - **Style**:
    - Solid lines with directional arrows.
    - Line thickness: 2px standard; highlight with 3px on selection.
  - **Color**:
    - Default: Neutral Black (#000000).
    - Relationship Types: Dark Gray (#666666).
  - **Labels**:
    - Positioned near the middle of the line.
    - Font: Sans-serif, regular, 12px, medium gray (#666666).
    - Uppercase text for protocol/relationship type (e.g., "CONNECTS_TO").
  - **Arrowheads**:
    - Small, solid, and unobtrusive.
    - Cleanly aligned with the target node.

- **Layout and Positioning**:
  - Use a force-directed or hierarchical top-down layout depending on relationship context:
  - Edges should minimize crossings for better readability.
  - Default padding of 80px between nodes.

- **Controls and Interaction**:
  - **Zoom and Pan**:
    - Zoom-in and zoom-out (+ / - buttons) positioned bottom-right.
    - Pan using mouse drag or touchscreen swipe.
  - **Reset View**:
    - Button to center and fit the full graph to the viewport.
  - **Download**:
    - Option to export the current graph view as an image or PDF.
  - **Dynamic Updates**:
    - Nodes and edges should animate gracefully when updated.

- **Performance Optimizations**:
  - Smooth rendering with support for up to 200 nodes and 400 edges without perceptible lag.
  - Progressive loading strategies for very large graphs.

- **Responsive Behavior**:
  - Graph automatically scales and repositions based on viewport size.
  - On mobile devices (width < 640px):
    - Node labels may hide and appear on hover/tap.
    - Prioritize the visibility of main components.
