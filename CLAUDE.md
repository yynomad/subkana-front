# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

Subkana Front is a Chrome browser extension that provides Japanese morphological tokenization for YouTube subtitles. It detects Japanese text in captions and displays tokenized versions when users hover over the text.

## Development Setup

This is a vanilla JavaScript Chrome extension with no build process.

### Loading the Extension
```bash
# In Chrome:
# 1. Go to chrome://extensions/
# 2. Enable "Developer mode"
# 3. Click "Load unpacked"
# 4. Select this repository directory
```

### Development Workflow
- Edit files directly in the repository
- After making changes, reload the extension in Chrome Extensions page
- Test on YouTube videos with Japanese subtitles

## Architecture

### Core Components

**`manifest.json`** - Chrome extension configuration
- Defines content script injection for YouTube
- Maps content.js and style.css to youtube.com

**`content.js`** - Main extension logic
- `tokenize(text)`: Sends text to backend API for morphological analysis
- `createBubble()`: Creates floating tooltip DOM element
- `showBubble(text)`: Displays tokenized text with mouse-following behavior
- `hideBubble()`: Hides tooltip and cleans up event listeners
- `observeCaptions()`: Monitors DOM for YouTube caption elements using MutationObserver

**`style.css`** - Tooltip styling
- Fixed positioning with high z-index (10000)
- Dark semi-transparent theme with rounded corners
- Mouse-following bubble for token display

### External Dependencies
- Backend API: `https://japanese-tokenizer.onrender.com/tokenize`
- Performs Japanese morphological analysis
- Returns tokenized text separated by "｜" character
- Extension gracefully degrades if API is unavailable

## Key Implementation Details

### Caption Detection Strategy
- Uses MutationObserver to detect DOM changes
- Multiple CSS selectors for YouTube captions (handles YouTube's changing DOM structure)
- Prevents duplicate event handlers using `dataset.jpHooked` marker
- Japanese character detection with regex `/[一-鿿ぁ-んァ-ヶ]/`

### Event Handling
- Mouse enter/leave events on caption segments trigger show/hide
- Mouse move events make tooltip follow cursor
- Proper cleanup of event listeners to prevent memory leaks

### Error Handling
- Network failures fall back to displaying original text
- Console logging for debugging API issues
- Graceful degradation when backend is unavailable

## Testing

No automated testing framework is used. Testing involves:
1. Loading extension in Chrome
2. Playing YouTube videos with Japanese subtitles
3. Hovering over Japanese text to verify tokenization
4. Testing edge cases (network failures, non-Japanese text, etc.)

## Common Modifications

- **Caption selectors**: Update selector array in `observeCaptions()` if YouTube changes DOM structure
- **Styling**: Modify `style.css` for tooltip appearance changes
- **API endpoint**: Change `API_URL` constant if backend service moves
- **Japanese detection**: Update regex in content script if needed

## Limitations

- Only works on YouTube (hardcoded URL match in manifest)
- Requires external API service for tokenization
- Dependent on YouTube's DOM structure (may break with YouTube updates)
- No offline functionality