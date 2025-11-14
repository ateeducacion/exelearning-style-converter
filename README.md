# eXeLearning Style Converter (v2.9 → v3.0)

Automated tool to convert eXeLearning styles from version 2.9 to version 3.0.

## 🌐 Web Interface (Recommended)

**Use the online converter:** [https://ateeducacion.github.io/exelearning-style-converter/](https://ateeducacion.github.io/exelearning-style-converter/)

No installation needed! Simply:
1. Open the web interface in your browser
2. Upload your v2.9 style (folder or ZIP file)
3. Click "Convert"
4. Download the ZIP file
5. Import into eXeLearning 3.0

## Features

✅ **Web & CLI Interfaces** - Use in browser or command line
✅ **Intelligent Analysis** - Automatically detects style complexity and custom code
✅ **Automatic Template Selection** - Chooses the appropriate v3.0 template (base/neo/flux)
✅ **Code Preservation** - Preserves custom JavaScript (H5P, characters, phase management, etc.)
✅ **CSS Merging** - Combines and updates CSS files with automatic selector/path updates
✅ **Asset Organization** - Migrates assets to organized subdirectories (icons/, img/, fonts/)
✅ **Config.xml Update** - Converts metadata to v3.0 format
✅ **Validation** - Validates the converted output
✅ **Detailed Reports** - Generates comprehensive conversion reports
✅ **Dry Run Mode** - Preview changes without modifying files (CLI only)

## Installation

### For CLI Usage

```bash
# Clone or download this repository
cd exelearning-style-converter

# Install dependencies
npm install
```

### For Web Development

```bash
# Install dependencies
npm install

# Run development server
npm run dev

# Build for production
npm run build
```

## Usage

### Web Interface

The easiest way to use the converter is through the web interface:

1. **Visit the online tool** (after deployment):
   [https://ateeducacion.github.io/exelearning-style-converter/](https://ateeducacion.github.io/exelearning-style-converter/)

2. **Upload your v2.9 style**
   - **Option 1 (Folder):** Click the "Folder" tab and select your old style directory
   - **Option 2 (ZIP):** Click the "ZIP File" tab and select a ZIP file containing your style

3. **Convert**
   Click the "Convert Style" button and watch the progress

4. **Download**
   The ZIP file will download automatically when complete

5. **Import into eXeLearning 3.0**
   Go to Tools → Preferences → Styles → Import Style

### CLI Usage

#### Basic Usage

Convert a single style:

```bash
node cli.js --input styles-old/garden
```

### Create ZIP for eXeLearning 3.0 Import

Convert and create a ZIP file ready to import:

```bash
node cli.js --input styles-old/garden --zip
```

The ZIP file will be created in the results directory (e.g., `results/garden-3.0.zip`) and can be directly imported into eXeLearning 3.0.

### Dry Run (Preview)

Preview the conversion without writing files:

```bash
node cli.js --input styles-old/garden --dry-run
```

### Verbose Output

Show detailed progress:

```bash
node cli.js --input styles-old/cREAgal --verbose
```

### Combined Options

Create ZIP with verbose output:

```bash
node cli.js --input styles-old/cREAgal --zip --verbose
```

### Batch Conversion

Convert all styles in a directory:

```bash
node cli.js --batch styles-old/
```

### Custom Output Directory

Specify a different output directory:

```bash
node cli.js --input styles-old/garden --output converted-styles/
```

## Command Line Options

| Option | Alias | Description |
|--------|-------|-------------|
| `--input <path>` | `-i` | Input directory containing old style (v2.9) |
| `--output <dir>` | `-o` | Output directory for converted styles (default: `results`) |
| `--dry-run` | `-d` | Preview changes without writing files |
| `--verbose` | `-v` | Show detailed progress |
| `--zip` | `-z` | Create ZIP file ready for eXeLearning 3.0 import |
| `--batch <dir>` | `-b` | Convert all styles in a directory |
| `--help` | `-h` | Display help information |
| `--version` | `-V` | Display version number |

## How It Works

### 1. Analysis Phase

The tool analyzes the old style to determine:
- **Complexity level** (simple, moderate, complex)
- **Custom code patterns** (H5P, characters, phase management, etc.)
- **File structure** (JavaScript, CSS, assets, config.xml)
- **Template selection** (base for simple styles, neo for complex styles)

### 2. Transformation Phase

**JavaScript Transformation:**
- Loads the appropriate v3.0 template (base or neo)
- Extracts custom code from old JavaScript
- Integrates custom code into the new template
- Preserves important custom functions

**CSS Merging:**
- Combines `content.css` + `nav.css` → `style.css`
- Updates selectors (`.no-nav` → `.siteNav-off`, etc.)
- Updates asset paths (`icon.gif` → `icons/icon.gif`)

**Config.xml Update:**
- Removes deprecated fields (`extra-head`, `extra-body`, etc.)
- Adds required v3.0 fields (`title`, `downloadable`)
- Updates `compatibility` to 3.0

**Asset Migration:**
- Organizes files into subdirectories:
  - `.gif`, small `.svg` → `icons/`
  - `.png`, `.jpg`, `.jpeg`, large images → `img/`
  - `.woff`, `.woff2`, `.ttf`, `.eot`, `.otf` → `fonts/`

### 3. Validation Phase

The tool validates:
- File structure (required files exist)
- Config.xml format (valid XML, required fields present)
- JavaScript syntax (myTheme object, required functions)
- CSS (no old selectors remaining)

### 4. Report Generation

Generates two types of reports:
- **Console report** - Colorized summary displayed in terminal
- **Markdown report** - Detailed conversion report saved as `conversion-report.md`

## Conversion Tiers

### Tier 1: Simple Styles
**Examples:** garden, kyoiku, seamist, silver, slate, standardwhite, Kahurangi

**Process:**
- Uses `base` template
- Replaces old JavaScript entirely with v3.0 standard code
- Merges CSS files
- Migrates assets
- Updates config.xml

### Tier 2: Moderate Styles
**Examples:** Tknika

**Process:**
- Uses `base` template
- Preserves moderate custom code
- Same as Tier 1 with custom code integration

### Tier 3: Complex Styles
**Examples:** cREAgal

**Process:**
- Uses `neo` template (includes `movePageTitle()`)
- Preserves extensive custom code:
  - H5P iframe resizer
  - Character management
  - Phase management
  - printContent function
  - common.init function
- Integrates custom code after standard v3.0 code
- Comprehensive CSS merging (5000+ lines)

## Output Structure

After conversion, each style will have this structure:

```
results/
├── [style-name]/
│   ├── config.xml              # Updated to v3.0 format
│   ├── style.css               # Merged and updated CSS
│   ├── style.js                # Transformed JavaScript
│   ├── conversion-report.md    # Detailed conversion report
│   ├── icons/                  # Icon files (.gif, small .svg)
│   ├── img/                    # Image files (.png, .jpg, .jpeg)
│   └── fonts/                  # Font files (.woff, .woff2, .ttf)
└── [style-name]-3.0.zip        # Ready for eXeLearning 3.0 import (if --zip used)
```

**Note:** The ZIP file contains only the necessary files for eXeLearning (config.xml, style.css, style.js, and asset directories). The conversion-report.md is excluded from the ZIP as it's for developer reference only.

## Key Differences: v2.9 vs v3.0

### File Naming
- **Old:** `_style_js.js`, `_garden_js.js`, etc.
- **New:** `style.js` (standardized)

- **Old:** `content.css` + `nav.css` (separated)
- **New:** `style.css` (unified)

### JavaScript Structure

**Old v2.9:**
```javascript
var myTheme = {
    init: function() { ... },
    hideMenu: function() { ... },
    toggleMenu: function(e) { ... },
    param: function(e, act) { ... },
    params: function(act) { ... },
    reset: function() { ... }
};
```

**New v3.0:**
```javascript
var myTheme = {
    init: function() { ... },
    inIframe: function() { ... },
    searchForm: function() { ... },
    isLowRes: function() { ... },
    checkNav: function() { ... },
    param: function(e, act) { ... },
    params: function(act) { ... },
    movePageTitle: function() { ... } // neo/flux only
};

$.fn.isInViewport = function() { ... }; // New jQuery extension
```

### Menu Toggling

**Old:** jQuery animations (`slideUp`, `slideDown`)
**New:** CSS-based transitions (class toggle)

**Old:** Anchor tags (`<a href="#" id="toggle-nav">`)
**New:** Button elements (`<button id="siteNavToggler">`)

### Config.xml

**Removed:**
- `<extra-head>`
- `<extra-body>`
- `<edition-extra-head>`

**Added:**
- `<title>` - Human-readable title
- `<downloadable>` - Whether the style can be downloaded

**Updated:**
- `<compatibility>` - Changed from 2.9 to 3.0
- `<version>` - Updated to 2025 standard

## Limitations

1. **CSS Manual Review Required** - While the tool automatically updates many CSS selectors and paths, complex styles may require manual CSS review for:
   - Custom animations
   - Complex selectors
   - Style-specific adjustments

2. **JavaScript Custom Code** - The tool preserves custom code but doesn't refactor it to use v3.0 best practices. Complex custom code may need manual optimization.

3. **Asset Path Updates** - Asset paths in CSS are updated automatically, but hardcoded paths in HTML/JavaScript may need manual updates.

4. **Pre-existing Syntax Errors** - The tool preserves code as-is, including any pre-existing syntax errors from v2.9 styles.

## Troubleshooting

### Error: "Input path does not exist"
Make sure the path to your old style is correct:
```bash
node cli.js --input styles-old/your-style-name
```

### Warning: "Mismatched braces"
This warning usually indicates a pre-existing syntax issue in the original v2.9 code. Review the generated `style.js` and fix if necessary.

### Missing Assets
If assets are missing after conversion:
1. Check the `conversion-report.md` for migration details
2. Verify the original style had the assets
3. Check the appropriate subdirectory (`icons/`, `img/`, or `fonts/`)

## Examples

### Example 1: Convert garden (Simple Style)

```bash
$ node cli.js --input styles-old/garden --zip

╔════════════════════════════════════════════════════════════╗
║   eXeLearning Style Converter v2.9 → v3.0                 ║
╚════════════════════════════════════════════════════════════╝

============================================================
  eXeLearning Style Conversion Report
============================================================

Style Information:
  Name: garden
  Complexity: simple
  Template Used: base
  Lines of Code: 80

JavaScript Transformation:
  → Used standard v3.0 template (no custom code)

CSS Changes:
  Total Updates: 11

Asset Migration:
  Total Files: 29
    - icons/: 29 files

Validation Results:
  Status: ✓ PASSED
  Errors: 0
  Warnings: 0

✓ Conversion completed successfully!
  Output: results/garden
  ZIP: results/garden-3.0.zip
  Ready to import into eXeLearning 3.0!
============================================================
```

### Example 2: Convert cREAgal (Complex Style)

```bash
$ node cli.js --input styles-old/cREAgal --zip

============================================================
  eXeLearning Style Conversion Report
============================================================

Style Information:
  Name: cREAgal
  Complexity: complex
  Template Used: neo
  Lines of Code: 317

Custom Features Detected:
  ✓ H5P iframe resizer
  ✓ Character management
  ✓ Phase management
  ✓ printContent()
  ✓ common.init()

JavaScript Transformation:
  ✓ Preserved 4 custom code sections

CSS Changes:
  Total Updates: 61

Asset Migration:
  Total Files: 168
    - img/: 24 files
    - fonts/: 4 files
    - icons/: 140 files

Validation Results:
  Status: ✓ PASSED

✓ Conversion completed successfully!
  Output: results/cREAgal
  ZIP: results/cREAgal-3.0.zip
  Ready to import into eXeLearning 3.0!
============================================================
```

### Example 3: Importing into eXeLearning 3.0

Once you have the ZIP file, you can import it into eXeLearning 3.0:

1. Open eXeLearning 3.0
2. Go to **Tools → Preferences → Styles**
3. Click **Import Style**
4. Select the generated ZIP file (e.g., `results/garden-3.0.zip`)
5. The style will be available in your styles list

**ZIP Contents:**
- ✅ config.xml (v3.0 format)
- ✅ style.css (merged and updated)
- ✅ style.js (transformed with v3.0 API)
- ✅ icons/, img/, fonts/ (organized assets)
- ❌ conversion-report.md (excluded - for developer reference only)

## Contributing

This tool was created to automate the migration of eXeLearning styles from v2.9 to v3.0. Contributions are welcome!

## License

MIT

## Author

Ernesto

## Acknowledgments

Based on the analysis of official eXeLearning styles from versions 2.9 and 3.0.
