# Portfolio

Static site for GitHub Pages. No build step.

## Publish
1. Create a repo named `Aniket-Padwekar.github.io` (user site) and push this folder's contents to `main`.
2. Settings > Pages > Source: `main` / root. The site is live at https://aniket-padwekar.github.io/

## Add a project
1. Open `assets/projects.js` and add one object at the top of the list (title, status, blurb, tags, href, cta).
2. If the project has its own page, create `projects/<name>/index.html` (copy `projects/youth-systems/index.html` as a start).
3. Commit and push. The home page card appears automatically.

## To check before publishing
- The 2. Bundesliga card links to https://aniket-padwekar.github.io/2.bundesliga-dashboard/ . Change `href` in `assets/projects.js` if the live URL differs.
- Add a LinkedIn link in the header nav of `index.html` if you want one.
