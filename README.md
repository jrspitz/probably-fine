# probably-fine

**Live deployment:** https://jrspitz.github.io/probably-fine/

A mashup of two things:

- **Question Hound** — the "This is fine." dog from KC Green's web comic, [_Gunshow_](https://kcgreendotcom.com/).
- **Matthias Müller's Eulerian fluid fire simulator** — from his [Ten Minute Physics](https://matthias-research.github.io/pages/tenMinutePhysics/index.html) series.

The hound sits in a burning room, and the fire is a real-time grid-based fluid simulation: advection, pressure projection, and buoyancy, with the temperature field driving the flames. Fan the flames with your coffee while everything stays (mostly) fine.

## Credits

- Comic and characters: [KC Green](https://kcgreendotcom.com/) — [_Gunshow_](https://kcgreendotcom.com/), "This is fine." (2013). Question Hound is KC Green's creation.
- Fluid simulation technique: [Matthias Müller](https://matthias-research.github.io/pages/tenMinutePhysics/index.html), Ten Minute Physics — the fire simulation is based on his Eulerian fluid solver.

This project and is not affiliated with or endorsed by either creator.

## Running it locally

```bash
npm install
npm run dev
```

Then open the URL Vite prints.

Production build:

```bash
npm run build
npm run preview
```

## Controls

- **Settings** button (top right) opens the menu:
  - **Hot Floor** / **Hot Cup** — toggle the heat sources.
  - **Temperature Legend** — show the color scale.
  - **Turbulent Swirls** — add swirls to the velocity field.
  - **Swirl Probability** — how often new swirls spawn.
  - **Background** — None, Checkers, Image, or Video.
- **Drag** on the canvas to move the cup and stir the fluid.
- **P** — pause/resume.
- **M** — step one frame.
