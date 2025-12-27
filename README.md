Opening (20–30 seconds)

“Hi, this is my CM2030 Graphics Programming assignment.

In this project, I developed an interactive snooker application using p5.js for rendering and Matter.js for physics.

I’ll walk through the table design, physics implementation, interaction controls, the three game modes, the animation effects, and finally my creative extension.”

1. Table Design & Dimensions (30–40 seconds)

“I’ll start with the snooker table design.

The table is drawn at the center of the canvas and follows the correct 2:1 ratio, where the table width is half the table length.

Ball size is calculated using the formula ball diameter = table width / 36, and pocket size is set to 1.5 times the ball diameter, matching real snooker proportions.

I’ve included all six pockets, the baulk line, and the ‘D’ zone, using appropriate colours to match a real snooker table.”

(Briefly point to pockets, baulk line, D zone)

2. Physics with Matter.js (30–40 seconds)

“All balls and cushions use Matter.js physics.

The balls have restitution for realistic bouncing and air friction so they gradually slow down.

The cushions are implemented as static bodies with different restitution values from the balls, which allows balls to rebound naturally off the table edges.

Gravity is disabled to simulate a flat snooker table.”

(Hit a ball lightly to show rebound)

3. Cue Ball Placement (30 seconds)

“At the start, the cue ball must be manually placed inside the ‘D’ zone.

I restrict movement so the cue ball cannot be placed outside this area.

The cue ball remains static until placement is confirmed, preventing early interaction.”

(Drag cue ball → press space)

4. Cue Control & Interaction (40–50 seconds)

“The cue uses a combination of mouse and keyboard interaction.

The mouse controls aiming direction, while the keyboard controls shot execution and power.

This avoids an elastic-band effect and allows more controlled, realistic shots.

When the cue strikes the cue ball, the force is applied using Matter.js, rather than manually changing velocity.”

(Take a visible shot)

5. Game Modes (50–60 seconds)

“The application includes three table modes, selectable using keys 1, 2, and 3.”

Mode 1 – Standard Formation

“Mode 1 creates the standard triangular red ball formation using nested loops.”

(Press 1)

Mode 2 – Random Cluster

“Mode 2 randomly clusters the red balls using random positioning, while keeping coloured balls fixed.”

(Press 2)

Mode 3 – Practice Mode

“Mode 3 is a practice setup where reds are laid out in a straight formation for controlled shots.”

(Press 3)

6. Animations & Visual Feedback (50–60 seconds)

“To enhance visual feedback, I implemented three animation systems.”

Ball Trail Effect

“When a ball moves above a speed threshold, it leaves a fading trail to indicate direction and speed.”

(Take a harder shot)

Cue Impact Animation

“When the cue strikes the cue ball, a brief expanding ring appears at the point of impact.”

Pocket Entry Animation

“When a ball is potted, the pocket plays a shrinking and fading animation to visually confirm the pot.”

(Pot a ball)

7. Creative Extension – Predictive Aim Guide (40–50 seconds)

“For my creative extension, I implemented a predictive aiming guide.

While aiming, a semi-transparent laser line shows the expected direction of travel based on shot power and angle.

This feature assists precision shots and is not commonly seen in traditional snooker games, making it both technically useful and visually informative.”

(Aim slowly to show the laser)

8. Code Quality & Structure (20–30 seconds)

“The code is modular, well-commented, and follows good structure.

Reusable functions are used for drawing, physics updates, and animations, with clear separation between logic and rendering.”

Closing (10–15 seconds)

“That concludes my demo.

This project demonstrates table rendering, physics simulation, user interaction, animation effects, and a creative extension using p5.js and Matter.js.

Thank you.”