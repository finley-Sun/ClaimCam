# IWSDK Starter Template

This folder is a source template used by `scripts/generate-starters.cjs` to produce 8 runnable variants:

- `starter-<vr|ar>-<manual|metaspatial>-<ts|js>`

Do not run this template directly. The generator will:

- Copy a variant-specific `src/index.ts` (see `src/index-*.ts`).
- Install the matching Vite config from `configs/`.
- Keep only the required metaspatial folder (renamed to `metaspatial`).
- Prune unused assets and dev dependencies.

UI is defined in `ui/welcome.uikitml`; the Vite UIKitML plugin compiles it to `public/ui/welcome.json` during build in generated variants.


Here is the adapted README section:

---

## How to Run the Project

### 1. Start the Development Server

```bash
npm run dev
```

Vite will output a local URL, typically:
```
https://localhost:5173/
```

> If the server is already running in the background, skip this step.

---

### 2. Open in Browser

Navigate to the URL provided in the terminal (e.g. `https://localhost:5173/`).

> **Note:** Accept any certificate warnings — these are expected due to the local `mkcert` HTTPS setup.

The app will load a VR scene including a robot, interactive panels, a desk/plant environment, and audio.

---

### 3. Interact and Explore

**Desktop Mode**
- Click **"Enter XR"** in the UI panel to emulate VR
- **WASD** — movement
- **Mouse** — look and click
- IWSDK provides built-in controls for locomotion and grabbing

**VR Mode**
- Ensure WebXR is enabled in your browser settings
- Connect your headset and enter the immersive session

> The UI is defined in `welcome.uikitml` and compiled to `welcome.json`. The project also includes Claude integration via `@iwsdk/vite-plugin-dev` for AI-assisted debugging and inspection.

---

### 4. Stop the Server

```bash
Ctrl+C
```

---

> **Troubleshooting:** If you encounter port conflicts or browser errors, re-run `npm run dev` in a fresh terminal and check the output for details.