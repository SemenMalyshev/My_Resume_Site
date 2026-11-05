# Portfolio

Static GitHub Pages portfolio. No build step or installed packages are required.

- `index.html` contains the Russian page; `en.html` contains the English page.
- Styles and interaction scripts are shared. Update both pages when editing content.
- `js/language.js` handles language selection and translated runtime messages.
- `assets/images/SOURCES.md` records image provenance.

## Language behavior

Direct Russian link: `/?lang=ru`. Direct English link: `/en.html`.
Selection priority is an explicit language URL, a saved manual selection, then
the first supported browser language. Other languages fall back to English.
The header switcher saves the manual selection and preserves the section anchor.
Country or precise location is not requested.

## Local checks

Serve the directory over HTTP to preview the pages and the Unity WebGL demo.
Run the dependency-free structural and language checks with:

```sh
node tests/site-check.cjs
```

MapPinner loads its WebGL build only when launched. Its source viewer retrieves
the selected file from the public GitHub repository when expanded. Gameplay
recordings use the original Rutube embeds.
