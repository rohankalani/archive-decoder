# Logo Setup Instructions

Three partner logos have been integrated across the application. Please add your logo files to the `public/logos/` directory.

## Required Logo Files

Place these three logo files in `public/logos/`:

1. **Abu Dhabi University Logo**
   - Filename: `abu-dhabi-university.svg` (or `.png`)
   - Path: `public/logos/abu-dhabi-university.svg`

2. **Arc Light Services Logo**
   - Filename: `arc-light-services.svg` (or `.png`)
   - Path: `public/logos/arc-light-services.svg`

3. **ROSAQI Logo**
   - Filename: `rosaqi.svg` (or `.png`)
   - Path: `public/logos/rosaqi.svg`

## Logo Specifications

### Recommended Format
- **SVG** is preferred (scales perfectly at any size)
- **PNG** is acceptable (minimum 200px height with transparent background)

### Design Requirements
- **Transparent background** (no white/colored boxes around logos)
- **Horizontal orientation** preferred
- **High resolution** if using PNG format
- **Dark mode compatible** (logos should be visible on both light and dark backgrounds)

## Logo Placements

The logos will appear in:

1. **Login/Auth Page** - Full size, prominently displayed at the top
2. **Application Header** - Compact size, visible on all pages (desktop only, hidden on small mobile)
3. **Mobile Navigation Menu** - Medium size at the top of the sidebar

## File Structure

```
public/
└── logos/
    ├── abu-dhabi-university.svg
    ├── arc-light-services.svg
    └── rosaqi.svg
```

## Fallback Behavior

The component automatically tries PNG format if SVG fails to load, so you can provide both formats if needed:
- `abu-dhabi-university.svg` + `abu-dhabi-university.png`
- `arc-light-services.svg` + `arc-light-services.png`
- `rosaqi.svg` + `rosaqi.png`

## Testing

After adding the logo files:
1. Refresh the application
2. Check the login page - logos should appear at the top
3. Log in and check the header - compact logos should appear next to the mobile menu
4. Open mobile navigation - logos should appear at the top of the sidebar
5. Test on both light and dark modes

## Need Help?

If logos don't appear:
- Check the browser console for 404 errors
- Verify file names match exactly (case-sensitive)
- Ensure files are in the correct directory (`public/logos/`)
- Check that images have transparent backgrounds
- Try clearing browser cache
