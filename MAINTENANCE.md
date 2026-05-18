# Maintenance Guide

This document outlines the routine tasks required to keep the SCSS Color Palettes library healthy and consistent.

## Routine Audit Checklist

Since this project does not currently use automated linting, maintainers should perform manual audits periodically (e.g., every time a new palette is added).

### 1. File Integrity Check
- [ ] Does every `.scss` file follow the naming convention (`Title Case.scss`)?
- [ ] Is there a valid `Coolors.co` link in the header comment?
- [ ] Are all six required sections present?
    1. CSS HEX
    2. CSS HSL
    3. SCSS HEX
    4. SCSS HSL
    5. SCSS RGB
    6. SCSS Gradient

### 2. Variable Consistency
- [ ] Do the variable names match across HEX, HSL, and RGB sections?
- [ ] Are the color values mathematically consistent? (Check a few samples to ensure HEX and HSL represent the same color).

### 3. Gradient Completeness
- [ ] Are all 9 standard gradient variables defined?
- [ ] Do the gradients include all colors from the palette in the correct order?

### 4. Documentation Update
- [ ] Is the new palette listed in the `Key Files` section of `GEMINI.md`?
- [ ] Has the `CHANGELOG.md` been updated with the new addition?

## Troubleshooting

If you find a palette with inconsistent values or missing sections:
1.  Verify the source URL from the header comment.
2.  Regenerate the missing or incorrect values using a tool like Coolors.co or an online color converter.
3.  Update the file and commit the fix.
