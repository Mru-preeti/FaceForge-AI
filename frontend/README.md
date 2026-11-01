# FaceForge AI Frontend

React, Vite, Tailwind CSS, and Lucide icons power the portrait studio interface.

## Run locally

```powershell
cd frontend
npm install
npm run dev
```

Use `npm run build` for a production build and `npm run lint` for Oxlint.

## Current scope

The prompt editor, supported-attribute list, example prompts, preview state, and download control are implemented. Example prompts are labeled as examples; they are not generation history or generated images. Until a model service is connected, Generate reports that no image was created and Download remains disabled.

The eight supported attributes are Brown_Hair, Black_Hair, Blond_Hair, Gray_Hair, Smiling, Eyeglasses, Wearing_Hat, and Heavy_Makeup.

## Model integration boundary

No checkpoint path, model architecture, attribute parser, or inference endpoint has been assumed. Inspect the actual checkpoint and inference code before implementing the Python service or connecting generation. Backend, AI service, and MongoDB setup are outside this frontend-first pass.
