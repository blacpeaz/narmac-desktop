# Narmac Societe for Windows

A small Windows program that opens the Narmac Societe app (https://narmacsociete.netlify.app) in its own window.

**Download:** open the [Releases page](https://github.com/blacpeaz/narmac-desktop/releases/latest) and download `Narmac-Societe-Setup-….exe`.

The first time, Windows may say "Windows protected your PC" (the program is not signed with a paid certificate). Click **More info → Run anyway**.

## Updates

- The app's screens and figures always come from the website, so every change to the app shows up straight away.
- The program itself checks this page every few hours. When there is a newer version it downloads it quietly and installs it the next time the program is closed.

## Making a new version (for the developer)

1. Raise `"version"` in `package.json` (for example 1.0.1), commit and push to `main`.
2. GitHub builds the installer (about 5 minutes) and puts it on the Releases page as v1.0.1. Installed programs pick it up by themselves.

This folder holds no passwords or keys: it only opens the public web address.
