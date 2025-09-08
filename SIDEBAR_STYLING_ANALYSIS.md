# Sidebar Styling Definitions Analysis

This document provides a comprehensive analysis of all sidebar styling definitions in the Exam Tracker V2 project, organized by component and functionality.

## CSS Variables

### Color Variables
```css
--sidebar: oklch(0.205 0 0); /* Background color */
--sidebar-foreground: oklch(0.985 0 0); /* Text color */
--sidebar-primary: oklch(0.488 0.243 264.376); /* Primary color */
--sidebar-primary-foreground: oklch(0.985 0 0); /* Primary text color */
--sidebar-accent: oklch(0.269 0 0); /* Accent color */
--sidebar-accent-foreground: oklch(0.985 0 0); /* Accent text color */
--sidebar-border: oklch(1 0 0 / 10%); /* Border color */
--sidebar-ring: oklch(0.556 0 0); /* Ring/focus color */
```

### Sizing Variables
```css
--sidebar-width: 280px; /* Expanded sidebar width */
--sidebar-width-icon: 4rem; /* Collapsed sidebar width */
```

## Component Structure

### Sidebar Wrapper
- **Selector**: `[data-slot="sidebar-wrapper"]`
- **Purpose**: Main container for the sidebar
- **Key Styles**: 
  - Uses `--sidebar` background color
  - Full viewport height

### Sidebar Container
- **Selectors**: `[data-slot="sidebar-container"]`, `[data-slot="sidebar-gap"]`
- **Purpose**: Fixed positioning container for sidebar content
- **Key Styles**:
  - Fixed positioning with smooth transitions
  - Responsive width based on state (expanded/collapsed)
  - Handles different variants (floating, inset, sidebar)

### Sidebar Inner
- **Selector**: `[data-slot="sidebar-inner"]`
- **Purpose**: Direct container for sidebar content
- **Key Styles**:
  - Flex column layout
  - Full height with scrollable content
  - Uses sidebar background color

## Layout Components

### Sidebar Header
- **Selector**: `[data-slot="sidebar-header"]`
- **Purpose**: Top section of sidebar (typically user info)
- **Key Styles**:
  - Padding adjustments based on state
  - Center alignment when collapsed
  - Enhanced visibility in dark mode

### Sidebar Footer
- **Selector**: `[data-slot="sidebar-footer"]`
- **Purpose**: Bottom section of sidebar (settings, theme toggle)
- **Key Styles**:
  - Special handling for buttons (larger size)
  - Center alignment when collapsed
  - Flex layout for content centering

### Sidebar Content
- **Selector**: `[data-slot="sidebar-content"]`
- **Purpose**: Scrollable area between header and footer
- **Key Styles**:
  - Flex layout with scrollable overflow
  - Takes available vertical space

### Sidebar Group
- **Selector**: `[data-slot="sidebar-group"]`
- **Purpose**: Logical sections within sidebar content
- **Key Styles**:
  - Padding adjustments based on collapse state
  - Flexible width handling

### Sidebar Group Label
- **Selector**: `[data-slot="sidebar-group-label"]`
- **Purpose**: Headers for sidebar groups
- **Key Styles**:
  - Uppercase text with letter spacing
  - Reduced opacity for subtle appearance
  - Smooth animations for text hiding/showing
  - Special centering when sidebar is collapsed

### Sidebar Group Content
- **Selector**: `[data-slot="sidebar-group-content"]`
- **Purpose**: Container for group items
- **Key Styles**:
  - Horizontal padding
  - Padding adjustments when collapsed

## Menu Components

### Sidebar Menu
- **Selector**: `[data-slot="sidebar-menu"]`
- **Purpose**: Container for menu items
- **Key Styles**:
  - Flex column layout
  - No gaps between items

### Sidebar Menu Item
- **Selector**: `[data-slot="sidebar-menu-item"]`
- **Purpose**: Individual menu items
- **Key Styles**:
  - Relative positioning
  - Group styling context

### Sidebar Menu Button
- **Selector**: `[data-slot="sidebar-menu-button"]`
- **Purpose**: Interactive buttons for navigation
- **Key Styles**:
  - Rounded corners with margin
  - Specific height constraints (2rem normally, 3rem in footer)
  - Left padding adjustments
  - Center alignment when sidebar is collapsed
  - Smooth transitions for state changes

### Sidebar Menu Action
- **Selector**: `[data-slot="sidebar-menu-action"]`
- **Purpose**: Additional actions associated with menu items
- **Key Styles**:
  - Absolute positioning (top right)
  - Hidden when sidebar is collapsed
  - Hover effects with accent colors

### Sidebar Menu Sub
- **Selector**: `[data-slot="sidebar-menu-sub"]`
- **Purpose**: Nested menu items (submenus)
- **Key Styles**:
  - Indented from parent
  - Hidden when sidebar is collapsed

## State-Based Styling

### Collapsed State
When the sidebar is in icon mode and collapsed:
- Text elements smoothly transition to hidden state
- Icons are centered
- Width reduces to `--sidebar-width-icon`
- Padding is reduced for compact appearance

### Mobile State
- Uses separate width variables
- Different height constraints for touch targets
- Special handling for small screens

### Dark Mode
- Enhanced text shadows for better visibility
- Adjusted color contrasts
- Special handling for group labels

## Animation and Transitions

### Text Animation
- Smooth hiding/showing of text when collapsing/expanding
- Transition properties: `opacity`, `transform`, `max-width`
- Duration: 0.2s with linear easing

### Layout Transitions
- Width changes with 0.2s ease-linear transition
- Position changes with 0.2s ease-linear transition
- Smooth state transitions for all interactive elements

## Responsive Design

### Small Screens
- Font size adjustments
- Touch target size increases
- Special padding considerations

### Large Screens
- Consistent sizing
- Smooth transitions
- Proper spacing

## Special Considerations

### Accessibility
- Focus rings with `--sidebar-ring` color
- Proper contrast ratios
- Keyboard navigation support

### Performance
- Hardware-accelerated transforms
- Optimized transitions
- Efficient repaints

## Customization Points

### Width Customization
- Modify `--sidebar-width` for expanded state
- Modify `--sidebar-width-icon` for collapsed state

### Color Customization
- All color variables can be overridden
- Separate light/dark mode definitions

### Behavior Customization
- Collapse behavior controlled via data attributes
- Variant styling (floating, inset, sidebar)